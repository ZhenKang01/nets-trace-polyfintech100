import type { WrappedData } from "./screens/WrappedScreen";

// Static demo data used when the backend API is unreachable (e.g. Netlify preview)

export const WRAPPED_FALLBACK: Record<string, WrappedData> = {
  u1: {
    user_id: "u1",
    persona: "hawker",
    total_spend: 3547.20,
    total_transactions: 312,
    top_category: "Food & Drink",
    top_merchant: "Tian Tian Hainanese Chicken Rice",
    top_merchant_visits: 24,
    personality: {
      name: "The Hawker Loyalist",
      tagline: "You're practically part of the furniture at your local hawker centre.",
      witty_line: "If NETS gave out Michelin stars, you'd have three.",
      emoji: "🍜",
      color: "#E31837",
    },
    biggest_day: { date: "2026-02-01", amount: 287.50, merchants: ["Tian Tian", "Old Chang Kee", "ABC Stalls"] },
    longest_streak_days: 18,
    streak_category: "Food & Drink",
    category_breakdown: [
      { category: "Food & Drink", total: 1820.50, count: 187 },
      { category: "Transport", total: 623.40, count: 89 },
      { category: "Shopping", total: 542.80, count: 24 },
      { category: "Entertainment", total: 560.50, count: 12 },
    ],
    monthly_breakdown: [
      { month: "Jan", total: 520.30 },
      { month: "Feb", total: 680.20 },
      { month: "Mar", total: 540.10 },
      { month: "Apr", total: 610.80 },
      { month: "May", total: 590.40 },
      { month: "Jun", total: 605.40 },
    ],
  },
  u2: {
    user_id: "u2",
    persona: "bbt",
    total_spend: 2198.60,
    total_transactions: 231,
    top_category: "Food & Drink",
    top_merchant: "Bober Tea",
    top_merchant_visits: 31,
    personality: {
      name: "The Bubble Tea Devotee",
      tagline: "Brown sugar or oat milk? Yes to both. Every Thursday, without fail.",
      witty_line: "Have you considered buying shares in Bober Tea?",
      emoji: "🧋",
      color: "#8B4513",
    },
    biggest_day: { date: "2026-03-15", amount: 198.40, merchants: ["Bober Tea", "The Cathay", "FairPrice"] },
    longest_streak_days: 12,
    streak_category: "Food & Drink",
    category_breakdown: [
      { category: "Food & Drink", total: 1120.80, count: 142 },
      { category: "Shopping", total: 520.30, count: 51 },
      { category: "Transport", total: 312.50, count: 28 },
      { category: "Entertainment", total: 245.00, count: 10 },
    ],
    monthly_breakdown: [
      { month: "Jan", total: 340.20 },
      { month: "Feb", total: 380.50 },
      { month: "Mar", total: 420.30 },
      { month: "Apr", total: 360.80 },
      { month: "May", total: 340.60 },
      { month: "Jun", total: 356.20 },
    ],
  },
  u3: {
    user_id: "u3",
    persona: "jb_runner",
    total_spend: 2841.90,
    total_transactions: 278,
    top_category: "Transport",
    top_merchant: "Woodlands Checkpoint",
    top_merchant_visits: 18,
    personality: {
      name: "The JB Weekend Runner",
      tagline: "You've practically funded JB's tourism industry singlehandedly.",
      witty_line: "At this rate, you qualify for Malaysian PR.",
      emoji: "🛣️",
      color: "#2B5CBF",
    },
    biggest_day: { date: "2026-04-20", amount: 312.80, merchants: ["R&R Plaza", "KSL City", "McDonald's JB"] },
    longest_streak_days: 9,
    streak_category: "Transport",
    category_breakdown: [
      { category: "Transport", total: 980.40, count: 98 },
      { category: "Food & Drink", total: 820.50, count: 121 },
      { category: "Shopping", total: 720.30, count: 42 },
      { category: "Entertainment", total: 320.70, count: 17 },
    ],
    monthly_breakdown: [
      { month: "Jan", total: 420.30 },
      { month: "Feb", total: 480.50 },
      { month: "Mar", total: 520.40 },
      { month: "Apr", total: 540.20 },
      { month: "May", total: 440.80 },
      { month: "Jun", total: 439.70 },
    ],
  },
};

export interface RoamFallback {
  is_traveling: boolean;
  location: string;
  country: string;
  currency: string;
  symbol: string;
  flag: string;
  fx_rate: number;
  networks: string[];
  differentiator: string;
  recent_foreign_txns: {
    id: string; date: string; time: string; merchant: string;
    category: string; amount: number; local_amount: number;
    local_symbol: string; local_currency: string;
  }[];
  total_foreign_spend_sgd: number;
}

export const ROAM_FALLBACK: Record<string, RoamFallback> = {
  u1: {
    is_traveling: false,
    location: "Singapore",
    country: "Singapore",
    currency: "SGD",
    symbol: "S$",
    flag: "🇸🇬",
    fx_rate: 1.0,
    networks: ["PayNow", "NETS"],
    differentiator: "When you travel, NETS Roam activates automatically. Pay from your bank — no foreign wallet needed.",
    recent_foreign_txns: [],
    total_foreign_spend_sgd: 0,
  },
  u2: {
    is_traveling: false,
    location: "Singapore",
    country: "Singapore",
    currency: "SGD",
    symbol: "S$",
    flag: "🇸🇬",
    fx_rate: 1.0,
    networks: ["PayNow", "NETS"],
    differentiator: "When you travel, NETS Roam activates automatically. Pay from your bank — no foreign wallet needed.",
    recent_foreign_txns: [],
    total_foreign_spend_sgd: 0,
  },
  u3: {
    is_traveling: true,
    location: "Johor Bahru, Malaysia",
    country: "Malaysia",
    currency: "MYR",
    symbol: "RM",
    flag: "🇲🇾",
    fx_rate: 3.42,
    networks: ["DuitNow", "MyDebit"],
    differentiator: "Your SGD goes further in JB. Pay directly from your POSB account — no MYR wallet to top up, no exchange counter queues.",
    recent_foreign_txns: [
      { id: "ft1", date: "2026-06-22", time: "19:42", merchant: "KSL City Food Court", category: "Food & Drink", amount: 8.20, local_amount: 28.04, local_symbol: "RM", local_currency: "MYR" },
      { id: "ft2", date: "2026-06-22", time: "15:18", merchant: "R&R Plaza", category: "Shopping", amount: 24.50, local_amount: 83.79, local_symbol: "RM", local_currency: "MYR" },
      { id: "ft3", date: "2026-06-21", time: "20:05", merchant: "Tamarind Restoran", category: "Food & Drink", amount: 12.40, local_amount: 42.41, local_symbol: "RM", local_currency: "MYR" },
      { id: "ft4", date: "2026-06-21", time: "13:22", merchant: "CitySquare Mall", category: "Shopping", amount: 31.80, local_amount: 108.76, local_symbol: "RM", local_currency: "MYR" },
      { id: "ft5", date: "2026-06-20", time: "18:55", merchant: "D'Tandoor JB", category: "Food & Drink", amount: 9.60, local_amount: 32.83, local_symbol: "RM", local_currency: "MYR" },
    ],
    total_foreign_spend_sgd: 86.50,
  },
};

// ── Transaction fallback ──────────────────────────────────────────────────────

export interface TxnFallback {
  id: string; merchant: string; category: string;
  amount: number; date: string; time: string; location: string;
}

export const TRANSACTIONS_FALLBACK: Record<string, TxnFallback[]> = {
  u1: [
    { id: "t1", merchant: "Tian Tian Hainanese Chicken Rice", category: "Food & Drink", amount: 5.50, date: "2026-06-22", time: "12:34", location: "Singapore" },
    { id: "t2", merchant: "SMRT", category: "Transport", amount: 1.80, date: "2026-06-22", time: "08:12", location: "Singapore" },
    { id: "t3", merchant: "Old Chang Kee", category: "Food & Drink", amount: 3.20, date: "2026-06-21", time: "15:45", location: "Singapore" },
    { id: "t4", merchant: "FairPrice Xtra", category: "Groceries", amount: 38.60, date: "2026-06-21", time: "13:20", location: "Singapore" },
    { id: "t5", merchant: "Maxwell Food Centre", category: "Food & Drink", amount: 4.80, date: "2026-06-20", time: "12:15", location: "Singapore" },
    { id: "t6", merchant: "SMRT", category: "Transport", amount: 2.10, date: "2026-06-20", time: "07:58", location: "Singapore" },
    { id: "t7", merchant: "Guardian Pharmacy", category: "Shopping", amount: 14.90, date: "2026-06-19", time: "18:30", location: "Singapore" },
    { id: "t8", merchant: "Lau Pa Sat", category: "Food & Drink", amount: 7.50, date: "2026-06-19", time: "12:50", location: "Singapore" },
    { id: "t9", merchant: "Grab", category: "Transport", amount: 12.40, date: "2026-06-18", time: "21:10", location: "Singapore" },
    { id: "t10", merchant: "Tian Tian Hainanese Chicken Rice", category: "Food & Drink", amount: 5.50, date: "2026-06-18", time: "12:28", location: "Singapore" },
  ],
  u2: [
    { id: "t1", merchant: "Bober Tea", category: "Food & Drink", amount: 6.50, date: "2026-06-22", time: "14:22", location: "Singapore" },
    { id: "t2", merchant: "Uniqlo", category: "Shopping", amount: 49.90, date: "2026-06-22", time: "16:05", location: "Singapore" },
    { id: "t3", merchant: "Bober Tea", category: "Food & Drink", amount: 6.50, date: "2026-06-19", time: "14:10", location: "Singapore" },
    { id: "t4", merchant: "The Cathay", category: "Entertainment", amount: 16.00, date: "2026-06-18", time: "20:30", location: "Singapore" },
    { id: "t5", merchant: "Grab", category: "Transport", amount: 9.80, date: "2026-06-18", time: "19:45", location: "Singapore" },
    { id: "t6", merchant: "Cold Storage", category: "Groceries", amount: 24.50, date: "2026-06-17", time: "12:00", location: "Singapore" },
    { id: "t7", merchant: "Bober Tea", category: "Food & Drink", amount: 7.00, date: "2026-06-16", time: "14:18", location: "Singapore" },
    { id: "t8", merchant: "Zara", category: "Shopping", amount: 79.90, date: "2026-06-15", time: "15:40", location: "Singapore" },
    { id: "t9", merchant: "Bober Tea", category: "Food & Drink", amount: 6.00, date: "2026-06-12", time: "14:05", location: "Singapore" },
    { id: "t10", merchant: "SMRT", category: "Transport", amount: 1.80, date: "2026-06-12", time: "08:30", location: "Singapore" },
  ],
  u3: [
    { id: "t1", merchant: "KSL City Food Court", category: "Food & Drink", amount: 8.20, date: "2026-06-22", time: "19:42", location: "Johor Bahru, Malaysia" },
    { id: "t2", merchant: "R&R Plaza", category: "Shopping", amount: 24.50, date: "2026-06-22", time: "15:18", location: "Johor Bahru, Malaysia" },
    { id: "t3", merchant: "Woodlands Checkpoint", category: "Transport", amount: 4.50, date: "2026-06-22", time: "10:05", location: "Singapore" },
    { id: "t4", merchant: "Tamarind Restoran", category: "Food & Drink", amount: 12.40, date: "2026-06-21", time: "20:05", location: "Johor Bahru, Malaysia" },
    { id: "t5", merchant: "CitySquare Mall", category: "Shopping", amount: 31.80, date: "2026-06-21", time: "13:22", location: "Johor Bahru, Malaysia" },
    { id: "t6", merchant: "D'Tandoor JB", category: "Food & Drink", amount: 9.60, date: "2026-06-20", time: "18:55", location: "Johor Bahru, Malaysia" },
    { id: "t7", merchant: "Woodlands Checkpoint", category: "Transport", amount: 4.50, date: "2026-06-20", time: "09:30", location: "Singapore" },
    { id: "t8", merchant: "7-Eleven JB", category: "Food & Drink", amount: 5.20, date: "2026-06-19", time: "11:10", location: "Johor Bahru, Malaysia" },
    { id: "t9", merchant: "SMRT", category: "Transport", amount: 2.10, date: "2026-06-17", time: "08:45", location: "Singapore" },
    { id: "t10", merchant: "Giant Hypermarket JB", category: "Groceries", amount: 18.40, date: "2026-06-15", time: "14:20", location: "Johor Bahru, Malaysia" },
  ],
};

// ── Pools fallback ────────────────────────────────────────────────────────────

export interface UserPoolFallback {
  id: string; name: string; icon: string; purpose_tag: string | null;
  member_count: number; members_preview: { id: string; display_name: string; is_self: boolean }[];
  your_balance: number; total_expenses: number; expense_count: number; last_activity: string;
}

export interface InferredPoolFallback {
  id: string; label: string; merchant: string; inferred_participants: number;
  pattern: string; occurrences: number; last_seen: string; avg_amount: number;
  transactions: { date: string; amount: number; merchant: string }[];
}

export const USER_POOLS_FALLBACK: Record<string, UserPoolFallback[]> = {
  u1: [
    {
      id: "pool-sg-001", name: "Supper Gang", icon: "🌙", purpose_tag: "Dinner",
      member_count: 3,
      members_preview: [
        { id: "mem-sg-alex", display_name: "Alex T.", is_self: true },
        { id: "mem-sg-wei", display_name: "Wei", is_self: false },
        { id: "mem-sg-aish", display_name: "Aish", is_self: false },
      ],
      your_balance: 54.93, total_expenses: 159.80, expense_count: 5, last_activity: "2026-06-20",
    },
    {
      id: "pool-tr-001", name: "Tekong Reunion", icon: "🎖️", purpose_tag: "Event",
      member_count: 3,
      members_preview: [
        { id: "mem-tr-alex", display_name: "Alex T.", is_self: true },
        { id: "mem-tr-darren", display_name: "Darren", is_self: false },
        { id: "mem-tr-kai", display_name: "Kai", is_self: false },
      ],
      your_balance: 24.00, total_expenses: 36.00, expense_count: 1, last_activity: "2026-06-15",
    },
  ],
  u2: [
    {
      id: "pool-bbt-001", name: "BBT Run", icon: "🧋", purpose_tag: "Drinks",
      member_count: 3,
      members_preview: [
        { id: "mem-bbt-jordan", display_name: "Jordan L.", is_self: true },
        { id: "mem-bbt-mei", display_name: "Mei", is_self: false },
        { id: "mem-bbt-priya", display_name: "Priya", is_self: false },
      ],
      your_balance: 31.50, total_expenses: 63.00, expense_count: 3, last_activity: "2026-06-19",
    },
  ],
  u3: [],
};

export const INFERRED_POOLS_FALLBACK: Record<string, InferredPoolFallback[]> = {
  u1: [
    {
      id: "ip-tt-001", label: "Hawker Regulars", merchant: "Tian Tian Hainanese Chicken Rice",
      inferred_participants: 3, pattern: "Weekday lunches, every Mon/Wed/Fri — amounts cluster around S$15–22",
      occurrences: 14, last_seen: "2026-06-22", avg_amount: 18.40,
      transactions: [
        { date: "2026-06-22", amount: 18.50, merchant: "Tian Tian Hainanese Chicken Rice" },
        { date: "2026-06-20", amount: 17.80, merchant: "Tian Tian Hainanese Chicken Rice" },
        { date: "2026-06-18", amount: 19.20, merchant: "Tian Tian Hainanese Chicken Rice" },
      ],
    },
  ],
  u2: [
    {
      id: "ip-bbt-001", label: "Thursday BBT Crew", merchant: "Bober Tea",
      inferred_participants: 4, pattern: "Every Thursday afternoon — amounts cluster around S$24–28",
      occurrences: 9, last_seen: "2026-06-19", avg_amount: 26.00,
      transactions: [
        { date: "2026-06-19", amount: 26.00, merchant: "Bober Tea" },
        { date: "2026-06-12", amount: 24.00, merchant: "Bober Tea" },
        { date: "2026-06-05", amount: 28.00, merchant: "Bober Tea" },
      ],
    },
  ],
  u3: [
    {
      id: "ip-jb-001", label: "JB Weekend Group", merchant: "KSL City Food Court",
      inferred_participants: 3, pattern: "Weekend evenings in JB — amounts cluster around S$30–45",
      occurrences: 6, last_seen: "2026-06-22", avg_amount: 38.60,
      transactions: [
        { date: "2026-06-22", amount: 36.90, merchant: "KSL City Food Court" },
        { date: "2026-06-15", amount: 41.20, merchant: "KSL City Food Court" },
        { date: "2026-06-08", amount: 37.80, merchant: "KSL City Food Court" },
      ],
    },
  ],
};
