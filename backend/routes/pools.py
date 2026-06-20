from fastapi import APIRouter, HTTPException
from collections import defaultdict
from database import get_db
from datetime import date as date_type

router = APIRouter()


def parse_date(s: str) -> date_type:
    return date_type.fromisoformat(s)


@router.get("/users/{user_id}/pools")
def get_pools(user_id: str):
    conn = get_db()
    user = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    txns = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date ASC, time ASC",
        (user_id,)
    ).fetchall()
    conn.close()

    txns = [dict(t) for t in txns]

    pools = []

    # --- Pattern 1: Same merchant, same day-of-week, similar amount, recurring ---
    merchant_dow: dict[tuple, list] = defaultdict(list)
    for t in txns:
        d = parse_date(t["date"])
        key = (t["merchant"], d.weekday())  # weekday 0=Mon, 4=Fri
        merchant_dow[key].append(t)

    WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    pool_id = 1
    seen_patterns = set()

    for (merchant, dow), group in merchant_dow.items():
        if len(group) < 4:
            continue
        amounts = [t["amount"] for t in group]
        avg = sum(amounts) / len(amounts)
        spread = max(amounts) - min(amounts)
        # Consistent amount ± 20% of average
        if spread > avg * 0.35:
            continue
        pattern_key = (merchant, dow)
        if pattern_key in seen_patterns:
            continue
        seen_patterns.add(pattern_key)

        day_name = WEEKDAY_NAMES[dow]
        inferred_participants = 3 if avg > 12 else 2

        pools.append({
            "id": f"p{pool_id}",
            "label": f"{day_name} regular at {merchant}",
            "merchant": merchant,
            "inferred_participants": inferred_participants,
            "pattern": f"Every {day_name}, ~${avg:.0f}–{avg + spread:.0f} at {merchant}",
            "occurrences": len(group),
            "last_seen": max(t["date"] for t in group),
            "avg_amount": round(avg, 2),
            "transactions": sorted(
                [{"date": t["date"], "amount": t["amount"], "merchant": t["merchant"]} for t in group],
                key=lambda x: x["date"],
                reverse=True,
            )[:6],
        })
        pool_id += 1

    # --- Pattern 2: MRT/transport clusters (commute pattern) ---
    transport_txns = [t for t in txns if t["category"] == "Transport" and "MRT" in t["merchant"]]
    if len(transport_txns) >= 10:
        # Group by weekday
        weekday_groups: dict[int, list] = defaultdict(list)
        for t in transport_txns:
            d = parse_date(t["date"])
            weekday_groups[d.weekday()].append(t)

        busiest_dow = max(weekday_groups, key=lambda k: len(weekday_groups[k]))
        group = weekday_groups[busiest_dow]
        if len(group) >= 5:
            amounts = [t["amount"] for t in group]
            avg = sum(amounts) / len(amounts)
            pools.append({
                "id": f"p{pool_id}",
                "label": f"{WEEKDAY_NAMES[busiest_dow]} commute pattern",
                "merchant": "SMRT MRT",
                "inferred_participants": 1,
                "pattern": f"Regular MRT tap-ins every {WEEKDAY_NAMES[busiest_dow]}, ~${avg:.2f}",
                "occurrences": len(group),
                "last_seen": max(t["date"] for t in group),
                "avg_amount": round(avg, 2),
                "transactions": sorted(
                    [{"date": t["date"], "amount": t["amount"], "merchant": t["merchant"]} for t in group],
                    key=lambda x: x["date"],
                    reverse=True,
                )[:6],
            })
            pool_id += 1

    pools.sort(key=lambda p: p["occurrences"], reverse=True)
    return pools[:5]  # top 5 most consistent patterns
