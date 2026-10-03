import { useEffect, useState } from "react";

export interface TextTypewriterProps {
  values: string[];
  /** Milliseconds per character while typing. */
  typingSpeed?: number;
  /** Milliseconds per character while deleting. */
  deletingSpeed?: number;
  /** Milliseconds the full value stays before deleting. */
  holdDuration?: number;
  className?: string;
}

/**
 * Types each value character by character, holds, deletes, then moves to the
 * next value — with a blinking caret. A hidden sizer keeps the layout stable
 * while the visible text grows. Reduced motion shows the first value statically.
 */
export function TextTypewriter({
  values,
  typingSpeed = 55,
  deletingSpeed = 30,
  holdDuration = 1600,
  className,
}: TextTypewriterProps) {
  const [valueIndex, setValueIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced || values.length < 2) return;
    const value = values[valueIndex] ?? "";

    if (!deleting && charCount < value.length) {
      const timer = window.setTimeout(() => setCharCount((count) => count + 1), typingSpeed);
      return () => window.clearTimeout(timer);
    }
    if (!deleting) {
      const timer = window.setTimeout(() => setDeleting(true), holdDuration);
      return () => window.clearTimeout(timer);
    }
    if (charCount > 0) {
      const timer = window.setTimeout(() => setCharCount((count) => count - 1), deletingSpeed);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setValueIndex((index) => (index + 1) % values.length);
      setDeleting(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [reduced, values.length, valueIndex, charCount, deleting, typingSpeed, deletingSpeed, holdDuration]);

  const value = reduced || values.length < 2 ? (values[0] ?? "") : (values[valueIndex] ?? "");
  const visible = reduced ? value : value.slice(0, charCount);
  const widest = values.reduce((longest, current) => (current.length > longest.length ? current : longest), "");

  return (
    <span className={`inline-grid align-bottom ${className ?? ""}`}>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {widest}
      </span>
      <span className="col-start-1 row-start-1 whitespace-nowrap">
        {visible}
        <span aria-hidden="true" className="famus-caret" />
      </span>
    </span>
  );
}
