from fastapi import APIRouter, HTTPException
from database import get_db

router = APIRouter()

FX_CONFIGS = {
    "Malaysia": {
        "currency": "MYR",
        "symbol": "RM",
        "rate": 3.42,
        "flag": "🇲🇾",
        "networks": ["DuitNow", "MyQR"],
        "differentiator": "Pay at any DuitNow QR merchant — money deducted straight from your bank account. No ringgit to carry, no prepaid balance to top up.",
    },
    "Thailand": {
        "currency": "THB",
        "symbol": "฿",
        "rate": 26.50,
        "flag": "🇹🇭",
        "networks": ["PromptPay"],
        "differentiator": "Pay at any PromptPay QR merchant — straight from your bank. No prepaid baht, no leftover balance.",
    },
    "Indonesia": {
        "currency": "IDR",
        "symbol": "Rp",
        "rate": 10850.0,
        "flag": "🇮🇩",
        "networks": ["QRIS"],
        "differentiator": "Pay at any QRIS merchant — straight from your bank. No cash exchange, no prepaid card.",
    },
}


@router.get("/users/{user_id}/roam")
def get_roam(user_id: str):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    user = dict(user)

    if not user["is_traveling"]:
        conn.close()
        return {
            "is_traveling": False,
            "location": "Singapore",
            "country": "Singapore",
            "currency": "SGD",
            "symbol": "S$",
            "flag": "🇸🇬",
            "fx_rate": 1.0,
            "networks": [],
            "differentiator": "",
            "recent_foreign_txns": [],
            "total_foreign_spend_sgd": 0.0,
        }

    current_location = user["current_location"]
    country = current_location.split(", ")[-1]
    fx = FX_CONFIGS.get(country, {
        "currency": "USD", "symbol": "$", "rate": 1.35,
        "flag": "🌏", "networks": [], "differentiator": "",
    })

    foreign_txns = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? AND location != 'Singapore' "
        "ORDER BY date DESC, time DESC LIMIT 12",
        (user_id,),
    ).fetchall()
    conn.close()

    foreign_txns = [dict(t) for t in foreign_txns]
    total_foreign_spend_sgd = round(sum(t["amount"] for t in foreign_txns), 2)

    for t in foreign_txns:
        t["local_amount"] = round(t["amount"] * fx["rate"], 2)
        t["local_currency"] = fx["currency"]
        t["local_symbol"] = fx["symbol"]

    return {
        "is_traveling": True,
        "location": current_location,
        "country": country,
        "currency": fx["currency"],
        "symbol": fx["symbol"],
        "flag": fx["flag"],
        "fx_rate": fx["rate"],
        "networks": fx["networks"],
        "differentiator": fx["differentiator"],
        "recent_foreign_txns": foreign_txns,
        "total_foreign_spend_sgd": total_foreign_spend_sgd,
    }
