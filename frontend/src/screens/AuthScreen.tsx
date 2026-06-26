import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OtpInput from "react-otp-input";
import { useUser, USER_PROFILES } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import type { UserId } from "../context/UserContext";

type AuthStep = "splash" | "select" | "pin" | "otp" | "biometric" | "success";

const AUTH_PROFILES = [
  { id: "u1" as UserId, name: "Alex T.", role: "The Hawker Loyalist", initials: "AT", color: "#1B3464", phone: "+65 ****1234", lastSeen: "Just now" },
  { id: "u2" as UserId, name: "Jordan L.", role: "The Bubble Tea Devotee", initials: "JL", color: "#2B5CBF", phone: "+65 ****5678", lastSeen: "Yesterday" },
  { id: "u3" as UserId, name: "Sam K.", role: "The JB Weekend Runner", initials: "SK", color: "#16a34a", phone: "+65 ****9012", lastSeen: "2 days ago" },
];

const NUMPAD = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

// ── PIN dots indicator ─────────────────────────────────────────────────────────

function PinDots({ value, total = 6 }: { value: string; total?: number }) {
  return (
    <div className="flex items-center justify-center gap-4 my-5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-3.5 h-3.5 rounded-full border-2 transition-colors duration-150 ${
            i < value.length ? "bg-white border-white" : "bg-transparent border-white/35"
          }`}
          animate={i === value.length - 1 && value.length > 0 ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ duration: 0.15 }}
        />
      ))}
    </div>
  );
}

// ── Number pad ─────────────────────────────────────────────────────────────────

function Numpad({ onPress, disabled }: { onPress: (k: string) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-3 px-6">
      {NUMPAD.flat().map((key, i) => (
        <motion.button
          key={i}
          onClick={() => !disabled && key && onPress(key)}
          whileTap={key && !disabled ? { scale: 0.88 } : {}}
          className={`h-[56px] rounded-2xl flex items-center justify-center text-[22px] font-semibold transition-colors ${
            !key ? "pointer-events-none opacity-0" : "text-white bg-white/10 active:bg-white/20"
          }`}
        >
          {key === "⌫" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          ) : key}
        </motion.button>
      ))}
    </div>
  );
}

// ── Fingerprint SVG ────────────────────────────────────────────────────────────

function FingerprintIcon({ color = "rgba(255,255,255,0.7)", size = 52 }: { color?: string; size?: number }) {
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

// ── Main AuthScreen ────────────────────────────────────────────────────────────

export function AuthScreen() {
  const { setUserId } = useUser();
  const { login } = useAuth();

  const [step, setStep] = useState<AuthStep>("splash");
  const [selected, setSelected] = useState<UserId | null>(null);
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [bioScanning, setBioScanning] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [wrongPin, setWrongPin] = useState(false);

  // One random OTP per session
  const demoOTP = useRef(String(Math.floor(100000 + Math.random() * 900000)));

  const profile = AUTH_PROFILES.find((p) => p.id === selected);

  // Splash auto-advance
  useEffect(() => {
    if (step !== "splash") return;
    const t = setTimeout(() => setStep("select"), 1900);
    return () => clearTimeout(t);
  }, [step]);

  // PIN: auto-advance when 6 digits entered (any PIN works)
  useEffect(() => {
    if (pin.length !== 6) return;
    const t = setTimeout(() => {
      setPin("");
      setStep("otp");
    }, 350);
    return () => clearTimeout(t);
  }, [pin]);

  // OTP: auto-advance on correct code
  useEffect(() => {
    if (otp.length !== 6 || otp !== demoOTP.current) return;
    const t = setTimeout(() => setStep("biometric"), 450);
    return () => clearTimeout(t);
  }, [otp]);

  // Success: call login() after animation settles
  useEffect(() => {
    if (step !== "success") return;
    const t = setTimeout(login, 1500);
    return () => clearTimeout(t);
  }, [step, login]);

  const handlePinKey = (key: string) => {
    setWrongPin(false);
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
    } else if (pin.length < 6) {
      setPin((p) => p + key);
    }
  };

  // Try WebAuthn; fall back to animated simulation if unavailable / cancelled
  const handleBiometric = async () => {
    if (bioScanning) return;
    setBioScanning(true);

    let authenticated = false;
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: { challenge, timeout: 30000, userVerification: "required" },
        });
        authenticated = true;
      }
    } catch {
      // Not available or user cancelled — fall through to simulation
    }

    if (!authenticated) {
      // Simulate 1.2 s scan animation
      await new Promise((r) => setTimeout(r, 1200));
    }

    setBioSuccess(true);
    setTimeout(() => {
      if (selected) setUserId(selected);
      setStep("success");
    }, 700);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence mode="wait">

        {/* ── Splash ─────────────────────────────────────────────────────── */}
        {step === "splash" && (
          <motion.div
            key="splash"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(160deg, #050d1f 0%, #0d1e40 55%, #1B3464 100%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <div className="w-20 h-20 rounded-[22px] flex items-center justify-center border border-white/20"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                <span className="text-white text-[22px] font-black tracking-tight">NETS</span>
              </div>
              <div className="text-center">
                <p className="text-white text-[28px] font-black tracking-tight">NETS Pay</p>
                <p className="text-white/40 text-[13px] mt-1 tracking-widest uppercase text-[10px]">
                  Secure · Fast · Seamless
                </p>
              </div>
            </motion.div>

            {/* Loading bar */}
            <div className="absolute bottom-12 left-12 right-12 h-px bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white/50 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {/* ── Profile Select ─────────────────────────────────────────────── */}
        {step === "select" && (
          <motion.div
            key="select"
            className="absolute inset-0 flex flex-col"
            style={{ background: "linear-gradient(170deg, #050d1f 0%, #0d1e40 100%)" }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
          >
            <div className="px-6 pt-10 pb-5">
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">Welcome to</p>
              <p className="text-white text-[26px] font-black">NETS Pay</p>
              <p className="text-white/40 text-[13px] mt-1">Who's signing in today?</p>
            </div>

            <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-6">
              {AUTH_PROFILES.map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 + 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSelected(p.id); setStep("pin"); }}
                  className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors border border-white/10"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-[14px] font-bold shrink-0"
                    style={{ background: p.color }}>
                    {p.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[15px] font-semibold">{p.name}</p>
                    <p className="text-white/40 text-[12px]">{USER_PROFILES[p.id].persona}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white/25 text-[10px]">Last active</p>
                    <p className="text-white/55 text-[11px] font-medium">{p.lastSeen}</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </motion.button>
              ))}
            </div>

            {/* Production note */}
            <div className="px-6 pb-6 pt-2 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
              <p className="text-white/20 text-[10px]">
                Powered by NETS Security Shield™
              </p>
            </div>
          </motion.div>
        )}

        {/* ── PIN Entry ──────────────────────────────────────────────────── */}
        {step === "pin" && (
          <motion.div
            key="pin"
            className="absolute inset-0 flex flex-col"
            style={{ background: "linear-gradient(170deg, #050d1f 0%, #0d1e40 100%)" }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <div className="flex items-center px-5 pt-7 pb-2">
              <button onClick={() => { setPin(""); setStep("select"); }} className="text-white/40 text-[13px] active:opacity-70 flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                Back
              </button>
            </div>

            <div className="flex flex-col items-center px-6 pt-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[16px] font-bold mb-3"
                style={{ background: profile?.color }}>
                {profile?.initials}
              </div>
              <p className="text-white text-[17px] font-bold">{profile?.name}</p>
              <p className="text-white/40 text-[12px] mt-0.5">Enter your 6-digit PIN</p>

              <PinDots value={pin} />

              <AnimatePresence>
                {wrongPin && (
                  <motion.p
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-red-400 text-[12px] mb-3"
                  >
                    Incorrect PIN. Try again.
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 mb-2">
                <span className="text-yellow-400/70 text-[13px]">💡</span>
                <span className="text-white/35 text-[11px]">Demo: any 6 digits</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end pb-7">
              <Numpad onPress={handlePinKey} />
            </div>
          </motion.div>
        )}

        {/* ── OTP Verification ───────────────────────────────────────────── */}
        {step === "otp" && (
          <motion.div
            key="otp"
            className="absolute inset-0 flex flex-col bg-[#f4f5f7]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            {/* SMS notification banner sliding in */}
            <motion.div
              className="mx-4 mt-5 mb-1 rounded-2xl bg-gray-900 p-3.5 flex items-start gap-3 shadow-2xl"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 240, delay: 0.25 }}
            >
              <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[11px] font-black">MSG</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white text-[13px] font-semibold">NETS-Verify</p>
                  <p className="text-white/40 text-[10px]">now</p>
                </div>
                <p className="text-white/65 text-[12px] leading-snug">
                  Your NETS OTP is{" "}
                  <span className="text-green-400 font-bold tracking-widest">{demoOTP.current}</span>.
                  {" "}Valid 5 min. Never share this code.
                </p>
              </div>
            </motion.div>

            <div className="flex-1 bg-white rounded-t-[24px] mt-3 px-6 pt-5 pb-6 flex flex-col">
              <button
                onClick={() => { setOtp(""); setStep("pin"); }}
                className="text-nets-muted text-[13px] mb-5 flex items-center gap-1.5 active:opacity-70 self-start"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
                Back
              </button>

              <p className="text-[22px] font-bold text-nets-text">OTP Verification</p>
              <p className="text-[13px] text-nets-muted mt-1 mb-6">
                6-digit code sent to{" "}
                <span className="font-semibold text-nets-text">{profile?.phone}</span>
              </p>

              {/* react-otp-input  */}
              <div className="flex justify-center mb-4">
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  inputType="tel"
                  shouldAutoFocus
                  renderInput={(props) => (
                    <input
                      {...props}
                      className="!w-11 h-14 mx-1 text-center text-[20px] font-bold rounded-xl border-2 border-nets-border focus:outline-none focus:border-nets-navy transition-colors"
                      style={{
                        borderColor: props.value ? "#1B3464" : undefined,
                        background: props.value ? "#eff6ff" : "white",
                        color: "#1A1A2E",
                      }}
                    />
                  )}
                />
              </div>

              <AnimatePresence>
                {otp.length === 6 && otp !== demoOTP.current && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-red-500 text-[12px] text-center mb-3"
                  >
                    Incorrect code — check the SMS banner above
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mt-auto pt-4">
                <p className="text-[12px] text-nets-muted">Didn't receive it?</p>
                <button className="text-[12px] font-semibold text-nets-navy active:opacity-70">
                  Resend OTP
                </button>
              </div>

              {/* Third-party note */}
              <div className="mt-5 bg-blue-50 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-blue-100">
                <span className="text-[13px]">🔐</span>
                <p className="text-[10px] text-nets-muted leading-snug">
                  <span className="font-semibold text-nets-blue">Production:</span>{" "}
                  Twilio Verify (SMS OTP) · WebAuthn (biometric) · Supabase Auth (sessions) — all free-tier available
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Biometric ──────────────────────────────────────────────────── */}
        {step === "biometric" && (
          <motion.div
            key="bio"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(170deg, #050d1f 0%, #0d1e40 100%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
          >
            <motion.p
              className="text-white text-[20px] font-bold mb-1"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Biometric Login
            </motion.p>
            <motion.p
              className="text-white/40 text-[13px] mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Confirm your identity to continue
            </motion.p>

            {/* Fingerprint button */}
            <motion.button
              onClick={handleBiometric}
              disabled={bioScanning}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.25 }}
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: bioSuccess
                  ? "radial-gradient(circle, #16a34a 0%, #15803d 100%)"
                  : "radial-gradient(circle, rgba(43,92,191,0.25) 0%, rgba(27,52,100,0.4) 100%)",
                border: `2px solid ${bioSuccess ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.15)"}`,
                boxShadow: bioScanning
                  ? "0 0 50px 14px rgba(43,92,191,0.35)"
                  : bioSuccess
                    ? "0 0 50px 14px rgba(74,222,128,0.3)"
                    : "none",
                transition: "background 0.4s, box-shadow 0.4s, border-color 0.4s",
              }}
            >
              {bioSuccess ? (
                <motion.span className="text-[44px]"
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                  ✓
                </motion.span>
              ) : (
                <motion.div
                  animate={bioScanning ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <FingerprintIcon
                    color={bioScanning ? "#93c5fd" : "rgba(255,255,255,0.6)"}
                    size={56}
                  />
                </motion.div>
              )}

              {/* Pulse ring while scanning */}
              {bioScanning && !bioSuccess && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                  animate={{ scale: [1, 1.5, 1.8], opacity: [0.7, 0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.3 }}
                />
              )}
            </motion.button>

            <motion.p
              className="text-[14px] font-semibold mt-7"
              style={{ color: bioSuccess ? "#4ade80" : "rgba(255,255,255,0.5)" }}
              animate={bioScanning && !bioSuccess ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
            >
              {bioSuccess ? "Identity verified ✓" : bioScanning ? "Scanning…" : "Touch to authenticate"}
            </motion.p>

            {!bioScanning && !bioSuccess && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-2 mt-6"
              >
                <button onClick={() => setStep("pin")} className="text-white/25 text-[12px] active:opacity-70">
                  Use PIN instead
                </button>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                  <p className="text-white/20 text-[10px]">Uses browser WebAuthn when available</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── Success ────────────────────────────────────────────────────── */}
        {step === "success" && (
          <motion.div
            key="success"
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: "linear-gradient(170deg, #050d1f 0%, #0d1e40 100%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-400/40 flex items-center justify-center text-[42px] mb-5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 340, damping: 18, delay: 0.05 }}
            >
              ✅
            </motion.div>
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
            >
              <p className="text-white text-[22px] font-bold">Welcome back!</p>
              <p className="text-white/50 text-[14px] mt-1">{profile?.name}</p>
              <div className="flex items-center justify-center gap-1.5 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-green-400/70 text-[12px]">Authenticated successfully</p>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
