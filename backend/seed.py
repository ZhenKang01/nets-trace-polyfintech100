import sqlite3
import random
import uuid
from datetime import date, timedelta
from database import get_db, DB_PATH

random.seed(42)

USERS = [
    {
        "id": "u1",
        "persona": "The Hawker Loyalist",
        "display_name": "Alex T.",
        "flashpay_balance": 47.20,
    },
    {
        "id": "u2",
        "persona": "The Bubble Tea Devotee",
        "display_name": "Jordan L.",
        "flashpay_balance": 23.80,
    },
    {
        "id": "u3",
        "persona": "The JB Weekend Runner",
        "display_name": "Sam K.",
        "flashpay_balance": 61.50,
    },
]

# Merchant pools per profile
U1_MERCHANTS = [
    # category, merchant, amount_range, weight
    ("Food & Drink", "Tian Tian Chicken Rice", (3.5, 5.5), 12),
    ("Food & Drink", "Maxwell Food Centre", (3.0, 7.0), 10),
    ("Food & Drink", "Old Chang Kee", (1.5, 3.5), 6),
    ("Food & Drink", "Ya Kun Kaya Toast", (4.0, 7.5), 5),
    ("Food & Drink", "Lau Pa Sat", (4.0, 9.0), 7),
    ("Food & Drink", "Bedok 85 Market", (3.0, 6.0), 8),
    ("Transport", "SMRT MRT", (1.2, 2.8), 14),
    ("Transport", "SBS Transit Bus", (0.80, 1.80), 8),
    ("Groceries", "NTUC FairPrice", (12.0, 45.0), 4),
    ("Groceries", "Sheng Siong", (8.0, 30.0), 2),
    ("Food & Drink", "Toast Box", (4.5, 8.0), 4),
    ("Food & Drink", "Kopitiam", (3.0, 6.5), 6),
]

U2_MERCHANTS = [
    ("Food & Drink", "LiHo Tea", (5.5, 8.5), 12),
    ("Food & Drink", "Koi Thé", (5.0, 8.0), 10),
    ("Food & Drink", "Gong Cha", (5.0, 7.5), 9),
    ("Food & Drink", "The Alley", (6.0, 9.0), 7),
    ("Food & Drink", "Share Tea", (5.0, 7.0), 8),
    ("Food & Drink", "Tiger Sugar", (6.5, 9.5), 6),
    ("Transport", "Grab", (8.0, 18.0), 8),
    ("Transport", "SMRT MRT", (1.2, 2.8), 6),
    ("Shopping", "Uniqlo", (19.90, 89.90), 3),
    ("Shopping", "Cotton On", (14.90, 49.90), 3),
    ("Food & Drink", "Starbucks", (6.5, 9.5), 5),
    ("Entertainment", "Cathay Cineplexes", (13.50, 15.50), 3),
    ("Food & Drink", "Shake Shack", (14.0, 22.0), 4),
    ("Food & Drink", "Saizeriya", (10.0, 18.0), 4),
    ("Shopping", "Watsons", (8.0, 25.0), 3),
]

U3_MERCHANTS = [
    ("Transport", "SMRT MRT", (1.2, 2.8), 12),
    ("Transport", "Woodlands Checkpoint", (2.0, 4.0), 6),
    ("Food & Drink", "JB City Square Mall Food Court", (8.0, 18.0), 8),
    ("Shopping", "AEON Tebrau City", (25.0, 120.0), 4),
    ("Transport", "Petrol Kiosk JB", (30.0, 65.0), 4),
    ("Food & Drink", "KSL City Food Court", (7.0, 15.0), 6),
    ("Food & Drink", "Tian Tian Chicken Rice", (3.5, 5.5), 5),
    ("Groceries", "NTUC FairPrice", (15.0, 55.0), 5),
    ("Food & Drink", "Old Chang Kee", (1.5, 3.5), 4),
    ("Transport", "SBS Transit Bus", (0.80, 1.80), 6),
    ("Shopping", "Mr DIY JB", (10.0, 60.0), 3),
    ("Food & Drink", "Toppen Shopping Centre", (10.0, 22.0), 4),
    ("ATM", "RHB Bank ATM", (50.0, 200.0), 3),
    ("Food & Drink", "McDonald's", (8.0, 14.0), 3),
    ("Groceries", "Giant Hypermarket JB", (20.0, 80.0), 3),
]


def weighted_choice(pool):
    merchants = [(m, w) for *m, w in pool]
    weights = [w for _, w in merchants]
    chosen = random.choices(merchants, weights=weights, k=1)[0]
    return chosen[0]  # (category, merchant, amount_range)


def random_time():
    hour = random.choices(
        range(7, 23),
        weights=[3, 5, 4, 3, 6, 8, 10, 8, 6, 5, 4, 3, 4, 5, 4, 3],
        k=1
    )[0]
    minute = random.randint(0, 59)
    return f"{hour:02d}:{minute:02d}"


def generate_transactions(user_id, merchant_pool, start_date, num_days=180):
    txns = []
    current = start_date
    for _ in range(num_days):
        # 0–4 transactions per day depending on profile
        if user_id == "u1":
            count = random.choices([1, 2, 3, 4], weights=[10, 30, 40, 20])[0]
        elif user_id == "u2":
            count = random.choices([0, 1, 2, 3], weights=[10, 25, 40, 25])[0]
        else:
            weekday = current.weekday()
            if weekday >= 5:  # weekend — JB runs
                count = random.choices([2, 3, 4, 5], weights=[15, 30, 35, 20])[0]
            else:
                count = random.choices([1, 2, 3], weights=[25, 50, 25])[0]

        for _ in range(count):
            cat, merchant, (lo, hi) = weighted_choice(merchant_pool)
            amount = round(random.uniform(lo, hi), 2)
            txns.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "date": current.isoformat(),
                "time": random_time(),
                "merchant": merchant,
                "category": cat,
                "amount": amount,
                "location": "Singapore" if "JB" not in merchant and "Tebrau" not in merchant and "KSL" not in merchant and "Toppen" not in merchant and "Mr DIY JB" not in merchant and "Giant Hyper" not in merchant and "Petrol Kiosk" not in merchant else "Johor Bahru",
            })
        current += timedelta(days=1)
    return txns


# Pool pattern seeds: inject consistent Friday dinner clusters for u1
def inject_pool_patterns(txns, user_id):
    extra = []

    if user_id == "u1":
        # Friday group dinner at Zion Road Food Centre — ~3 people, consistent ~$15-17
        start_fri = date(2026, 1, 3)
        for week in range(22):
            friday = start_fri + timedelta(weeks=week)
            if friday > date(2026, 6, 20):
                break
            base_amount = round(random.uniform(14.5, 17.0), 2)
            for _ in range(random.randint(2, 3)):
                amount = round(base_amount + random.uniform(-0.8, 0.8), 2)
                extra.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "date": friday.isoformat(),
                    "time": f"19:{random.randint(0, 29):02d}",
                    "merchant": "Zion Road Food Centre",
                    "category": "Food & Drink",
                    "amount": amount,
                    "location": "Singapore",
                })

    if user_id == "u2":
        # Thursday after-work bbt run — same group, same bbt shop
        start_thu = date(2026, 1, 8)
        for week in range(20):
            thursday = start_thu + timedelta(weeks=week)
            if thursday > date(2026, 6, 20):
                break
            base_amount = round(random.uniform(6.5, 8.0), 2)
            for _ in range(random.randint(2, 3)):
                amount = round(base_amount + random.uniform(-0.5, 0.5), 2)
                extra.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "date": thursday.isoformat(),
                    "time": f"17:{random.randint(30, 59):02d}",
                    "merchant": "Bober Tea Orchard",
                    "category": "Food & Drink",
                    "amount": amount,
                    "location": "Singapore",
                })

    if user_id == "u3":
        # Bi-weekly Saturday JB grocery run with consistent spend
        start_sat = date(2026, 1, 4)
        for week in range(0, 24, 2):
            saturday = start_sat + timedelta(weeks=week)
            if saturday > date(2026, 6, 20):
                break
            base_amount = round(random.uniform(42.0, 58.0), 2)
            for _ in range(random.randint(1, 2)):
                amount = round(base_amount + random.uniform(-3.0, 3.0), 2)
                extra.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "date": saturday.isoformat(),
                    "time": f"14:{random.randint(0, 59):02d}",
                    "merchant": "Paradigm Mall JB",
                    "category": "Shopping",
                    "amount": amount,
                    "location": "Johor Bahru",
                })

    return txns + extra


def seed():
    conn = get_db()
    c = conn.cursor()

    # Skip if already seeded
    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
        conn.close()
        return

    print("Seeding database...")
    start = date(2026, 1, 1)

    for user in USERS:
        c.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?)",
            (user["id"], user["persona"], user["display_name"], user["flashpay_balance"])
        )

    pools = {
        "u1": U1_MERCHANTS,
        "u2": U2_MERCHANTS,
        "u3": U3_MERCHANTS,
    }

    for user in USERS:
        txns = generate_transactions(user["id"], pools[user["id"]], start)
        txns = inject_pool_patterns(txns, user["id"])
        for t in txns:
            c.execute(
                "INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (t["id"], t["user_id"], t["date"], t["time"],
                 t["merchant"], t["category"], t["amount"], t["location"])
            )

    conn.commit()
    conn.close()
    print("Seeding complete.")


if __name__ == "__main__":
    from database import init_db
    init_db()
    seed()
