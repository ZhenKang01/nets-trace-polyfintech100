import { motion } from "framer-motion";
import type { WrappedData } from "../../WrappedScreen";

export function Card6WittyLine({ data }: { data: WrappedData }) {
  const { personality } = data;
  const words = personality.witty_line.split(" ");

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#0a0a0a" }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${personality.color}80 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 text-center px-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-[60px] mb-8"
        >
          {personality.emoji}
        </motion.div>

        <div className="text-[24px] font-bold text-white leading-relaxed">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }}
              className="inline-block mr-1.5"
            >
              {word}
            </motion.span>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + words.length * 0.08 + 0.5 }}
          className="mt-10"
          style={{ color: personality.color }}
        >
          <p className="text-[13px] font-semibold uppercase tracking-widest">— NETS Wrapped 2026</p>
        </motion.div>
      </div>
    </div>
  );
}
