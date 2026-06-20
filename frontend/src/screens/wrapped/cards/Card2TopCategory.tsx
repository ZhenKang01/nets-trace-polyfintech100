import { motion } from "framer-motion";
import type { WrappedData } from "../../WrappedScreen";

const CAT_CONFIG: Record<string, { emoji: string; color: string; bg: string }> = {
  "Food & Drink": { emoji: "🍜", color: "#E85D04", bg: "from-orange-900 via-orange-700 to-orange-500" },
  Transport: { emoji: "🚇", color: "#0891B2", bg: "from-cyan-900 via-cyan-700 to-cyan-500" },
  Groceries: { emoji: "🛒", color: "#16A34A", bg: "from-green-900 via-green-700 to-green-500" },
  Shopping: { emoji: "🛍️", color: "#7C3AED", bg: "from-purple-900 via-purple-700 to-purple-500" },
  Entertainment: { emoji: "🎬", color: "#DB2777", bg: "from-pink-900 via-pink-700 to-pink-500" },
  ATM: { emoji: "🏧", color: "#1B3464", bg: "from-blue-900 via-blue-700 to-blue-500" },
};

export function Card2TopCategory({ data }: { data: WrappedData }) {
  const cfg = CAT_CONFIG[data.top_category] ?? { emoji: "💳", color: "#1B3464", bg: "from-blue-900 via-blue-700 to-blue-500" };
  const total = data.category_breakdown.reduce((a, b) => a + b.total, 0);
  const topCatData = data.category_breakdown[0];
  const pct = total > 0 ? Math.round((topCatData.total / total) * 100) : 0;

  return (
    <div className={`w-full h-full flex flex-col justify-between relative overflow-hidden bg-gradient-to-b ${cfg.bg}`}>
      {/* Top section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="px-8 pt-20 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
          className="text-[80px] mb-4"
        >
          {cfg.emoji}
        </motion.div>
        <p className="text-white/60 text-[13px] uppercase tracking-widest mb-2">Your top category</p>
        <p className="text-white font-black text-[36px] leading-tight">{data.top_category}</p>
        <p className="text-white/70 text-[14px] mt-2">
          S${topCatData?.total.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · {topCatData?.count} transactions
        </p>
      </motion.div>

      {/* Bar chart */}
      <div className="px-6 pb-24 space-y-2">
        {data.category_breakdown.slice(0, 4).map((cat, i) => {
          const barPct = total > 0 ? (cat.total / total) * 100 : 0;
          return (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className="text-white/80 text-[12px] w-24 truncate">{cat.category}</span>
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${barPct}%` }}
                  transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <span className="text-white/60 text-[11px] w-10 text-right">{Math.round(barPct)}%</span>
            </motion.div>
          );
        })}
        <p className="text-white/40 text-[11px] text-center pt-2">
          {pct}% of your spending was on {data.top_category}
        </p>
      </div>
    </div>
  );
}
