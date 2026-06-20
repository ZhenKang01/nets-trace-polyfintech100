from fastapi import APIRouter, HTTPException
from collections import defaultdict
from database import get_db

router = APIRouter()

PERSONALITIES = {
    "u1": {
        "name": "The Hawker Loyalist",
        "tagline": "Your heart (and wallet) belongs to the heartland.",
        "witty_line": "If hawker food had a loyalty programme, you'd already be Platinum tier.",
        "emoji": "🍜",
        "color": "#E85D04",
    },
    "u2": {
        "name": "The Bubble Tea Devotee",
        "tagline": "Life's too short for bad boba. You know this better than anyone.",
        "witty_line": "At this rate, you could open your own bubble tea franchise. We believe in you.",
        "emoji": "🧋",
        "color": "#7C3AED",
    },
    "u3": {
        "name": "The JB Weekend Runner",
        "tagline": "The causeway is basically your second front door.",
        "witty_line": "You've single-handedly boosted Singapore-Malaysia bilateral trade. Salute.",
        "emoji": "🛣️",
        "color": "#0891B2",
    },
}


@router.get("/users/{user_id}/wrapped")
def get_wrapped(user_id: str):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    txns = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date ASC, time ASC",
        (user_id,)
    ).fetchall()
    conn.close()

    if not txns:
        raise HTTPException(status_code=404, detail="No transactions found")

    txns = [dict(t) for t in txns]

    # Total spend
    total_spend = round(sum(t["amount"] for t in txns), 2)

    # Category breakdown
    cat_totals: dict[str, float] = defaultdict(float)
    cat_counts: dict[str, int] = defaultdict(int)
    for t in txns:
        cat_totals[t["category"]] += t["amount"]
        cat_counts[t["category"]] += 1

    top_category = max(cat_totals, key=lambda k: cat_totals[k])

    category_breakdown = sorted(
        [{"category": k, "total": round(v, 2), "count": cat_counts[k]} for k, v in cat_totals.items()],
        key=lambda x: x["total"],
        reverse=True,
    )

    # Top merchant
    merchant_totals: dict[str, float] = defaultdict(float)
    merchant_counts: dict[str, int] = defaultdict(int)
    for t in txns:
        merchant_totals[t["merchant"]] += t["amount"]
        merchant_counts[t["merchant"]] += 1

    top_merchant = max(merchant_totals, key=lambda k: merchant_counts[k])
    top_merchant_visits = merchant_counts[top_merchant]

    # Biggest single day
    day_totals: dict[str, float] = defaultdict(float)
    day_merchants: dict[str, list] = defaultdict(list)
    for t in txns:
        day_totals[t["date"]] += t["amount"]
        if t["merchant"] not in day_merchants[t["date"]]:
            day_merchants[t["date"]].append(t["merchant"])

    biggest_day_date = max(day_totals, key=lambda k: day_totals[k])
    biggest_day = {
        "date": biggest_day_date,
        "amount": round(day_totals[biggest_day_date], 2),
        "merchants": day_merchants[biggest_day_date][:4],
    }

    # Monthly breakdown
    monthly: dict[str, float] = defaultdict(float)
    for t in txns:
        month = t["date"][:7]  # YYYY-MM
        monthly[month] += t["amount"]

    monthly_breakdown = sorted(
        [{"month": k, "total": round(v, 2)} for k, v in monthly.items()],
        key=lambda x: x["month"],
    )

    # Streak: longest consecutive days with at least one transaction
    all_dates = sorted({t["date"] for t in txns})
    from datetime import date as date_type, timedelta

    longest_streak = 1
    streak_start = all_dates[0]
    best_streak_start = all_dates[0]
    current_streak = 1

    for i in range(1, len(all_dates)):
        prev = date_type.fromisoformat(all_dates[i - 1])
        curr = date_type.fromisoformat(all_dates[i])
        if (curr - prev).days == 1:
            current_streak += 1
            if current_streak > longest_streak:
                longest_streak = current_streak
                best_streak_start = streak_start
        else:
            current_streak = 1
            streak_start = all_dates[i]

    # Streak category: dominant category during streak period
    streak_txns = [t for t in txns if t["date"] >= best_streak_start]
    streak_cat_counts: dict[str, int] = defaultdict(int)
    for t in streak_txns:
        streak_cat_counts[t["category"]] += 1
    streak_category = max(streak_cat_counts, key=lambda k: streak_cat_counts[k]) if streak_cat_counts else top_category

    personality = PERSONALITIES.get(user_id, {
        "name": "The NETS Explorer",
        "tagline": "Every tap tells a story.",
        "witty_line": "You keep us guessing. We like that.",
        "emoji": "✨",
        "color": "#1B3464",
    })

    return {
        "user_id": user_id,
        "persona": dict(user)["persona"],
        "total_spend": total_spend,
        "total_transactions": len(txns),
        "top_category": top_category,
        "top_merchant": top_merchant,
        "top_merchant_visits": top_merchant_visits,
        "personality": personality,
        "biggest_day": biggest_day,
        "longest_streak_days": longest_streak,
        "streak_category": streak_category,
        "category_breakdown": category_breakdown,
        "monthly_breakdown": monthly_breakdown,
    }
