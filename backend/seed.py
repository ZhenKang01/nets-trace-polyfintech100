import random
import uuid
from datetime import date, timedelta, datetime
from database import get_db

random.seed(42)

USERS = [
    {
        "id": "u1",
        "persona": "The Hawker Loyalist",
        "display_name": "Alex T.",
        "flashpay_balance": 47.20,
        "is_traveling": 0,
        "current_location": "Singapore",
    },
    {
        "id": "u2",
        "persona": "The Bubble Tea Devotee",
        "display_name": "Jordan L.",
        "flashpay_balance": 12.40,   # perpetually broke from bbt
        "is_traveling": 0,
        "current_location": "Singapore",
    },
    {
        "id": "u3",
        "persona": "The JB Weekend Runner",
        "display_name": "Sam K.",
        "flashpay_balance": 61.50,
        "is_traveling": 1,
        "current_location": "Johor Bahru, Malaysia",
    },
]

# Alex: hawker food dominant — Tian Tian is the clear #1 by visits,
# SMRT kept low so it doesn't hijack top_merchant.
U1_MERCHANTS = [
    ("Food & Drink", "Tian Tian Chicken Rice",  (3.5,  5.5), 20),
    ("Food & Drink", "Maxwell Food Centre",      (3.0,  7.0), 12),
    ("Food & Drink", "Old Chang Kee",            (1.5,  3.5),  8),
    ("Food & Drink", "Bedok 85 Market",          (3.0,  6.0),  8),
    ("Food & Drink", "Ya Kun Kaya Toast",        (4.0,  7.5),  7),
    ("Food & Drink", "Kopitiam",                 (3.0,  6.5),  6),
    ("Food & Drink", "Lau Pa Sat",               (4.0,  9.0),  6),
    ("Food & Drink", "Toast Box",                (4.5,  8.0),  4),
    ("Groceries",    "NTUC FairPrice",           (12.0, 45.0),  4),
    ("Transport",    "SMRT MRT",                 (1.2,  2.8),  6),
    ("Transport",    "SBS Transit Bus",          (0.80, 1.80),  4),
    ("Groceries",    "Sheng Siong",              (8.0, 30.0),   2),
]

# Jordan: BBT shops dominate — LiHo #1, Share Tea removed from random pool
# (used only in the pool injection so pattern detection stays clean).
U2_MERCHANTS = [
    ("Food & Drink",   "LiHo Tea",             (5.5,  8.5), 22),
    ("Food & Drink",   "Koi Thé",              (5.0,  8.0), 16),
    ("Food & Drink",   "Gong Cha",             (5.0,  7.5), 14),
    ("Food & Drink",   "The Alley",            (6.0,  9.0),  8),
    ("Food & Drink",   "Tiger Sugar",          (6.5,  9.5),  6),
    ("Transport",      "Grab",                 (8.0, 18.0),  6),
    ("Food & Drink",   "Starbucks",            (6.5,  9.5),  4),
    ("Food & Drink",   "Shake Shack",         (14.0, 22.0),  3),
    ("Food & Drink",   "Saizeriya",           (10.0, 18.0),  3),
    ("Transport",      "SMRT MRT",             (1.2,  2.8),  3),
    ("Shopping",       "Uniqlo",              (19.90, 89.90), 2),
    ("Shopping",       "Cotton On",           (14.90, 49.90), 2),
    ("Entertainment",  "Cathay Cineplexes",   (13.50, 15.50), 2),
    ("Shopping",       "Watsons",             (8.0,  25.0),  1),
]

# Sam: Singapore weekday commute + JB weekend spend.
JB_MERCHANTS = {
    "JB City Square Mall Food Court", "AEON Tebrau City", "Petrol Kiosk JB",
    "KSL City Food Court", "Mr DIY JB", "Toppen Shopping Centre",
    "Giant Hypermarket JB", "Paradigm Mall JB", "Woodlands Checkpoint",
}

U3_MERCHANTS = [
    ("Transport",  "SMRT MRT",                    (1.2,  2.8), 14),
    ("Transport",  "SBS Transit Bus",             (0.80, 1.80), 6),
    ("Transport",  "Woodlands Checkpoint",        (2.0,  4.0),  6),
    ("Food & Drink","Tian Tian Chicken Rice",     (3.5,  5.5),  5),
    ("Food & Drink","Old Chang Kee",              (1.5,  3.5),  4),
    ("Food & Drink","McDonald's",                 (8.0, 14.0),  4),
    ("Groceries",  "NTUC FairPrice",             (15.0, 55.0),  5),
    ("Food & Drink","JB City Square Mall Food Court",(8.0,18.0),8),
    ("Shopping",   "AEON Tebrau City",           (25.0, 85.0),  4),
    ("Transport",  "Petrol Kiosk JB",            (28.0, 55.0),  4),
    ("Food & Drink","KSL City Food Court",        (7.0, 15.0),  6),
    ("Shopping",   "Mr DIY JB",                 (10.0, 60.0),   3),
    ("Food & Drink","Toppen Shopping Centre",    (10.0, 22.0),   4),
    ("Groceries",  "Giant Hypermarket JB",       (20.0, 80.0),   3),
]


def location_for(merchant: str) -> str:
    return "Johor Bahru" if merchant in JB_MERCHANTS else "Singapore"


def weighted_choice(pool):
    items = [(cat, merchant, rng) for cat, merchant, rng, _ in pool]
    weights = [w for *_, w in pool]
    return random.choices(items, weights=weights, k=1)[0]


def rtime(h_lo=8, h_hi=22):
    return f"{random.randint(h_lo, h_hi):02d}:{random.randint(0, 59):02d}"


def txn(user_id, date_str, time_str, merchant, category, amount, location):
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "date": date_str,
        "time": time_str,
        "merchant": merchant,
        "category": category,
        "amount": amount,
        "location": location,
    }


def generate_transactions(user_id, merchant_pool, start_date, num_days=180):
    rows = []
    current = start_date
    for _ in range(num_days):
        if user_id == "u1":
            # Alex rarely misses a day — hawker 3x daily is the norm
            count = random.choices([2, 3, 4], weights=[20, 50, 30])[0]
        elif user_id == "u2":
            # Jordan sometimes skips weekends (catching up on sleep)
            count = random.choices([0, 1, 2, 3], weights=[8, 20, 45, 27])[0]
        else:
            # Sam: weekdays light (mostly commute), weekends moderate (JB runs)
            if current.weekday() >= 5:
                count = random.choices([2, 3, 4], weights=[30, 45, 25])[0]
            else:
                count = random.choices([1, 2], weights=[40, 60])[0]

        for _ in range(count):
            cat, merchant, (lo, hi) = weighted_choice(merchant_pool)
            rows.append(txn(
                user_id, current.isoformat(), rtime(),
                merchant, cat, round(random.uniform(lo, hi), 2),
                location_for(merchant),
            ))
        current += timedelta(days=1)
    return rows


# ---------------------------------------------------------------------------
# Pool pattern injections — carefully engineered so the detection algo fires
# ---------------------------------------------------------------------------

def inject_pool_patterns(rows, user_id):
    extra = []

    if user_id == "u1":
        # Friday group dinner at Zion Road Food Centre.
        # 3 transactions per Friday → detection sees 3 co-located same-amount hits;
        # avg ~$15.50 > $12 → inferred_participants = 3.
        start = date(2026, 1, 2)   # first Friday
        for w in range(25):
            friday = start + timedelta(weeks=w)
            if friday > date(2026, 6, 20):
                break
            base = round(random.uniform(14.8, 16.2), 2)
            for _ in range(3):
                extra.append(txn(
                    user_id, friday.isoformat(),
                    f"19:{random.randint(0, 45):02d}",
                    "Zion Road Food Centre", "Food & Drink",
                    round(base + random.uniform(-0.4, 0.4), 2),
                    "Singapore",
                ))

    if user_id == "u2":
        # Thursday after-work BBT group order — one person pays for 3.
        # Single ~$21 transaction → avg > $12 → 3 participants inferred.
        # Amount spread is tight (base ±1) → detection threshold easily met.
        start = date(2026, 1, 8)   # first Thursday
        for w in range(23):
            thursday = start + timedelta(weeks=w)
            if thursday > date(2026, 6, 20):
                break
            base = round(random.uniform(19.8, 22.2), 2)
            extra.append(txn(
                user_id, thursday.isoformat(),
                f"17:{random.randint(30, 59):02d}",
                "Bober Tea Orchard", "Food & Drink",
                round(base + random.uniform(-0.8, 0.8), 2),
                "Singapore",
            ))

    if user_id == "u3":
        # Bi-weekly Saturday Paradigm Mall JB grocery+shopping trip.
        # Tight amount range (±2 around 47–51) → spread/avg ≈ 0.12 < 0.35.
        # avg ~$49 > $12 → inferred_participants = 2 (a couple's trip).
        start = date(2026, 1, 3)   # first Saturday
        for w in range(0, 24, 2):
            saturday = start + timedelta(weeks=w)
            if saturday > date(2026, 6, 20):
                break
            base = round(random.uniform(47.0, 51.0), 2)
            for _ in range(random.randint(1, 2)):
                extra.append(txn(
                    user_id, saturday.isoformat(),
                    f"14:{random.randint(0, 59):02d}",
                    "Paradigm Mall JB", "Shopping",
                    round(base + random.uniform(-1.5, 1.5), 2),
                    "Johor Bahru",
                ))

    return rows + extra


# ---------------------------------------------------------------------------
# Big-day injections — guarantees Wrapped Card 4 tells a clear story
# ---------------------------------------------------------------------------

def inject_big_days(rows, user_id):
    extra = []

    if user_id == "u1":
        # CNY Eve (28 Jan 2026) — hawker feast + last-minute groceries.
        # Total: ~$137. No other random day should approach this.
        for cat, merchant, amt, t in [
            ("Groceries",    "NTUC FairPrice",       52.30, "10:15"),
            ("Food & Drink", "Maxwell Food Centre",  24.80, "12:00"),
            ("Food & Drink", "Lau Pa Sat",           38.50, "18:30"),
            ("Food & Drink", "Tian Tian Chicken Rice", 5.50, "19:45"),
            ("Food & Drink", "Old Chang Kee",         9.80, "20:30"),
            ("Food & Drink", "Ya Kun Kaya Toast",     7.20, "21:15"),
        ]:
            extra.append(txn(user_id, "2026-01-28", t, merchant, cat, amt, "Singapore"))

    if user_id == "u2":
        # Birthday splurge (5 Apr 2026) — shopping haul + full bbt marathon.
        # Total: ~$184. Uniqlo + cinema + Shake Shack + 3 BBT shops.
        for cat, merchant, amt, t in [
            ("Shopping",       "Uniqlo",              79.90, "11:00"),
            ("Food & Drink",   "Koi Thé",              8.50, "12:30"),
            ("Food & Drink",   "Shake Shack",         22.40, "13:00"),
            ("Entertainment",  "Cathay Cineplexes",   15.50, "15:00"),
            ("Food & Drink",   "The Alley",            8.90, "17:30"),
            ("Shopping",       "Watsons",             24.60, "18:00"),
            ("Food & Drink",   "LiHo Tea",             7.80, "20:00"),
            ("Food & Drink",   "Saizeriya",           16.80, "20:30"),
        ]:
            extra.append(txn(user_id, "2026-04-05", t, merchant, cat, amt, "Singapore"))

    if user_id == "u3":
        # Mega JB haul Saturday (21 Mar 2026) — car full-tank, AEON sweep,
        # Giant grocery run, hardware. Total: ~$392.
        # Even a lucky random weekend can't beat this.
        for cat, merchant, amt, t in [
            ("Transport",  "Petrol Kiosk JB",       63.50, "08:50"),
            ("Shopping",   "AEON Tebrau City",      158.80, "10:30"),
            ("Food & Drink","KSL City Food Court",   14.20, "13:00"),
            ("Groceries",  "Giant Hypermarket JB",   95.60, "14:30"),
            ("Shopping",   "Mr DIY JB",              42.90, "16:00"),
            ("Food & Drink","Toppen Shopping Centre", 17.40, "18:00"),
        ]:
            extra.append(txn(user_id, "2026-03-21", t, merchant, cat, amt, "Johor Bahru"))

    return rows + extra


# ---------------------------------------------------------------------------
# Current JB trip for Sam — makes the Roam screen feel live
# ---------------------------------------------------------------------------

def inject_current_jb_trip(rows, user_id):
    if user_id != "u3":
        return rows

    trip = [
        # Jun 18 — crossing over + first day
        ("Transport",   "Woodlands Checkpoint",          3.20, "2026-06-18", "09:12"),
        ("Transport",   "Petrol Kiosk JB",              54.60, "2026-06-18", "10:45"),
        ("Food & Drink","JB City Square Mall Food Court",11.20, "2026-06-18", "12:30"),
        ("Food & Drink","KSL City Food Court",            9.80, "2026-06-18", "15:00"),
        ("Shopping",    "Mr DIY JB",                    24.60, "2026-06-18", "17:30"),
        # Jun 19 — shopping day
        ("Shopping",    "AEON Tebrau City",             78.40, "2026-06-19", "10:00"),
        ("Food & Drink","Toppen Shopping Centre",        13.50, "2026-06-19", "13:00"),
        ("Groceries",   "Giant Hypermarket JB",         52.30, "2026-06-19", "16:00"),
        ("Food & Drink","KSL City Food Court",           10.90, "2026-06-19", "19:30"),
        # Jun 20 — today (currently in JB)
        ("Shopping",    "Paradigm Mall JB",             48.20, "2026-06-20", "09:30"),
        ("Food & Drink","JB City Square Mall Food Court", 8.90, "2026-06-20", "12:15"),
        ("Food & Drink","McDonald's",                   11.50, "2026-06-20", "14:45"),
    ]

    extra = []
    for cat, merchant, amt, d, t in trip:
        extra.append(txn(user_id, d, t, merchant, cat, amt, "Johor Bahru"))
    return rows + extra


# ---------------------------------------------------------------------------
# Seed entrypoint
# ---------------------------------------------------------------------------

def seed():
    conn = get_db()
    c = conn.cursor()

    if c.execute("SELECT COUNT(*) FROM users").fetchone()[0] > 0:
        conn.close()
        return

    print("Seeding database...")
    start = date(2026, 1, 1)
    pools = {"u1": U1_MERCHANTS, "u2": U2_MERCHANTS, "u3": U3_MERCHANTS}

    for user in USERS:
        c.execute(
            "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)",
            (user["id"], user["persona"], user["display_name"],
             user["flashpay_balance"], user["is_traveling"], user["current_location"]),
        )

    for user in USERS:
        uid = user["id"]
        # u3 random generation stops Jun 17 — inject_current_jb_trip handles Jun 18-20
        # cleanly so the Roam feed isn't polluted with future random JB transactions.
        # u1/u2 run through Jun 20 (171 days).
        num_days = 168 if uid == "u3" else 171
        rows = generate_transactions(uid, pools[uid], start, num_days)
        rows = inject_pool_patterns(rows, uid)
        rows = inject_big_days(rows, uid)
        rows = inject_current_jb_trip(rows, uid)
        for r in rows:
            c.execute(
                "INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (r["id"], r["user_id"], r["date"], r["time"],
                 r["merchant"], r["category"], r["amount"], r["location"]),
            )

    conn.commit()
    seed_pools(conn)
    seed_trips(conn)
    conn.close()
    print("Seeding complete.")


# ---------------------------------------------------------------------------
# Pool seeding — demo user-created pools with pre-computed expense history
# ---------------------------------------------------------------------------

def _insert_expense(c, exp_id, pool_id, payer_id, amount, description, split_type, date_str, splits):
    """Insert one pool expense and its splits. splits = {member_id: amount_owed}."""
    c.execute(
        "INSERT INTO pool_expenses (id, pool_id, payer_member_id, amount, description, split_type, created_at) "
        "VALUES (?,?,?,?,?,?,?)",
        (exp_id, pool_id, payer_id, amount, description, split_type, date_str + "T12:00:00"),
    )
    for member_id, owed in splits.items():
        c.execute(
            "INSERT INTO expense_splits (id, expense_id, member_id, amount_owed) VALUES (?,?,?,?)",
            (str(uuid.uuid4()), exp_id, member_id, owed),
        )


def seed_pools(conn):
    c = conn.cursor()
    if c.execute("SELECT COUNT(*) FROM user_pools").fetchone()[0] > 0:
        return

    # ── Fixed IDs for reproducibility ────────────────────────────────────────
    # Alex (u1) — Supper Gang
    POOL_SG   = "pool-sg-001"
    M_SG_ALEX = "mem-sg-alex";  M_SG_WEI = "mem-sg-wei";  M_SG_AISH = "mem-sg-aish"

    # Alex (u1) — Tekong Reunion
    POOL_TR    = "pool-tr-001"
    M_TR_ALEX  = "mem-tr-alex";  M_TR_DAR = "mem-tr-darren";  M_TR_KAI = "mem-tr-kai"

    # Jordan (u2) — BBT Run
    POOL_BBT   = "pool-bbt-001"
    M_BBT_JOR  = "mem-bbt-jordan";  M_BBT_MEI = "mem-bbt-mei";  M_BBT_PRI = "mem-bbt-priya"

    # ── Alex — Supper Gang 🌙 ─────────────────────────────────────────────────
    # Purpose: supper hangouts.  Five expenses over the last 10 days.
    #
    # Verified balances:
    #   Alex T.       +S$54.93  (owed by others)
    #   Wei H.        −S$19.67  (owes Alex)
    #   Aishwaryaa M. −S$35.26  (owes Alex)
    #   Sum = 0.00 ✓
    c.execute(
        "INSERT INTO user_pools VALUES (?,?,?,?,?,?)",
        (POOL_SG, "Supper Gang", "🌙", "Supper", "u1", "2026-06-13T18:00:00"),
    )
    for mid, name, phone, is_self in [
        (M_SG_ALEX, "Alex T.",       None,              1),
        (M_SG_WEI,  "Wei H.",        "+65 9123 4567",   0),
        (M_SG_AISH, "Aishwaryaa M.", "+65 8234 5678",   0),
    ]:
        c.execute(
            "INSERT INTO pool_members VALUES (?,?,?,?,?,?)",
            (mid, POOL_SG, name, phone, is_self, "2026-06-13T18:00:00"),
        )

    # E1 – $45.80 Alex paid (equal: Alex $15.27, Wei $15.27, Aish $15.26)
    _insert_expense(c, "exp-sg-1", POOL_SG, M_SG_ALEX, 45.80, "Maxwell hawker supper", "equal",
                    "2026-06-13", {M_SG_ALEX: 15.27, M_SG_WEI: 15.27, M_SG_AISH: 15.26})
    # E2 – $12.60 Wei paid (equal: $4.20 each)
    _insert_expense(c, "exp-sg-2", POOL_SG, M_SG_WEI, 12.60, "Old Chang Kee snacks", "equal",
                    "2026-06-14", {M_SG_ALEX: 4.20, M_SG_WEI: 4.20, M_SG_AISH: 4.20})
    # E3 – $18.00 Aish paid (equal: $6.00 each)
    _insert_expense(c, "exp-sg-3", POOL_SG, M_SG_AISH, 18.00, "Grab home split", "equal",
                    "2026-06-17", {M_SG_ALEX: 6.00, M_SG_WEI: 6.00, M_SG_AISH: 6.00})
    # E4 – $62.40 Alex paid (equal: $20.80 each)
    _insert_expense(c, "exp-sg-4", POOL_SG, M_SG_ALEX, 62.40, "Lau Pa Sat Friday dinner", "equal",
                    "2026-06-20", {M_SG_ALEX: 20.80, M_SG_WEI: 20.80, M_SG_AISH: 20.80})
    # E5 – $21.00 Wei paid (equal: $7.00 each)
    _insert_expense(c, "exp-sg-5", POOL_SG, M_SG_WEI, 21.00, "Bubble tea round", "equal",
                    "2026-06-21", {M_SG_ALEX: 7.00, M_SG_WEI: 7.00, M_SG_AISH: 7.00})

    # Pre-seed invite code so demo QR is stable across reseeds
    c.execute(
        "INSERT INTO pool_invites VALUES (?,?,?,?)",
        ("inv-sg-001", POOL_SG, "SUPR2026", "2026-06-13T18:00:00"),
    )

    # ── Alex — Tekong Reunion 🎖️ ──────────────────────────────────────────────
    # Purpose: occasional NS buddy dinners.  One recent expense.
    #
    # Balances: Alex +S$24.00, Darren −S$12.00, Kai −S$12.00  (sum=0 ✓)
    c.execute(
        "INSERT INTO user_pools VALUES (?,?,?,?,?,?)",
        (POOL_TR, "Tekong Reunion", "🎖️", "Dinner", "u1", "2026-06-22T19:00:00"),
    )
    for mid, name, phone, is_self in [
        (M_TR_ALEX,  "Alex T.",   None,            1),
        (M_TR_DAR,   "Darren T.", "+65 9345 6789", 0),
        (M_TR_KAI,   "Kai W.",    "+65 8901 2345", 0),
    ]:
        c.execute(
            "INSERT INTO pool_members VALUES (?,?,?,?,?,?)",
            (mid, POOL_TR, name, phone, is_self, "2026-06-22T19:00:00"),
        )
    _insert_expense(c, "exp-tr-1", POOL_TR, M_TR_ALEX, 36.00, "Tiong Bahru chicken rice", "equal",
                    "2026-06-22", {M_TR_ALEX: 12.00, M_TR_DAR: 12.00, M_TR_KAI: 12.00})

    # ── Jordan — BBT Run 🧋 ───────────────────────────────────────────────────
    # Purpose: bubble tea runs.  Three expenses over last week.
    #
    # Verified balances:
    #   Jordan L. +S$31.50  (owed by others)
    #   Mei L.    −S$4.50   (owes Jordan)
    #   Priya S.  −S$27.00  (owes Jordan)
    #   Sum = 0.00 ✓
    c.execute(
        "INSERT INTO user_pools VALUES (?,?,?,?,?,?)",
        (POOL_BBT, "BBT Run", "🧋", "Drinks", "u2", "2026-06-18T15:00:00"),
    )
    for mid, name, phone, is_self in [
        (M_BBT_JOR, "Jordan L.", None,            1),
        (M_BBT_MEI, "Mei L.",    "+65 9876 5432", 0),
        (M_BBT_PRI, "Priya S.",  "+65 8765 4321", 0),
    ]:
        c.execute(
            "INSERT INTO pool_members VALUES (?,?,?,?,?,?)",
            (mid, POOL_BBT, name, phone, is_self, "2026-06-18T15:00:00"),
        )
    # E1 – $27.50 Jordan paid (Jordan $9.17, Mei $9.17, Priya $9.16  →  sum $27.50 ✓)
    _insert_expense(c, "exp-bbt-1", POOL_BBT, M_BBT_JOR, 27.50, "Tiger Sugar run", "equal",
                    "2026-06-18", {M_BBT_JOR: 9.17, M_BBT_MEI: 9.17, M_BBT_PRI: 9.16})
    # E2 – $22.50 Mei paid ($7.50 each)
    _insert_expense(c, "exp-bbt-2", POOL_BBT, M_BBT_MEI, 22.50, "Gong Cha round", "equal",
                    "2026-06-19", {M_BBT_JOR: 7.50, M_BBT_MEI: 7.50, M_BBT_PRI: 7.50})
    # E3 – $31.00 Jordan paid (Jordan $10.33, Mei $10.33, Priya $10.34  →  sum $31.00 ✓)
    _insert_expense(c, "exp-bbt-3", POOL_BBT, M_BBT_JOR, 31.00, "The Alley + Share Tea", "equal",
                    "2026-06-21", {M_BBT_JOR: 10.33, M_BBT_MEI: 10.33, M_BBT_PRI: 10.34})

    conn.commit()


def seed_trips(conn):
    """Seed Sam's active JB trip — started 2026-06-18 when inject_current_jb_trip txns begin."""
    c = conn.cursor()
    if c.execute("SELECT COUNT(*) FROM trips").fetchone()[0] > 0:
        return
    import json
    c.execute(
        """INSERT INTO trips
           (id, user_id, destination, country, currency, symbol, flag, fx_rate, networks, started_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (
            "trip-sam-jb-001", "u3",
            "Johor Bahru", "Malaysia", "MYR", "RM", "🇲🇾", 3.42,
            json.dumps(["DuitNow", "MyDebit"]),
            "2026-06-18T09:00:00Z",
        ),
    )
    conn.commit()


if __name__ == "__main__":
    from database import init_db
    init_db()
    seed()
