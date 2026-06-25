import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrip } from "../context/TripContext";

const AUTO_DISMISS_MS = 3800;

export function RoamActivationOverlay() {
  const { activeTrip, justActivated, dismissActivation } = useTrip();

  useEffect(() => {
    if (!justActivated) return;
    const t = setTimeout(dismissActivation, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [justActivated, dismissActivation]);

  return (
    <AnimatePresence>
      {justActivated && activeTrip && (
        <motion.div
          key="roam-activation"
          className="absolute inset-0 z-[150] flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none"
          style={{ background: "linear-gradient(160deg, #050d1f 0%, #0d1e40 40%, #1B3464 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          onClick={dismissActivation}
        >
          {/* Radial glow behind flag */}
          <motion.div
            className="absolute w-64 h-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(43,92,191,0.4) 0%, transparent 70%)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
          />

          {/* Flag */}
          <motion.div
            className="text-[88px] mb-3 relative z-10"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 18, delay: 0.15 }}
          >
            {activeTrip.flag}
          </motion.div>

          {/* "Looks like you're in" */}
          <motion.p
            className="text-white/50 text-[13px] font-semibold tracking-[0.12em] uppercase mb-1 relative z-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            Looks like you're in
          </motion.p>

          {/* City name */}
          <motion.p
            className="text-white text-[34px] font-black tracking-tight mb-1 relative z-10"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            {activeTrip.destination}
          </motion.p>

          {/* Country */}
          <motion.p
            className="text-white/40 text-[14px] font-medium mb-6 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.4 }}
          >
            {activeTrip.country}
          </motion.p>

          {/* NETS Roam badge */}
          <motion.div
            className="flex items-center gap-2.5 mb-5 relative z-10"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75, type: "spring", stiffness: 300, damping: 22 }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300 text-[17px] font-bold tracking-tight">
              NETS Roam is on
            </span>
          </motion.div>

          {/* Network badges */}
          <motion.div
            className="flex gap-2 mb-10 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            {activeTrip.networks.map((n) => (
              <div key={n} className="bg-white/10 border border-white/20 rounded-full px-3.5 py-1">
                <span className="text-white/80 text-[12px] font-semibold">{n}</span>
              </div>
            ))}
          </motion.div>

          {/* No top-up line */}
          <motion.div
            className="flex items-center gap-2 relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05 }}
          >
            <span className="text-green-400/70 text-[12px]">✓</span>
            <span className="text-white/30 text-[12px]">
              Paying straight from your bank — no top-up needed
            </span>
          </motion.div>

          {/* Tap hint */}
          <motion.p
            className="absolute bottom-8 text-white/20 text-[11px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            Tap anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
