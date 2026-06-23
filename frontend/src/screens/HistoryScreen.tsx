import { useEffect, useState } from "react";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";
import { useUser } from "../context/UserContext";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  time: string;
  location: string;
}

const CATEGORY_ICON: Record<string, string> = {
  "Food & Drink": "🍜",
  Transport: "🚇",
  Groceries: "🛒",
  Shopping: "🛍️",
  Entertainment: "🎬",
  ATM: "🏧",
};

function groupByDate(txns: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  for (const t of txns) {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatDate(d: string) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });
}

export function HistoryScreen() {
  const { userId } = useUser();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/users/${userId}/transactions?limit=100`)
      .then((r) => r.json())
      .then((data) => { setTxns(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const groups = groupByDate(txns);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg">
      <NetsHeader title="Transaction History" showBack={false} />
      <div className="flex-1 screen-scroll px-4 pb-[72px] pt-3 space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && groups.map(([date, items]) => (
          <div key={date}>
            <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2 px-1">
              {formatDate(date)}
            </p>
            <NetsCard padding={false}>
              {items.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center px-4 py-3.5 ${i < items.length - 1 ? "border-b border-nets-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-full bg-nets-gray-bg flex items-center justify-center text-lg mr-3">
                    {CATEGORY_ICON[t.category] ?? "💳"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-nets-text truncate">{t.merchant}</p>
                    <p className="text-[11px] text-nets-muted">{t.time} · {t.category}</p>
                  </div>
                  <p className="text-[13px] font-semibold text-nets-text ml-2">
                    −S${t.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </NetsCard>
          </div>
        ))}
      </div>
    </div>
  );
}
