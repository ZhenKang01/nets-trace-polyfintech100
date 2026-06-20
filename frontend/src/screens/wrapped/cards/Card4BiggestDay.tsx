import { motion } from "framer-motion";
import type { WrappedData } from "../../WrappedScreen";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-SG", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function Card4BiggestDay({ data }: { data: WrappedData }) {
  const { biggest_day } = data;

  return (
    <div
      className="w-full h-full flex flex-col justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1a0533 0%, #3b0764 50%, #6b21a8 100%)" }}
    >
      {/* Stars */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ width: Math.random() * 3 + 1, height: Math.random() * 3 + 1, left: `${Math.random() * 100}%`, top: `${Math.random() * 60}%`, opacity: Math.random() * 0.5 + 0.1 }}
          animate={{ opacity: [0.1, 0.6, 0.1] }}
          transition={{ duration: Math.random() * 4 + 2, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      <div className="px-8 relative z-10">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/60 text-[13px] uppercase tracking-widest mb-6 text-center"
        >
          Your biggest day
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className="text-center mb-8"
        >
          <p className="text-white/70 text-[15px] mb-1">{formatDate(biggest_day.date)}</p>
          <p
            className="text-white font-black leading-none"
            style={{ fontSize: "clamp(52px, 14vw, 72px)" }}
          >
            S${biggest_day.amount.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-white/50 text-[13px] mt-2">spent in a single day</p>
        </motion.div>

        <div className="space-y-2">
          {biggest_day.merchants.map((m, i) => (
            <motion.div
              key={m}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.12 }}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-[10px] px-4 py-3"
            >
              <div className="w-2 h-2 rounded-full bg-purple-300" />
              <p className="text-white text-[14px] font-medium">{m}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
