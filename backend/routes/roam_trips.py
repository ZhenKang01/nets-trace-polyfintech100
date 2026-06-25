from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid
import json
import random
from datetime import datetime, timezone, date as date_t

from database import get_db

router = APIRouter()

# ── City registry ─────────────────────────────────────────────────────────────

CITIES: dict[str, dict] = {
    "Bangkok": {
        "country": "Thailand", "currency": "THB", "symbol": "฿",
        "flag": "🇹🇭", "fx_rate": 27.50,
        "networks": ["PromptPay"],
        "differentiator": "Pay at any PromptPay QR merchant — straight from your bank. No prepaid baht, no leftover balance.",
        "merchants": [
            {"name": "Chatuchak Weekend Market", "category": "Shopping"},
            {"name": "Pad Thai Fawng (Silom)", "category": "Food & Drink"},
            {"name": "MBK Center", "category": "Shopping"},
            {"name": "Terminal 21", "category": "Shopping"},
            {"name": "BTS Skytrain Top-up", "category": "Transport"},
            {"name": "7-Eleven Bangkok", "category": "Food & Drink"},
            {"name": "Mango Sticky Rice stall", "category": "Food & Drink"},
            {"name": "Asiatique Night Market", "category": "Shopping"},
        ],
    },
    "Johor Bahru": {
        "country": "Malaysia", "currency": "MYR", "symbol": "RM",
        "flag": "🇲🇾", "fx_rate": 3.42,
        "networks": ["DuitNow", "MyDebit"],
        "differentiator": "Pay at any DuitNow QR merchant — money deducted straight from your bank account. No ringgit to carry, no prepaid balance.",
        "merchants": [
            {"name": "KSL City Mall Food Court", "category": "Food & Drink"},
            {"name": "R&R Plaza", "category": "Shopping"},
            {"name": "CitySquare Mall", "category": "Shopping"},
            {"name": "AEON Tebrau City", "category": "Shopping"},
            {"name": "Giant Hypermarket JB", "category": "Groceries"},
            {"name": "D'Tandoor JB", "category": "Food & Drink"},
        ],
    },
    "Kuala Lumpur": {
        "country": "Malaysia", "currency": "MYR", "symbol": "RM",
        "flag": "🇲🇾", "fx_rate": 3.42,
        "networks": ["DuitNow", "MyDebit"],
        "differentiator": "Pay at any DuitNow QR merchant — straight from your bank. No ringgit needed.",
        "merchants": [
            {"name": "KLCC Suria", "category": "Shopping"},
            {"name": "Pavilion KL", "category": "Shopping"},
            {"name": "Nasi Lemak Wanjo", "category": "Food & Drink"},
            {"name": "Rapid KL LRT", "category": "Transport"},
        ],
    },
    "Jakarta": {
        "country": "Indonesia", "currency": "IDR", "symbol": "Rp",
        "flag": "🇮🇩", "fx_rate": 11500.0,
        "networks": ["QRIS"],
        "differentiator": "Pay at any QRIS merchant — straight from your bank. No cash exchange, no prepaid card.",
        "merchants": [
            {"name": "Grand Indonesia Mall", "category": "Shopping"},
            {"name": "Warung Padang", "category": "Food & Drink"},
            {"name": "TransJakarta stop", "category": "Transport"},
        ],
    },
}

WITTY_LINES = {
    "Food & Drink": "Your stomach led the way in {dest}. Worth every {cur}.",
    "Shopping": "You came, you saw, you shopped. {dest}'s malls thank you.",
    "Transport": "You covered more ground in {dest} than the guidebook suggested.",
    "Groceries": "You shop like a local in {dest}. The grocery haul was very real.",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _get_active_trip(user_id: str, conn):
    row = conn.execute(
        "SELECT * FROM trips WHERE user_id=? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    return dict(row) if row else None


def _trip_txns(trip: dict, conn) -> list[dict]:
    rows = conn.execute(
        """SELECT * FROM transactions
           WHERE user_id=? AND location != 'Singapore'
             AND date >= ?
           ORDER BY date DESC, time DESC""",
        (trip["user_id"], trip["started_at"][:10]),
    ).fetchall()
    return [dict(r) for r in rows]


def _fmt_txn(t: dict, trip: dict) -> dict:
    return {
        "id": t["id"],
        "date": t["date"],
        "time": t["time"],
        "merchant": t["merchant"],
        "category": t["category"],
        "amount": t["amount"],
        "local_amount": round(t["amount"] * trip["fx_rate"], 2),
        "local_symbol": trip["symbol"],
        "local_currency": trip["currency"],
        "location": t.get("location", ""),
    }


def _parse_networks(trip: dict) -> list[str]:
    n = trip["networks"]
    return json.loads(n) if isinstance(n, str) else n


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/users/{user_id}/trip/active")
def get_active_trip(user_id: str):
    """Poll this endpoint to detect if a trip has started."""
    conn = get_db()
    try:
        trip = _get_active_trip(user_id, conn)
        if not trip:
            return {"active": False}

        txns = _trip_txns(trip, conn)
        total_sgd = round(sum(t["amount"] for t in txns), 2)
        networks = _parse_networks(trip)

        return {
            "active": True,
            "trip": {
                "id": trip["id"],
                "destination": trip["destination"],
                "country": trip["country"],
                "currency": trip["currency"],
                "symbol": trip["symbol"],
                "flag": trip["flag"],
                "fx_rate": trip["fx_rate"],
                "networks": networks,
                "started_at": trip["started_at"],
                "txn_count": len(txns),
                "total_sgd": total_sgd,
                "recent_txns": [_fmt_txn(t, trip) for t in txns[:12]],
            },
        }
    finally:
        conn.close()


class InjectRequest(BaseModel):
    city: str = "Bangkok"
    merchant: Optional[str] = None
    amount: float = 12.50
    category: str = "Food & Drink"


@router.post("/users/{user_id}/inject-foreign-txn")
def inject_foreign_txn(user_id: str, req: InjectRequest):
    """Demo endpoint: inject a foreign transaction → auto-creates a trip if none active."""
    city = CITIES.get(req.city)
    if not city:
        raise HTTPException(400, f"Unknown city '{req.city}'. Available: {list(CITIES)}")

    conn = get_db()
    try:
        trip = _get_active_trip(user_id, conn)
        now = _now()

        if not trip:
            trip_id = f"trip-{uuid.uuid4().hex[:8]}"
            conn.execute(
                """INSERT INTO trips
                   (id, user_id, destination, country, currency, symbol, flag, fx_rate, networks, started_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (
                    trip_id, user_id, req.city, city["country"], city["currency"],
                    city["symbol"], city["flag"], city["fx_rate"],
                    json.dumps(city["networks"]), now,
                ),
            )
            trip_id_ret = trip_id
        else:
            trip_id_ret = trip["id"]

        merchant = req.merchant or random.choice(city["merchants"])["name"]
        txn_id = f"inj-{uuid.uuid4().hex[:8]}"
        dt = datetime.now(timezone.utc)
        conn.execute(
            "INSERT INTO transactions (id, user_id, date, time, merchant, category, amount, location) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (txn_id, user_id, dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M"),
             merchant, req.category, req.amount, req.city),
        )
        conn.commit()

        return {
            "triggered": True,
            "trip_id": trip_id_ret,
            "transaction": {"id": txn_id, "merchant": merchant, "amount": req.amount},
            "city_info": {k: v for k, v in city.items() if k != "merchants"},
        }
    finally:
        conn.close()


@router.post("/users/{user_id}/trip/end")
def end_trip(user_id: str):
    """End the active trip — triggers Trip Wrapped to become available."""
    conn = get_db()
    try:
        trip = _get_active_trip(user_id, conn)
        if not trip:
            raise HTTPException(404, "No active trip found")
        conn.execute("UPDATE trips SET ended_at=? WHERE id=?", (_now(), trip["id"]))
        conn.commit()
        return {"ended": True, "trip_id": trip["id"]}
    finally:
        conn.close()


@router.get("/users/{user_id}/trip/wrapped")
def trip_wrapped(user_id: str):
    """Trip Wrapped stats for the most recently ended trip."""
    conn = get_db()
    try:
        row = conn.execute(
            "SELECT * FROM trips WHERE user_id=? AND ended_at IS NOT NULL ORDER BY ended_at DESC LIMIT 1",
            (user_id,),
        ).fetchone()
        if not row:
            raise HTTPException(404, "No ended trip found")

        trip = dict(row)
        txns = _trip_txns(trip, conn)
        if not txns:
            raise HTTPException(404, "No transactions for this trip")

        total_sgd = round(sum(t["amount"] for t in txns), 2)
        cat_totals: dict[str, float] = {}
        cat_counts: dict[str, int] = {}
        for t in txns:
            cat = t["category"]
            cat_totals[cat] = cat_totals.get(cat, 0) + t["amount"]
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        top_cat = max(cat_totals, key=lambda c: cat_totals[c])
        biggest = max(txns, key=lambda t: t["amount"])

        start_d = date_t.fromisoformat(trip["started_at"][:10])
        end_d = date_t.fromisoformat(trip["ended_at"][:10])
        days = max(1, (end_d - start_d).days + 1)

        networks = _parse_networks(trip)
        template = WITTY_LINES.get(top_cat, "You lived like a local. NETS paid the way.")
        witty = template.replace("{dest}", trip["destination"]).replace("{cur}", trip["currency"])

        return {
            "trip_id": trip["id"],
            "destination": trip["destination"],
            "country": trip["country"],
            "flag": trip["flag"],
            "currency": trip["currency"],
            "symbol": trip["symbol"],
            "fx_rate": trip["fx_rate"],
            "networks": networks,
            "started_at": trip["started_at"],
            "ended_at": trip["ended_at"],
            "trip_days": days,
            "txn_count": len(txns),
            "total_sgd": total_sgd,
            "daily_pace_sgd": round(total_sgd / days, 2),
            "top_category": top_cat,
            "biggest_txn": {
                "merchant": biggest["merchant"],
                "amount_sgd": biggest["amount"],
                "local_amount": round(biggest["amount"] * trip["fx_rate"], 2),
                "local_symbol": trip["symbol"],
            },
            "category_breakdown": [
                {"category": c, "total_sgd": round(cat_totals[c], 2), "count": cat_counts[c]}
                for c in sorted(cat_totals, key=lambda c: -cat_totals[c])
            ],
            "witty_line": witty,
        }
    finally:
        conn.close()


@router.get("/users/{user_id}/spending-pace")
def spending_pace(user_id: str):
    """Historical daily spend pace for trip budget intelligence (Feature 2)."""
    conn = get_db()
    try:
        rows = conn.execute(
            """SELECT date, SUM(amount) AS daily_total
               FROM transactions
               WHERE user_id=? AND location='Singapore'
               GROUP BY date
               ORDER BY date DESC
               LIMIT 90""",
            (user_id,),
        ).fetchall()
        if not rows:
            return {"avg_daily_sgd": 25.0, "data_points": 0}
        totals = [r["daily_total"] for r in rows]
        avg = round(sum(totals) / len(totals), 2)
        return {
            "avg_daily_sgd": avg,
            "data_points": len(totals),
            "suggested_3day": round(avg * 3, 2),
            "suggested_5day": round(avg * 5, 2),
            "suggested_7day": round(avg * 7, 2),
        }
    finally:
        conn.close()


@router.get("/trip/merchants/{city}")
def merchants_for_city(city: str):
    """NETS-QR-accepting merchants for a given city (Feature 3 — mock data)."""
    city_data = CITIES.get(city)
    if not city_data:
        raise HTTPException(404, f"City not found: {city}")
    return {
        "city": city,
        "flag": city_data["flag"],
        "networks": city_data["networks"],
        "merchants": city_data["merchants"],
    }
