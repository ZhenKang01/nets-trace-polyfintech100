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
  contributed: number;
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

interface Contribution {
  id: string;
  member_id: string;
  display_name: string;
  is_self: boolean;
  amount: number;
  note: string | null;
  created_at: string;
}

interface PoolDetail {
  id: string;
  name: string;
  icon: string;
  purpose_tag: string | null;
  members: Member[];
  your_balance: number;
  pool_fund_balance: number;
  total_contributed: number;
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
  return new Date(d.slice(0, 10) + "T00:00:00").toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
  });
}

// ── Add Funds Modal ───────────────────────────────────────────────────────────

function AddFundsModal({
  poolId,
  selfMember,
  onClose,
  onAdded,
}: {
  poolId: string;
  selfMember: Member;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    setSaving(true);
    try {
      await fetch(`${API}/user-pools/${poolId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: selfMember.id,
          amount: amt,
          note: note.trim() || null,
        }),
      });
      setSuccess(true);
      setTimeout(() => { onAdded(); }, 900);
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
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-t-[24px] p-5"
        initial={{ y: 320 }}
        animate={{ y: 0 }}
        exit={{ y: 320 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-nets-border rounded-full mx-auto mb-4" />

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6 gap-2"
            >
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">💰</div>
              <p className="text-[17px] font-bold text-nets-text">Funds added!</p>
              <p className="text-[13px] text-nets-muted">S${parseFloat(amount).toFixed(2)} added to pool</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-4">
              <div>
                <p className="text-[17px] font-bold text-nets-text mb-1">Add funds to pool</p>
                <p className="text-[12px] text-nets-muted">
                  Adding as <span className="font-semibold text-nets-text">{selfMember.display_name}</span>
                </p>
              </div>

              {/* Amount input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-nets-muted select-none">S$</span>
                <input
                  className="w-full border-2 border-nets-border rounded-nets pl-12 pr-4 py-4 text-[28px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {["10", "20", "50", "100"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className={`flex-1 py-2 rounded-nets text-[13px] font-semibold border transition-colors ${
                      amount === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>

              {/* Note */}
              <input
                className="w-full border border-nets-border rounded-nets px-4 py-3 text-[13px] focus:outline-none focus:border-nets-navy"
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />

              <button
                onClick={submit}
                disabled={saving || !amount || parseFloat(amount) <= 0}
                className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {saving ? "Adding…" : `Add S$${parseFloat(amount || "0").toFixed(2)} to pool`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
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
                className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                  payerId === m.id ? "bg-nets-navy text-white" : "bg-nets-gray-bg text-nets-text border border-nets-border"
                }`}
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
                <QRCodeSVG value={invite.invite_url} size={160} bgColor="#ffffff" fgColor="#1B3464" level="M" />
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
              <button onClick={onClose} className="flex-1 bg-nets-navy text-white rounded-nets py-3 text-[13px] font-semibold active:opacity-80">
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
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [settleTarget, setSettleTarget] = useState<{ from: Member; to: Member; amount: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!poolId) return;
    const [pd, ex, ct] = await Promise.all([
      fetch(`${API}/user-pools/${poolId}`).then((r) => r.json()).catch(() => null),
      fetch(`${API}/user-pools/${poolId}/expenses`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/user-pools/${poolId}/contributions`).then((r) => r.json()).catch(() => []),
    ]);
    setPool(pd);
    setExpenses(ex);
    setContributions(ct);
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
  const fundBal = pool.pool_fund_balance ?? 0;
  const totalContrib = pool.total_contributed ?? 0;
  const totalExp = pool.total_expenses ?? 0;

  // Build mixed activity feed (expenses + contributions), sorted newest first
  const activityItems: Array<{ date: string; type: "expense" | "contribution"; data: Expense | Contribution }> = [
    ...expenses.map((e) => ({ date: e.created_at, type: "expense" as const, data: e })),
    ...contributions.map((c) => ({ date: c.created_at, type: "contribution" as const, data: c })),
  ].sort((a, b) => b.date.localeCompare(a.date));

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
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            Invite
          </button>
        }
      />

      <div className="flex-1 screen-scroll px-4 pt-4 pb-[90px] space-y-3">

        {/* ── Pool Funds Card ─────────────────────────────────────────────── */}
        <div
          className="rounded-nets p-4"
          style={{
            background: fundBal > 0.005
              ? "linear-gradient(135deg, #1B3464, #2B5CBF)"
              : fundBal < -0.005
                ? "linear-gradient(135deg, #b45309, #d97706)"
                : "linear-gradient(135deg, #374151, #4B5563)",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Pool funds</p>
              <p className="text-[30px] font-bold text-white mt-0.5">S${Math.abs(fundBal).toFixed(2)}</p>
              <p className="text-[12px] text-white/70 mt-0.5">
                {fundBal > 0.005
                  ? `S$${totalContrib.toFixed(2)} in · S$${totalExp.toFixed(2)} spent`
                  : fundBal < -0.005
                    ? `Pool needs S$${Math.abs(fundBal).toFixed(2)} top-up`
                    : totalContrib > 0 ? "Pool balanced" : "No funds added yet"}
              </p>
            </div>
            <button
              onClick={() => setShowAddFunds(true)}
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-2 text-[12px] font-semibold flex items-center gap-1.5 active:opacity-70 transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add funds
            </button>
          </div>

          {/* Per-member contribution bars */}
          {totalContrib > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 flex gap-3 flex-wrap">
              {pool.members.map((m, i) => (
                m.contributed > 0 && (
                  <div key={m.id} className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[i % 4] + "cc", color: "white" }}
                    >
                      {m.is_self ? "Y" : m.initials[0]}
                    </div>
                    <span className="text-[11px] text-white/80">S${m.contributed.toFixed(2)}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* ── Your Balance Card ───────────────────────────────────────────── */}
        <div
          className="rounded-nets p-4"
          style={{
            background: pool.your_balance > 0.005
              ? "linear-gradient(135deg, #16a34a, #15803d)"
              : pool.your_balance < -0.005
                ? "linear-gradient(135deg, #d97706, #b45309)"
                : "linear-gradient(135deg, #4B5563, #374151)",
          }}
        >
          <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider">Your balance</p>
          <p className="text-[30px] font-bold text-white mt-0.5">
            {pool.your_balance > 0.005 ? "+" : ""}S${Math.abs(pool.your_balance).toFixed(2)}
          </p>
          <p className="text-[12px] text-white/70 mt-0.5">
            {pool.your_balance > 0.005 ? "You're owed this amount" : pool.your_balance < -0.005 ? "You owe this amount" : "All settled up"}
          </p>
        </div>

        {/* ── Members ─────────────────────────────────────────────────────── */}
        <NetsCard>
          <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-3">Members</p>
          <div className="space-y-3">
            {pool.members.map((m, i) => {
              const bal = m.net_balance;
              const balLabel = bal > 0.005 ? `Owed S$${bal.toFixed(2)}` : bal < -0.005 ? `Owes S$${Math.abs(bal).toFixed(2)}` : "Settled";
              const balColor = bal > 0.005 ? "text-green-600" : bal < -0.005 ? "text-amber-600" : "text-nets-muted";
              const canSettle = !m.is_self && m.net_balance < -0.005 && selfMember && selfMember.net_balance > 0.005;

              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                    style={{ background: AVATAR_COLORS[i % 4] }}
                  >
                    {m.is_self ? "You" : m.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-nets-text">{m.is_self ? "You" : m.display_name}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[11px] font-medium ${balColor}`}>{balLabel}</p>
                      {m.contributed > 0 && (
                        <>
                          <span className="text-nets-border">·</span>
                          <p className="text-[11px] text-nets-muted">Added S${m.contributed.toFixed(2)}</p>
                        </>
                      )}
                    </div>
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

        {/* ── Activity Feed (expenses + contributions mixed) ───────────────── */}
        {activityItems.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Activity</p>
            <NetsCard padding={false}>
              {activityItems.map((item, i) => {
                const isLast = i === activityItems.length - 1;
                if (item.type === "contribution") {
                  const c = item.data as Contribution;
                  return (
                    <div key={c.id} className={`px-4 py-3.5 flex items-center gap-3 ${!isLast ? "border-b border-nets-border" : ""}`}>
                      <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-base shrink-0">
                        💰
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-nets-text">
                          {c.is_self ? "You" : c.display_name} added funds
                        </p>
                        <p className="text-[11px] text-nets-muted">
                          {c.note ?? "Pool top-up"} · {formatDate(c.created_at)}
                        </p>
                      </div>
                      <p className="text-[14px] font-bold text-green-600 shrink-0">+S${c.amount.toFixed(2)}</p>
                    </div>
                  );
                } else {
                  const e = item.data as Expense;
                  return (
                    <div key={e.id} className={`px-4 py-3.5 ${!isLast ? "border-b border-nets-border" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-nets-gray-bg flex items-center justify-center text-base shrink-0">
                            🧾
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-nets-text">{e.description}</p>
                            <p className="text-[11px] text-nets-muted mt-0.5">
                              Paid by {e.payer_name} · {formatDate(e.created_at)}
                            </p>
                          </div>
                        </div>
                        <p className="text-[14px] font-bold text-nets-text shrink-0">−S${e.amount.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-1.5 mt-2 ml-12 flex-wrap">
                        {e.splits.map((s) => (
                          <span key={s.member_id} className="text-[10px] bg-nets-gray-bg text-nets-muted rounded-full px-2 py-0.5">
                            {s.display_name.split(" ")[0]} S${s.amount_owed.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
              })}
            </NetsCard>
          </div>
        )}

        {activityItems.length === 0 && (
          <div className="text-center py-8 text-nets-muted">
            <p className="text-3xl mb-2">🪣</p>
            <p className="text-[13px] font-medium">Pool is empty</p>
            <p className="text-[11px] mt-1">Add funds or record an expense to get started</p>
          </div>
        )}
      </div>

      {/* ── Bottom action bar ────────────────────────────────────────────── */}
      <div className="absolute bottom-[76px] left-0 right-0 px-4 flex gap-2.5">
        <button
          onClick={() => setShowAddFunds(true)}
          className="flex-1 border-2 border-nets-navy text-nets-navy rounded-nets py-3 text-[14px] font-semibold active:opacity-70 flex items-center justify-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add funds
        </button>
        <button
          onClick={() => setShowAddExpense(true)}
          className="flex-1 bg-nets-navy text-white rounded-nets py-3 text-[14px] font-semibold shadow-lg active:opacity-80 flex items-center justify-center gap-1.5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add expense
        </button>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddFunds && selfMember && (
          <AddFundsModal
            poolId={pool.id}
            selfMember={selfMember}
            onClose={() => setShowAddFunds(false)}
            onAdded={() => { setShowAddFunds(false); refresh(); }}
          />
        )}
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
