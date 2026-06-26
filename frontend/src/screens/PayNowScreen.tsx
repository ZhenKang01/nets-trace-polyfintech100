import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransactionAuthModal } from "../components/TransactionAuthModal";

type PayStep = "input" | "review" | "processing" | "success";
type PayMode = "phone" | "scan";

const RECENT_CONTACTS = [
  { name: "Wei Liang", phone: "+65 9123 4567", initials: "WL", color: "#1B3464", lastTx: "Sent S$25 · 2 days ago" },
  { name: "Priya R.", phone: "+65 8234 5678", initials: "PR", color: "#7C3AED", lastTx: "Sent S$12 · 1 week ago" },
  { name: "Jordan L.", phone: "+65 9876 5432", initials: "JL", color: "#2B5CBF", lastTx: "Received S$48 · 2 weeks ago" },
];

function ScannerFrame() {
  return (
    <div className="relative w-56 h-56">
      {[
        "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
        "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
        "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
        "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
      ].map((cls, i) => (
        <div key={i} className={`absolute w-7 h-7 border-violet-400 ${cls}`} />
      ))}
      <motion.div
        className="absolute left-2 right-2 h-0.5 rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, #a78bfa, transparent)",
          boxShadow: "0 0 12px 3px rgba(167,139,250,0.8)",
        }}
        animate={{ top: ["8px", "214px", "8px"] }}
        transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
      />
      <div className="absolute inset-4 opacity-5 bg-violet-400 rounded-sm" />
    </div>
  );
}

export function PayNowScreen() {
  const [mode, setMode] = useState<PayMode>("phone");
  const [step, setStep] = useState<PayStep>("input");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedContact, setSelectedContact] = useState<typeof RECENT_CONTACTS[0] | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scannedRecipient = { name: "Maxwell Food Centre", uen: "UEN 201234567K", initials: "MF", color: "#7C3AED" };

  // Auto-advance QR scan after 2.8s
  useEffect(() => {
    if (step !== "input" || mode !== "scan") return;
    scanTimerRef.current = setTimeout(() => setStep("review"), 2800);
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, [step, mode]);

  const switchMode = (m: PayMode) => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setMode(m);
    setStep("input");
    setPhone("");
    setAmount("");
    setSelectedContact(null);
  };

  const handlePay = async () => {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1700));
    setStep("success");
  };

  const handleReset = () => {
    setStep("input");
    setPhone("");
    setAmount("");
    setNote("");
    setSelectedContact(null);
  };

  const amt = parseFloat(amount) || 0;
  const recipientName = mode === "phone"
    ? (selectedContact?.name ?? phone)
    : scannedRecipient.name;
  const recipientSub = mode === "phone"
    ? (selectedContact?.phone ?? phone)
    : scannedRecipient.uen;
  const recipientInitials = mode === "phone"
    ? (selectedContact?.initials ?? phone.slice(-2).toUpperCase())
    : scannedRecipient.initials;
  const recipientColor = mode === "phone"
    ? (selectedContact?.color ?? "#1B3464")
    : scannedRecipient.color;

  const canReview = phone.trim().length > 0 && amt > 0;
  const canPay = amt > 0;

  return (
    <div className="flex flex-col h-full bg-[#f4f5f7]">

      {/* ── Header ── */}
      <div className="bg-white border-b border-nets-border">
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="text-[18px] font-bold text-nets-text">PayNow</p>
            <p className="text-[11px] text-nets-muted">Instant transfer · 24/7</p>
          </div>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7B44F2, #3B82F6)" }}
          >
            <span className="text-white text-[10px] font-black tracking-tight">PN</span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex mx-5 mb-3 p-0.5 bg-nets-gray-bg rounded-xl">
          {(["phone", "scan"] as PayMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold transition-all ${
                mode === m ? "bg-white text-nets-navy shadow-sm" : "text-nets-muted"
              }`}
            >
              <span>{m === "phone" ? "📱" : "📷"}</span>
              {m === "phone" ? "Phone / UEN" : "Scan QR"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Phone input ── */}
          {mode === "phone" && step === "input" && (
            <motion.div
              key="phone-input"
              className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-[88px] space-y-4"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
            >
              {/* Recent contacts */}
              <div>
                <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Recent</p>
                <div className="space-y-2">
                  {RECENT_CONTACTS.map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => { setSelectedContact(c); setPhone(c.phone); }}
                      className={`w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3 text-left border-2 transition-all ${
                        selectedContact?.phone === c.phone
                          ? "border-nets-navy shadow-sm"
                          : "border-transparent"
                      }`}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                        style={{ background: c.color }}
                      >
                        {c.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-nets-text">{c.name}</p>
                        <p className="text-[11px] text-nets-muted">{c.phone}</p>
                      </div>
                      <p className="text-[10px] text-nets-muted text-right shrink-0 leading-snug">{c.lastTx}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual input */}
              <div>
                <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2">
                  Or enter number / UEN
                </p>
                <input
                  className="w-full bg-white border border-nets-border rounded-2xl px-4 py-3 text-[14px] text-nets-text focus:outline-none focus:border-nets-navy"
                  placeholder="+65 9XXX XXXX or UEN 20XXXXXXXX"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setSelectedContact(null); }}
                  type="tel"
                />
              </div>

              {/* Amount */}
              <div>
                <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Amount</p>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] font-bold text-nets-muted select-none">S$</span>
                  <input
                    className="w-full bg-white border border-nets-border rounded-2xl pl-12 pr-4 py-3.5 text-[26px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                    placeholder="0.00" type="number" step="0.01" min="0.01"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {["5", "10", "20", "50"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(v)}
                      className={`flex-1 py-2 rounded-xl text-[13px] font-semibold border transition-colors ${
                        amount === v
                          ? "bg-nets-navy text-white border-nets-navy"
                          : "bg-white text-nets-text border-nets-border"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <input
                className="w-full bg-white border border-nets-border rounded-2xl px-4 py-3 text-[13px] text-nets-text focus:outline-none focus:border-nets-navy"
                placeholder="Add a note (optional)"
                value={note} onChange={(e) => setNote(e.target.value)}
              />
            </motion.div>
          )}

          {/* ── QR scanner ── */}
          {mode === "scan" && step === "input" && (
            <motion.div
              key="scan-input"
              className="absolute inset-0 flex flex-col"
              style={{ background: "linear-gradient(180deg, #0d0520 0%, #150a30 100%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-white/40 text-[12px] text-center mt-5 mb-6">
                Point at any PayNow or NETS QR code
              </p>
              <div className="flex-1 flex items-center justify-center">
                <ScannerFrame />
              </div>
              <div className="mx-5 mb-3 rounded-2xl border border-white/10 p-3 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "linear-gradient(135deg, #7B44F2, #3B82F6)" }}>
                  <span className="text-white text-[9px] font-black">PN</span>
                </div>
                <div>
                  <p className="text-white text-[12px] font-semibold">PayNow transfer</p>
                  <p className="text-white/40 text-[11px]">Supports phone, UEN, and VPA</p>
                </div>
              </div>
              <button
                onClick={() => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); setStep("review"); }}
                className="text-white/30 text-[12px] text-center pb-6"
              >
                Enter details manually instead
              </button>
            </motion.div>
          )}

          {/* ── Review (shared for both modes) ── */}
          {step === "review" && (
            <motion.div
              key="review"
              className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-[88px] space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* QR detected badge (scan mode) */}
              {mode === "scan" && (
                <motion.div
                  className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2.5"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shrink-0" />
                  <p className="text-violet-700 text-[12px] font-semibold">PayNow QR detected</p>
                </motion.div>
              )}

              {/* Recipient */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-nets-border">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[14px] font-bold shrink-0"
                  style={{ background: recipientColor }}
                >
                  {recipientInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-nets-text">{recipientName}</p>
                  <p className="text-[12px] text-nets-muted">{recipientSub}</p>
                </div>
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-white rounded-2xl p-4 border border-nets-border">
                <p className="text-[11px] font-semibold text-nets-muted uppercase tracking-wider mb-2">Amount</p>
                <div className="relative mb-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] font-bold text-nets-muted select-none">S$</span>
                  <input
                    className="w-full border-2 border-nets-border rounded-xl pl-10 pr-4 py-3 text-[24px] font-bold text-nets-text focus:outline-none focus:border-nets-navy"
                    type="number" step="0.01" min="0.01"
                    placeholder="0.00"
                    value={amount} onChange={(e) => setAmount(e.target.value)}
                    autoFocus={mode === "scan"}
                  />
                </div>
                <div className="flex gap-2">
                  {["5", "10", "20", "50"].map((v) => (
                    <button key={v} onClick={() => setAmount(v)}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                        amount === v ? "bg-nets-navy text-white border-nets-navy" : "bg-nets-gray-bg text-nets-text border-nets-border"
                      }`}
                    >
                      ${v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="bg-white rounded-2xl px-4 py-3 border border-nets-border">
                <input
                  className="w-full text-[13px] text-nets-text focus:outline-none"
                  placeholder="Add a note (optional)"
                  value={note} onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-[12px] text-nets-muted">From</span>
                  <span className="text-[12px] font-semibold text-nets-text">DBS eSavings ••••4892</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px] text-nets-muted">To</span>
                  <span className="text-[12px] font-semibold text-nets-text">{recipientName}</span>
                </div>
                {amt > 0 && (
                  <div className="flex justify-between border-t border-violet-100 pt-2">
                    <span className="text-[12px] text-nets-muted">Total</span>
                    <span className="text-[15px] font-bold" style={{ color: "#7B44F2" }}>S${amt.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("input")}
                className="text-nets-muted text-[12px] text-center w-full py-1"
              >
                ← Edit details
              </button>
            </motion.div>
          )}

          {/* ── Processing ── */}
          {step === "processing" && (
            <motion.div
              key="processing"
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(123,68,242,0.12), rgba(59,130,246,0.12))" }}
              >
                <div
                  className="w-10 h-10 rounded-full animate-spin"
                  style={{ border: "3px solid rgba(123,68,242,0.2)", borderTopColor: "#7B44F2" }}
                />
              </div>
              <div className="text-center">
                <p className="text-[16px] font-bold text-nets-text">Processing payment…</p>
                <p className="text-[12px] text-nets-muted mt-1">Connecting to PayNow network</p>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "#7B44F2" }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.35, 1, 0.35] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-[42px] mb-5"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 360, damping: 16 }}
              >
                ✅
              </motion.div>
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[20px] font-bold text-nets-text">Sent!</p>
                <p className="text-[30px] font-bold text-green-600 mt-1">S${amt.toFixed(2)}</p>
                <p className="text-[13px] text-nets-muted mt-1">to {recipientName}</p>
                {note.trim() && (
                  <p className="text-[12px] text-nets-muted mt-1 italic">"{note}"</p>
                )}
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <p className="text-[11px] text-nets-muted">via PayNow · instant</p>
                </div>
              </motion.div>
              <motion.button
                onClick={handleReset}
                className="mt-8 px-8 py-3 rounded-xl text-[14px] font-semibold text-white active:opacity-80"
                style={{ background: "linear-gradient(135deg, #7B44F2, #3B82F6)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Send another
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Bottom CTA ── */}
      <AnimatePresence>
        {(step === "input" && mode === "phone") && (
          <motion.div
            key="cta-input"
            className="absolute bottom-[72px] left-0 right-0 px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <button
              onClick={() => setStep("review")}
              disabled={!canReview}
              className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-35 active:opacity-80 transition-opacity"
              style={{ background: "linear-gradient(135deg, #7B44F2, #3B82F6)" }}
            >
              Review transfer →
            </button>
          </motion.div>
        )}
        {step === "review" && (
          <motion.div
            key="cta-review"
            className="absolute bottom-[72px] left-0 right-0 px-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <button
              onClick={() => setShowAuth(true)}
              disabled={!canPay}
              className="w-full rounded-2xl py-3.5 text-[15px] font-semibold text-white disabled:opacity-35 active:opacity-80 transition-opacity"
              style={{ background: "linear-gradient(135deg, #7B44F2, #3B82F6)" }}
            >
              Pay S${amt > 0 ? amt.toFixed(2) : "0.00"} via PayNow
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction auth gate */}
      <AnimatePresence>
        {showAuth && (
          <TransactionAuthModal
            amount={amt}
            label={`to ${recipientName}`}
            onSuccess={() => { setShowAuth(false); handlePay(); }}
            onCancel={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
