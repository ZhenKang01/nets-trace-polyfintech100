import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type AuthMode = "bio" | "pin";

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

function FingerprintIcon({ color = "rgba(255,255,255,0.65)", size = 48 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.1.9 2 2 2s2-.9 2-2a2 2 0 0 0-2-2z" />
      <path d="M12 2a10 10 0 0 1 0 20" />
      <path d="M12 6a6 6 0 0 1 0 12" />
      <path d="M12 2C6.48 2 2 6.48 2 12" />
      <path d="M8 12a4 4 0 0 1 4-4" />
    </svg>
  );
}

interface TransactionAuthModalProps {
  amount: number;
  label?: string;       // e.g. "to Wei Liang" or "Maxwell Food Centre"
  symbol?: string;      // currency symbol, defaults to "S$"
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionAuthModal({
  amount,
  label,
  symbol = "S$",
  onSuccess,
  onCancel,
}: TransactionAuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("bio");
  const [pin, setPin] = useState("");
  const [scanning, setScanning] = useState(false);
  const [bioOk, setBioOk] = useState(false);
  const [wrongPin, setWrongPin] = useState(false);

  // Auto-advance when 6 PIN digits entered (any code works for demo)
  useEffect(() => {
    if (pin.length !== 6) return;
    const t = setTimeout(() => {
      onSuccess();
    }, 280);
    return () => clearTimeout(t);
  }, [pin, onSuccess]);

  const handlePinKey = (key: string) => {
    setWrongPin(false);
    if (key === "⌫") setPin((p) => p.slice(0, -1));
    else if (pin.length < 6) setPin((p) => p + key);
  };

  const handleBio = async () => {
    if (scanning) return;
    setScanning(true);
    let ok = false;

    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: { challenge, timeout: 30000, userVerification: "required" },
        });
        ok = true;
      }
    } catch {
      // WebAuthn not available or cancelled — fall through to simulation
    }

    if (!ok) await new Promise((r) => setTimeout(r, 1100));

    setBioOk(true);
    setTimeout(onSuccess, 500);
  };

  const switchToPin = () => {
    setScanning(false);
    setBioOk(false);
    setPin("");
    setMode("pin");
  };

  return (
    // Backdrop
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        className="bg-white rounded-t-[28px] overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-nets-border rounded-full" />
        </div>

        {/* Transaction summary */}
        <div className="px-6 pt-3 pb-4 border-b border-nets-border">
          <p className="text-[12px] font-semibold text-nets-muted uppercase tracking-wider mb-1">Authorise payment</p>
          <p className="text-[28px] font-black text-nets-text">{symbol}{amount.toFixed(2)}</p>
          {label && <p className="text-[13px] text-nets-muted mt-0.5">{label}</p>}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[7px] font-black">DBS</span>
            </div>
            <p className="text-[11px] text-nets-muted">DBS eSavings ••••4892</p>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Biometric mode ── */}
          {mode === "bio" && (
            <motion.div
              key="bio"
              className="flex flex-col items-center px-6 pt-6 pb-7"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {/* Fingerprint button */}
              <motion.button
                onClick={handleBio}
                disabled={scanning}
                className="relative w-24 h-24 rounded-full flex items-center justify-center mb-3 transition-all"
                style={{
                  background: bioOk
                    ? "radial-gradient(circle, #16a34a, #15803d)"
                    : scanning
                      ? "radial-gradient(circle, #1e3a70, #1B3464)"
                      : "radial-gradient(circle, #f0f4ff, #dbe4ff)",
                  border: `2px solid ${bioOk ? "rgba(74,222,128,0.5)" : scanning ? "rgba(43,92,191,0.4)" : "#c7d2fe"}`,
                  boxShadow: scanning
                    ? "0 0 40px 10px rgba(43,92,191,0.2)"
                    : bioOk
                      ? "0 0 40px 10px rgba(74,222,128,0.2)"
                      : "none",
                }}
                whileTap={{ scale: 0.93 }}
              >
                {bioOk ? (
                  <motion.span
                    className="text-[42px]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 14 }}
                  >
                    ✓
                  </motion.span>
                ) : (
                  <motion.div
                    animate={scanning ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                    transition={{ repeat: Infinity, duration: 1.1 }}
                  >
                    <FingerprintIcon
                      color={scanning ? "#93c5fd" : "#1B3464"}
                      size={46}
                    />
                  </motion.div>
                )}

                {/* Pulse ring while scanning */}
                {scanning && !bioOk && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-blue-400/40"
                    animate={{ scale: [1, 1.45, 1.7], opacity: [0.7, 0.3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  />
                )}
              </motion.button>

              <motion.p
                className="text-[14px] font-semibold mb-1"
                style={{ color: bioOk ? "#16a34a" : scanning ? "#1B3464" : "#1A1A2E" }}
                animate={scanning && !bioOk ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
                transition={{ repeat: Infinity, duration: 1.1 }}
              >
                {bioOk ? "Authenticated ✓" : scanning ? "Scanning…" : "Touch to authorise"}
              </motion.p>

              <p className="text-[11px] text-nets-muted mb-5">
                {scanning ? "Verifying your identity" : "Use fingerprint or Face ID"}
              </p>

              {!scanning && !bioOk && (
                <button
                  onClick={switchToPin}
                  className="text-nets-navy text-[13px] font-semibold active:opacity-70"
                >
                  Use PIN instead
                </button>
              )}

              <button onClick={onCancel} className="text-nets-muted text-[12px] mt-3 active:opacity-70">
                Cancel
              </button>
            </motion.div>
          )}

          {/* ── PIN mode ── */}
          {mode === "pin" && (
            <motion.div
              key="pin"
              className="flex flex-col items-center px-6 pt-5 pb-6"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
            >
              <p className="text-[15px] font-bold text-nets-text mb-0.5">Enter your PIN</p>
              <p className="text-[11px] text-nets-muted mb-4">6-digit PIN to confirm payment</p>

              {/* PIN dots */}
              <div className="flex items-center gap-3 mb-1">
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 transition-colors ${
                      i < pin.length ? "bg-nets-navy border-nets-navy" : "bg-transparent border-nets-border"
                    }`}
                    animate={i === pin.length - 1 && pin.length > 0 ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.12 }}
                  />
                ))}
              </div>

              <AnimatePresence>
                {wrongPin && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-red-500 text-[11px] mb-1"
                  >
                    Incorrect PIN
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-1.5 mb-4">
                <span className="text-yellow-500/70 text-[11px]">💡</span>
                <span className="text-nets-muted text-[11px]">Demo: any 6 digits</span>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mb-4">
                {NUMPAD.flat().map((key, i) => (
                  <motion.button
                    key={i}
                    onClick={() => key && handlePinKey(key)}
                    whileTap={key ? { scale: 0.88 } : {}}
                    className={`h-12 rounded-xl flex items-center justify-center text-[18px] font-semibold transition-colors ${
                      !key
                        ? "pointer-events-none opacity-0"
                        : "bg-nets-gray-bg text-nets-text active:bg-nets-border"
                    }`}
                  >
                    {key === "⌫" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                        <line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" />
                      </svg>
                    ) : key}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-4">
                <button onClick={() => setMode("bio")} className="text-nets-navy text-[12px] font-semibold active:opacity-70">
                  Use biometric
                </button>
                <span className="text-nets-border">·</span>
                <button onClick={onCancel} className="text-nets-muted text-[12px] active:opacity-70">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
