import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const socials = [
  { label: "X", id: "@famus_4821", href: "https://x.com/", icon: FaXTwitter },
  { label: "LinkedIn", id: "famus-2714", href: "https://www.linkedin.com/", icon: FaLinkedinIn },
  { label: "Instagram", id: "@famus.8392", href: "https://www.instagram.com/", icon: FaInstagram },
] as const;

export function SocialLinks() {
  const [active, setActive] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const reduceMotion = useReducedMotion();
  const current = active === null ? null : socials[active];

  return (
    <nav aria-label="Social links" className="relative" onMouseLeave={() => setActive(null)} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setActive(null);
    }}>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1 backdrop-blur-xl">
        {socials.map((social, index) => {
          const Icon = social.icon;
          return (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${social.label} (sample ID ${social.id})`}
              title={`${social.label} · sample ID ${social.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-9 rounded-full text-muted-foreground hover:bg-foreground/10 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary", active === index && "bg-foreground/10 text-primary")}
              onMouseEnter={() => { setActive(index); setOffset(0); }}
              onMouseMove={(event) => {
                if (reduceMotion) return;
                const rect = event.currentTarget.getBoundingClientRect();
                setOffset(((event.clientX - rect.left) / rect.width - 0.5) * 12);
              }}
              onFocus={() => { setActive(index); setOffset(0); }}
            >
              <Icon aria-hidden="true" className="size-[18px]" />
            </a>
          );
        })}
      </div>
      {current && (
        <motion.div
          key={current.label}
          role="status"
          initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: reduceMotion ? 0 : offset }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
          className="pointer-events-none absolute right-0 top-[calc(100%+0.5rem)] z-30 w-max overflow-hidden rounded-md border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-lg backdrop-blur-xl sm:top-[calc(100%+0.75rem)] sm:w-48 sm:p-3"
        >
          <div className="flex items-center gap-2 sm:border-b sm:border-border sm:pb-2">
            <current.icon aria-hidden="true" className="size-4 text-primary" />
            <span className="text-xs font-medium sm:inline">{current.label}</span>
            <span className="text-xs text-muted-foreground sm:hidden">{current.id} · sample</span>
          </div>
          <p className="mt-2 hidden truncate font-display text-xl sm:block">{current.id}</p>
          <p className="mt-1 hidden text-[10px] uppercase tracking-widest text-muted-foreground sm:block">Sample ID · coming soon</p>
        </motion.div>
      )}
    </nav>
  );
}