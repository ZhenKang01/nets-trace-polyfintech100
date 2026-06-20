import { useRef } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import type { WrappedData } from "../../WrappedScreen";

interface Props {
  data: WrappedData;
  onClose: () => void;
}

function ShareCard({ data }: { data: WrappedData }) {
  const { personality, total_spend, top_merchant, top_merchant_visits, longest_streak_days, total_transactions } = data;
  return (
    <div
      id="nets-share-card"
      style={{
        width: 390,
        height: 693,
        background: personality.color,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 32px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* BG decoration */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
      <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

      {/* Logo */}
      <div style={{ position: "absolute", top: 28, left: 28, fontSize: 22, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>
        NETS
      </div>
      <div style={{ position: "absolute", top: 28, right: 28, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Wrapped 2026
      </div>

      {/* Emoji */}
      <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>{personality.emoji}</div>

      {/* Persona */}
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
        I'm
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: "white", textAlign: "center", lineHeight: 1.15, marginBottom: 6 }}>
        {personality.name}
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 32, lineHeight: 1.4 }}>
        {personality.tagline}
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", marginBottom: 32 }}>
        {[
          { label: "Total Spent", value: `S$${total_spend.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          { label: "Transactions", value: total_transactions.toString() },
          { label: `Visited ${top_merchant.split(" ").slice(0, 2).join(" ")}`, value: `${top_merchant_visits}x` },
          { label: "Day Streak", value: `${longest_streak_days}d 🔥` },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "white" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
        nets.com.sg · Jan–Jun 2026
      </div>
    </div>
  );
}

export function Card7Share({ data, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { personality } = data;

  const handleShare = async () => {
    const el = document.getElementById("nets-share-card");
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
      const link = document.createElement("a");
      link.download = "nets-wrapped-2026.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("html2canvas error", e);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #111 0%, #1a1a1a 100%)" }}
    >
      {/* Off-screen render target */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <ShareCard data={data} />
      </div>

      {/* Visible preview */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        ref={cardRef}
        className="mt-14 mx-4 rounded-[20px] overflow-hidden shadow-2xl"
        style={{ boxShadow: `0 0 60px ${personality.color}60` }}
      >
        <div style={{ transform: "scale(0.9)", transformOrigin: "top center" }}>
          <ShareCard data={data} />
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="absolute bottom-10 left-4 right-4 space-y-3"
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="w-full h-[52px] rounded-[10px] font-semibold text-[16px] flex items-center justify-center gap-2"
          style={{ background: personality.color, color: "white" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Save as Image
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-full h-[44px] rounded-[10px] font-medium text-[14px] text-white/50 flex items-center justify-center"
        >
          Back to NETS
        </button>
      </motion.div>
    </div>
  );
}
