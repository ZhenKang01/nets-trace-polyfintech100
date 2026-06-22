import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { NetsHeader } from "../components/NetsHeader";

const API = "http://localhost:8001";

interface Preview {
  code: string;
  pool_id: string;
  pool_name: string;
  pool_icon: string;
  purpose_tag: string | null;
  owner_name: string;
  member_count: number;
  expense_count: number;
  total_expenses: number;
}

export function JoinPreviewScreen() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetch(`${API}/invite/${code}`)
      .then((r) => r.json())
      .then((d) => { setPreview(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [code]);

  const handleJoin = () => {
    setJoined(true);
    setTimeout(() => navigate("/pools"), 1800);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-nets-gray-bg">
        <NetsHeader title="Join Pool" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col h-full bg-nets-gray-bg">
        <NetsHeader title="Join Pool" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-3">
          <p className="text-4xl">🔗</p>
          <p className="text-[16px] font-semibold text-nets-text">Invalid invite link</p>
          <p className="text-[13px] text-nets-muted">This invite may have expired or the pool no longer exists.</p>
        </div>
      </div>
    );
  }

  if (joined) {
    return (
      <motion.div
        className="flex flex-col h-full items-center justify-center gap-4 px-8 text-center"
        style={{ background: "linear-gradient(135deg, #1B3464 0%, #2B5CBF 100%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-6xl"
        >
          {preview.pool_icon}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[22px] font-bold text-white">You joined!</p>
          <p className="text-[14px] text-white/70 mt-1">{preview.pool_name}</p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[12px] text-white/50"
        >
          Redirecting to Pools…
        </motion.p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg">
      <NetsHeader title="You've been invited" />

      <div className="flex-1 screen-scroll px-4 py-5 space-y-4">
        {/* Pool hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-nets p-5 flex items-center gap-4 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-nets-gray-bg flex items-center justify-center text-4xl">
            {preview.pool_icon}
          </div>
          <div>
            <p className="text-[20px] font-bold text-nets-text">{preview.pool_name}</p>
            {preview.purpose_tag && (
              <span className="text-[11px] font-medium text-nets-muted bg-nets-gray-bg rounded-full px-2 py-0.5 mt-1 inline-block">
                {preview.purpose_tag}
              </span>
            )}
          </div>
        </motion.div>

        {/* Invite from */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-nets p-4"
        >
          <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Invited by</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-nets-navy flex items-center justify-center text-[14px] font-bold text-white">
              {preview.owner_name.slice(0, 1)}
            </div>
            <p className="text-[15px] font-semibold text-nets-text">{preview.owner_name}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { label: "Members", value: preview.member_count },
            { label: "Expenses", value: preview.expense_count },
            { label: "Total", value: `S$${preview.total_expenses.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-nets p-3 text-center">
              <p className="text-[20px] font-bold text-nets-navy">{s.value}</p>
              <p className="text-[10px] text-nets-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Privacy note */}
        <div className="bg-blue-50 border border-blue-100 rounded-nets px-3 py-2.5">
          <p className="text-[11px] text-nets-blue leading-snug">
            By joining, you'll see shared expenses and your balance. Your account holder name will be visible to pool members.
          </p>
        </div>
      </div>

      <div className="bg-white border-t border-nets-border px-4 py-4">
        <button
          onClick={handleJoin}
          className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold active:opacity-80"
        >
          Join {preview.pool_name}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="w-full text-[13px] text-nets-muted py-2 mt-1"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
