import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WrappedData } from "../WrappedScreen";
import { Card1TotalSpend } from "./cards/Card1TotalSpend";
import { Card2TopCategory } from "./cards/Card2TopCategory";
import { Card3Personality } from "./cards/Card3Personality";
import { Card4BiggestDay } from "./cards/Card4BiggestDay";
import { Card5Streak } from "./cards/Card5Streak";
import { Card6WittyLine } from "./cards/Card6WittyLine";
import { Card7Share } from "./cards/Card7Share";

interface Props {
  data: WrappedData;
  onClose: () => void;
}

const TOTAL_CARDS = 7;
const CARD_DURATION = 6000;

export function WrappedStory({ data, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const stopProgress = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const startProgress = useCallback(() => {
    stopProgress();
    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / CARD_DURATION, 1);
      setProgress(pct);
      if (pct < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDirection(1);
        setIndex((i) => {
          if (i >= TOTAL_CARDS - 1) {
            onClose();
            return i;
          }
          return i + 1;
        });
        setProgress(0);
        startTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [onClose, stopProgress]);

  // Start progress on mount and clean up on unmount
  useEffect(() => {
    startProgress();
    return stopProgress;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback(
    (next: number, dir: number) => {
      if (next < 0) { onClose(); return; }
      if (next >= TOTAL_CARDS) { onClose(); return; }
      setDirection(dir);
      setIndex(next);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [onClose]
  );

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX =
      "touches" in e
        ? (e.touches[0]?.clientX ?? rect.left + rect.width / 2)
        : (e as React.MouseEvent).clientX;
    const isRight = clientX > rect.left + rect.width / 2;
    if (isRight) goTo(index + 1, 1);
    else goTo(index - 1, -1);
  };

  const CARDS = [
    <Card1TotalSpend key="c1" data={data} />,
    <Card2TopCategory key="c2" data={data} />,
    <Card3Personality key="c3" data={data} />,
    <Card4BiggestDay key="c4" data={data} />,
    <Card5Streak key="c5" data={data} />,
    <Card6WittyLine key="c6" data={data} />,
    <Card7Share key="c7" data={data} onClose={onClose} />,
  ];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0.6 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0.6 }),
  };

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden no-select"
      onMouseDown={stopProgress}
      onMouseUp={startProgress}
      onTouchStart={stopProgress}
      onTouchEnd={startProgress}
      onClick={handleTap}
    >
      {/* Close button */}
      <button
        className="absolute top-3 right-4 z-50 text-white/80 hover:text-white"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-50">
        {Array.from({ length: TOTAL_CARDS }).map((_, i) => (
          <div key={i} className="story-progress flex-1">
            <div
              className="story-progress-fill"
              style={{
                width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Card */}
      <AnimatePresence custom={direction} initial={false} mode="popLayout">
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 380, damping: 35, mass: 0.8 }}
          className="absolute inset-0"
        >
          {CARDS[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
