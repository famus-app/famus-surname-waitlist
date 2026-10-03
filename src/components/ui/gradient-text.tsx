import type { ReactNode } from "react";

export interface GradientTextProps {
  children: ReactNode;
  /** Gradient stops. The first color is appended to the end for a smooth loop. */
  colors?: string[];
  /** Seconds for one full gradient sweep. */
  animationSpeed?: number;
  showBorder?: boolean;
  className?: string;
}

/**
 * Animated gradient text — the fill sweeps across the letters continuously.
 * Uses the shared .famus-gradient-text utility so reduced motion can stop it.
 */
export function GradientText({
  children,
  colors = ["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"],
  animationSpeed = 8,
  showBorder = false,
  className = "",
}: GradientTextProps) {
  // For a smoother animation, the gradient should start and end with the same color.
  const gradientColors = colors.length > 1 ? [...colors, colors[0]] : colors;
  const gradientStyle = {
    backgroundImage: `linear-gradient(to right, ${gradientColors.join(", ")})`,
    animationDuration: `${animationSpeed}s`,
  };

  return (
    <span
      className={`famus-gradient-text ${showBorder ? "border-2" : ""} ${className}`.trim()}
      style={gradientStyle}
    >
      {children}
    </span>
  );
}
