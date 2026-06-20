import { motion } from "framer-motion";
import type { WrappedData } from "../../WrappedScreen";

export function Card5Streak({ data }: { data: WrappedData }) {
  const { longest_streak_days, streak_category } = data;

  const blocks = Math.min(longest_streak_days, 42);
  const cols = 7;
  const rows = Math.ceil(blocks / cols);

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #064e3b 0%, #065f46 50%, #10b981 100%)" }}
    >
      <div className="relative z-10 text-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="text-[70px] mb-4"
        >
          🔥
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-white/70 text-[13px] uppercase tracking-widest mb-2"
        >
          Your longest streak
        </motion.p>

        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-white font-black leading-none mb-1"
          style={{ fontSize: "clamp(60px, 16vw, 80px)" }}
        >
          {longest_streak_days}
        </motion.p>
        <p className="text-white/70 text-[18px] font-semibold">consecutive days</p>
        <p className="text-white/50 text-[13px] mt-2">
          tapping NETS for {streak_category}
        </p>

        {/* Grid visualization */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-8 flex flex-col items-center gap-1"
        >
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="flex gap-1">
              {Array.from({ length: cols }).map((_, col) => {
                const idx = row * cols + col;
                return (
                  <motion.div
                    key={col}
                    className={`w-7 h-7 rounded-[5px] ${idx < blocks ? "bg-emerald-300" : "bg-white/10"}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.1 + idx * 0.02, type: "spring", stiffness: 300 }}
                  />
                );
              })}
            </div>
          ))}
          {longest_streak_days > 42 && (
            <p className="text-white/40 text-[11px] mt-2">+{longest_streak_days - 42} more days shown</p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
