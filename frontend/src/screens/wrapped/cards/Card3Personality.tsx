import { motion } from "framer-motion";
import type { WrappedData } from "../../WrappedScreen";

export function Card3Personality({ data }: { data: WrappedData }) {
  const { personality } = data;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: personality.color }}
    >
      {/* Animated rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/10"
          style={{ width: i * 200, height: i * 200 }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}

      <div className="text-center px-8 relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="text-[90px] mb-6"
        >
          {personality.emoji}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/70 text-[13px] uppercase tracking-widest mb-3"
        >
          Your spend personality
        </motion.p>

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="text-white font-black leading-tight mb-4"
          style={{ fontSize: "clamp(28px, 8vw, 40px)" }}
        >
          {personality.name}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="text-white/75 text-[15px] leading-relaxed"
        >
          {personality.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="mt-8 grid grid-cols-3 gap-3"
        >
          <div className="bg-white/15 rounded-[10px] p-3">
            <p className="text-white text-[18px] font-bold">{data.top_merchant_visits}x</p>
            <p className="text-white/60 text-[10px] leading-tight mt-0.5">visits to your fave spot</p>
          </div>
          <div className="bg-white/15 rounded-[10px] p-3">
            <p className="text-white text-[18px] font-bold">{data.total_transactions}</p>
            <p className="text-white/60 text-[10px] leading-tight mt-0.5">total taps</p>
          </div>
          <div className="bg-white/15 rounded-[10px] p-3">
            <p className="text-white text-[18px] font-bold">{data.longest_streak_days}d</p>
            <p className="text-white/60 text-[10px] leading-tight mt-0.5">longest streak</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
