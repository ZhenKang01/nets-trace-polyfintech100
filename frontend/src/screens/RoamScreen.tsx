import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NetsHeader } from "../components/NetsHeader";
import { NetsCard } from "../components/NetsCard";
import { NetsButton } from "../components/NetsButton";
import { useTrip } from "../context/TripContext";
import type { ActiveTrip, TripTxn } from "../context/TripContext";

// ── Mock QR (visual only) ────────────────────────────────────────────────────

function MockQRCode({ size = 168 }: { size?: number }) {
  const u = size / 21;
  const bits: [number, number][] = [
    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[0,1],[6,1],[0,2],[2,2],[3,2],[4,2],[6,2],
    [0,3],[2,3],[4,3],[6,3],[0,4],[2,4],[3,4],[4,4],[6,4],[0,5],[6,5],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
    [14,0],[15,0],[16,0],[17,0],[18,0],[19,0],[20,0],[14,1],[20,1],[14,2],[16,2],[17,2],[18,2],[20,2],
    [14,3],[16,3],[18,3],[20,3],[14,4],[16,4],[17,4],[18,4],[20,4],[14,5],[20,5],[14,6],[15,6],[16,6],[17,6],[18,6],[19,6],[20,6],
    [0,14],[1,14],[2,14],[3,14],[4,14],[5,14],[6,14],[0,15],[6,15],[0,16],[2,16],[3,16],[4,16],[6,16],
    [0,17],[2,17],[4,17],[6,17],[0,18],[2,18],[3,18],[4,18],[6,18],[0,19],[6,19],[0,20],[1,20],[2,20],[3,20],[4,20],[5,20],[6,20],
    [8,6],[10,6],[12,6],[6,8],[6,10],[6,12],[14,8],[14,10],[14,12],
    [8,8],[9,8],[11,8],[13,8],[15,8],[16,8],[18,8],[20,8],[8,9],[10,9],[12,9],[15,9],[17,9],[19,9],
    [8,10],[9,10],[11,10],[13,10],[16,10],[18,10],[20,10],[8,11],[10,11],[12,11],[14,11],[15,11],[17,11],[19,11],[20,11],
    [8,12],[9,12],[13,12],[16,12],[18,12],[8,13],[11,13],[12,13],[15,13],[17,13],[19,13],[20,13],
    [9,14],[10,14],[12,14],[13,14],[16,14],[18,14],[20,14],[8,15],[11,15],[13,15],[15,15],[17,15],[19,15],
    [9,16],[10,16],[12,16],[14,16],[16,16],[18,16],[20,16],[8,17],[11,17],[13,17],[15,17],[17,17],[19,17],[20,17],
    [8,18],[9,18],[12,18],[14,18],[16,18],[18,18],[8,19],[10,19],[11,19],[13,19],[15,19],[17,19],[20,19],
    [9,20],[12,20],[14,20],[16,20],[18,20],[20,20],
  ];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="8" />
      {bits.map(([x, y], i) => (
        <rect key={i} x={x * u + 1} y={y * u + 1} width={u - 1} height={u - 1} rx="1" fill="#1B3464" />
      ))}
    </svg>
  );
}

// ── QR Modal ─────────────────────────────────────────────────────────────────

function QRModal({ trip, onClose }: { trip: ActiveTrip; onClose: () => void }) {
  const [mode, setMode] = useState<"show" | "scan">("show");
  const [seconds, setSeconds] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const lastTxn = trip.recent_txns[0];

  const handleSimulateScan = () => {
    onClose();
  };

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col"
      style={{ background: mode === "show" ? "linear-gradient(160deg, #050d1f 0%, #1B3464 60%, #0a2240 100%)" : "#000000" }}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
    >
      <button className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center" onClick={onClose}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Toggle */}
      <div className="absolute top-5 left-0 right-0 flex justify-center z-20">
        <div className="bg-white/20 p-1 rounded-full flex gap-1 backdrop-blur-md">
          <button
            onClick={() => setMode("show")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              mode === "show" ? "bg-white text-[#1B3464] shadow-sm" : "text-white"
            }`}
          >
            Show QR
          </button>
          <button
            onClick={() => setMode("scan")}
            className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
              mode === "scan" ? "bg-white text-[#1B3464] shadow-sm" : "text-white"
            }`}
          >
            Scan QR
          </button>
        </div>
      </div>

      {mode === "show" ? (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10">
            <div className="flex gap-2 mb-5">
              {trip.networks.map((n) => (
                <div key={n} className="bg-white/10 border border-white/20 rounded-full px-3 py-1">
                  <span className="text-white text-[12px] font-semibold">{n}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-2xl flex flex-col items-center gap-3">
              <MockQRCode size={168} />
              <div className="w-full border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Amount</p>
                  <p className="text-[17px] font-bold text-[#1B3464]">
                    {lastTxn ? `${trip.symbol} ${lastTxn.local_amount.toFixed(2)}` : `${trip.symbol} —`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-400 font-medium">≈ SGD</p>
                  <p className="text-[17px] font-bold text-[#1B3464]">
                    {lastTxn ? `S$${lastTxn.amount.toFixed(2)}` : "S$ —"}
                  </p>
                </div>
              </div>
              <div className="w-full flex items-center justify-center gap-1.5 pt-1 border-t border-gray-100">
                <span className="text-[10px] text-gray-400">Powered by</span>
                <span className="text-[13px] font-black text-[#E31837] tracking-tight">NETS</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/70 text-[13px]">
                QR expires in <span className="text-white font-semibold tabular-nums">{mm}:{ss}</span>
              </span>
            </div>
          </div>
          <div className="pb-10 px-6 text-center">
            <p className="text-white/50 text-[12px] leading-snug">
              Show this QR at the merchant's terminal.{"\n"}
              Deducted directly from your linked bank — no top-up, no leftover balance.
            </p>
          </div>
        </>
      ) : (
        <div className="flex-1 relative flex flex-col items-center justify-center">
          {/* Mock Camera Background Overlay */}
          <div className="absolute inset-0 bg-[#0f1115] flex flex-col">
            <div className="flex-1 bg-black/40 backdrop-blur-[2px]" />
            <div className="flex justify-center">
              <div className="w-12 bg-black/40 backdrop-blur-[2px]" />
              {/* Cutout area */}
              <div className="w-[260px] h-[260px] border border-white/20 relative overflow-hidden flex-shrink-0 bg-transparent">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                
                {/* Scanning line animation */}
                <motion.div
                  className="w-full h-[2px] bg-green-400 shadow-[0_0_12px_#4ade80]"
                  animate={{ y: [0, 256, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="w-12 bg-black/40 backdrop-blur-[2px]" />
            </div>
            <div className="flex-1 bg-black/40 backdrop-blur-[2px]" />
          </div>
          
          {/* Content layered over camera view */}
          <div className="absolute top-32 text-center w-full px-6 z-10">
             <p className="text-white font-bold text-[17px] mb-1">Scan Merchant QR</p>
             <p className="text-white/70 text-[13px]">Align the QR code within the frame</p>
          </div>

          <div className="absolute bottom-[72px] w-full px-8 z-10">
            <NetsButton onClick={handleSimulateScan}>
               Simulate Scan
            </NetsButton>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TxnRow({ t, flag, isLast }: { t: TripTxn; flag: string; isLast: boolean }) {
  return (
    <div className={`flex items-center px-4 py-3 ${!isLast ? "border-b border-nets-border" : ""}`}>
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-sm mr-3 shrink-0">
        {flag}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-nets-text truncate">{t.merchant}</p>
        <p className="text-[11px] text-nets-muted">{t.date} · {t.time}</p>
      </div>
      <div className="text-right ml-2 shrink-0">
        <p className="text-[13px] font-semibold text-nets-text">
          {t.local_symbol}{t.local_amount.toFixed(2)}
        </p>
        <p className="text-[11px] text-nets-muted">S${t.amount.toFixed(2)}</p>
      </div>
    </div>
  );
}

// ── Traveling state ───────────────────────────────────────────────────────────

function TravelingState({ trip }: { trip: ActiveTrip }) {
  const [qrOpen, setQrOpen] = useState(false);
  const { endTrip } = useTrip();
  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    setEnding(true);
    await endTrip();
    setEnding(false);
  };

  const differentiators: Record<string, string> = {
    PromptPay: "Pay at any PromptPay QR merchant — straight from your bank. No prepaid baht, no leftover balance.",
    DuitNow: "Pay at any DuitNow QR merchant — deducted straight from your bank. No ringgit to carry.",
    QRIS: "Pay at any QRIS merchant — straight from your bank. No cash exchange, no prepaid card.",
  };
  const diff = differentiators[trip.networks[0]] ?? "Pay directly from your bank — no foreign currency needed.";

  return (
    <div className="flex-1 screen-scroll px-4 pt-4 pb-[72px] space-y-3">
      {/* Roam active banner */}
      <div
        className="rounded-nets p-4 flex items-center gap-3"
        style={{ background: "linear-gradient(135deg, #1B3464 0%, #2B5CBF 100%)" }}
      >
        <div className="text-3xl leading-none">{trip.flag}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-green-300 uppercase tracking-wider">Roam Active</span>
          </div>
          <p className="text-[16px] font-bold text-white">{trip.destination}, {trip.country}</p>
          <p className="text-[12px] text-white/70 mt-0.5">
            {trip.txn_count} transaction{trip.txn_count !== 1 ? "s" : ""} · S${trip.total_sgd.toFixed(2)} spent
          </p>
        </div>
      </div>

      {/* FX rate */}
      <NetsCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-nets-muted font-medium uppercase tracking-wider">Live Rate</p>
            <p className="text-[20px] font-bold text-nets-text mt-0.5">
              1 SGD = {trip.fx_rate.toFixed(2)} {trip.currency}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-50 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[11px] font-semibold text-green-700">Live</span>
          </div>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {trip.networks.map((n) => (
            <span key={n} className="text-[11px] font-medium text-nets-navy bg-blue-50 rounded-full px-2.5 py-0.5">
              {n}
            </span>
          ))}
          <span className="text-[11px] text-nets-muted">accepted</span>
        </div>
      </NetsCard>

      {/* Pay CTA */}
      <NetsButton onClick={() => setQrOpen(true)}>
        <span className="flex items-center justify-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h1.5v1.5M17.5 14H19v1.5M14 17.5v1.5h1.5M17.5 17.5H19v1.5" />
          </svg>
          Pay with NETS QR
        </span>
      </NetsButton>

      {/* No top-up differentiator */}
      <div className="rounded-nets border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <div className="text-xl leading-none mt-0.5">✅</div>
          <div>
            <p className="text-[13px] font-semibold text-green-900">No top-up needed</p>
            <p className="text-[12px] text-green-800 mt-1 leading-snug">{diff}</p>
          </div>
        </div>
      </div>

      {/* This trip spend */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-nets-text">This trip</span>
          <span className="text-[13px] font-bold text-nets-navy">S${trip.total_sgd.toFixed(2)} total</span>
        </div>
        <NetsCard padding={false}>
          {trip.recent_txns.length === 0 && (
            <p className="text-[13px] text-nets-muted px-4 py-4">No transactions yet — first QR payment will appear here.</p>
          )}
          {trip.recent_txns.map((t, i) => (
            <TxnRow key={t.id} t={t} flag={trip.flag} isLast={i === trip.recent_txns.length - 1} />
          ))}
        </NetsCard>
      </div>

      {/* End trip */}
      <button
        onClick={handleEnd}
        disabled={ending}
        className="w-full py-3 rounded-nets border border-nets-border text-[13px] font-semibold text-nets-muted flex items-center justify-center gap-2 active:bg-nets-gray-bg disabled:opacity-50"
      >
        {ending
          ? <div className="w-4 h-4 border-2 border-nets-muted border-t-transparent rounded-full animate-spin" />
          : "🏁 End trip"}
      </button>

      <AnimatePresence>{qrOpen && <QRModal trip={trip} onClose={() => setQrOpen(false)} />}</AnimatePresence>
    </div>
  );
}

// ── Idle state ────────────────────────────────────────────────────────────────

function IdleState() {
  const { injectForeignTxn } = useTrip();
  const [injecting, setInjecting] = useState(false);

  const handleInject = async () => {
    setInjecting(true);
    await injectForeignTxn("Johor Bahru");
    setInjecting(false);
  };

  return (
    <div className="flex-1 screen-scroll px-4 pt-6 pb-[72px]">
      <div
        className="rounded-nets p-6 flex flex-col items-center text-center mb-4"
        style={{ background: "linear-gradient(135deg, #1B3464 0%, #2B5CBF 100%)" }}
      >
        <div className="text-5xl mb-3">🌏</div>
        <p className="text-[18px] font-bold text-white">You're in Singapore</p>
        <p className="text-[13px] text-white/70 mt-2 leading-snug max-w-[220px]">
          NETS Roam activates automatically when you tap abroad.
        </p>
      </div>

      <NetsCard>
        <p className="text-[13px] font-semibold text-nets-text mb-3">Where NETS Roam works</p>
        {[
          { flag: "🇲🇾", country: "Malaysia", networks: "DuitNow · MyDebit" },
          { flag: "🇹🇭", country: "Thailand", networks: "PromptPay" },
          { flag: "🇮🇩", country: "Indonesia", networks: "QRIS" },
        ].map((row, i, arr) => (
          <div key={row.country} className={`flex items-center gap-3 py-3 ${i < arr.length - 1 ? "border-b border-nets-border" : ""}`}>
            <span className="text-2xl">{row.flag}</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-nets-text">{row.country}</p>
              <p className="text-[11px] text-nets-muted">{row.networks}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" />
          </div>
        ))}
      </NetsCard>

      <div className="mt-3 rounded-nets border border-blue-100 bg-blue-50 p-4">
        <p className="text-[12px] text-nets-blue font-medium leading-snug">
          💳 Money comes straight from your linked bank account — no foreign currency to carry, no prepaid balance to manage.
        </p>
      </div>

      {/* Demo trigger */}
      <button
        onClick={handleInject}
        disabled={injecting}
        className="mt-4 w-full py-3 rounded-nets border border-dashed border-nets-border text-[12px] font-semibold text-nets-muted flex items-center justify-center gap-2 active:bg-nets-gray-bg disabled:opacity-50"
      >
        {injecting
          ? <div className="w-4 h-4 border-2 border-nets-muted border-t-transparent rounded-full animate-spin" />
          : "✈️ Demo: tap abroad in Johor Bahru"}
      </button>
    </div>
  );
}

// ── Root screen ───────────────────────────────────────────────────────────────

export function RoamScreen() {
  const { activeTrip, loading } = useTrip();

  return (
    <div className="flex flex-col h-full bg-nets-gray-bg relative overflow-hidden">
      <NetsHeader title="NETS Roam" showBack={false} />

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-nets-navy border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && (
        <motion.div
          key={activeTrip?.id ?? "idle"}
          className="flex flex-col flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {activeTrip ? <TravelingState trip={activeTrip} /> : <IdleState />}
        </motion.div>
      )}
    </div>
  );
}
