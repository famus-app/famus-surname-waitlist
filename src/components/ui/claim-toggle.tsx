import { useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { BsCheckCircleFill } from "react-icons/bs";
import { cn } from "@/lib/utils";

type ClaimStatus = "idle" | "loading" | "success";

interface ClaimToggleProps {
  idleText: string;
  disabled?: boolean;
  onAction: () => Promise<boolean>;
  onComplete: () => void;
  className?: string;
}

const HEIGHT = 42;
const CIRCLE = 42;
const IDLE_WIDTH = 144;
const IVORY = "#FFF1E6";

export function ClaimToggle({ idleText, disabled, onAction, onComplete, className }: ClaimToggleProps) {
  const [status, setStatus] = useState<ClaimStatus>("idle");
  const busyRef = useRef(false);

  async function handleClick() {
    if (busyRef.current || disabled) return;
    busyRef.current = true;
    setStatus("loading");
    const succeeded = await onAction();
    if (succeeded) {
      setStatus("success");
      window.setTimeout(onComplete, 1000);
    } else {
      busyRef.current = false;
      setStatus("idle");
    }
  }

  const isCircle = status === "loading" || status === "success";

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 400, damping: 30, mass: 1 }} reducedMotion="user">
      <motion.button
        type="button"
        onClick={() => void handleClick()}
        aria-busy={isCircle}
        disabled={disabled}
        initial={false}
        animate={{
          width: isCircle ? CIRCLE : IDLE_WIDTH,
          height: HEIGHT,
          backgroundColor: "var(--primary)",
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          mass: 1.2,
          backgroundColor: { duration: 0.2 },
        }}
        className={cn(
          "relative z-0 flex cursor-pointer items-center justify-center overflow-hidden rounded-full select-none",
          "shadow-[0_10px_30px_-10px_rgb(231_90_36/0.55)] focus:outline-none active:scale-[0.97]",
          disabled && "cursor-not-allowed opacity-55",
          className,
        )}
      >
        <AnimatePresence mode="popLayout">
          {status === "idle" && (
            <motion.span
              key="metal"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="famus-metal-cta-fill pointer-events-none absolute inset-0"
            />
          )}

          {status === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15, x: -20 }}
              className="absolute inset-0 z-10 flex items-center justify-center text-sm font-medium tracking-wide text-primary-foreground"
            >
              {idleText}
            </motion.span>
          )}

          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.svg
                viewBox="0 0 26 26"
                className="h-6 w-6"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}
              >
                <circle cx="13" cy="13" r="10" stroke="rgba(255,241,230,0.35)" strokeWidth="3" fill="none" />
                <path d="M13 3 A10 10 0 0 1 23 13" stroke={IVORY} strokeWidth="3" strokeLinecap="round" fill="none" />
              </motion.svg>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1.15, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 15, filter: "blur(4px)" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <BsCheckCircleFill className="z-20 text-[26px]" color={IVORY} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </MotionConfig>
  );
}
