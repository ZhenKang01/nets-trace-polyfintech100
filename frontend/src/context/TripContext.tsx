import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from "react";
import type { ReactNode } from "react";
import { useUser } from "./UserContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";
const POLL_MS = 5000;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TripTxn {
  id: string; date: string; time: string; merchant: string;
  category: string; amount: number; local_amount: number;
  local_symbol: string; local_currency: string; location: string;
}

export interface ActiveTrip {
  id: string;
  destination: string;
  country: string;
  currency: string;
  symbol: string;
  flag: string;
  fx_rate: number;
  networks: string[];
  started_at: string;
  txn_count: number;
  total_sgd: number;
  recent_txns: TripTxn[];
}

interface TripCtx {
  activeTrip: ActiveTrip | null;
  justActivated: boolean;
  loading: boolean;
  dismissActivation: () => void;
  endTrip: () => Promise<void>;
  injectForeignTxn: (city?: string) => Promise<void>;
  refresh: () => void;
}

// ── Fallback Bangkok trip for offline/Netlify demo ────────────────────────────

const BANGKOK_FALLBACK: ActiveTrip = {
  id: "trip-demo-bkk",
  destination: "Bangkok",
  country: "Thailand",
  currency: "THB",
  symbol: "฿",
  flag: "🇹🇭",
  fx_rate: 27.50,
  networks: ["PromptPay"],
  started_at: new Date().toISOString(),
  txn_count: 1,
  total_sgd: 12.50,
  recent_txns: [
    {
      id: "demo-t1", date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      merchant: "Pad Thai Fawng (Silom)", category: "Food & Drink",
      amount: 12.50, local_amount: 343.75, local_symbol: "฿", local_currency: "THB",
      location: "Bangkok",
    },
  ],
};

const SAM_JB_FALLBACK: ActiveTrip = {
  id: "trip-sam-jb-001",
  destination: "Johor Bahru",
  country: "Malaysia",
  currency: "MYR",
  symbol: "RM",
  flag: "🇲🇾",
  fx_rate: 3.42,
  networks: ["DuitNow", "MyDebit"],
  started_at: "2026-06-18T09:00:00Z",
  txn_count: 12,
  total_sgd: 338.30,
  recent_txns: [
    { id: "f1", date: "2026-06-20", time: "14:45", merchant: "McDonald's", category: "Food & Drink", amount: 11.50, local_amount: 39.33, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f2", date: "2026-06-20", time: "12:15", merchant: "JB City Square Mall Food Court", category: "Food & Drink", amount: 8.90, local_amount: 30.44, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f3", date: "2026-06-20", time: "09:30", merchant: "Paradigm Mall JB", category: "Shopping", amount: 48.20, local_amount: 164.84, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f4", date: "2026-06-19", time: "19:30", merchant: "KSL City Food Court", category: "Food & Drink", amount: 10.90, local_amount: 37.28, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f5", date: "2026-06-19", time: "16:00", merchant: "Giant Hypermarket JB", category: "Groceries", amount: 52.30, local_amount: 178.87, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f6", date: "2026-06-19", time: "13:00", merchant: "Toppen Shopping Centre", category: "Food & Drink", amount: 13.50, local_amount: 46.17, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f7", date: "2026-06-19", time: "10:00", merchant: "AEON Tebrau City", category: "Shopping", amount: 78.40, local_amount: 268.13, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
    { id: "f8", date: "2026-06-18", time: "17:30", merchant: "Mr DIY JB", category: "Shopping", amount: 24.60, local_amount: 84.13, local_symbol: "RM", local_currency: "MYR", location: "Johor Bahru" },
  ],
};

// ── Context ───────────────────────────────────────────────────────────────────

const TripContext = createContext<TripCtx>({
  activeTrip: null, justActivated: false, loading: true,
  dismissActivation: () => {}, endTrip: async () => {},
  injectForeignTxn: async () => {}, refresh: () => {},
});

export function TripProvider({ children }: { children: ReactNode }) {
  const { userId } = useUser();
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [justActivated, setJustActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const prevTripId = useRef<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether we've already seen a trip on page load (so we don't re-animate existing trips)
  const initialLoadDone = useRef(false);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`${API}/users/${userId}/trip/active`);
      const data = await res.json();

      if (data.active) {
        const trip: ActiveTrip = data.trip;
        setActiveTrip(trip);

        // Only animate if this is a genuinely NEW trip detected since load
        if (initialLoadDone.current && prevTripId.current === null) {
          setJustActivated(true);
        }
        prevTripId.current = trip.id;
      } else {
        setActiveTrip(null);
        prevTripId.current = null;
      }
    } catch {
      // Backend unreachable — use offline fallback based on userId
      if (userId === "u3") {
        setActiveTrip(SAM_JB_FALLBACK);
        prevTripId.current = SAM_JB_FALLBACK.id;
      } else {
        setActiveTrip(null);
        prevTripId.current = null;
      }
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [userId]);

  // Reset on user switch
  useEffect(() => {
    setActiveTrip(null);
    setJustActivated(false);
    prevTripId.current = null;
    initialLoadDone.current = false;
    setLoading(true);
    fetchTrip();
  }, [userId, fetchTrip]);

  // Polling
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchTrip, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchTrip]);

  const dismissActivation = useCallback(() => setJustActivated(false), []);

  const endTrip = useCallback(async () => {
    try {
      await fetch(`${API}/users/${userId}/trip/end`, { method: "POST" });
    } catch { /* offline */ }
    setActiveTrip(null);
    prevTripId.current = null;
  }, [userId]);

  const injectForeignTxn = useCallback(async (city = "Bangkok") => {
    try {
      await fetch(`${API}/users/${userId}/inject-foreign-txn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, amount: 12.50, category: "Food & Drink" }),
      });
      // Fetch updated trip from backend
      const res = await fetch(`${API}/users/${userId}/trip/active`);
      const data = await res.json();
      if (data.active) {
        setActiveTrip(data.trip);
        prevTripId.current = data.trip.id;
      }
    } catch {
      // Backend unavailable: simulate activation with fallback
      setActiveTrip(BANGKOK_FALLBACK);
      prevTripId.current = BANGKOK_FALLBACK.id;
    }
    // Always trigger the animation moment
    setJustActivated(true);
  }, [userId]);

  return (
    <TripContext.Provider value={{
      activeTrip, justActivated, loading,
      dismissActivation, endTrip, injectForeignTxn, refresh: fetchTrip,
    }}>
      {children}
    </TripContext.Provider>
  );
}

export const useTrip = () => useContext(TripContext);
