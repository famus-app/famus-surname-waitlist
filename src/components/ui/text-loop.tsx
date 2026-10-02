import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface TextLoopProps {
  values: ReactNode[];
  /** Seconds each value stays before swapping. */
  interval?: number;
  /** Seconds the swap animation takes. */
  transitionDuration?: number;
  className?: string;
}

/**
 * Cycles through a list of values with a vertical slide, 21st.dev "text-loop" style.
 * Values stack in one grid cell so the width stays at the widest value — no layout jump.
 */
export function TextLoop({ values, interval = 2.4, transitionDuration = 0.45, className }: TextLoopProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (values.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setIndex((current) => (current + 1) % values.length),
      interval * 1000,
    );
    return () => window.clearInterval(timer);
  }, [values.length, interval]);

  return (
    <span className={`inline-grid overflow-hidden align-bottom ${className ?? ""}`}>
      <AnimatePresence initial={false}>
        <motion.span
          key={index}
          initial={{ y: "0.9em", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-0.9em", opacity: 0 }}
          transition={{ duration: transitionDuration, ease: "easeOut" }}
          className="col-start-1 row-start-1 whitespace-nowrap"
        >
          {values[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
