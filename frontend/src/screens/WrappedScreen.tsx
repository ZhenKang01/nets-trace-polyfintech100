import { useEffect, useState } from "react";
import { NetsHeader } from "../components/NetsHeader";
import { NetsButton } from "../components/NetsButton";
import { NetsCard } from "../components/NetsCard";
import { useUser } from "../context/UserContext";
import { WrappedStory } from "./wrapped/WrappedStory";
import { WRAPPED_FALLBACK } from "../fallbackData";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

export interface WrappedData {
  user_id: string;
  persona: string;
  total_spend: number;
  total_transactions: number;
  top_category: string;
  top_merchant: string;
  top_merchant_visits: number;
  personality: {
    name: string;
    tagline: string;
    witty_line: string;
    emoji: string;
    color: string;
  };
  biggest_day: { date: string; amount: number; merchants: string[] };
  longest_streak_days: number;
  streak_category: string;
  category_breakdown: { category: string; total: number; count: number }[];
  monthly_breakdown: { month: string; total: number }[];
}

export function WrappedScreen() {
  const { userId } = useUser();
  const [data, setData] = useState<WrappedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setPlaying(false);
    fetch(`${API}/users/${userId}/wrapped`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData(WRAPPED_FALLBACK[userId] ?? null); setLoading(false); });
  }, [userId]);

  if (playing && data) {
    return <WrappedStory data={data} onClose={() => setPlaying(false)} />;
  }

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg">
      <NetsHeader title="NETS Wrapped" showBack={false} />
      <div className="flex-1 screen-scroll px-4 pb-[72px] pt-4 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && !loading && (
          <>
            {/* Hero card */}
            <div
              className="rounded-nets p-6 relative overflow-hidden cursor-pointer active:opacity-90"
              style={{ background: `linear-gradient(135deg, ${data.personality.color}dd 0%, ${data.personality.color} 100%)` }}
              onClick={() => setPlaying(true)}
            >
              <div className="absolute -right-4 -bottom-6 text-[100px] select-none opacity-20">
                {data.personality.emoji}
              </div>
              <p className="text-white/70 text-[12px] font-semibold uppercase tracking-wider">Your 2026 Story</p>
              <p className="text-white text-[26px] font-black mt-1 leading-tight">
                {data.personality.name}
              </p>
              <p className="text-white/80 text-[13px] mt-2 leading-snug">{data.personality.tagline}</p>
              <div className="mt-5 flex items-center gap-2">
                <div className="bg-white text-[13px] font-bold px-4 py-2 rounded-full" style={{ color: data.personality.color }}>
                  ▶ Watch your Wrapped
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <NetsCard>
                <p className="text-[11px] text-nets-muted font-medium uppercase tracking-wider">Total Spent</p>
                <p className="text-[22px] font-bold text-nets-text mt-1">S${data.total_spend.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </NetsCard>
              <NetsCard>
                <p className="text-[11px] text-nets-muted font-medium uppercase tracking-wider">Transactions</p>
                <p className="text-[22px] font-bold text-nets-text mt-1">{data.total_transactions.toLocaleString()}</p>
              </NetsCard>
              <NetsCard>
                <p className="text-[11px] text-nets-muted font-medium uppercase tracking-wider">Top Spot</p>
                <p className="text-[14px] font-bold text-nets-text mt-1 leading-snug">{data.top_merchant}</p>
                <p className="text-[11px] text-nets-muted">{data.top_merchant_visits}x visits</p>
              </NetsCard>
              <NetsCard>
                <p className="text-[11px] text-nets-muted font-medium uppercase tracking-wider">Streak</p>
                <p className="text-[22px] font-bold text-nets-text mt-1">{data.longest_streak_days}d</p>
                <p className="text-[11px] text-nets-muted">consecutive days</p>
              </NetsCard>
            </div>

            <NetsButton onClick={() => setPlaying(true)}>
              ✨ Play My Wrapped Story
            </NetsButton>

            <p className="text-[11px] text-center text-nets-muted">
              Based on Jan – Jun 2026 transactions via NETS
            </p>
          </>
        )}
      </div>
    </div>
  );
}
