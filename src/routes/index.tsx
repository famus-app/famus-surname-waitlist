import { createFileRoute } from "@tanstack/react-router";
import { Download, Link2, LockKeyhole, RotateCw, Share2 } from "lucide-react";
import { ThinkingOrb } from "@/components/agents-ui/thinking-orb";
import { AtSignIcon, type AtSignIconHandle } from "@/components/icons/at-sign-icon";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


import { ClaimToggle } from "@/components/ui/claim-toggle";
import { ProgressiveInputStack } from "@/components/ui/progressive-input-stack";
import { GradientText } from "@/components/ui/gradient-text";
import { TextMarquee } from "@/components/ui/text-marquee";
import { TextTypewriter } from "@/components/ui/text-typewriter";

import { Button } from "@/components/ui/button";
import { SocialFollow } from "@/components/ui/social-follow";
import type { Options as ConfettiOptions } from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import bgFamilyStars from "@/assets/famus-bg-v5.jpg.asset.json";
import bgFamilyStarsLoop from "@/assets/famus-bg-loop-v5.mp4.asset.json";
import bgFamilyStarsLoopWebm from "@/assets/famus-bg-loop-v5.webm.asset.json";
import bgStarsOnly from "@/assets/famus-bg-stars-only.jpg.asset.json";
import bgStarsLoop from "@/assets/famus-bg-stars-loop.mp4.asset.json";
import bgStarsLoopWebm from "@/assets/famus-bg-stars-loop.webm.asset.json";
import famusLogoAsset from "@/assets/famus-logo-transparent.png.asset.json";
const famusLogo = famusLogoAsset.url;
import cardFrontArt from "@/assets/famus-card-front-garden.png.asset.json";
import cardBackArt from "@/assets/famus-card-back-ascii.png.asset.json";

// Beige paint-brush swipe laid behind the family number. One seeded generator
// feeds both the live card SVG and the share-card canvas, so both draw one stroke.
const brushRand = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const buildBrush = (seed: number, n = 320) => {
  const rnd = brushRand(seed);
  // value noise: random grid values joined by a smoothstep
  const wave = (cells: number) => {
    const g = Array.from({ length: cells + 1 }, () => rnd() - 0.5);
    return (t: number) => {
      const s = t * cells;
      const i = Math.min(Math.floor(s), cells - 1);
      const f = s - i;
      const a = g[i] ?? 0;
      const b = g[i + 1] ?? 0;
      return a + (b - a) * (f * f * (3 - 2 * f));
    };
  };
  const tBig = wave(6), tMid = wave(24), tFine = wave(130);
  const bBig = wave(6), bMid = wave(24), bFine = wave(130);
  const drift = wave(8);
  const thick = wave(40);
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = i / n;
    // paint sits heaviest mid-stroke and runs dry into split bristles at the ends
    const ramp = Math.min(1, x / 0.1, (1 - x) / 0.1); // the outer tenth of the swipe runs out
    const comb = Math.abs(Math.sin(x * 140)); // where the bristles separate
    const pinch = (1 - ramp) * (1 - comb); // deep gaps only near the tips
    const env = Math.max(0.1, Math.sqrt(ramp)) * (1 - 0.92 * pinch);
    const half = 0.46 * env * (0.85 + (thick(x) + 0.5) * 0.3);
    const c = 0.5 + drift(x) * 0.05;
    top.push([x, c - half + (tBig(x) * 0.03 + tMid(x) * 0.016 + tFine(x) * 0.009) * env]);
    bot.push([x, c + half + (bBig(x) * 0.03 + bMid(x) * 0.016 + bFine(x) * 0.009) * env]);
  }
  // bristle fibres: tapered paint threads, each a closed outline in band space
  const streaks: { poly: [number, number][]; a: number; lit: boolean }[] = [];
  for (let i = 0; i < 38; i++) {
    const yc = 0.5 + (rnd() - 0.5) * 0.62;
    const th = 0.02 + rnd() * 0.09;
    const a = 0.1 + rnd() * 0.4;
    const x0 = rnd() < 0.6 ? 0 : rnd() * 0.25;
    const x1 = rnd() < 0.6 ? 1 : 0.75 + rnd() * 0.25;
    const bow = (rnd() - 0.5) * 0.06; // the fibre curves as it travels
    const up: [number, number][] = [];
    const dn: [number, number][] = [];
    for (let j = 0; j <= 26; j++) {
      const t = j / 26;
      const x = x0 + (x1 - x0) * t;
      // pinched at both ends so a fibre reads as a thread, never a bar
      const w = (th / 2) * Math.pow(Math.sin(Math.PI * t), 0.6);
      const y = yc + bow * Math.sin(Math.PI * t);
      up.push([x, y - w]);
      dn.push([x, y + w]);
    }
    streaks.push({ poly: [...up, ...dn.reverse()], a, lit: i % 3 === 0 });
  }
  // flecks the bristles throw off past either end of the swipe
  const flecks: [number, number, number][] = [];
  for (let i = 0; i < 26; i++) {
    const nearLeft = rnd() < 0.5;
    flecks.push([nearLeft ? rnd() * 0.09 : 0.91 + rnd() * 0.09, 0.5 + (rnd() - 0.5) * 0.5, 0.6 + rnd() * 2.4]);
  }
  return { top, bot, streaks, flecks };
};
const BRUSH = buildBrush(4471);
const BRUSH_W = 900;
const BRUSH_H = 130;
const BRUSH_TILT = -1.1; // degrees, so the swipe reads as hand-laid
const brushPts = (pts: readonly (readonly [number, number])[]) =>
  pts.map(([x, y]) => `${(x * BRUSH_W).toFixed(1)},${(y * BRUSH_H).toFixed(1)}`).join(" ");
const BRUSH_STRIP = `${brushPts(BRUSH.top)} ${brushPts([...BRUSH.bot].reverse())}`;

// The number is a single flat gold — no gradient or texture painted behind it.
// Card back text slots are fixed-height; long values only shrink their font (cqw units).
function handleSize(handle: string) {
  return Math.min(10, 84 / ((handle.length + 1) * 0.62));
}
// Preview handle: stays on one line and only shrinks, so the chip never jumps.
function previewHandlePx(handle: string) {
  const len = (handle || "yourname").length;
  return Math.round(Math.max(15, Math.min(22, 320 / (len + 4))));
}
function numberSize(num: string) {
  return Math.min(8, 84 / ((num.length + 4) * 0.5));
}

// Bronze-copper ramp for the family number, matched to the front artwork's lettering — keep in sync with .famus-gold in styles.css
const GOLD_STOPS: [number, string][] = [
  [0, "#3A1B08"], [0.08, "#8A4E22"], [0.18, "#E3B98A"], [0.3, "#F2D9B8"],
  [0.42, "#C58C54"], [0.55, "#B37640"], [0.68, "#6E3A1A"], [0.78, "#4A2410"],
  [0.88, "#A9683A"], [0.96, "#D9A870"], [1, "#7A4520"],
];


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Claim your family agent — famUS" },
      { name: "description", content: "Reserve an AI agent username based on your surname and join the famUS early access list." },
      { property: "og:title", content: "Claim your family agent — famUS" },
      { property: "og:description", content: "Your family name is already waiting at the door." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});


function Index() {
  const [surname, setSurname] = useState("Pedapati");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [claimed, setClaimed] = useState(true);
  const [previewing, setPreviewing] = useState(false);
  const [remaining, setRemaining] = useState(31_000_000);
  const [error, setError] = useState("");
  const [claimNumber, setClaimNumber] = useState<number | null>(1);
  const [sharing, setSharing] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(true);
  const [onSurnameStep, setOnSurnameStep] = useState(false);
  const [takenHandle, setTakenHandle] = useState("");
  const [priority, setPriority] = useState(false);

  async function joinPriority(): Promise<boolean> {
    if (!cleanSurname || !email.includes("@")) return false;
    const { error: pErr } = await supabase.from("priority_waitlist").insert({
      email: email.trim().toLowerCase(),
      full_name: name.trim() || null,
      requested_surname: cleanSurname,
    });
    if (pErr) {
      toast.error("We couldn't add you right now. Please try again.");
      return false;
    }
    setCardFlipped(false);
    setPriority(true);
    return true;
  }

  const cardSceneRef = useRef<HTMLDivElement>(null);
  const cardTiltRaf = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tiltCards = (e: ReactMouseEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const inner = cardSceneRef.current?.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const rect = cardSceneRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(cardTiltRaf.current);
    cardTiltRaf.current = requestAnimationFrame(() => {
      inner.classList.add("is-tilting");
      inner.style.setProperty("--tilt-x", `${(-py * 12).toFixed(2)}deg`);
      inner.style.setProperty("--tilt-y", `${(px * 12).toFixed(2)}deg`);
    });
  };
  const untiltCards = () => {
    const inner = cardSceneRef.current?.firstElementChild as HTMLElement | null;
    if (!inner) return;
    cancelAnimationFrame(cardTiltRaf.current);
    inner.classList.remove("is-tilting");
    inner.style.setProperty("--tilt-x", "0deg");
    inner.style.setProperty("--tilt-y", "0deg");
  };

  const confettiRef = useRef<((options?: ConfettiOptions) => void) | null>(null);

  const cleanSurname = surname.trim().replace(/[^a-zA-ZÀ-ž' -]/g, "");
  const handle = cleanSurname.toLowerCase().replace(/[\s']/g, "-");

  const previewAtRef = useRef<AtSignIconHandle>(null);
  const drawnFor = useRef("");

  // Draw the @ in when the preview appears and when a name first lands in it;
  // after that it rests fully drawn and redraws on hover.
  useEffect(() => {
    if (!onSurnameStep) {
      drawnFor.current = "";
      return;
    }
    const icon = previewAtRef.current;
    if (!icon) return;
    const key = handle === "" ? "empty" : "named";
    if (drawnFor.current === key) return;
    drawnFor.current = key;
    icon.startAnimation();
    const timer = window.setTimeout(() => icon.stopAnimation(), 900);
    return () => window.clearTimeout(timer);
  }, [onSurnameStep, handle]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ambient loop: autoplay everywhere, but stay paused for reduced motion.
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      if (reducedMotion.matches) {
        video.pause();
      } else {
        const tryPlay = () => void video.play().catch(() => {});
        tryPlay();
        // If the first attempt fired before the clip was ready, retry once it can play.
        video.addEventListener("canplay", tryPlay, { once: true });
      }
    };
    applyMotion();
    reducedMotion.addEventListener("change", applyMotion);
    return () => reducedMotion.removeEventListener("change", applyMotion);
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshPublicStatus() {
      const { data: stats } = await supabase
        .from("waitlist_stats")
        .select("claimed_count")
        .eq("id", true)
        .maybeSingle();
      if (!active) return;
      if (stats) setRemaining(Math.max(0, 31_000_000 - Number(stats.claimed_count)));
    }

    void refreshPublicStatus();
    const interval = window.setInterval(() => void refreshPublicStatus(), 8_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  // Preload the celebration library so the burst fires the instant the claim lands.
  useEffect(() => {
    void import("canvas-confetti").then((module) => {
      confettiRef.current = module.default;
    });
  }, []);

  // Celebration: confetti pops from both bottom corners for a few seconds.
  useEffect(() => {
    if (!claimed || previewing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const tokens = getComputedStyle(document.documentElement);
    // Confetti only parses hex/rgb/hsl — normalize the site's oklch tokens first.
    const probe = document.createElement("canvas").getContext("2d");
    const toRgb = (value: string) => {
      if (!probe) return "";
      probe.fillStyle = "#000000";
      probe.fillStyle = value;
      return probe.fillStyle === "#000000" ? "" : probe.fillStyle;
    };
    const colors = ["--primary", "--primary-soft", "--primary-foreground"]
      .map((token) => toRgb(tokens.getPropertyValue(token).trim()))
      .filter(Boolean);
    const timer = window.setTimeout(() => {
      const fire = () => {
        if (cancelled) return;
        const confetti = confettiRef.current;
        if (!confetti) {
          window.setTimeout(fire, 100);
          return;
        }
        const pop = (angle: number, x: number, count: number, spread = 65) =>
          confetti({ particleCount: count, angle, spread, startVelocity: 58, gravity: 0.9, scalar: 0.9, ticks: 240, origin: { x, y: 1 }, colors });
        pop(62, -0.02, 60);
        pop(118, 1.02, 60);
        const end = Date.now() + 3400;
        const stream = window.setInterval(() => {
          if (Date.now() > end || cancelled) {
            window.clearInterval(stream);
            return;
          }
          pop(58, -0.02, 5, 55);
          pop(122, 1.02, 5, 55);
        }, 220);
      };
      fire();
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [claimed, previewing]);

  async function createShareCard(side: "front" | "back" = cardFlipped ? "back" : "front"): Promise<Blob | null> {
    if (claimNumber === null) return null;
    const back = side === "back";
    // Render at 4K portrait resolution using the same locked 1080 × 1920 layout.
    const exportScale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = 1080 * exportScale;
    canvas.height = 1920 * exportScale;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const ctx = context as CanvasRenderingContext2D & { letterSpacing: string };
    ctx.scale(exportScale, exportScale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const tokens = getComputedStyle(document.documentElement);
    const foreground = tokens.getPropertyValue("--foreground").trim();
    const primary = tokens.getPropertyValue("--primary").trim();
    const withAlpha = (c: string, a: number) => `color-mix(in oklab, ${c} ${a * 100}%, transparent)`;
    const alphaColor = (c: string, a: number) => {
      // Canvas may not parse color-mix; fall back to globalAlpha.
      ctx.fillStyle = c;
      ctx.globalAlpha = a;
      void withAlpha;
    };

    const art = new Image();
    art.crossOrigin = "anonymous";
    art.src = back ? cardBackArt.url : cardFrontArt.url;
    await Promise.all([
      art.decode(),
      document.fonts.load('108px "Canarina"', handle + "famUS"),
      document.fonts.load('36px "Work Sans"', "@ Reserve yours at www.famus.si"),
      document.fonts.load('86px "Instrument Serif"', "fam #0123456789"),
      document.fonts.ready,
    ]);
    const ratio = Math.max(1080 / art.naturalWidth, 1920 / art.naturalHeight);
    const width = art.naturalWidth * ratio;
    const height = art.naturalHeight * ratio;
    ctx.drawImage(art, (1080 - width) / 2, (1920 - height) / 2, width, height);

    // Same shade as .famus-card-shade
    const shade = ctx.createLinearGradient(0, 0, 0, 1920);
    shade.addColorStop(0, "oklch(0.07 0.007 58 / 0.55)");
    shade.addColorStop(0.3, "oklch(0.07 0.007 58 / 0)");
    shade.addColorStop(0.72, "oklch(0.07 0.007 58 / 0)");
    shade.addColorStop(1, "oklch(0.07 0.007 58 / 0.72)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 1080, 1920);

    if (back) {
      // 1cqw on the live card = 10.8px on this 1080px canvas.
      const q = 10.8;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 15 * exportScale;
      ctx.shadowOffsetY = 10 * exportScale;

      // Handle: top 65cqw
      // locked slot: line height stays 10q; long names only shrink the font to fit 84q width
      let hSize = handleSize(handle) * q;
      ctx.font = `${hSize}px "Canarina", sans-serif`;
      {
        const w0 = ctx.measureText("@" + handle).width;
        if (w0 > 84 * q) hSize *= (84 * q) / w0;
      }
      let y = 65 * q;
      const hBase = y + 8 * q - (10 * q - hSize) * 0.45;
      alphaColor("#D8C4AB", 1);
      // "@" in the body font, the name in the wordmark font — measure both so the pair stays centred
      ctx.textAlign = "left";
      ctx.font = `${hSize}px "Work Sans", sans-serif`;
      const atW = ctx.measureText("@").width;
      ctx.font = `${hSize}px "Canarina", sans-serif`;
      const nameW = ctx.measureText(handle).width;
      const hx = 540 - (atW + nameW) / 2;
      ctx.font = `${hSize}px "Work Sans", sans-serif`;
      ctx.fillText("@", hx, hBase);
      ctx.font = `${hSize}px "Canarina", sans-serif`;
      ctx.fillText(handle, hx + atW, hBase, 88 * q);
      ctx.textAlign = "center";
      y += 10 * q;

      // Divider
      y += 6 * q;
      alphaColor(foreground, 0.25);
      ctx.fillRect(540 - 7 * q, y, 14 * q, 2);
      y += 1;

      // the word fam stays plain; the number alone is bold gold
      y += 6 * q;
      const lead = "fam ";
      const num = "#" + String(claimNumber).padStart(4, "0");
      let fSize = numberSize(num) * q;
      ctx.font = `${fSize}px "Instrument Serif", serif`;
      {
        const w0 = ctx.measureText(lead + num).width;
        if (w0 > 84 * q) { fSize *= (84 * q) / w0; ctx.font = `${fSize}px "Instrument Serif", serif`; }
      }
      y += (8 * q - fSize) / 2;
      const lw = ctx.measureText(lead).width;
      const nw = ctx.measureText(num).width;
      const startX = 540 - (lw + nw) / 2;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.textAlign = "left";
      const fm = ctx.measureText(lead + num);
      const base = y + (fSize - (fm.fontBoundingBoxAscent + fm.fontBoundingBoxDescent)) / 2 + fm.fontBoundingBoxAscent;
      alphaColor(foreground, 1);
      ctx.fillText(lead, startX, base);
      ctx.globalAlpha = 1;
      const gold = ctx.createLinearGradient(0, base - fm.fontBoundingBoxAscent, 0, base + fm.fontBoundingBoxDescent);
      for (const [p, c] of GOLD_STOPS) gold.addColorStop(p, c);
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = fSize * 0.09 * exportScale;
      ctx.shadowOffsetY = fSize * 0.045 * exportScale;
      ctx.lineJoin = "round";
      // the live card renders this number bold, so fatten the same ramp to match its weight
      ctx.lineWidth = fSize * 0.014;
      ctx.strokeStyle = gold;
      ctx.strokeText(num, startX + lw, base);
      ctx.fillStyle = gold;
      ctx.fillText(num, startX + lw, base);
      ctx.lineWidth = 1;
      ctx.shadowColor = "rgba(0,0,0,0)";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 15 * exportScale;
      ctx.shadowOffsetY = 10 * exportScale;
      y += fSize + (8 * q - fSize) / 2;
      ctx.textAlign = "center";


      // Reserved text: 3.2cqw, line-height 1.5, tracking 0.18em
      y += 9 * q;
      const tSize = 3.2 * q;
      const tLine = tSize * 1.5;
      ctx.font = `${tSize}px "Work Sans", sans-serif`;
      ctx.letterSpacing = `${tSize * 0.18}px`;
      alphaColor(foreground, 0.9);
      ctx.fillText("I JUST RESERVED OUR", 540 + tSize * 0.09, y + tLine / 2 + tSize * 0.35, 92 * q);
      ctx.fillText("LEGACY IN PERPETUITY,", 540 + tSize * 0.09, y + tLine * 1.5 + tSize * 0.35, 92 * q);
      ctx.fillText("READY FOR THE ERA OF", 540 + tSize * 0.09, y + tLine * 2.5 + tSize * 0.35, 92 * q);
      ctx.fillText("FAMILY INTELLIGENCE.", 540 + tSize * 0.09, y + tLine * 3.5 + tSize * 0.35, 92 * q);
      y += tLine * 4;
      ctx.letterSpacing = "0px";

      // Logo + divider + wordmark
      y += 10 * q;
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.src = famusLogo;
      await logo.decode();
      const logoW = 12.5 * q;
      const logoH = logo.naturalWidth ? logoW * (logo.naturalHeight / logo.naturalWidth) : logoW;
      const wSize = 12.5 * q;
      const gap = 2.5 * q;
      ctx.font = `${wSize}px "Canarina", sans-serif`;
      const track = -0.056 * wSize;
      ctx.letterSpacing = "0px";
      const famAdv = ctx.measureText("fam").width;
      const usAdv = ctx.measureText("US").width;
      // tracking lands after every glyph, so each drawn run is one step wider per letter
      const famW = famAdv + 3 * track;
      const usW = usAdv + 2 * track;
      const rowH = Math.max(logoH, wSize);
      const groupW = logoW + gap + 2 + gap + famW + usW;
      let x = 540 - groupW / 2;
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      if (logo.naturalWidth) ctx.drawImage(logo, x, y + (rowH - logoH) / 2, logoW, logoH);
      x += logoW + gap;
      alphaColor(foreground, 0.35);
      ctx.fillRect(x, y + (rowH - 7.5 * q) / 2, 2, 7.5 * q);
      x += 2 + gap;
      const wBase = y + rowH / 2 + wSize * 0.35;
      ctx.letterSpacing = `${track}px`;
      alphaColor("#D8C4AB", 1);
      ctx.fillText("fam", x, wBase);
      alphaColor("#EB5F06", 1);
      ctx.fillText("US", x + famW, wBase);
      ctx.letterSpacing = "0px";
      ctx.textAlign = "center";

      // Bottom block, anchored 8cqw from bottom
      let by = 1920 - 8 * q;
      const tagSize = 2.7 * q;
      ctx.font = `${tagSize}px "Work Sans", sans-serif`;
      ctx.letterSpacing = `${tagSize * 0.08}px`;
      ctx.textAlign = "center";
      alphaColor(foreground, 0.8);
      ctx.fillText("ONE FAMILY NAME. ONE SI. FOR YOUR FAMILY 🫶🏻", 540, by - tagSize * 1.6 / 2 + tagSize * 0.35, 88 * q);
      ctx.letterSpacing = "0px";
      by -= tagSize * 1.6 + 4 * q;
      alphaColor(foreground, 0.15);
      ctx.fillRect(6 * q, by - 1, 88 * q, 2);
      by -= 4 * q;
      const rSize = 3.4 * q;
      ctx.font = `${rSize}px "Work Sans", sans-serif`;
      const a = "Reserve yours at ";
      const b = "www.famus.si";
      const aw = ctx.measureText(a).width;
      const bw = ctx.measureText(b).width;
      const rx = 540 - (aw + bw) / 2;
      const rBase = by - rSize * 1.5 / 2 + rSize * 0.35;
      ctx.textAlign = "left";
      alphaColor(foreground, 1);
      ctx.fillText(a, rx, rBase);
      alphaColor(primary, 1);
      ctx.fillText(b, rx + aw, rBase);
      ctx.globalAlpha = 1;
    }

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function shareCard() {
    setSharing(true);
    try {
      const blob = await createShareCard();
      if (!blob) throw new Error("Card image could not be prepared");
      const file = new File([blob], `famus-${handle}-${cardFlipped ? "details" : "welcome"}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `The ${cleanSurname}s are on famUS` });
        } catch (shareError) {
          if (!(shareError instanceof DOMException && shareError.name === "AbortError")) downloadBlob(blob, cardFlipped ? "back" : "front");
        }
      } else {
        downloadBlob(blob, cardFlipped ? "back" : "front");
      }
    } catch {
      toast.error("Your card couldn't be prepared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  function downloadBlob(blob: Blob, side: "front" | "back" = "back") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `famus-${handle}-${side === "back" ? "details" : "welcome"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function downloadCard(side: "front" | "back") {
    setSharing(true);
    try {
      const blob = await createShareCard(side);
      if (!blob) throw new Error("Card image could not be prepared");
      downloadBlob(blob, side);
    } catch {
      toast.error("Your card couldn't be prepared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  async function downloadClickableCard() {
    setSharing(true);
    try {
      const blob = await createShareCard("back");
      if (!blob) return;
      const dataUrl: string = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
      const img = new Image();
      await new Promise((res) => { img.onload = res; img.src = dataUrl; });
      const { jsPDF } = await import("jspdf");
      const w = img.width, h = img.height;
      const pdf = new jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "px", format: [w, h], hotfixes: ["px_scaling"] });
      pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
      pdf.link(0, 0, w, h, { url: "https://www.famus.si" });
      pdf.save(`famus-${handle}-details.pdf`);
    } catch {
      toast.error("Your card couldn't be prepared. Please try again.");
    } finally {
      setSharing(false);
    }
  }

  async function copyCardLink() {
    const link = "https://famus.si/register";
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const area = document.createElement("textarea");
      area.value = link;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) {
        toast.error("Couldn't copy the link. Long-press the card to share instead.");
        return;
      }
    }
    toast.success("Link copied — famus.si/register");
  }


  async function submitClaim(): Promise<boolean> {
    if (!cleanSurname || !name.trim() || !email.includes("@")) return false;
    setError("");
    const { data, error: claimError } = await supabase.rpc("claim_waitlist_surname", {
      p_surname: cleanSurname,
      p_surname_key: handle,
      p_email: email.trim().toLowerCase(),
      p_name: name.trim(),
      p_priority_interest: false,
    });
    if (claimError) {
      if (claimError.code === "23505") {
        setTakenHandle(handle);
        setError("");
      } else setError("We couldn't hold that name. Please try again.");
      return false;
    }
    setTakenHandle("");
    const claim = data?.[0];
    if (!claim) {
      setError("We couldn't confirm that claim. Please try again.");
      return false;
    }
    setClaimNumber(Number(claim.claim_number));
    setRemaining((value) => Math.max(0, value - 1));
    return true;
  }
  const isTaken = takenHandle !== "" && takenHandle === handle;

  return (
    <div className="relative min-h-screen bg-background font-body text-foreground antialiased">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden bg-background">
        <video
          key={claimed && !previewing ? "stars" : "family"}
          ref={videoRef}
          className="size-full object-cover object-bottom"
          poster={claimed && !previewing ? bgStarsOnly.url : bgFamilyStars.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
        >
          <source src={claimed && !previewing ? bgStarsLoopWebm.url : bgFamilyStarsLoopWebm.url} type="video/webm" />
          <source src={claimed && !previewing ? bgStarsLoop.url : bgFamilyStarsLoop.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/45 to-background/85" />
        <div className="absolute inset-0 [background:radial-gradient(ellipse_60%_55%_at_50%_45%,hsl(var(--background)/0.55),transparent_70%)]" />
      </div>
      <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-10 flex items-center justify-center px-6 py-5 sm:px-10">
        <a href="/" aria-label="famUS home" onClick={(e) => { e.preventDefault(); setClaimed(false); setPreviewing(true); setPriority(false); setCardFlipped(false); setSharing(false); setError(""); }} className="flex items-center gap-3 font-wordmark leading-none text-foreground text-[clamp(1.75rem,7vw,2.5rem)] tracking-[-0.056em]">
          <img src={famusLogo} alt="" className="inline-block size-10 align-middle" />
          <span aria-hidden="true" className="h-6 w-px bg-foreground/35" />
          <span className="whitespace-nowrap"><span className="text-[#D8C4AB]">fam</span><span className="text-[#EB5F06]">US</span></span>
        </a>
      </header>

      <main className={`relative z-10 mx-auto flex w-full max-w-[1200px] flex-col sm:px-10 ${claimed ? "min-h-[calc(100dvh-6rem)] justify-center px-6 pb-12 pt-2" : "min-h-[calc(100dvh-6rem)] px-6 pb-6 pt-16 sm:pt-24"}`}>
        {!claimed ? (
          <div className="-translate-y-9">
            <p key={remaining} aria-live="polite" className="famus-count text-center font-display text-[clamp(4rem,13vw,9rem)] leading-[0.82] tabular-nums">
              <span className="whitespace-nowrap">{remaining.toLocaleString("en-US")}<span className="align-super text-[0.55em] text-primary">*</span></span><span className="ml-2 whitespace-nowrap text-[clamp(1.5rem,3.5vw,2.5rem)] text-muted-foreground">left</span>
            </p>
            <h1 className="mx-auto mt-16 whitespace-nowrap text-center font-display text-[clamp(1.2rem,3vw,2.5rem)] leading-none text-foreground">
              <span>Built for your whole family: One&nbsp;</span>
              <GradientText
                colors={["#EB5F06", "#D8C4AB", "#f4f2f2"]}
                animationSpeed={3}
                className="text-primary"
              >
                <TextTypewriter
                  values={["Family Name.", "Intelligent Agent."]}
                  className="font-bold"
                />
              </GradientText>
            </h1>
          </div>
        ) : null}

        <section className={claimed ? "w-full" : "mt-12 py-8 sm:mt-16 sm:pb-4 sm:pt-10"}>
          {!claimed ? (
            <>
              <ProgressiveInputStack
                className="mx-auto w-full max-w-md"
                onStepChange={(step) => setOnSurnameStep(step === 2)}
                steps={[
                  { id: "email", placeholder: "Email address", type: "email", autoComplete: "email" },
                  { id: "name", placeholder: "Your name", autoComplete: "name" },
                  { id: "surname", placeholder: "Family name", autoComplete: "family-name" },
                ]}
                onChange={(data) => {
                  setSurname(data["surname"] ?? "");
                  setEmail(data["email"] ?? "");
                  setName(data["name"] ?? "");
                }}
                submitControl={
                  <ClaimToggle
                    idleText={isTaken ? "Join priority list" : "Claim my agent"}
                    idleWidth={isTaken ? 168 : 144}
                    disabled={!cleanSurname || !name.trim() || !email.includes("@")}
                    onAction={isTaken ? () => joinPriority() : submitClaim}
                    onComplete={() => { setPreviewing(false); setClaimed(true); }}
                  />
                }
              />
              <AnimatePresence>
                {onSurnameStep ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="mt-[90px] flex flex-col items-center"
                  >
                    <div className="min-w-0 max-w-full text-center">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Preview your family's agent name</p>
                      <div className="mx-auto mt-2 flex w-fit max-w-[min(92vw,26rem)] items-center justify-center gap-2.5 rounded-full border border-border/70 bg-background/40 px-5 py-1.5 backdrop-blur-sm">
                        <ThinkingOrb state={handle ? "weaving" : "breathing"} size={20} theme="dark" color="#EB5F06" className="shrink-0" aria-label="Your family agent" />
                        <div className="flex min-w-0 items-center gap-1 leading-none" style={{ fontSize: `${previewHandlePx(handle)}px` }}>
                          <AtSignIcon
                            ref={previewAtRef}
                            size={20}
                            aria-hidden="true"
                            className="shrink-0 text-primary"
                            onMouseEnter={() => previewAtRef.current?.startAnimation()}
                            onMouseLeave={() => previewAtRef.current?.stopAnimation()}
                          />
                          <span className="truncate">{handle || "yourname"}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {error ? <p role="alert" className="mt-3 text-center text-sm text-primary">{error}</p> : null}
              {isTaken ? (
                <div role="alert" className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 text-center">
                  <p className="text-sm"><span className="font-bold text-primary">@{takenHandle}</span> is already claimed</p>
                  <p className="text-[13px] text-muted-foreground">We'll notify you first when custom family agent names are live</p>
                </div>
              ) : null}

            </>
          ) : (
            <div className="famus-arrive mx-auto grid max-w-3xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)] md:items-center">
              <div ref={cardSceneRef} onMouseMove={tiltCards} onMouseEnter={tiltCards} onMouseLeave={untiltCards} className="famus-card-scene w-full max-w-[360px] justify-self-center">
                <div className={`famus-card-inner relative aspect-[9/16] w-full ${cardFlipped ? "is-flipped" : ""}`}>
                  <div className="famus-card-face famus-metal-card absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={cardFrontArt.url} alt="" className="absolute inset-0 size-full object-cover" width={768} height={1365} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div aria-hidden className="famus-orb-glow famus-glow-layer absolute inset-0" />
                    <button type="button" aria-label="Flip card" style={{ ["--pop" as string]: "34px" }} onClick={() => setCardFlipped(true)} className={`${priority ? "hidden " : ""}famus-pop absolute top-[3.5cqw] right-[3.5cqw] z-10 grid size-[9cqw] place-items-center rounded-full border border-border bg-background/40 text-foreground backdrop-blur-sm transition-colors hover:bg-background/70`}>
                      <RotateCw className="size-[4.5cqw]" />
                    </button>
                  </div>
                  <div className="famus-card-face famus-card-back absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={cardBackArt.url} alt="" className="absolute inset-0 size-full object-cover" width={941} height={1672} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div className="famus-pop absolute inset-x-[8cqw] top-[65cqw] flex flex-col items-center text-center drop-shadow-lg" style={{ ["--pop" as string]: "14px" }}>
                      <p className="famus-pop flex h-[10cqw] max-w-full items-center justify-center whitespace-nowrap font-wordmark leading-none" style={{ ["--pop" as string]: "30px", color: "#D8C4AB", fontSize: `${handleSize(handle)}cqw` }}><span className="font-body">@</span>{handle}</p>
                      <span aria-hidden className="mt-[6cqw] h-px w-[14cqw] bg-foreground/25" />
                      <div className="famus-pop relative mt-[6cqw] flex h-[8cqw] items-center" style={{ ["--pop" as string]: "24px" }}>
                        <p className="whitespace-nowrap font-display leading-none" style={{ fontSize: `${numberSize("#" + String(claimNumber ?? 0).padStart(4, "0"))}cqw` }}>
                          <span className="text-foreground">{"fam "}</span>
                          <span className="famus-gold font-bold">{"#"}{String(claimNumber ?? 0).padStart(4, "0")}</span>
                        </p>
                      </div>
                      <p className="mt-[9cqw] text-[3.2cqw] uppercase leading-[1.5] tracking-[0.18em] text-foreground/90">I JUST RESERVED OUR<br />LEGACY IN PERPETUITY,<br />READY FOR THE ERA OF<br />FAMILY INTELLIGENCE.</p>
                      <div className="mt-[10cqw] flex items-center justify-center gap-[2.5cqw]">
                        <img src={famusLogo} alt="" className="famus-pop w-[12.5cqw]" style={{ ["--pop" as string]: "18px" }} />
                        <span aria-hidden className="famus-pop h-[7.5cqw] w-px bg-foreground/35" style={{ ["--pop" as string]: "18px" }} />
                        <span aria-hidden="true" className="famus-pop whitespace-nowrap font-wordmark text-[12.5cqw] leading-none tracking-[-0.056em]" style={{ ["--pop" as string]: "18px" }}><span className="text-[#D8C4AB]">fam</span><span className="text-[#EB5F06]">US</span></span>
                      </div>
                    </div>
                    <div className="famus-pop absolute inset-x-[6cqw] bottom-[8cqw] flex flex-col items-center text-center drop-shadow-lg" style={{ ["--pop" as string]: "12px" }}>
                      <p className="text-[3.4cqw] text-foreground">Reserve yours at <span className="text-primary">www.famus.si</span></p>
                      <span aria-hidden className="my-[4cqw] h-px w-full bg-foreground/15" />
                      <p className="text-[2.7cqw] uppercase leading-[1.6] tracking-[0.08em] text-foreground/80">ONE FAMILY NAME. ONE SI. FOR YOUR FAMILY 🫶🏻</p>
                    </div>
                    <button type="button" aria-label="Flip card" style={{ ["--pop" as string]: "34px" }} onClick={() => setCardFlipped(false)} className="famus-pop absolute top-[3.5cqw] right-[3.5cqw] z-10 grid size-[9cqw] place-items-center rounded-full border border-border bg-background/40 text-foreground backdrop-blur-sm transition-colors hover:bg-background/70">
                      <RotateCw className="size-[4.5cqw]" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                {priority ? <>
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">You're on the priority list</p>
                <h2 className="mt-1 font-display text-4xl leading-none">Thank you !</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{"\n"}</p>
                </> : <>
                {!previewing && <p className="text-[11px] uppercase tracking-[0.22em] text-primary">@{handle} is yours</p>}
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon !</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Your family name is officially secured on famUS<br />We’ll be in touch as soon as your SI is live</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={sharing}><Share2 className="size-4" />{sharing ? "Preparing…" : "Pass the Torch"}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem onClick={() => void downloadCard("front")} className="gap-2">
                        <Download className="size-4" />Download front · HD
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void downloadCard("back")} className="gap-2">
                        <Download className="size-4" />Download back · HD
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void downloadClickableCard()} className="gap-2">
                        <Link2 className="size-4" />Download clickable card
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void shareCard()} className="gap-2">
                        <Share2 className="size-4" />Post to socials
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void copyCardLink()} className="gap-2">
                        <Link2 className="size-4" />Share link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                </>}
                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-primary"><LockKeyhole className="size-4" /><span className="text-[10px] uppercase tracking-[0.22em]">NEXT DROP</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">{priority ? "Custom family agent names open to the priority list first; keep an eye on your inbox" : "Invite 2 of your other family members to unlock Family Founder badge and privileges"}</p>
                </div>
                <div className="mt-13">
                  <SocialFollow />
                </div>
              </div>
            </div>
          )}
        </section>

        {!claimed ? (
          <div className="mt-auto border-t border-border pt-5">
            <div className="flex items-center justify-center gap-1 whitespace-nowrap text-[11px] tracking-[0.1em] text-muted-foreground sm:text-[13px] sm:tracking-[0.18em]">
              <span className="font-bold uppercase">ALREADY RESERVED</span>
              <span className="mx-2 text-primary/70">&middot;</span>
              <span className="text-foreground/80">famus.si/</span>
              <TextMarquee speed={2} height={26}>
                {["patel", "garcia", "kimura", "okafor", "sullivan"].map((sampleName) => (
                  <span key={sampleName} className="whitespace-nowrap font-bold text-primary">{sampleName}</span>
                ))}
              </TextMarquee>
            </div>
          </div>
        ) : null}

      </main>
      </div>
    </div>
  );
}
