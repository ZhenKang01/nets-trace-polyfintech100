import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { WrappedData } from "../../WrappedScreen";

export function Card1TotalSpend({ data }: { data: WrappedData }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1800;
    const target = data.total_spend;
    const tick = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [data.total_spend]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
      {/* Particle dots */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/20"
          style={{ width: Math.random() * 6 + 2, height: Math.random() * 6 + 2, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.1, 0.6, 0.1], scale: [1, 1.5, 1] }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="text-center px-8"
      >
        <p className="text-white/60 text-[14px] font-medium uppercase tracking-widest mb-4">
          In 2026, you spent
        </p>
        <motion.p
          className="text-white font-black leading-none mb-2"
          style={{ fontSize: "clamp(48px, 13vw, 68px)" }}
        >
          S$
          {displayed.toLocaleString("en-SG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </motion.p>
        <p className="text-white/50 text-[15px] mt-4">via NETS · Jan–Jun 2026</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 0.4 }}
          className="mt-8 inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2"
        >
          <p className="text-white/80 text-[13px]">
            That's {data.total_transactions} taps on NETS 💳
          </p>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-12 text-white/30 text-[11px] tracking-widest uppercase">
        Tap to continue →
      </div>
    </div>
  );
}
