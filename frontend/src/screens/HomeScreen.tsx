import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { NetsLogo } from "../components/NetsLogo";
import { NetsCard } from "../components/NetsCard";
import { NetsFlashPayCard } from "../components/NetsFlashPayCard";
import { UserSwitcher } from "../components/UserSwitcher";
import { useUser } from "../context/UserContext";
import { TRANSACTIONS_FALLBACK, ROAM_FALLBACK } from "../fallbackData";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

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

const fmt = (n: number) =>
  n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Top-up Modal ───────────────────────────────────────────────────────────────

type TopUpStep = "amount" | "auth" | "processing" | "success";

function TopUpModal({
  currentBalance,
  onClose,
  onSuccess,
}: {
  currentBalance: number;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [step, setStep] = useState<TopUpStep>("amount");
  const [amount, setAmount] = useState("");
  const [authScanning, setAuthScanning] = useState(false);
  const [authOk, setAuthOk] = useState(false);

  const amt = parseFloat(amount) || 0;

  const handleAuth = async () => {
    if (authScanning) return;
    setAuthScanning(true);
    await new Promise((r) => setTimeout(r, 1150));
    setAuthOk(true);
    setTimeout(() => {
      setStep("processing");
      setTimeout(() => {
        onSuccess(amt);
        setStep("success");
      }, 1600);
    }, 500);
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.5)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget && step === "amount") onClose(); }}
    >
      <AnimatePresence mode="wait">

        {/* ── Step 1: Amount ── */}
        {step === "amount" && (
          <motion.div
            key="amount"
            className="bg-white rounded-t-[28px] p-5 space-y-4"
            initial={{ y: 380 }} animate={{ y: 0 }} exit={{ y: 380 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />
            <div>
              <p className="text-[18px] font-bold text-nets-text">Top-up FlashPay</p>
              <p className="text-[12px] text-nets-muted mt-0.5">
                Current balance: <span className="font-semibold text-nets-text">SGD {fmt(currentBalance)}</span>
              </p>
            </div>

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-bold text-nets-muted select-none">S$</span>
              <input
                className="w-full border-2 border-nets-border rounded-nets pl-12 pr-4 py-4 text-[30px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                placeholder="0.00" type="number" step="0.01" min="1"
                value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus
              />
            </div>

            {/* Quick amounts */}
            <div className="grid grid-cols-4 gap-2">
              {["100", "500", "1000", "5000"].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                    amount === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                  }`}
                >
                  ${parseInt(v).toLocaleString()}
                </button>
              ))}
            </div>

            {/* Bank source */}
            <div className="flex items-center gap-3 border border-nets-border rounded-nets px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                <span className="text-white text-[10px] font-black">DBS</span>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-nets-text">DBS eSavings</p>
                <p className="text-[11px] text-nets-muted">Account ••••4892 · Available S$98,200.00</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6,9 12,15 18,9" />
              </svg>
            </div>

            <button
              onClick={() => { if (amt > 0) setStep("auth"); }}
              disabled={amt <= 0}
              className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold disabled:opacity-35 active:opacity-80"
            >
              Continue → S${amt > 0 ? fmt(amt) : "0.00"}
            </button>
          </motion.div>
        )}

        {/* ── Step 2: Auth ── */}
        {step === "auth" && (
          <motion.div
            key="auth"
            className="rounded-t-[28px] overflow-hidden"
            initial={{ y: 380 }} animate={{ y: 0 }} exit={{ y: 380 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DBS header */}
            <div className="bg-red-600 px-5 pt-5 pb-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                <span className="text-red-600 text-[11px] font-black">DBS</span>
              </div>
              <div>
                <p className="text-white font-bold text-[15px]">DBS digibank</p>
                <p className="text-white/70 text-[11px]">Authorise transfer</p>
              </div>
            </div>

            <div className="bg-white p-5 space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-[12px] text-nets-muted">From</span>
                  <span className="text-[13px] font-semibold text-nets-text">DBS eSavings ••••4892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-nets-muted">To</span>
                  <span className="text-[13px] font-semibold text-nets-text">NETS FlashPay</span>
                </div>
                <div className="border-t border-nets-border pt-2.5 flex justify-between">
                  <span className="text-[12px] text-nets-muted">Amount</span>
                  <span className="text-[20px] font-bold text-nets-text">S${fmt(amt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-nets-muted">New balance</span>
                  <span className="text-[13px] font-semibold text-green-600">S${fmt(currentBalance + amt)}</span>
                </div>
              </div>

              {/* Fingerprint */}
              <div className="flex flex-col items-center gap-3 py-1">
                <motion.button
                  onClick={handleAuth}
                  disabled={authScanning}
                  className="w-20 h-20 rounded-full flex items-center justify-center relative transition-all active:scale-95"
                  style={{
                    background: authOk
                      ? "radial-gradient(circle, #16a34a, #15803d)"
                      : authScanning
                        ? "radial-gradient(circle, #991b1b, #7f1d1d)"
                        : "bg-red-50",
                    border: `2px solid ${authOk ? "rgba(74,222,128,0.5)" : authScanning ? "rgba(220,38,38,0.5)" : "#fecaca"}`,
                    backgroundColor: authOk ? undefined : authScanning ? undefined : "#fef2f2",
                  }}
                >
                  {authOk ? (
                    <motion.span className="text-[36px]" initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 14 }}>✓</motion.span>
                  ) : (
                    <motion.div
                      animate={authScanning ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z" />
                        <path d="M12 2a10 10 0 0 1 0 20" />
                        <path d="M12 6a6 6 0 0 1 0 12" />
                        <path d="M12 2C6.48 2 2 6.48 2 12" />
                        <path d="M8 12a4 4 0 0 1 4-4" />
                      </svg>
                    </motion.div>
                  )}
                  {authScanning && !authOk && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-400/40"
                      animate={{ scale: [1, 1.4, 1.7], opacity: [0.7, 0.3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                    />
                  )}
                </motion.button>
                <p className="text-[13px] font-semibold text-nets-text">
                  {authOk ? "Authenticated ✓" : authScanning ? "Verifying…" : "Touch to authorise"}
                </p>
                <p className="text-[11px] text-nets-muted">Use fingerprint to confirm transfer</p>
              </div>

              <button onClick={() => setStep("amount")} className="w-full text-[13px] text-nets-muted py-1 text-center">
                ← Back
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Processing ── */}
        {step === "processing" && (
          <motion.div
            key="processing"
            className="bg-white rounded-t-[28px] p-8 flex flex-col items-center gap-4"
            initial={{ y: 380 }} animate={{ y: 0 }} exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid #fecaca", borderTopColor: "#dc2626" }} />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-bold text-nets-text">Processing top-up…</p>
              <p className="text-[12px] text-nets-muted mt-1">Transferring from DBS eSavings</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="w-2 h-2 rounded-full bg-red-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Success ── */}
        {step === "success" && (
          <motion.div
            key="success"
            className="bg-white rounded-t-[28px] p-8 flex flex-col items-center gap-3"
            initial={{ y: 380 }} animate={{ y: 0 }}
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
            <motion.div className="text-center" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <p className="text-[18px] font-bold text-nets-text">Top-up successful!</p>
              <p className="text-[30px] font-bold text-green-600 mt-1">+S${fmt(amt)}</p>
              <p className="text-[12px] text-nets-muted mt-1">Added to NETS FlashPay</p>
              <div className="mt-3 bg-green-50 rounded-xl px-5 py-3">
                <p className="text-[11px] text-nets-muted">New FlashPay balance</p>
                <p className="text-[20px] font-bold text-green-700 mt-0.5">SGD {fmt(currentBalance + amt)}</p>
              </div>
            </motion.div>
            <motion.button
              onClick={onClose}
              className="mt-2 w-full bg-nets-navy text-white rounded-nets py-3 text-[14px] font-semibold active:opacity-80"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            >
              Done
            </motion.button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

// ── Auto Top-up Modal ──────────────────────────────────────────────────────────

const THRESHOLDS = ["500", "1,000", "2,000"];
const TOPUP_AMOUNTS = ["1,000", "2,000", "5,000", "10,000"];

function AutoTopUpModal({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState("1,000");
  const [topupAmt, setTopupAmt] = useState("2,000");
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(true);
    await new Promise((r) => setTimeout(r, 1400));
    onClose();
  };

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.5)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget && !saved) onClose(); }}
    >
      <motion.div
        className="bg-white rounded-t-[28px] p-5 space-y-5"
        initial={{ y: 500 }} animate={{ y: 0 }} exit={{ y: 500 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-nets-border rounded-full mx-auto" />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[18px] font-bold text-nets-text">Auto Top-up</p>
            <p className="text-[12px] text-nets-muted mt-0.5">Automatically top-up when balance is low</p>
          </div>
          {/* Toggle */}
          <motion.button
            onClick={() => setEnabled((v) => !v)}
            className="relative w-12 h-7 rounded-full transition-colors"
            style={{ background: enabled ? "#1B3464" : "#d1d5db" }}
          >
            <motion.div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
              animate={{ left: enabled ? "calc(100% - 24px)" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.button>
        </div>

        <AnimatePresence>
          {enabled && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            >
              {/* Threshold */}
              <div>
                <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">
                  When balance drops below
                </p>
                <div className="flex gap-2">
                  {THRESHOLDS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setThreshold(v)}
                      className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-colors ${
                        threshold === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                      }`}
                    >
                      S${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top-up amount */}
              <div>
                <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-2">
                  Auto top-up amount
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {TOPUP_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      onClick={() => setTopupAmt(v)}
                      className={`py-2.5 rounded-xl text-[12px] font-semibold border transition-colors ${
                        topupAmt === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                      }`}
                    >
                      S${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source */}
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

              {/* Summary pill */}
              <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
                <p className="text-[12px] text-nets-navy font-medium leading-snug">
                  When FlashPay drops below{" "}
                  <span className="font-bold">S${threshold}</span>, we'll automatically top up{" "}
                  <span className="font-bold">S${topupAmt}</span> from your DBS account.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {saved ? (
            <motion.div
              key="saved"
              className="flex items-center justify-center gap-2 py-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="text-xl">✅</span>
              <p className="text-[15px] font-bold text-green-700">Saved!</p>
            </motion.div>
          ) : (
            <motion.button
              key="save"
              onClick={handleSave}
              className="w-full bg-nets-navy text-white rounded-nets py-3.5 text-[15px] font-semibold active:opacity-80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {enabled ? `Save — top-up S${topupAmt} when below S$${threshold}` : "Save — Auto top-up off"}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── Quick Action ───────────────────────────────────────────────────────────────

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 flex-1 active:opacity-70">
      <div className="w-12 h-12 rounded-full bg-nets-gray-bg flex items-center justify-center text-xl">
        {icon}
      </div>
      <span className="text-[11px] font-medium text-nets-muted">{label}</span>
    </button>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { userId, balance, addBalance } = useUser();
  const navigate = useNavigate();
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [roamActive, setRoamActive] = useState<{ location: string; flag: string } | null>(null);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAutoTopUp, setShowAutoTopUp] = useState(false);

  useEffect(() => {
    fetch(`${API}/users/${userId}/transactions?limit=5`)
      .then((r) => r.json())
      .then(setRecent)
      .catch(() => setRecent((TRANSACTIONS_FALLBACK[userId] ?? []).slice(0, 5)));
    fetch(`${API}/users/${userId}/roam`)
      .then((r) => r.json())
      .then((d) => setRoamActive(d.is_traveling ? { location: d.location, flag: d.flag } : null))
      .catch(() => {
        const fb = ROAM_FALLBACK[userId];
        setRoamActive(fb?.is_traveling ? { location: fb.location, flag: fb.flag } : null);
      });
  }, [userId]);

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg screen-scroll pb-[72px] relative">
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
          <button onClick={() => navigate("/settings")} className="active:opacity-70">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Roam active alert */}
      <AnimatePresence>
        {roamActive && (
          <motion.button
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden w-full text-left"
            onClick={() => navigate("/roam")}
          >
            <div className="flex items-center gap-3 px-4 py-3" style={{ background: "linear-gradient(90deg, #1B3464 0%, #2B5CBF 100%)" }}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span className="text-[13px] font-semibold text-white flex-1">
                {roamActive.flag} NETS Roam active · {roamActive.location}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 space-y-4">
        {/* FlashPay card */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-medium text-nets-text">NETS FlashPay Card, Motoring Card</span>
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
            <QuickAction icon="⬆️" label="Top-up" onClick={() => setShowTopUp(true)} />
            <QuickAction icon="📋" label="History" onClick={() => navigate("/history")} />
            <QuickAction icon="🔄" label="Auto Top-up" onClick={() => setShowAutoTopUp(true)} />
            <QuickAction icon="✨" label="Wrapped" onClick={() => navigate("/wrapped")} />
          </div>
        </NetsCard>

        {/* Wrapped promo */}
        <button onClick={() => navigate("/wrapped")} className="w-full text-left active:opacity-80">
          <div
            className="rounded-nets p-4 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1B3464 0%, #7C3AED 100%)" }}
          >
            <div className="absolute right-3 top-2 text-5xl opacity-20 select-none">✨</div>
            <p className="text-[12px] font-semibold text-white/70 uppercase tracking-wider">NETS Trace · New</p>
            <p className="text-[17px] font-bold text-white mt-0.5">Your Wrapped story is ready</p>
            <p className="text-[12px] text-white/70 mt-1">See your 2026 spend personality →</p>
          </div>
        </button>

        {/* Recent transactions */}
        {recent.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium text-nets-text">Recent Transactions</span>
              <button className="text-[12px] text-nets-navy font-medium" onClick={() => navigate("/history")}>
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
                  <p className="text-[13px] font-semibold text-nets-text ml-2">−S${t.amount.toFixed(2)}</p>
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

      {/* Modals */}
      <AnimatePresence>
        {showTopUp && (
          <TopUpModal
            key="topup"
            currentBalance={balance}
            onClose={() => setShowTopUp(false)}
            onSuccess={(amt) => { addBalance(amt); }}
          />
        )}
        {showAutoTopUp && (
          <AutoTopUpModal key="autotopup" onClose={() => setShowAutoTopUp(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
