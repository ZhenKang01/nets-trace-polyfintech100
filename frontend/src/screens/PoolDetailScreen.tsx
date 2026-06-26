import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";
import { TransactionAuthModal } from "../components/TransactionAuthModal";

// ── Demo data ─────────────────────────────────────────────────────────────────

const SCAN_MERCHANTS = [
  { name: "Maxwell Food Centre", category: "Food & Drink", amount: 42.50, icon: "🍜" },
  { name: "Old Chang Kee", category: "Food & Drink", amount: 18.80, icon: "🥟" },
  { name: "Lau Pa Sat", category: "Food & Drink", amount: 51.30, icon: "🍢" },
  { name: "Giant Hypermarket", category: "Groceries", amount: 68.40, icon: "🛒" },
  { name: "Don Don Donki", category: "Shopping", amount: 58.90, icon: "🛍️" },
  { name: "Grab (group ride)", category: "Transport", amount: 24.20, icon: "🚗" },
  { name: "KFC Singapore", category: "Food & Drink", amount: 35.60, icon: "🍗" },
];

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";
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

// ── Add Funds Modal (bank verification flow) ─────────────────────────────────

type FundsStep = "amount" | "auth" | "processing" | "success";

function AddFundsModal({
  poolId,
  selfMember,
  poolName,
  onClose,
  onAdded,
}: {
  poolId: string;
  selfMember: Member;
  poolName: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [step, setStep] = useState<FundsStep>("amount");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [processingMsg, setProcessingMsg] = useState("Authorising…");

  const amt = parseFloat(amount) || 0;

  const handleContinue = () => {
    if (amt <= 0) return;
    setStep("auth");
  };

  const handleAuthorise = async () => {
    setStep("processing");
    setProcessingMsg("Authorising with DBS…");
    await new Promise((r) => setTimeout(r, 1200));
    setProcessingMsg("Transferring funds…");
    try {
      await fetch(`${API}/user-pools/${poolId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: selfMember.id, amount: amt, note: note.trim() || null }),
      });
    } catch { /* offline — still show success */ }
    await new Promise((r) => setTimeout(r, 900));
    setStep("success");
    setTimeout(onAdded, 1800);
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ background: step === "auth" ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget && step === "amount") onClose(); }}
    >
      <AnimatePresence mode="wait">

        {/* ── Step 1: Amount ── */}
        {step === "amount" && (
          <motion.div
            key="amount"
            className="bg-white rounded-t-[24px] p-5 space-y-4"
            initial={{ y: 340 }} animate={{ y: 0 }} exit={{ y: 340 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />
            <div>
              <p className="text-[17px] font-bold text-nets-text">Add funds to pool</p>
              <p className="text-[12px] text-nets-muted mt-0.5">
                Adding as <span className="font-semibold text-nets-text">{selfMember.display_name}</span>
              </p>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-nets-muted select-none">S$</span>
              <input
                className="w-full border-2 border-nets-border rounded-nets pl-12 pr-4 py-4 text-[28px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                placeholder="0.00" type="number" step="0.01" min="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
              />
            </div>

            <div className="flex gap-2">
              {["10", "20", "50", "100"].map((v) => (
                <button key={v} onClick={() => setAmount(v)}
                  className={`flex-1 py-2 rounded-nets text-[13px] font-semibold border transition-colors ${
                    amount === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>

            <input
              className="w-full border border-nets-border rounded-nets px-4 py-3 text-[13px] focus:outline-none focus:border-nets-navy"
              placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            />

            {/* Linked bank account */}
            <div className="flex items-center gap-3 border border-nets-border rounded-nets px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">DBS</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-nets-text">DBS eSavings</p>
                <p className="text-[11px] text-nets-muted">Account ••••4892</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>

            <button
              onClick={handleContinue}
              disabled={amt <= 0}
              className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40"
            >
              Continue → S${amt > 0 ? amt.toFixed(2) : "0.00"}
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Bank auth ── */}
        {step === "auth" && (
          <motion.div
            key="auth"
            className="rounded-t-[24px] overflow-hidden"
            initial={{ y: 340 }} animate={{ y: 0 }} exit={{ y: 340 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DBS header bar */}
            <div className="bg-red-600 px-5 pt-5 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-red-600 text-[11px] font-black">DBS</span>
              </div>
              <div>
                <p className="text-white font-bold text-[15px]">DBS digibank</p>
                <p className="text-white/70 text-[11px]">Payment authorisation</p>
              </div>
            </div>

            <div className="bg-white p-5 space-y-4">
              {/* Payment summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-nets-muted">From</span>
                  <span className="text-[13px] font-semibold text-nets-text">DBS eSavings ••••4892</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-nets-muted">To</span>
                  <span className="text-[13px] font-semibold text-nets-text">{poolName} (Pool)</span>
                </div>
                <div className="border-t border-nets-border pt-3 flex justify-between items-center">
                  <span className="text-[12px] text-nets-muted">Amount</span>
                  <span className="text-[20px] font-bold text-nets-text">S${amt.toFixed(2)}</span>
                </div>
                {note ? (
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] text-nets-muted">Reference</span>
                    <span className="text-[12px] text-nets-text">{note}</span>
                  </div>
                ) : null}
              </div>

              {/* Biometric authorise */}
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  onClick={handleAuthorise}
                  className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center active:scale-95 transition-transform active:bg-red-100"
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z" />
                    <path d="M12 2a10 10 0 0 1 0 20" />
                    <path d="M12 6a6 6 0 0 1 0 12" />
                    <path d="M12 2C6.48 2 2 6.48 2 12" />
                    <path d="M8 12a4 4 0 0 1 4-4" />
                  </svg>
                </button>
                <p className="text-[13px] font-semibold text-nets-text">Touch to authorise</p>
                <p className="text-[11px] text-nets-muted">Use fingerprint to confirm payment</p>
              </div>

              <button onClick={() => setStep("amount")} className="w-full text-[13px] text-nets-muted py-2 text-center">
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Processing ── */}
        {step === "processing" && (
          <motion.div
            key="processing"
            className="bg-white rounded-t-[24px] p-8 flex flex-col items-center gap-4"
            initial={{ y: 340 }} animate={{ y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin"
                style={{ borderWidth: 3 }} />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-bold text-nets-text">{processingMsg}</p>
              <p className="text-[12px] text-nets-muted mt-1">Securing connection with DBS</p>
            </div>
            {/* Animated dots */}
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-red-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && (
          <motion.div
            key="success"
            className="bg-white rounded-t-[24px] p-8 flex flex-col items-center gap-3"
            initial={{ y: 340 }} animate={{ y: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl"
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              ✅
            </motion.div>
            <motion.div className="text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-[18px] font-bold text-nets-text">Transfer successful</p>
              <p className="text-[24px] font-bold text-green-600 mt-1">S${amt.toFixed(2)}</p>
              <p className="text-[12px] text-nets-muted mt-1">Deducted from DBS eSavings ••••4892</p>
              <p className="text-[12px] text-nets-muted">Added to {poolName}</p>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

// ── Add Expense Modal (QR scanner + generator flow) ──────────────────────────

type ExpenseStep = "scan" | "review" | "saving" | "success";
type ExpenseMode = "scan" | "generate";

function ScannerFrame() {
  return (
    <div className="relative w-56 h-56">
      {[
        "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
        "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-7 h-7 border-green-400 ${cls}`} />
      ))}
      <motion.div
        className="absolute left-2 right-2 h-0.5 bg-green-400 rounded-full"
        style={{ boxShadow: "0 0 10px 3px rgba(74,222,128,0.7)" }}
        animate={{ top: ["8px", "214px", "8px"] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      />
      <div className="absolute inset-4 opacity-10 bg-green-400 rounded-sm" />
    </div>
  );
}

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
  const [mode, setMode] = useState<ExpenseMode>("scan");
  const [step, setStep] = useState<ExpenseStep>("scan");
  const detected = useRef(SCAN_MERCHANTS[Math.floor(Math.random() * SCAN_MERCHANTS.length)]);
  const [amount, setAmount] = useState(String(detected.current.amount.toFixed(2)));
  const [genAmount, setGenAmount] = useState("");
  const [payerId, setPayerId] = useState(members.find((m) => m.is_self)?.id ?? members[0]?.id ?? "");
  const [manualDesc, setManualDesc] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance only in scan mode
  useEffect(() => {
    if (step !== "scan" || mode !== "scan") return;
    scanTimerRef.current = setTimeout(() => setStep("review"), 2800);
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, [step, mode]);

  const switchMode = (m: ExpenseMode) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setMode(m);
  };

  const confirmGenerated = () => {
    const amt = parseFloat(genAmount);
    if (isNaN(amt) || amt <= 0) return;
    setAmount(genAmount);
    setShowManual(true);
    setStep("review");
  };

  const submit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    setStep("saving");
    const desc = manualDesc.trim() || (mode === "generate" ? "Group expense" : detected.current.name);
    try {
      await fetch(`${API}/user-pools/${poolId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, amount: amt, payer_member_id: payerId, split_type: "equal" }),
      });
    } catch { /* offline */ }
    setStep("success");
    setTimeout(onAdded, 1400);
  };

  const perMember = members.length > 0 ? (parseFloat(amount) || 0) / members.length : 0;
  const genAmt = parseFloat(genAmount) || 0;
  const genQRValue = `https://nets.com.sg/qr/pool/${poolId}?amount=${genAmount}&split=equal&n=${members.length}`;

  return (
    <AnimatePresence mode="wait">

      {/* ── Scan / Generate step: full-screen ── */}
      {step === "scan" && (
        <motion.div
          key="scan"
          className="absolute inset-0 z-40 flex flex-col"
          style={{ background: "linear-gradient(180deg, #050d1f 0%, #0d1e40 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="w-8" />
            <p className="text-white font-bold text-[15px]">
              {mode === "scan" ? "Scan to add expense" : "Generate payment QR"}
            </p>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex mx-5 mb-4 p-1 rounded-xl bg-white/10 border border-white/15">
            {(["scan", "generate"] as ExpenseMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold transition-all ${
                  mode === m ? "bg-white/20 text-white shadow" : "text-white/40"
                }`}
              >
                <span>{m === "scan" ? "📷" : "📲"}</span>
                {m === "scan" ? "Scan QR" : "Generate QR"}
              </button>
            ))}
          </div>

          {/* ── Scan mode ── */}
          {mode === "scan" && (
            <>
              <p className="text-white/50 text-[12px] text-center mb-8">
                Point at any PayNow or NETS QR code
              </p>
              <div className="flex-1 flex items-center justify-center">
                <ScannerFrame />
              </div>
              <div className="mx-5 mb-3 rounded-xl bg-white/10 border border-white/20 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-nets-navy flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">NETS</span>
                </div>
                <div>
                  <p className="text-white text-[12px] font-semibold">Paying from pool</p>
                  <p className="text-white/50 text-[11px]">Expense split equally between members</p>
                </div>
              </div>
              <button
                onClick={() => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); setShowManual(true); setStep("review"); }}
                className="text-white/40 text-[12px] text-center pb-6"
              >
                Enter manually instead
              </button>
            </>
          )}

          {/* ── Generate mode ── */}
          {mode === "generate" && (
            <>
              {/* Amount input */}
              <div className="px-5 mb-4">
                <p className="text-white/40 text-[11px] font-semibold uppercase tracking-wider mb-2 text-center">
                  Amount to split
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-bold text-white/40 select-none">S$</span>
                  <input
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-[28px] font-bold text-white focus:outline-none focus:border-green-400/60"
                    placeholder="0.00" type="number" step="0.01" min="0.01"
                    value={genAmount} onChange={(e) => setGenAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* QR area */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="wait">
                  {genAmt > 0 ? (
                    <motion.div
                      key="qr-live"
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.7, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 22 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div
                        className="p-4 rounded-2xl border-2 border-green-400/50"
                        style={{
                          background: "#0a1628",
                          boxShadow: "0 0 36px 10px rgba(74,222,128,0.18)",
                        }}
                      >
                        <QRCodeSVG
                          value={genQRValue}
                          size={148}
                          bgColor="#0a1628"
                          fgColor="#4ade80"
                          level="M"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
                        <span className="text-green-300 text-[12px] font-semibold">
                          S${genAmt.toFixed(2)} · {members.length} members · S${(genAmt / Math.max(members.length, 1)).toFixed(2)} each
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr-placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-48 h-48 border-2 border-dashed border-white/15 rounded-2xl flex items-center justify-center"
                    >
                      <span className="text-white/20 text-[12px] text-center px-4">Enter amount to generate QR</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Badge */}
              <div className="mx-5 mb-3 rounded-xl bg-white/10 border border-white/20 p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-nets-navy flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-black">NETS</span>
                </div>
                <div>
                  <p className="text-white text-[12px] font-semibold">NETS Payment QR</p>
                  <p className="text-white/50 text-[11px]">Others scan this to pay · split from pool</p>
                </div>
              </div>

              <div className="px-5 pb-6">
                <button
                  onClick={confirmGenerated}
                  disabled={genAmt <= 0}
                  className="w-full bg-green-500 disabled:bg-white/10 text-white rounded-xl py-3.5 text-[15px] font-semibold disabled:text-white/30 active:opacity-80 transition-colors"
                >
                  {genAmt > 0 ? `✓ Payment received · S$${genAmt.toFixed(2)}` : "Enter amount above"}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* ── Review step ── */}
      {step === "review" && (
        <motion.div
          key="review"
          className="absolute inset-0 z-40 flex flex-col justify-end"
          style={{ background: "linear-gradient(180deg, #050d1f 0%, rgba(13,30,64,0.92) 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="opacity-25">
              {mode === "scan" ? (
                <ScannerFrame />
              ) : (
                genAmt > 0 ? (
                  <div className="p-3 rounded-xl border border-green-400/30" style={{ background: "#0a1628" }}>
                    <QRCodeSVG value={genQRValue} size={100} bgColor="#0a1628" fgColor="#4ade80" level="M" />
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Status badge */}
          <motion.div
            className={`mx-4 mb-2 flex items-center gap-2 border rounded-xl px-4 py-2.5 ${
              mode === "generate"
                ? "bg-green-500/20 border-green-500/40"
                : "bg-green-500/20 border-green-500/40"
            }`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <p className="text-green-300 text-[12px] font-semibold">
              {mode === "generate" ? "Payment confirmed" : "QR detected"}
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-t-[24px] p-5 space-y-4"
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />

            <div className="flex items-center gap-3 bg-nets-gray-bg rounded-xl p-3">
              <div className="w-11 h-11 rounded-xl bg-white border border-nets-border flex items-center justify-center text-2xl shrink-0">
                {mode === "generate" ? "📲" : detected.current.icon}
              </div>
              <div className="flex-1 min-w-0">
                {showManual ? (
                  <input
                    className="w-full text-[14px] font-semibold text-nets-text bg-transparent focus:outline-none border-b border-nets-border"
                    value={manualDesc} onChange={(e) => setManualDesc(e.target.value)}
                    placeholder={mode === "generate" ? "What's this expense for?" : "What was this for?"}
                    autoFocus
                  />
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-nets-text truncate">{detected.current.name}</p>
                    <p className="text-[11px] text-nets-muted">{detected.current.category}</p>
                  </>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-1.5">Total amount</p>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[18px] font-bold text-nets-muted">S$</span>
                <input
                  className="w-full border-2 border-nets-border rounded-nets pl-11 pr-4 py-3 text-[24px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                  type="number" step="0.01" min="0.01"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Who paid?</p>
              <div className="flex gap-2 flex-wrap">
                {members.map((m) => (
                  <button key={m.id} onClick={() => setPayerId(m.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                      payerId === m.id ? "bg-nets-navy text-white" : "bg-nets-gray-bg text-nets-text border border-nets-border"
                    }`}
                  >
                    {m.is_self ? "You" : m.display_name.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {members.length > 0 && parseFloat(amount) > 0 && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <p className="text-[12px] text-nets-blue font-medium">
                  Split equally × {members.length} members
                </p>
                <p className="text-[13px] font-bold text-nets-navy">S${perMember.toFixed(2)} each</p>
              </div>
            )}

            <button
              onClick={() => { if ((parseFloat(amount) || 0) > 0) setShowAuth(true); }}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              ✓ Add expense · S${(parseFloat(amount) || 0).toFixed(2)}
            </button>

            <button onClick={onClose} className="w-full text-center text-[13px] text-nets-muted py-1">Cancel</button>
          </motion.div>

          {/* Transaction auth gate */}
          <AnimatePresence>
            {showAuth && (
              <TransactionAuthModal
                amount={parseFloat(amount) || 0}
                label={`split among ${members.length} members`}
                onSuccess={() => { setShowAuth(false); submit(); }}
                onCancel={() => setShowAuth(false)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Saving / success ── */}
      {(step === "saving" || step === "success") && (
        <motion.div
          key="done"
          className="absolute inset-0 z-40 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="bg-white rounded-2xl p-8 mx-8 flex flex-col items-center gap-3 w-full max-w-[280px]"
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            {step === "saving" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <div className="w-8 h-8 border-nets-navy border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                </div>
                <p className="text-[15px] font-bold text-nets-text">Adding expense…</p>
              </>
            ) : (
              <>
                <motion.div
                  className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-3xl"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  🧾
                </motion.div>
                <p className="text-[16px] font-bold text-nets-text">Expense added!</p>
                <p className="text-[12px] text-nets-muted text-center">
                  S${(parseFloat(amount) || 0).toFixed(2)} split among {members.length} members
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
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
            poolName={pool.name}
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
