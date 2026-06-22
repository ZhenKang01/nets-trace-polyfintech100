# NETS Trace — PolyFinTech100 2026 Demo

**NETS Trace** is a hackathon demo for the NETS sponsor brief, featuring three new behavioral-intelligence features built into the NETS app shell:

| Feature | What it does |
|---|---|
| **NETS Wrapped** | Spotify-Wrapped-style animated spend recap — swipeable story cards, shareable as image |
| **NETS Roam** | Travel mode: pay via interoperable QR (DuitNow/PromptPay/QRIS), see what you paid in SGD, no top-up ever needed |
| **Pools** | Two layers: *Inferred* ("We noticed…" patterns, no social graph) + *User-created* (invite friends by name/QR, track shared expenses, settle up) |

Inferred features derive purely from **behavioral transaction data** — no user identity, demographics, or friend graph assumed.  
User-created Pools are explicit user-volunteered social data — members are added by you, not inferred by NETS.

---

## Quick Start

### 1. Backend (FastAPI + SQLite)

```bash
cd backend
pip install fastapi uvicorn
python -m uvicorn main:app --reload --port 8000
```

The database is auto-created and seeded with 3 demo profiles on first run.

**API endpoints:**
- `GET /users` — list all profiles
- `GET /users/{id}/transactions` — transaction history
- `GET /users/{id}/wrapped` — Wrapped stats (computed server-side)
- `GET /users/{id}/pools` — inferred recurring patterns
- `GET /users/{id}/roam` — travel mode state, FX rate, foreign transactions
- `GET /users/{id}/user-pools` — user-created pools with computed balances
- `POST /users/{id}/user-pools` — create a pool
- `GET /user-pools/{pool_id}` — pool detail with member balances
- `POST /user-pools/{pool_id}/expenses` — add expense (equal or custom split)
- `POST /user-pools/{pool_id}/settle` — mark a debt as settled
- `GET /user-pools/{pool_id}/invite` — get/create invite QR code
- `GET /invite/{code}` — join preview for invitees

### 2. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome. The app renders in a phone-sized frame.

---

## Demo Profiles

| Profile | Persona | Key demo moment |
|---|---|---|
| Alex T. (u1) | The Hawker Loyalist 🍜 | Wrapped: Platinum hawker tier; Pools: Friday dinner pattern |
| Jordan L. (u2) | The Bubble Tea Devotee 🧋 | Wrapped: Boba franchise candidate; Pools: Thursday BBT run |
| Sam K. (u3) | The JB Weekend Runner 🛣️ | **Mid-travel** — Roam active in Johor Bahru; Wrapped: bilateral trade hero |

Switch between profiles via the dropdown at top-right of the home screen.

---

## 90-Second On-Stage Demo Script

### [0:00–0:05] Open the app on Alex T.
> "This is NETS Trace — three new features we've built directly into the NETS app. Same nav, same components, same visual language — because it *is* NETS."

### [0:05–0:20] Tap Wrapped tab → Play
> "Tap Wrapped. NETS has crunched Alex's 6 months of transaction data and built a spend personality. Alex is The Hawker Loyalist — S$3,500+, 500+ taps. Hit Play."
*(Swipe through cards: total spend counter → category breakdown → personality → biggest day → streak heatmap → witty line → shareable card)*
> "The final card is exportable — tap Save as Image, it downloads a PNG for your story. That's the viral loop."

### [0:20–0:30] Switch to Sam K. → Home screen
> "Switch to Sam — The JB Weekend Runner. Notice the banner: **NETS Roam active · Johor Bahru, Malaysia**. NETS detected the location shift automatically."

### [0:30–0:50] Tap Roam tab
> "Tap Roam. Sam is in JB right now. Live rate: 1 SGD = 3.42 MYR. Hit Pay with NETS QR."
*(QR modal slides up — DuitNow QR, 5-minute countdown)*
> "This QR works at any DuitNow merchant. The money comes **straight from Sam's bank account** — no ringgit to carry, no prepaid balance to top up. That's NETS' differentiator versus YouTrip or Revolut."
*(Close QR, scroll down)*
> "Below the fold: every foreign transaction this trip, showing both MYR and the exact SGD charged."

### [0:50–1:05] Tap Pools tab (switch to Jordan or Alex)
> "Switch to Jordan. Tap Pools. NETS noticed Jordan hits Bober Tea every Thursday after work with 2 others — inferred purely from timing and amount clustering. No names. No friend graph. Just behaviour. Every label says 'We noticed' — not 'Your friend paid.'"

### [0:50–1:00] Tap Pools → Your Pools (switch to Alex)
> "Switch to Alex. Tap Pools. Two layers here. Top: pools Alex created himself — the Supper Gang with Wei and Aishwaryaa. Alex is owed S$54.93 from 5 shared suppers. Tap in."
*(Pool detail: green balance hero, member list with per-person balances, expense history)*
> "Tap Add Expense — Maxwell tonight, S$48, split equally. Balances update instantly. Tap Share invite — QR code, scannable by Wei's phone. Tap Preview join to see what the invitee sees."

### [1:00–1:05] Scroll down to Suggested
> "Below 'Your Pools': NETS Suggested — Jordan's Bober Tea pattern, inferred purely from behaviour. No name. No friend. Just timing. Two features, two privacy contracts, clearly separated."

### [1:05–1:10] Close
> "Wrapped is the acquisition hook — shareable, personal, makes NETS feel alive. Roam removes the last friction of travelling cashless. Pools works at two levels: inferred intelligence for discovery, explicit tracking for real group spend. Thank you."

---

## Architecture

```
c:/Nets Circles/
├── backend/
│   ├── main.py          # FastAPI app (NETS Trace API v2)
│   ├── database.py      # SQLite init (users + transactions)
│   ├── seed.py          # 3 profiles × ~180 days SG-flavored transactions; u3 mid-travel
│   └── routes/
│       ├── transactions.py
│       ├── wrapped.py   # Wrapped stats computation
│       ├── pools.py     # Behavioral pattern inference
│       └── roam.py      # Travel state, FX rates, foreign txn feed
├── frontend/
│   └── src/
│       ├── context/UserContext.tsx
│       ├── components/  # NetsLogo, NetsHeader, NetsTabBar, NetsCard, NetsButton,
│       │                # NetsFlashPayCard, UserSwitcher
│       └── screens/
│           ├── HomeScreen.tsx      # Roam alert banner when traveling
│           ├── HistoryScreen.tsx
│           ├── WrappedScreen.tsx
│           ├── RoamScreen.tsx      # Travel mode, QR modal, SGD feed
│           ├── PoolsScreen.tsx     # Two-section: user-created + inferred; create flow overlay
│           ├── PoolDetailScreen.tsx # Pool detail, add expense, settle up, invite QR
│           ├── JoinPreviewScreen.tsx # Simulated invite accept flow
│           └── wrapped/
│               ├── WrappedStory.tsx   # Story orchestrator (auto-advance, tap-skip, hold-pause)
│               └── cards/             # 7 story cards
└── reference/           # NETS app screenshots used as design reference
```

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, html2canvas, qrcode.react
- **Backend:** FastAPI, Python 3.11, SQLite (stdlib sqlite3, no ORM)
- **No real API keys, no real auth** — everything is simulated
