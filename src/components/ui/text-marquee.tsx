import React from "react";
import { cn } from "@/lib/utils";

interface TextMarqueeProps {
  children: React.ReactNode[];
  speed?: number;
  className?: string;
  prefix?: React.ReactNode;
  height?: number;
}

const MASK_IMAGE =
  "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgb(0,0,0) 32%, rgb(0,0,0) 68%, rgba(0,0,0,0) 100%)";

export function TextMarquee({
  children,
  speed = 1,
  className,
  prefix,
  height = 40,
}: TextMarqueeProps) {
  const count = React.Children.count(children);

  return (
    <>
      <style>
        {`
          @keyframes famus-marquee-slide {
            to { translate: 0 var(--destination); }
          }
          @media (prefers-reduced-motion: reduce) {
            .famus-marquee-item { animation: none !important; }
            .famus-marquee-item:not(:first-child) { visibility: hidden; }
            .famus-marquee-item:first-child { translate: 0 0 !important; }
          }
        `}
      </style>
      <div className={cn("flex relative", className)}>
        <div className="flex relative overflow-hidden flex-row gap-1 items-center w-min h-min">
          {prefix ? (
            <div className="whitespace-pre size-auto relative">{prefix}</div>
          ) : null}
          <div
            className="relative w-auto overflow-hidden"
            style={{
              height: `${height}px`,
              maskImage: MASK_IMAGE,
              WebkitMaskImage: MASK_IMAGE,
            }}
          >
            <div
              className="relative h-full"
              style={{ "--count": count, "--speed": speed } as React.CSSProperties}
            >
              {React.Children.map(children, (child, index) => (
                <div
                  key={index}
                  className="famus-marquee-item flex items-center"
                  style={{
                    height: `${height}px`,
                    "--index": index,
                    "--origin": "calc((var(--count) - var(--index)) * 100%)",
                    "--destination": "calc((var(--index) + 1) * -100%)",
                    "--duration": "calc(var(--speed) * var(--count) * 1s)",
                    "--delay":
                      "calc((var(--duration) / var(--count)) * var(--index) - var(--duration))",
                    translate: "0 var(--origin)",
                    animation:
                      "famus-marquee-slide var(--duration) var(--delay) infinite linear",
                  } as React.CSSProperties}
                >
                  {child}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
