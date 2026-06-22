import uuid
import string
import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_db

router = APIRouter()


# ── Pydantic models ──────────────────────────────────────────────────────────

class CreatePoolRequest(BaseModel):
    name: str
    icon: str = "💰"
    purpose_tag: Optional[str] = None


class AddMemberRequest(BaseModel):
    display_name: str
    phone: Optional[str] = None


class SplitItem(BaseModel):
    member_id: str
    amount: float


class AddExpenseRequest(BaseModel):
    description: str
    amount: float
    payer_member_id: str
    split_type: str = "equal"           # "equal" | "custom"
    custom_splits: Optional[list[SplitItem]] = None


class SettleRequest(BaseModel):
    from_member_id: str
    to_member_id: str
    amount: float
    note: Optional[str] = None


class ContributeRequest(BaseModel):
    member_id: str
    amount: float
    note: Optional[str] = None


# ── Balance computation ───────────────────────────────────────────────────────

def compute_pool_balances(pool_id: str, conn) -> dict[str, float]:
    """
    Returns {member_id: net_balance} where:
      positive = member is owed this amount
      negative = member owes this amount

    Algorithm:
      For each expense: payer gains full amount paid, every member loses their split.
      For each settlement: payer gains (debt reduces), recipient loses (credit reduces).
    """
    members = conn.execute(
        "SELECT id FROM pool_members WHERE pool_id = ?", (pool_id,)
    ).fetchall()
    balances: dict[str, float] = {m["id"]: 0.0 for m in members}

    expenses = conn.execute(
        "SELECT id, payer_member_id, amount FROM pool_expenses WHERE pool_id = ?",
        (pool_id,),
    ).fetchall()
    for exp in expenses:
        payer = exp["payer_member_id"]
        if payer in balances:
            balances[payer] += exp["amount"]
        splits = conn.execute(
            "SELECT member_id, amount_owed FROM expense_splits WHERE expense_id = ?",
            (exp["id"],),
        ).fetchall()
        for s in splits:
            if s["member_id"] in balances:
                balances[s["member_id"]] -= s["amount_owed"]

    settlements = conn.execute(
        "SELECT from_member_id, to_member_id, amount FROM pool_settlements WHERE pool_id = ?",
        (pool_id,),
    ).fetchall()
    for s in settlements:
        if s["from_member_id"] in balances:
            balances[s["from_member_id"]] += s["amount"]
        if s["to_member_id"] in balances:
            balances[s["to_member_id"]] -= s["amount"]

    return {k: round(v, 2) for k, v in balances.items()}


def make_equal_splits(amount: float, member_ids: list[str]) -> dict[str, float]:
    """Split amount equally, distributing the rounding remainder to the last member."""
    n = len(member_ids)
    base = round(amount / n, 2)
    splits = {m: base for m in member_ids}
    remainder = round(amount - base * n, 2)
    if remainder != 0:
        splits[member_ids[-1]] = round(splits[member_ids[-1]] + remainder, 2)
    return splits


def compute_pool_fund_balance(pool_id: str, conn) -> tuple[float, float]:
    """Returns (total_contributed, total_expenses) for the pool's kitty balance."""
    contributed = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM pool_contributions WHERE pool_id = ?",
        (pool_id,),
    ).fetchone()["total"]
    expenses = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM pool_expenses WHERE pool_id = ?",
        (pool_id,),
    ).fetchone()["total"]
    return round(contributed, 2), round(expenses, 2)


def member_initials(display_name: str) -> str:
    parts = display_name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    return display_name[:2].upper()


def _pool_summary(pool, conn) -> dict:
    members = conn.execute(
        "SELECT * FROM pool_members WHERE pool_id = ? ORDER BY is_self DESC, joined_at",
        (pool["id"],),
    ).fetchall()
    balances = compute_pool_balances(pool["id"], conn)

    total_row = conn.execute(
        "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM pool_expenses WHERE pool_id = ?",
        (pool["id"],),
    ).fetchone()
    last_row = conn.execute(
        "SELECT MAX(created_at) as last FROM pool_expenses WHERE pool_id = ?",
        (pool["id"],),
    ).fetchone()

    self_member = next((m for m in members if m["is_self"] == 1), None)
    your_balance = balances.get(self_member["id"], 0.0) if self_member else 0.0

    total_contributed, total_expenses_val = compute_pool_fund_balance(pool["id"], conn)

    return {
        "id": pool["id"],
        "name": pool["name"],
        "icon": pool["icon"],
        "purpose_tag": pool["purpose_tag"],
        "owner_user_id": pool["owner_user_id"],
        "created_at": pool["created_at"],
        "member_count": len(members),
        "members_preview": [
            {"id": m["id"], "display_name": m["display_name"], "is_self": bool(m["is_self"])}
            for m in members
        ],
        "your_balance": your_balance,
        "pool_fund_balance": round(total_contributed - total_expenses_val, 2),
        "total_contributed": total_contributed,
        "total_expenses": round(total_row["total"], 2),
        "expense_count": total_row["cnt"],
        "last_activity": (last_row["last"] or pool["created_at"])[:10],
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/user-pools")
def list_user_pools(user_id: str):
    conn = get_db()
    try:
        pools = conn.execute(
            "SELECT * FROM user_pools WHERE owner_user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
        return [_pool_summary(p, conn) for p in pools]
    finally:
        conn.close()


@router.post("/users/{user_id}/user-pools", status_code=201)
def create_pool(user_id: str, body: CreatePoolRequest):
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        pool_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO user_pools (id, name, icon, purpose_tag, owner_user_id, created_at) VALUES (?,?,?,?,?,?)",
            (pool_id, body.name, body.icon, body.purpose_tag, user_id, now),
        )

        # Auto-add the owner as the self member
        member_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO pool_members (id, pool_id, display_name, phone, is_self, joined_at) VALUES (?,?,?,?,?,?)",
            (member_id, pool_id, user["display_name"], None, 1, now),
        )
        conn.commit()
        pool = conn.execute("SELECT * FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        return _pool_summary(pool, conn)
    finally:
        conn.close()


@router.get("/user-pools/{pool_id}")
def get_pool_detail(pool_id: str):
    conn = get_db()
    try:
        pool = conn.execute("SELECT * FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        members = conn.execute(
            "SELECT * FROM pool_members WHERE pool_id = ? ORDER BY is_self DESC, joined_at",
            (pool_id,),
        ).fetchall()
        balances = compute_pool_balances(pool_id, conn)

        total_row = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt FROM pool_expenses WHERE pool_id = ?",
            (pool_id,),
        ).fetchone()
        last_row = conn.execute(
            "SELECT MAX(created_at) as last FROM pool_expenses WHERE pool_id = ?",
            (pool_id,),
        ).fetchone()

        self_member = next((m for m in members if m["is_self"] == 1), None)
        your_balance = balances.get(self_member["id"], 0.0) if self_member else 0.0

        # Per-member contribution totals
        contrib_rows = conn.execute(
            "SELECT member_id, SUM(amount) as total FROM pool_contributions WHERE pool_id = ? GROUP BY member_id",
            (pool_id,),
        ).fetchall()
        contrib_by_member = {r["member_id"]: round(r["total"], 2) for r in contrib_rows}
        total_contributed, total_expenses_val = compute_pool_fund_balance(pool_id, conn)

        last_contrib = conn.execute(
            "SELECT MAX(created_at) as last FROM pool_contributions WHERE pool_id = ?",
            (pool_id,),
        ).fetchone()["last"]
        last_activity_raw = max(
            filter(None, [last_row["last"], last_contrib, pool["created_at"]])
        )

        return {
            "id": pool["id"],
            "name": pool["name"],
            "icon": pool["icon"],
            "purpose_tag": pool["purpose_tag"],
            "owner_user_id": pool["owner_user_id"],
            "created_at": pool["created_at"],
            "members": [
                {
                    "id": m["id"],
                    "display_name": m["display_name"],
                    "phone": m["phone"],
                    "is_self": bool(m["is_self"]),
                    "initials": member_initials(m["display_name"]),
                    "net_balance": balances.get(m["id"], 0.0),
                    "contributed": contrib_by_member.get(m["id"], 0.0),
                }
                for m in members
            ],
            "your_balance": your_balance,
            "pool_fund_balance": round(total_contributed - total_expenses_val, 2),
            "total_contributed": total_contributed,
            "total_expenses": round(total_row["total"], 2),
            "expense_count": total_row["cnt"],
            "last_activity": last_activity_raw[:10],
        }
    finally:
        conn.close()


@router.post("/user-pools/{pool_id}/members", status_code=201)
def add_member(pool_id: str, body: AddMemberRequest):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        member_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO pool_members (id, pool_id, display_name, phone, is_self, joined_at) VALUES (?,?,?,?,0,?)",
            (member_id, pool_id, body.display_name, body.phone, now),
        )
        conn.commit()
        return {"id": member_id, "display_name": body.display_name, "phone": body.phone, "is_self": False}
    finally:
        conn.close()


@router.get("/user-pools/{pool_id}/expenses")
def list_expenses(pool_id: str):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        expenses = conn.execute(
            "SELECT e.*, m.display_name as payer_name FROM pool_expenses e "
            "JOIN pool_members m ON m.id = e.payer_member_id "
            "WHERE e.pool_id = ? ORDER BY e.created_at DESC",
            (pool_id,),
        ).fetchall()

        result = []
        for exp in expenses:
            splits = conn.execute(
                "SELECT s.amount_owed, m.display_name, s.member_id FROM expense_splits s "
                "JOIN pool_members m ON m.id = s.member_id WHERE s.expense_id = ?",
                (exp["id"],),
            ).fetchall()
            result.append({
                "id": exp["id"],
                "description": exp["description"],
                "amount": exp["amount"],
                "payer_member_id": exp["payer_member_id"],
                "payer_name": exp["payer_name"],
                "split_type": exp["split_type"],
                "created_at": exp["created_at"][:10],
                "splits": [
                    {"member_id": s["member_id"], "display_name": s["display_name"], "amount_owed": s["amount_owed"]}
                    for s in splits
                ],
            })
        return result
    finally:
        conn.close()


@router.post("/user-pools/{pool_id}/expenses", status_code=201)
def add_expense(pool_id: str, body: AddExpenseRequest):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        payer = conn.execute(
            "SELECT id FROM pool_members WHERE id = ? AND pool_id = ?",
            (body.payer_member_id, pool_id),
        ).fetchone()
        if not payer:
            raise HTTPException(status_code=400, detail="Payer is not a member of this pool")

        all_members = conn.execute(
            "SELECT id FROM pool_members WHERE pool_id = ?", (pool_id,)
        ).fetchall()
        member_ids = [m["id"] for m in all_members]

        expense_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO pool_expenses (id, pool_id, payer_member_id, amount, description, split_type, created_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (expense_id, pool_id, body.payer_member_id, body.amount, body.description, body.split_type, now),
        )

        if body.split_type == "equal":
            splits = make_equal_splits(body.amount, member_ids)
        elif body.split_type == "custom":
            if not body.custom_splits:
                raise HTTPException(status_code=400, detail="custom_splits required for custom split type")
            splits = {s.member_id: s.amount for s in body.custom_splits}
            if abs(sum(splits.values()) - body.amount) > 0.02:
                raise HTTPException(status_code=400, detail="Custom splits must sum to expense amount")
        else:
            raise HTTPException(status_code=400, detail="split_type must be 'equal' or 'custom'")

        for member_id, amount_owed in splits.items():
            conn.execute(
                "INSERT INTO expense_splits (id, expense_id, member_id, amount_owed) VALUES (?,?,?,?)",
                (str(uuid.uuid4()), expense_id, member_id, amount_owed),
            )

        conn.commit()

        # Return updated pool balances so frontend can refresh
        balances = compute_pool_balances(pool_id, conn)
        members = conn.execute(
            "SELECT id, display_name, is_self FROM pool_members WHERE pool_id = ?", (pool_id,)
        ).fetchall()
        return {
            "expense_id": expense_id,
            "balances": {
                m["display_name"]: balances.get(m["id"], 0.0) for m in members
            },
        }
    finally:
        conn.close()


@router.post("/user-pools/{pool_id}/settle", status_code=201)
def settle_debt(pool_id: str, body: SettleRequest):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        for mid in (body.from_member_id, body.to_member_id):
            m = conn.execute(
                "SELECT id FROM pool_members WHERE id = ? AND pool_id = ?", (mid, pool_id)
            ).fetchone()
            if not m:
                raise HTTPException(status_code=400, detail=f"Member {mid} not in pool")

        settlement_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO pool_settlements (id, pool_id, from_member_id, to_member_id, amount, note, settled_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (settlement_id, pool_id, body.from_member_id, body.to_member_id, body.amount, body.note, now),
        )
        conn.commit()

        balances = compute_pool_balances(pool_id, conn)
        members = conn.execute(
            "SELECT id, display_name FROM pool_members WHERE pool_id = ?", (pool_id,)
        ).fetchall()
        return {
            "settlement_id": settlement_id,
            "balances": {m["display_name"]: balances.get(m["id"], 0.0) for m in members},
        }
    finally:
        conn.close()


@router.get("/user-pools/{pool_id}/invite")
def get_or_create_invite(pool_id: str):
    conn = get_db()
    try:
        pool = conn.execute(
            "SELECT p.*, u.display_name as owner_name FROM user_pools p "
            "JOIN users u ON u.id = p.owner_user_id WHERE p.id = ?",
            (pool_id,),
        ).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        existing = conn.execute(
            "SELECT code FROM pool_invites WHERE pool_id = ?", (pool_id,)
        ).fetchone()
        if existing:
            code = existing["code"]
        else:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            conn.execute(
                "INSERT INTO pool_invites (id, pool_id, code, created_at) VALUES (?,?,?,?)",
                (str(uuid.uuid4()), pool_id, code, datetime.utcnow().isoformat()),
            )
            conn.commit()

        member_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM pool_members WHERE pool_id = ?", (pool_id,)
        ).fetchone()["cnt"]

        return {
            "code": code,
            "pool_id": pool_id,
            "pool_name": pool["name"],
            "pool_icon": pool["icon"],
            "owner_name": pool["owner_name"],
            "member_count": member_count,
            "invite_url": f"http://localhost:5173/join/{code}",
        }
    finally:
        conn.close()


@router.get("/user-pools/{pool_id}/contributions")
def list_contributions(pool_id: str):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        rows = conn.execute(
            "SELECT c.id, c.amount, c.note, c.created_at, "
            "m.id as member_id, m.display_name, m.is_self "
            "FROM pool_contributions c "
            "JOIN pool_members m ON m.id = c.member_id "
            "WHERE c.pool_id = ? ORDER BY c.created_at DESC",
            (pool_id,),
        ).fetchall()
        return [
            {
                "id": r["id"],
                "member_id": r["member_id"],
                "display_name": r["display_name"],
                "is_self": bool(r["is_self"]),
                "amount": r["amount"],
                "note": r["note"],
                "created_at": r["created_at"][:10],
            }
            for r in rows
        ]
    finally:
        conn.close()


@router.post("/user-pools/{pool_id}/contribute", status_code=201)
def contribute(pool_id: str, body: ContributeRequest):
    conn = get_db()
    try:
        pool = conn.execute("SELECT id FROM user_pools WHERE id = ?", (pool_id,)).fetchone()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        member = conn.execute(
            "SELECT id FROM pool_members WHERE id = ? AND pool_id = ?",
            (body.member_id, pool_id),
        ).fetchone()
        if not member:
            raise HTTPException(status_code=400, detail="Member not in this pool")
        if body.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")

        contrib_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        conn.execute(
            "INSERT INTO pool_contributions (id, pool_id, member_id, amount, note, created_at) VALUES (?,?,?,?,?,?)",
            (contrib_id, pool_id, body.member_id, body.amount, body.note, now),
        )
        conn.commit()

        total_contributed, total_expenses = compute_pool_fund_balance(pool_id, conn)
        return {
            "contribution_id": contrib_id,
            "pool_fund_balance": round(total_contributed - total_expenses, 2),
            "total_contributed": total_contributed,
        }
    finally:
        conn.close()


@router.get("/invite/{code}")
def join_preview(code: str):
    conn = get_db()
    try:
        invite = conn.execute(
            "SELECT i.*, p.name as pool_name, p.icon as pool_icon, p.purpose_tag, "
            "u.display_name as owner_name "
            "FROM pool_invites i "
            "JOIN user_pools p ON p.id = i.pool_id "
            "JOIN users u ON u.id = p.owner_user_id "
            "WHERE i.code = ?",
            (code,),
        ).fetchone()
        if not invite:
            raise HTTPException(status_code=404, detail="Invite not found")

        member_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM pool_members WHERE pool_id = ?",
            (invite["pool_id"],),
        ).fetchone()["cnt"]
        expense_count = conn.execute(
            "SELECT COUNT(*) as cnt FROM pool_expenses WHERE pool_id = ?",
            (invite["pool_id"],),
        ).fetchone()["cnt"]
        total = conn.execute(
            "SELECT COALESCE(SUM(amount), 0) as total FROM pool_expenses WHERE pool_id = ?",
            (invite["pool_id"],),
        ).fetchone()["total"]

        return {
            "code": code,
            "pool_id": invite["pool_id"],
            "pool_name": invite["pool_name"],
            "pool_icon": invite["pool_icon"],
            "purpose_tag": invite["purpose_tag"],
            "owner_name": invite["owner_name"],
            "member_count": member_count,
            "expense_count": expense_count,
            "total_expenses": round(total, 2),
        }
    finally:
        conn.close()
