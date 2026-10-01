import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepData {
  id: string;
  type?: "text" | "email";
  placeholder?: string;
  autoComplete?: string;
}

interface ProgressiveInputStackProps {
  steps: StepData[];
  initialData?: Record<string, string>;
  onChange?: (data: Record<string, string>) => void;
  /** Rendered inside the last card in place of the Next button. */
  submitControl?: React.ReactNode;
  className?: string;
}

export const ProgressiveInputStack: React.FC<ProgressiveInputStackProps> = ({
  steps,
  initialData,
  onChange,
  submitControl,
  className,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>(
    initialData || steps.reduce((acc, step) => ({ ...acc, [step.id]: "" }), {}),
  );

  const springTransition = {
    type: "spring" as const,
    stiffness: 800,
    damping: 45,
    mass: 2,
  };

  const handleNext = () => {
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
      <div className="relative h-12 w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          {steps.map((step, index) => {
            if (index > currentStep) return null;

            const position = currentStep - index;
            const isTop = index === currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 1.15, y: 14, z: steps.length }}
                animate={{
                  opacity: 1,
                  scale: 1 - position * 0.05,
                  y: -position * 10,
                  z: steps.length - position,
                }}
                exit={{ opacity: 0, scale: 1.15, y: 14 }}
                transition={springTransition}
                className={cn(
                  "famus-glass absolute inset-0 flex h-12 items-center gap-2 rounded-lg py-2 pl-4 pr-1.5 transition focus-within:ring-2 focus-within:ring-primary/60",
                  !isTop && "pointer-events-none opacity-50",
                )}
              >
                <input
                  autoFocus={isTop}
                  type={step.type === "email" ? "email" : "text"}
                  value={formData[step.id] as string}
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

                {isTop ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {currentStep > 0 ? (
                      <motion.button
                        type="button"
                        onClick={handleBack}
                        aria-label="Previous field"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
                      >
                        <ArrowLeft size={15} />
                      </motion.button>
                    ) : null}

                    {currentStep < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                      >
                        Next
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      submitControl
                    )}
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
