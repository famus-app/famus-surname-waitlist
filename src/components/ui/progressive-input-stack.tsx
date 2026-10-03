import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface StepData {
  id: string;
  type?: "text" | "email" | "checkbox";
  placeholder?: string;
  autoComplete?: string;
}

interface ProgressiveInputStackProps {
  steps: StepData[];
  initialData?: Record<string, string>;
  onChange?: (data: Record<string, string>) => void;
  /** Called whenever the active step changes (0-based index). */
  onStepChange?: (step: number) => void;
  /** Rendered inside the final field's bar, in place of the Next button. */
  submitControl?: React.ReactNode;
  className?: string;
}

export const ProgressiveInputStack: React.FC<ProgressiveInputStackProps> = ({
  steps,
  initialData,
  onChange,
  onStepChange,
  submitControl,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(
    initialData || steps.reduce((acc, step) => ({ ...acc, [step.id]: "" }), {}),
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const springTransition = {
    type: "spring" as const,
    stiffness: 800,
    damping: 45,
    mass: 2,
  };

  const handleNext = () => {
    const step = steps[currentStep];
    const value = step ? formData[step.id]?.trim() : "";
    if (step?.type !== "checkbox" && (!value || (step?.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))) return;
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const updateField = (id: string, value: string) => {
    const next = { ...formData, [id]: value };
    setFormData(next);
    onChange?.(next);
  };

  return (
    <div className={cn("w-full", className)}>
       <div className="relative h-[106px] w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          {steps.map((step, index) => {
            if (index > currentStep || index < currentStep - 1) return null;

            const position = currentStep - index;
            const isTop = index === currentStep;

            return (
              <motion.div
                key={step.id}
                style={{ zIndex: steps.length - index }}
                initial={{ opacity: 0, scale: 1.15, y: 14, z: steps.length }}
                animate={{
                  opacity: isTop ? 1 : 1 - position * 0.5,
                  scale: 1 - position * 0.04,
                  y: -position * 46,
                  z: steps.length - position,
                }}
                exit={{ opacity: 0, scale: 1.15, y: 14 }}
                transition={springTransition}
                className={cn(
                   "famus-glass absolute inset-x-0 bottom-0 flex h-[54px] items-center gap-2 rounded-full py-1 pl-5 pr-1.5 transition focus-within:ring-2 focus-within:ring-primary/60",
                   !isTop && "pointer-events-none",
                )}
              >
                {!isTop ? (
                  step.type === "checkbox" ? (
                    <span className="flex min-w-0 flex-1 items-center gap-3 text-sm">
                      {formData[step.id] === "true" ? (
                        <Check size={16} strokeWidth={2.5} className="shrink-0 text-primary" />
                      ) : null}
                      <span className="truncate text-muted-foreground">{step.placeholder}</span>
                    </span>
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-foreground/85">
                      {formData[step.id] || step.placeholder}
                    </span>
                  )
                ) : step.type === "checkbox" ? (
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={formData[step.id] === "true"}
                      onChange={(event) => updateField(step.id, event.target.checked ? "true" : "")}
                      className="size-5 shrink-0 accent-primary"
                    />
                    <span className="truncate">{step.placeholder}</span>
                  </label>
                ) : (
                  <input
                    autoFocus={isTop}
                    type={step.type === "email" ? "email" : "text"}
                    value={formData[step.id] ?? ""}
                    onChange={(event) => updateField(step.id, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        if (isTop && currentStep < steps.length - 1) handleNext();
                      }
                    }}
                    placeholder={step.placeholder}
                    autoComplete={step.autoComplete}
                    aria-label={step.placeholder}
                    className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
                  />
                )}

                {isTop ? (
                   <div className="flex shrink-0 items-center gap-1.5">
                    {currentStep > 0 ? (
                       <Button
                        type="button"
                        onClick={handleBack}
                        aria-label="Previous field"
                         variant="outline"
                         size="icon"
                         className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft size={15} />
                       </Button>
                    ) : null}

                    {currentStep < steps.length - 1 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={step.type !== "checkbox" && (!formData[step.id]?.trim() || (step.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[step.id] ?? "")))}
                        className="relative h-[42px] w-24 shrink-0 overflow-hidden sm:w-36 rounded-full shadow-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="famus-metal-cta-fill pointer-events-none absolute inset-0"
                        />
                        <span className="relative z-10">Next</span>
                        <ArrowRight size={15} className="relative z-10" />
                      </Button>
                    ) : submitControl}
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
