import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NetsLogo } from "../components/NetsLogo";
import { NetsCard } from "../components/NetsCard";
import { NetsFlashPayCard } from "../components/NetsFlashPayCard";
import { UserSwitcher } from "../components/UserSwitcher";
import { useUser } from "../context/UserContext";

const API = "http://localhost:8000";

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  time: string;
}

const CATEGORY_ICON: Record<string, string> = {
  "Food & Drink": "🍜",
  Transport: "🚇",
  Groceries: "🛒",
  Shopping: "🛍️",
  Entertainment: "🎬",
  ATM: "🏧",
};

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-1 active:opacity-70"
    >
      <div className="w-12 h-12 rounded-full bg-nets-gray-bg flex items-center justify-center text-xl">
        {icon}
      </div>
      <span className="text-[11px] font-medium text-nets-muted">{label}</span>
    </button>
  );
}

export function HomeScreen() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch(`${API}/users/${userId}/transactions?limit=5`)
      .then((r) => r.json())
      .then(setRecent)
      .catch(() => {});
  }, [userId]);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg screen-scroll pb-[72px]">
      {/* Top header */}
      <div className="bg-white px-5 pt-4 pb-3 flex items-center justify-between border-b border-nets-border">
        <NetsLogo className="text-[26px]" />
        <div className="flex items-center gap-3">
          <UserSwitcher />
          <button className="relative active:opacity-70">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-nets-red rounded-full" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* FlashPay card section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-nets-text">
              NETS FlashPay Card, Motoring Card
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <NetsFlashPayCard />
        </div>

        {/* Quick actions */}
        <NetsCard padding={false}>
          <div className="flex items-center py-4 px-2">
            <QuickAction icon="⬆️" label="Top-up" />
            <QuickAction icon="📋" label="History" onClick={() => navigate("/history")} />
            <QuickAction icon="🔄" label="Auto Top-up" />
            <QuickAction icon="✨" label="Wrapped" onClick={() => navigate("/wrapped")} />
          </div>
        </NetsCard>

        {/* Wrapped promo banner */}
        <button
          onClick={() => navigate("/wrapped")}
          className="w-full text-left active:opacity-80"
        >
          <div
            className="rounded-nets p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1B3464 0%, #7C3AED 100%)" }}
          >
            <div className="absolute right-3 top-2 text-5xl opacity-20 select-none">✨</div>
            <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">New</p>
            <p className="text-[17px] font-bold text-white mt-0.5">NETS Wrapped is here</p>
            <p className="text-[12px] text-white/70 mt-1">See your 2026 spend story →</p>
          </div>
        </button>

        {/* Recent transactions */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-nets-text">Recent Transactions</span>
              <button
                className="text-[12px] text-nets-navy font-medium"
                onClick={() => navigate("/history")}
              >
                See all
              </button>
            </div>
            <NetsCard padding={false}>
              {recent.map((t, i) => (
                <div
                  key={t.id}
                  className={`flex items-center px-4 py-3.5 ${i < recent.length - 1 ? "border-b border-nets-border" : ""}`}
                >
                  <div className="w-9 h-9 rounded-full bg-nets-gray-bg flex items-center justify-center text-lg mr-3">
                    {CATEGORY_ICON[t.category] ?? "💳"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-nets-text truncate">{t.merchant}</p>
                    <p className="text-[11px] text-nets-muted">{t.date} · {t.time}</p>
                  </div>
                  <p className="text-[13px] font-semibold text-nets-text ml-2">
                    −S${t.amount.toFixed(2)}
                  </p>
                </div>
              ))}
            </NetsCard>
          </div>
        )}

        {/* NETS vCashCard */}
        <NetsCard>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-nets-blue rounded-nets flex items-center justify-center text-white text-2xl">
              🚗
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-nets-text">NETS vCashCard</p>
              <p className="text-[11px] text-nets-muted mt-0.5">
                Pay your ERP charges conveniently through a virtual card payment service.
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-nets-border pt-4 flex items-center justify-between">
            <p className="text-[12px] text-nets-muted">No card required in in-vehicle unit</p>
            <button className="bg-nets-navy text-white text-[12px] font-semibold px-4 py-2 rounded-[8px] active:opacity-80">
              Get Started
            </button>
          </div>
        </NetsCard>

        {/* NETS Prepaid Card */}
        <NetsCard>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-nets-text">NETS Prepaid Card</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-[11px] text-nets-muted mt-1">Manage your prepaid card balance and transactions.</p>
        </NetsCard>
      </div>
    </div>
  );
}
