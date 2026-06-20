# NETS (Circles + Roam + Wrapped) — PolyFinTech100 2026 Demo

A mobile-first hackathon demo featuring two new NETS app features:
- **NETS Wrapped** — Spotify-Wrapped-style animated spend recap
- **Inferred Pools** — behaviorally inferred recurring split patterns

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

### 2. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in Chrome. The app renders in a phone-sized frame.

---

## Demo Profiles

| Profile | Persona | Switch to |
|---|---|---|
| Alex T. | The Hawker Loyalist 🍜 | Select via dropdown top-right |
| Jordan L. | The Bubble Tea Devotee 🧋 | Select via dropdown top-right |
| Sam K. | The JB Weekend Runner 🛣️ | Select via dropdown top-right |

---

## 60-Second On-Stage Demo Script

**[0:00–0:10] — Open the app**
> "This is NETS Wrapped — a new feature we've built directly into the NETS app. It looks and feels exactly like NETS because it *is* NETS — same nav, same components, same visual language."

**[0:10–0:20] — Tap Wrapped tab**
> "Tap the Wrapped tab. The app has crunched your 6 months of NETS transaction data server-side and produced your spend personality. Alex here is The Hawker Loyalist — $3,576 spent, 554 transactions."

**[0:20–0:35] — Play the story**
> "Hit Play. This is your spend story — swipeable, animated, like Instagram Stories but for your finances." *(Swipe through cards 1–6 — total spend counter, category breakdown, personality card, biggest day, streak heatmap, witty one-liner)*

**[0:35–0:40] — Share card**
> "The final card is shareable — tap Save as Image and it downloads a PNG ready for your Instagram story. This is the viral loop."

**[0:40–0:50] — Switch user, show Pools**
> "Switch to Jordan — a completely different personality: The Bubble Tea Devotee. Now tap Pools." *(Show inferred patterns)* "NETS noticed Jordan hits Bober Tea every Thursday after work with 2 others — inferred purely from timing and amount clustering. No names, no friend graph — just behaviour."

**[0:50–1:00] — Close**
> "Both features are served by a real FastAPI backend computing stats on actual transaction data. Wrapped is the acquisition hook — it's shareable, it's personal, and it makes NETS feel alive. Thank you."

---

## Architecture

```
c:/Nets Circles/
├── backend/
│   ├── main.py          # FastAPI app + startup seed
│   ├── database.py      # SQLite init
│   ├── seed.py          # 3 profiles × ~180 days of SG-flavored transactions
│   └── routes/
│       ├── transactions.py
│       ├── wrapped.py   # Wrapped stats computation
│       └── pools.py     # Behavioral pattern inference
├── frontend/
│   └── src/
│       ├── context/UserContext.tsx
│       ├── components/  # NetsLogo, NetsHeader, NetsTabBar, NetsCard,
│       │                # NetsButton, NetsFlashPayCard, UserSwitcher
│       └── screens/
│           ├── HomeScreen.tsx
│           ├── HistoryScreen.tsx
│           ├── WrappedScreen.tsx
│           ├── PoolsScreen.tsx
│           └── wrapped/
│               ├── WrappedStory.tsx   # Story orchestrator
│               └── cards/             # 7 story cards
└── reference/           # NETS app screenshots used as design reference
```

## Tech Stack
- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Recharts, html2canvas
- Backend: FastAPI, Python 3.11, SQLite (no ORM, stdlib sqlite3)
