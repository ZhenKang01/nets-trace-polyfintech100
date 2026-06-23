import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";
import { useUser } from "../context/UserContext";
import { USER_POOLS_FALLBACK, INFERRED_POOLS_FALLBACK } from "../fallbackData";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";
const AVATAR_COLORS = ["#1B3464", "#2B5CBF", "#E31837", "#6B7280"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserPool {
  id: string;
  name: string;
  icon: string;
  purpose_tag: string | null;
  member_count: number;
  members_preview: { id: string; display_name: string; is_self: boolean }[];
  your_balance: number;
  total_expenses: number;
  expense_count: number;
  last_activity: string;
}

interface InferredPool {
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

interface NewMember { display_name: string; phone: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  const p = name.trim().split(" ");
  return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "short" });
}

// ── User Pool Card ─────────────────────────────────────────────────────────────

function UserPoolCard({ pool, onTap }: { pool: UserPool; onTap: () => void }) {
  const bal = pool.your_balance;
  const balLabel = bal > 0.005
    ? `You're owed S$${bal.toFixed(2)}`
    : bal < -0.005
      ? `You owe S$${Math.abs(bal).toFixed(2)}`
      : "All settled";
  const balColor = bal > 0.005 ? "text-green-600" : bal < -0.005 ? "text-amber-600" : "text-nets-muted";

  return (
    <NetsCard padding={false}>
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3 active:bg-nets-gray-bg/50 transition-colors"
        onClick={onTap}
      >
        <div className="w-11 h-11 rounded-xl bg-nets-gray-bg flex items-center justify-center text-2xl shrink-0">
          {pool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-nets-text truncate">{pool.name}</p>
            {pool.purpose_tag && (
              <span className="text-[10px] font-medium text-nets-muted bg-nets-gray-bg rounded-full px-2 py-0.5 shrink-0">
                {pool.purpose_tag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex -space-x-1.5">
              {pool.members_preview.slice(0, 3).map((m, i) => (
                <div
                  key={m.id}
                  className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: AVATAR_COLORS[i] }}
                >
                  {initials(m.display_name)[0]}
                </div>
              ))}
              {pool.member_count > 3 && (
                <div className="w-5 h-5 rounded-full border border-white bg-nets-muted flex items-center justify-center text-[8px] font-bold text-white">
                  +{pool.member_count - 3}
                </div>
              )}
            </div>
            <span className="text-[11px] text-nets-muted">{pool.member_count} members</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[12px] font-semibold ${balColor}`}>{balLabel}</span>
          <span className="text-[10px] text-nets-muted">{formatDate(pool.last_activity)}</span>
        </div>
      </button>
    </NetsCard>
  );
}

// ── Inferred Pool Card (unchanged) ─────────────────────────────────────────────

function InferredPoolCard({ pool, index }: { pool: InferredPool; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
      <NetsCard padding={false}>
        <button
          className="w-full text-left px-4 pt-4 pb-3 active:bg-nets-gray-bg/50"
          onClick={() => setExpanded((e) => !e)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
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
                    style={{ background: AVATAR_COLORS[i] }}
                  >
                    {"👤"}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-nets-muted">{pool.inferred_participants} participant{pool.inferred_participants > 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-nets-border">
            <span className="text-[12px] text-nets-muted">~S${pool.avg_amount.toFixed(2)} avg · last {formatDate(pool.last_seen)}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </div>
        </button>
        {expanded && (
          <div className="border-t border-nets-border">
            <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider px-4 pt-3 pb-1">Recent occurrences</p>
            {pool.transactions.map((t, i) => (
              <div key={i} className={`flex items-center px-4 py-2.5 ${i < pool.transactions.length - 1 ? "border-b border-nets-border" : ""}`}>
                <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-sm mr-3">🍜</div>
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

// ── Create Pool Overlay ────────────────────────────────────────────────────────

const POOL_EMOJIS = ["🍽️", "🧋", "🍺", "🛣️", "🎖️", "🏠", "🎬", "💪", "✈️", "🎉", "💰", "🎮"];
const POOL_TAGS = ["Dinner", "Drinks", "Trip", "Rent", "Entertainment", "Groceries", "Other"];

function CreatePoolOverlay({
  userId,
  onClose,
  onCreated,
}: {
  userId: string;
  onClose: () => void;
  onCreated: (poolId: string) => void;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💰");
  const [tag, setTag] = useState("Dinner");
  const [members, setMembers] = useState<NewMember[]>([]);
  const [memberName, setMemberName] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [creating, setCreating] = useState(false);

  const addMember = () => {
    if (!memberName.trim()) return;
    setMembers((prev) => [...prev, { display_name: memberName.trim(), phone: memberPhone.trim() }]);
    setMemberName("");
    setMemberPhone("");
  };

  const createPool = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API}/users/${userId}/user-pools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "My Pool", icon, purpose_tag: tag }),
      });
      const pool = await res.json();
      for (const m of members) {
        await fetch(`${API}/user-pools/${pool.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: m.display_name, phone: m.phone || null }),
        });
      }
      onCreated(pool.id);
    } catch {
      setCreating(false);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      style={{ background: "#f4f5f7" }}
    >
      {/* Header */}
      <div className="bg-white px-5 pt-4 pb-3 flex items-center justify-between border-b border-nets-border">
        <button onClick={step > 1 ? () => setStep(s => s - 1) : onClose} className="text-nets-navy font-medium text-[14px] active:opacity-70">
          {step > 1 ? "Back" : "Cancel"}
        </button>
        <span className="text-[16px] font-semibold text-nets-text">New Pool</span>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-6 h-1.5 rounded-full transition-colors ${s <= step ? "bg-nets-navy" : "bg-nets-border"}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-3">Choose an icon</p>
              <div className="grid grid-cols-6 gap-2">
                {POOL_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setIcon(e)}
                    className={`h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${icon === e ? "bg-nets-navy scale-110" : "bg-white border border-nets-border"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Pool name</p>
              <input
                className="w-full bg-white border border-nets-border rounded-nets px-4 py-3 text-[15px] text-nets-text focus:outline-none focus:border-nets-navy"
                placeholder="e.g. Supper Gang"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {POOL_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTag(t)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${tag === t ? "bg-nets-navy text-white" : "bg-white border border-nets-border text-nets-text"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white rounded-nets p-4 border border-nets-border">
              <div className="w-12 h-12 rounded-xl bg-nets-gray-bg flex items-center justify-center text-2xl">{icon}</div>
              <div>
                <p className="text-[15px] font-semibold text-nets-text">{name || "My Pool"}</p>
                <p className="text-[12px] text-nets-muted">{tag}</p>
              </div>
            </div>
            <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider">Add members</p>
            <div className="space-y-2">
              <input
                className="w-full bg-white border border-nets-border rounded-nets px-4 py-3 text-[14px] focus:outline-none focus:border-nets-navy"
                placeholder="Name (e.g. Wei H.)"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
              />
              <input
                className="w-full bg-white border border-nets-border rounded-nets px-4 py-3 text-[14px] focus:outline-none focus:border-nets-navy"
                placeholder="Phone number (optional)"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
              />
              <button
                onClick={addMember}
                disabled={!memberName.trim()}
                className="w-full bg-nets-navy text-white rounded-nets py-3 text-[14px] font-semibold disabled:opacity-40 active:opacity-80"
              >
                + Add member
              </button>
            </div>
            {members.length > 0 && (
              <div className="space-y-2">
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-nets px-4 py-3 border border-nets-border">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white" style={{ background: AVATAR_COLORS[(i + 1) % 4] }}>
                      {initials(m.display_name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-nets-text">{m.display_name}</p>
                      {m.phone && <p className="text-[11px] text-nets-muted">{m.phone}</p>}
                    </div>
                    <button onClick={() => setMembers((prev) => prev.filter((_, j) => j !== i))} className="text-nets-muted active:opacity-70">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-white rounded-nets p-4 border border-nets-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-nets-gray-bg flex items-center justify-center text-3xl">{icon}</div>
                <div>
                  <p className="text-[17px] font-bold text-nets-text">{name || "My Pool"}</p>
                  <p className="text-[12px] text-nets-muted">{tag}</p>
                </div>
              </div>
              <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Members</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 py-1">
                  <div className="w-7 h-7 rounded-full bg-nets-navy flex items-center justify-center text-[10px] font-bold text-white">You</div>
                  <p className="text-[13px] text-nets-text">You (account owner)</p>
                </div>
                {members.map((m, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: AVATAR_COLORS[(i + 1) % 4] }}>
                      {initials(m.display_name)}
                    </div>
                    <p className="text-[13px] text-nets-text">{m.display_name}</p>
                    {m.phone && <p className="text-[11px] text-nets-muted ml-auto">{m.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-nets-muted text-center px-4">
              Members you've added can see shared expenses and their balance. You invited them — NETS doesn't know who they are.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-white border-t border-nets-border px-5 py-4">
        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 1 && !name.trim()}
            className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 active:opacity-80"
          >
            {step === 2 ? "Review pool" : "Next"}
          </button>
        ) : (
          <button
            onClick={createPool}
            disabled={creating}
            className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 active:opacity-80 flex items-center justify-center gap-2"
          >
            {creating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {creating ? "Creating…" : "Create pool"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Main PoolsScreen ───────────────────────────────────────────────────────────

export function PoolsScreen() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [userPools, setUserPools] = useState<UserPool[]>([]);
  const [inferredPools, setInferredPools] = useState<InferredPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPools = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/users/${userId}/user-pools`).then((r) => r.json()).catch(() => USER_POOLS_FALLBACK[userId] ?? []),
      fetch(`${API}/users/${userId}/pools`).then((r) => r.json()).catch(() => INFERRED_POOLS_FALLBACK[userId] ?? []),
    ]).then(([up, ip]) => {
      setUserPools(up);
      setInferredPools(ip);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg relative">
      <NetsHeader
        title="Pools"
        showBack={false}
        rightElement={
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 bg-nets-navy rounded-full flex items-center justify-center active:opacity-70"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 screen-scroll px-4 pb-[72px]">
        {/* Your Pools section */}
        <div className="pt-4 mb-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-nets-text">Your Pools</p>
            <span className="text-[11px] text-nets-muted">You added these members</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && userPools.length === 0 && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full border-2 border-dashed border-nets-border rounded-nets py-8 flex flex-col items-center gap-2 active:opacity-70"
            >
              <span className="text-3xl">➕</span>
              <p className="text-[13px] font-medium text-nets-muted">Create your first pool</p>
              <p className="text-[11px] text-nets-muted px-8 text-center">Track shared expenses with friends you've invited</p>
            </button>
          )}

          <div className="space-y-2.5">
            {userPools.map((pool, i) => (
              <motion.div
                key={pool.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <UserPoolCard pool={pool} onTap={() => navigate(`/pools/${pool.id}`)} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Suggested section */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-nets-text">NETS Suggested</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-nets px-3 py-2.5 mb-3">
            <p className="text-[11px] text-nets-blue font-medium leading-snug">
              🔍 Inferred from transaction behaviour — no personal data shared.
            </p>
          </div>

          {!loading && inferredPools.length === 0 && (
            <div className="text-center py-10 text-nets-muted">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-[13px] font-medium">No patterns detected yet</p>
            </div>
          )}

          <div className="space-y-3">
            {inferredPools.map((pool, i) => (
              <InferredPoolCard key={pool.id} pool={pool} index={i} />
            ))}
          </div>

          {!loading && inferredPools.length > 0 && (
            <p className="text-[11px] text-center text-nets-muted px-4 py-3">
              Patterns inferred from timing, location & amount similarity. No identities stored.
            </p>
          )}
        </div>
      </div>

      {/* Create pool overlay */}
      <AnimatePresence>
        {showCreate && (
          <CreatePoolOverlay
            userId={userId}
            onClose={() => setShowCreate(false)}
            onCreated={(poolId) => {
              setShowCreate(false);
              navigate(`/pools/${poolId}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
