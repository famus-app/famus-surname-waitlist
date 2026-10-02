import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  /** Rendered below the stacked fields on the final step. */
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
       <div className="relative h-[152px] w-full sm:h-[106px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {steps.map((step, index) => {
            if (index > currentStep) return null;

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
                   "famus-glass absolute inset-x-0 bottom-0 flex h-[54px] items-center gap-2 rounded-lg py-1 pl-4 pr-1.5 transition focus-within:ring-2 focus-within:ring-primary/60",
                   isTop && currentStep > 0 && "h-[100px] flex-wrap content-center py-2 sm:h-[54px] sm:flex-nowrap sm:py-1",
                   !isTop && "pointer-events-none max-sm:hidden",
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
                   className="min-w-0 flex-1 basis-full bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:basis-0"
                />

                {isTop ? (
                   <div className="flex shrink-0 items-center gap-1.5 max-sm:ml-auto">
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
                         className="h-[42px] w-36 shrink-0 rounded-full shadow-sm"
                      >
                        Next
                        <ArrowRight size={15} />
                       </Button>
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
