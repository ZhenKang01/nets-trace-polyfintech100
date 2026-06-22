import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";

const API = "http://localhost:8001";
const AVATAR_COLORS = ["#1B3464", "#2B5CBF", "#E31837", "#6B7280"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  id: string;
  display_name: string;
  phone: string | null;
  is_self: boolean;
  initials: string;
  net_balance: number;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  payer_member_id: string;
  payer_name: string;
  split_type: string;
  created_at: string;
  splits: { member_id: string; display_name: string; amount_owed: number }[];
}

interface PoolDetail {
  id: string;
  name: string;
  icon: string;
  purpose_tag: string | null;
  members: Member[];
  your_balance: number;
  total_expenses: number;
  expense_count: number;
  last_activity: string;
}

interface InviteInfo {
  code: string;
  invite_url: string;
  pool_name: string;
  pool_icon: string;
  owner_name: string;
  member_count: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

// ── Add Expense Modal ─────────────────────────────────────────────────────────

function AddExpenseModal({
  poolId,
  members,
  onClose,
  onAdded,
}: {
  poolId: string;
  members: Member[];
  onClose: () => void;
  onAdded: () => void;
}) {
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [payerId, setPayerId] = useState(members.find((m) => m.is_self)?.id ?? members[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await fetch(`${API}/user-pools/${poolId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc.trim(),
          amount: amt,
          payer_member_id: payerId,
          split_type: "equal",
        }),
      });
      onAdded();
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-t-[24px] p-5 space-y-4"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />
        <p className="text-[17px] font-bold text-nets-text">Add expense</p>
        <input
          className="w-full border border-nets-border rounded-nets px-4 py-3 text-[14px] focus:outline-none focus:border-nets-navy"
          placeholder="What was this for?"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-semibold text-nets-muted shrink-0">S$</span>
          <input
            className="flex-1 border border-nets-border rounded-nets px-4 py-3 text-[20px] font-semibold focus:outline-none focus:border-nets-navy"
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <p className="text-[12px] font-semibold text-nets-muted mb-2">Who paid?</p>
          <div className="flex gap-2 flex-wrap">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayerId(m.id)}
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${payerId === m.id ? "bg-nets-navy text-white" : "bg-nets-gray-bg text-nets-text border border-nets-border"}`}
              >
                {m.is_self ? "You" : m.display_name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-nets-muted">Split equally among {members.length} members</p>
        <button
          onClick={submit}
          disabled={saving || !desc.trim() || !amount || parseFloat(amount) <= 0}
          className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {saving && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? "Saving…" : "Add expense"}
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Settle Modal ──────────────────────────────────────────────────────────────

function SettleModal({
  poolId,
  fromMember,
  toMember,
  amount,
  onClose,
  onSettled,
}: {
  poolId: string;
  fromMember: Member;
  toMember: Member;
  amount: number;
  onClose: () => void;
  onSettled: () => void;
}) {
  const [settling, setSettling] = useState(false);

  const settle = async () => {
    setSettling(true);
    try {
      await fetch(`${API}/user-pools/${poolId}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_member_id: fromMember.id,
          to_member_id: toMember.id,
          amount: Math.abs(amount),
        }),
      });
      onSettled();
    } catch {
      setSettling(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="w-full bg-white rounded-t-[24px] p-5 space-y-4"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />
        <div className="text-center space-y-1">
          <p className="text-[17px] font-bold text-nets-text">Mark as settled</p>
          <p className="text-[13px] text-nets-muted">
            {fromMember.is_self ? "You pay" : fromMember.display_name + " pays"}{" "}
            <span className="font-semibold text-nets-text">S${Math.abs(amount).toFixed(2)}</span>{" "}
            to {toMember.is_self ? "you" : toMember.display_name}
          </p>
        </div>
        <div className="bg-green-50 rounded-nets p-4 text-center">
          <p className="text-[24px] font-bold text-green-700">S${Math.abs(amount).toFixed(2)}</p>
        </div>
        <button
          onClick={settle}
          disabled={settling}
          className="w-full bg-green-600 text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {settling && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {settling ? "Settling…" : "Confirm settlement"}
        </button>
        <button onClick={onClose} className="w-full text-[14px] text-nets-muted py-2">Cancel</button>
      </motion.div>
    </motion.div>
  );
}

// ── Invite QR Modal ───────────────────────────────────────────────────────────

function InviteQRModal({
  poolId,
  onClose,
}: {
  poolId: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);

  useEffect(() => {
    fetch(`${API}/user-pools/${poolId}/invite`)
      .then((r) => r.json())
      .then(setInvite)
      .catch(() => {});
  }, [poolId]);

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-t-[24px] p-5 space-y-4"
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        exit={{ y: 400 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />

        {invite ? (
          <>
            <div className="text-center">
              <p className="text-[17px] font-bold text-nets-text">Invite to {invite.pool_icon} {invite.pool_name}</p>
              <p className="text-[12px] text-nets-muted mt-1">Scan or share the link below</p>
            </div>
            <div className="flex justify-center py-2">
              <div className="p-4 bg-white border-2 border-nets-border rounded-xl">
                <QRCodeSVG
                  value={invite.invite_url}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#1B3464"
                  level="M"
                />
              </div>
            </div>
            <div className="bg-nets-gray-bg rounded-nets px-4 py-3 text-center">
              <p className="text-[11px] text-nets-muted mb-1">Invite code</p>
              <p className="text-[18px] font-bold text-nets-navy tracking-widest">{invite.code}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onClose(); navigate(`/join/${invite.code}`); }}
                className="flex-1 border border-nets-navy text-nets-navy rounded-nets py-3 text-[13px] font-semibold active:opacity-70"
              >
                Preview join
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-nets-navy text-white rounded-nets py-3 text-[13px] font-semibold active:opacity-80"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Pool Detail Screen ────────────────────────────────────────────────────────

export function PoolDetailScreen() {
  const { poolId } = useParams<{ poolId: string }>();
  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ from: Member; to: Member; amount: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!poolId) return;
    const [pd, ex] = await Promise.all([
      fetch(`${API}/user-pools/${poolId}`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/user-pools/${poolId}/expenses`).then((r) => r.json()).catch(() => []),
    ]);
    setPool(pd);
    setExpenses(ex);
    setLoading(false);
  }, [poolId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-nets-gray-bg">
        <NetsHeader title="Pool" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex flex-col h-full bg-nets-gray-bg">
        <NetsHeader title="Pool" />
        <div className="flex-1 flex items-center justify-center text-nets-muted">Pool not found</div>
      </div>
    );
  }

  const selfMember = pool.members.find((m) => m.is_self);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg relative">
      <NetsHeader
        title={`${pool.icon} ${pool.name}`}
        rightElement={
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-nets-navy text-[13px] font-semibold active:opacity-70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Invite
          </button>
        }
      />

      <div className="flex-1 screen-scroll px-4 pt-4 pb-[90px] space-y-4">
        {/* Your balance hero */}
        <div
          className="rounded-nets p-4"
          style={{ background: pool.your_balance > 0.005 ? "linear-gradient(135deg, #16a34a, #15803d)" : pool.your_balance < -0.005 ? "linear-gradient(135deg, #d97706, #b45309)" : "linear-gradient(135deg, #4B5563, #374151)" }}
        >
          <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">Your balance</p>
          <p className="text-[32px] font-bold text-white mt-1">
            {pool.your_balance > 0.005 ? "+" : ""}S${Math.abs(pool.your_balance).toFixed(2)}
          </p>
          <p className="text-[13px] text-white/80 mt-1">
            {pool.your_balance > 0.005 ? "You're owed this amount" : pool.your_balance < -0.005 ? "You owe this amount" : "All settled up"}
          </p>
        </div>

        {/* Members */}
        <NetsCard>
          <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-3">Members</p>
          <div className="space-y-3">
            {pool.members.map((m, i) => {
              const bal = m.net_balance;
              const balLabel = bal > 0.005 ? `Owed S$${bal.toFixed(2)}` : bal < -0.005 ? `Owes S$${Math.abs(bal).toFixed(2)}` : "Settled";
              const balColor = bal > 0.005 ? "text-green-600" : bal < -0.005 ? "text-amber-600" : "text-nets-muted";

              // Show "Settle up" button for non-self members who owe you (if you're the creditor)
              const canSettle = !m.is_self && m.net_balance < -0.005 && selfMember && selfMember.net_balance > 0.005;

              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: AVATAR_COLORS[i % 4] }}
                  >
                    {m.is_self ? "You" : m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-nets-text">{m.is_self ? "You" : m.display_name}</p>
                    <p className={`text-[11px] font-medium ${balColor}`}>{balLabel}</p>
                  </div>
                  {canSettle && (
                    <button
                      onClick={() => setSettleTarget({ from: m, to: selfMember!, amount: m.net_balance })}
                      className="text-[11px] font-semibold text-nets-navy border border-nets-navy rounded-full px-2.5 py-1 active:opacity-70"
                    >
                      Settle
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </NetsCard>

        {/* Expense history */}
        {expenses.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Expenses</p>
            <NetsCard padding={false}>
              {expenses.map((exp, i) => (
                <div key={exp.id} className={`px-4 py-3.5 ${i < expenses.length - 1 ? "border-b border-nets-border" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-nets-text">{exp.description}</p>
                      <p className="text-[11px] text-nets-muted mt-0.5">
                        Paid by {exp.payer_name} · {formatDate(exp.created_at)}
                      </p>
                    </div>
                    <p className="text-[14px] font-bold text-nets-text shrink-0">S${exp.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {exp.splits.map((s) => (
                      <span key={s.member_id} className="text-[10px] bg-nets-gray-bg text-nets-muted rounded-full px-2 py-0.5">
                        {s.display_name.split(" ")[0]} S${s.amount_owed.toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </NetsCard>
          </div>
        )}

        {expenses.length === 0 && (
          <div className="text-center py-8 text-nets-muted">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-[13px] font-medium">No expenses yet</p>
            <p className="text-[11px] mt-1">Add the first expense to get started</p>
          </div>
        )}
      </div>

      {/* Add expense floating button */}
      <div className="absolute bottom-[76px] left-0 right-0 px-4">
        <button
          onClick={() => setShowAddExpense(true)}
          className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold shadow-lg active:opacity-80 flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add expense
        </button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddExpense && (
          <AddExpenseModal
            poolId={pool.id}
            members={pool.members}
            onClose={() => setShowAddExpense(false)}
            onAdded={() => { setShowAddExpense(false); refresh(); }}
          />
        )}
        {settleTarget && (
          <SettleModal
            poolId={pool.id}
            fromMember={settleTarget.from}
            toMember={settleTarget.to}
            amount={settleTarget.amount}
            onClose={() => setSettleTarget(null)}
            onSettled={() => { setSettleTarget(null); refresh(); }}
          />
        )}
        {showInvite && (
          <InviteQRModal
            poolId={pool.id}
            onClose={() => setShowInvite(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
