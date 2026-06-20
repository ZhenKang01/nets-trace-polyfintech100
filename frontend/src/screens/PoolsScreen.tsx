import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";
import { useUser } from "../context/UserContext";

const API = "http://localhost:8000";

interface Pool {
  id: string;
  label: string;
  merchant: string;
  inferred_participants: number;
  pattern: string;
  occurrences: number;
  last_seen: string;
  avg_amount: number;
  transactions: { date: string; amount: number; merchant: string }[];
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

function PoolCard({ pool, index }: { pool: Pool; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <NetsCard padding={false}>
        <button
          className="w-full text-left px-4 pt-4 pb-3 active:bg-nets-gray-bg/50 transition-colors"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Inferred badge */}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="bg-blue-50 rounded-full px-2 py-0.5 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-nets-blue" />
                  <span className="text-[10px] font-semibold text-nets-blue uppercase tracking-wider">Inferred</span>
                </div>
                <span className="text-[11px] text-nets-muted">{pool.occurrences}x detected</span>
              </div>
              <p className="text-[14px] font-semibold text-nets-text leading-snug">
                We noticed a pattern at {pool.merchant}
              </p>
              <p className="text-[12px] text-nets-muted mt-1 leading-snug">{pool.pattern}</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="flex -space-x-1.5 mb-1">
                {Array.from({ length: Math.min(pool.inferred_participants, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px]"
                    style={{ background: ["#1B3464", "#2B5CBF", "#E31837"][i] }}
                  >
                    {["👤", "👤", "👤"][i]}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-nets-muted">{pool.inferred_participants} participant{pool.inferred_participants > 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-nets-border">
            <span className="text-[12px] text-nets-muted">~S${pool.avg_amount.toFixed(2)} avg · last {formatDate(pool.last_seen)}</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </button>

        {/* Expanded transaction list */}
        {expanded && (
          <div className="border-t border-nets-border">
            <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider px-4 pt-3 pb-1">
              Recent occurrences
            </p>
            {pool.transactions.map((t, i) => (
              <div
                key={i}
                className={`flex items-center px-4 py-2.5 ${i < pool.transactions.length - 1 ? "border-b border-nets-border" : ""}`}
              >
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-sm mr-3">
                  🍜
                </div>
                <div className="flex-1">
                  <p className="text-[12px] font-medium text-nets-text">{t.merchant}</p>
                  <p className="text-[11px] text-nets-muted">{formatDate(t.date)}</p>
                </div>
                <p className="text-[12px] font-semibold text-nets-text">S${t.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </NetsCard>
    </motion.div>
  );
}

export function PoolsScreen() {
  const { userId } = useUser();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/users/${userId}/pools`)
      .then((r) => r.json())
      .then((d) => { setPools(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg">
      <NetsHeader title="Inferred Pools" showBack={false} />

      {/* Explainer banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
        <p className="text-[12px] text-nets-blue font-medium leading-snug">
          🔍 These patterns were inferred from your transaction behaviour — not from any personal data you shared.
        </p>
      </div>

      <div className="flex-1 screen-scroll px-4 pt-4 pb-[72px] space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && pools.length === 0 && (
          <div className="text-center py-16 text-nets-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[14px] font-medium">No patterns detected yet</p>
            <p className="text-[12px] mt-1">Keep using NETS and we'll surface recurring patterns here.</p>
          </div>
        )}
        {!loading && pools.map((pool, i) => (
          <PoolCard key={pool.id} pool={pool} index={i} />
        ))}

        {!loading && pools.length > 0 && (
          <p className="text-[11px] text-center text-nets-muted px-4 pb-2">
            Patterns are inferred from timing, location & amount similarity. No identities are known or stored.
          </p>
        )}
      </div>
    </div>
  );
}
