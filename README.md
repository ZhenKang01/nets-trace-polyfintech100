# NETS Trace — PolyFinTech100 2026 Demo

**NETS Trace** is a hackathon demo for the NETS sponsor brief, featuring three new behavioral-intelligence features built into the NETS app shell:

| Feature | What it does |
|---|---|
| **NETS Wrapped** | Spotify-Wrapped-style animated spend recap — swipeable story cards, shareable as image |
| **NETS Roam** | Travel mode: pay via interoperable QR (DuitNow/PromptPay/QRIS), live SGD rate, no top-up ever needed |
| **Pools** | Two layers — *Inferred*: behaviorally-detected recurring group spend ("We noticed…", no social graph); *User-created*: invite friends, pool funds, track expenses, settle up |

Inferred features derive purely from **behavioral transaction data** — no user identity, demographics, or friend graph assumed.  
User-created Pools are explicit: members are added by you, NETS never assumes who they are.

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

| Method | Path | Description |
|---|---|---|
| GET | `/users` | List all profiles |
| GET | `/users/{id}/transactions` | Transaction history |
| GET | `/users/{id}/wrapped` | Wrapped stats (server-computed) |
| GET | `/users/{id}/pools` | Inferred recurring patterns |
| GET | `/users/{id}/roam` | Travel state, FX rate, foreign txn feed |
| GET | `/users/{id}/user-pools` | User-created pools with computed balances |
| POST | `/users/{id}/user-pools` | Create a pool |
| GET | `/user-pools/{pool_id}` | Pool detail — member balances, fund balance |
| POST | `/user-pools/{pool_id}/members` | Add a member |
| POST | `/user-pools/{pool_id}/expenses` | Add expense (equal or custom split) |
| GET | `/user-pools/{pool_id}/expenses` | Expense history |
| POST | `/user-pools/{pool_id}/contribute` | Add funds to pool kitty |
| GET | `/user-pools/{pool_id}/contributions` | Contribution history |
| POST | `/user-pools/{pool_id}/settle` | Mark a debt as settled |
| GET | `/user-pools/{pool_id}/invite` | Get / create invite QR code |
| GET | `/invite/{code}` | Invite join preview |

### 2. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome. The app renders in a phone-sized shell.

---

## Demo Profiles

| Profile | Persona | Key demo moment |
|---|---|---|
| Alex T. (u1) | The Hawker Loyalist 🍜 | Wrapped: Platinum hawker tier · Pools: "Supper Gang", owed S$54.93 |
| Jordan L. (u2) | The Bubble Tea Devotee 🧋 | Wrapped: Boba franchise candidate · Pools: "BBT Run", owed S$31.50 |
| Sam K. (u3) | The JB Weekend Runner 🛣️ | **Mid-travel** — Roam active in Johor Bahru · Wrapped: bilateral trade hero |

Switch between profiles via the dropdown at the top-right of the home screen.

---

## 90-Second On-Stage Demo Script

### [0:00–0:05] Open on Alex T.
> "This is NETS Trace — three new features built directly into the NETS app. Same nav, same components, same visual language — because it *is* NETS."

### [0:05–0:20] Tap Wrapped → Play
> "Tap Wrapped. NETS has crunched Alex's 6 months of data and built a spend personality. The Hawker Loyalist — S$3,500+, 500+ taps. Hit Play."  
*(Cards: total spend counter → category breakdown → personality tier → biggest day → streak heatmap → witty line → shareable card)*  
> "The final card is exportable — tap Save as Image, it downloads a PNG for your story. That's the viral loop."

### [0:20–0:30] Switch to Sam K. → Home screen
> "Switch to Sam — The JB Weekend Runner. Notice the banner: **NETS Roam active · Johor Bahru, Malaysia**."

### [0:30–0:45] Tap Roam tab
> "Live rate: 1 SGD = 3.42 MYR. Hit Pay with NETS QR."  
*(QR modal slides up — DuitNow QR, 5-minute countdown)*  
> "Works at any DuitNow merchant. Money comes straight from Sam's bank — no ringgit to carry, no prepaid wallet to top up. That's NETS' differentiator against YouTrip or Revolut."  
> "Scroll down — every foreign transaction this trip, in both MYR and SGD."

### [0:45–1:00] Tap Pools → switch to Alex
> "Switch to Alex. Tap Pools. Two layers at the top: pools Alex created himself."  
*(Tap into Supper Gang 🌙)*  
> "Pool Funds: S$0 in the kitty. Tap Add Funds — enter S$50, tap the button. Done — S$50 in pool, activity feed updates instantly."  
> "Tap Add Expense — Maxwell tonight, S$48, Alex paid. Balances recalculate server-side. Alex is now owed S$54.93 across all 6 expenses."  
> "Tap Invite — real scannable QR. Tap Preview join to see what Wei sees when she scans it."

### [1:00–1:05] Scroll down to Suggested
> "Below Your Pools: NETS Suggested. Jordan hits Bober Tea every Thursday — inferred purely from timing and amount clustering. No name. No friend graph. Every card says 'We noticed' — not 'Your friend paid.' Two features, two privacy contracts, clearly separated."

### [1:05–1:10] Close
> "Wrapped is the acquisition hook — shareable, personal, makes NETS feel alive. Roam removes the last friction of cross-border cashless. Pools brings social spending intelligence: inferred for discovery, explicit for real tracking. Thank you."

---

## Architecture

```
c:/Nets Circles/
├── backend/
│   ├── main.py          # FastAPI app, CORS, startup seed
│   ├── database.py      # SQLite schema (9 tables, IF NOT EXISTS)
│   ├── seed.py          # 3 profiles × ~170 days; demo pools with pre-seeded expenses
│   └── routes/
│       ├── transactions.py   # History feed
│       ├── wrapped.py        # Wrapped stats computation
│       ├── pools.py          # Behavioral pattern inference
│       ├── roam.py           # Travel state, FX rates, foreign txn feed
│       └── user_pools.py     # User-created pools, balance math, contributions
├── frontend/
│   └── src/
│       ├── context/UserContext.tsx
│       ├── components/       # NetsLogo, NetsHeader, NetsTabBar, NetsCard,
│       │                     # NetsFlashPayCard, UserSwitcher
│       └── screens/
│           ├── HomeScreen.tsx         # Roam active banner
│           ├── HistoryScreen.tsx
│           ├── WrappedScreen.tsx
│           ├── RoamScreen.tsx         # Travel mode, QR modal, SGD feed
│           ├── PoolsScreen.tsx        # Your Pools + Suggested; 3-step create overlay
│           ├── PoolDetailScreen.tsx   # Fund balance, expense split, add funds/expense,
│           │                          # settle up, invite QR, activity feed
│           ├── JoinPreviewScreen.tsx  # Simulated invite accept flow
│           └── wrapped/
│               ├── WrappedStory.tsx   # Story orchestrator (auto-advance, tap, hold-pause)
│               └── cards/             # 7 story cards
└── reference/            # NETS app screenshots used as design reference
```

## Database Schema (SQLite)

| Table | Purpose |
|---|---|
| `users` | 3 demo profiles with persona, balance, travel state |
| `transactions` | ~900 SG-flavoured transactions seeded across Jan–Jun 2026 |
| `user_pools` | User-created pools (name, icon, tag, owner) |
| `pool_members` | Pool membership — added by the owner, never inferred |
| `pool_expenses` | Shared expenses with payer and split type |
| `expense_splits` | Per-member amounts owed for each expense |
| `pool_contributions` | Money added to the pool kitty by members |
| `pool_settlements` | Recorded debt settlements |
| `pool_invites` | Invite codes for QR-based pool joining |

## Tech Stack
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, html2canvas, qrcode.react
- **Backend:** FastAPI, Python 3.11, SQLite (stdlib `sqlite3`, no ORM)
- **No real API keys, no real auth** — everything is simulated for demo purposes
