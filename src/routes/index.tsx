import { createFileRoute } from "@tanstack/react-router";
import { Download, Link2, LockKeyhole, RotateCw, Share2 } from "lucide-react";
import { ThinkingOrb } from "@/components/agents-ui/thinking-orb";
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
import scrollVideoAsset from "@/assets/famus-scroll.webm.asset.json";
import famusLogoAsset from "@/assets/famus-logo-transparent.png.asset.json";
const famusLogo = famusLogoAsset.url;
import cardFrontArt from "@/assets/famus-card-front-ascii.png.asset.json";
import cardBackArt from "@/assets/famus-card-back-ascii.png.asset.json";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [surname, setSurname] = useState("Pedapati");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [claimed, setClaimed] = useState(true);
  const [previewing, setPreviewing] = useState(true);
  const [remaining, setRemaining] = useState(31_000_000);
  const [error, setError] = useState("");
  const [claimNumber, setClaimNumber] = useState<number | null>(1);
  const [sharing, setSharing] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Ambient loop: autoplay everywhere, but stay paused for reduced motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }
    void video.play().catch(() => {});

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => {
      if (reducedMotion.matches) video.pause();
      else void video.play().catch(() => {});
    };
    reducedMotion.addEventListener("change", handleMotionChange);
    return () => reducedMotion.removeEventListener("change", handleMotionChange);
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
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) return null;
    const ctx = context as CanvasRenderingContext2D & { letterSpacing: string };

    const tokens = getComputedStyle(document.documentElement);
    const foreground = tokens.getPropertyValue("--foreground").trim();
    const primary = tokens.getPropertyValue("--primary").trim();
    const background = tokens.getPropertyValue("--background").trim();
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
    try {
      await Promise.all([art.decode(), document.fonts.ready]);
      const ratio = Math.max(canvas.width / art.width, canvas.height / art.height);
      const width = art.width * ratio;
      const height = art.height * ratio;
      ctx.drawImage(art, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    } catch {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

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
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 10;

      // Reserved text: top 65cqw, 3.2cqw, line-height 1.6, tracking 0.18em
      const tSize = 3.2 * q;
      const tLine = tSize * 1.6;
      let y = 65 * q;
      ctx.font = `${tSize}px "Work Sans", sans-serif`;
      ctx.letterSpacing = `${tSize * 0.18}px`;
      alphaColor(foreground, 0.9);
      ctx.fillText("I JUST RESERVED MY", 540 + tSize * 0.09, y + tLine / 2 + tSize * 0.35);
      ctx.fillText("FAMILY NAME IN PERPETUITY", 540 + tSize * 0.09, y + tLine * 1.5 + tSize * 0.35);
      y += tLine * 2;
      ctx.letterSpacing = "0px";

      // Divider
      y += 6 * q;
      alphaColor(foreground, 0.25);
      ctx.fillRect(540 - 7 * q, y, 14 * q, 2);
      y += 1;

      // Handle
      y += 6 * q;
      const hSize = (handle.length > 12 ? 8 : handle.length > 8 ? 10 : 13) * q;
      ctx.font = `${hSize}px "Instrument Serif", serif`;
      alphaColor(primary, 1);
      ctx.fillText(`@${handle}`, 540, y + hSize * 0.8, 88 * q);
      y += hSize;

      // fam #0001
      y += 9 * q;
      const fSize = 8 * q;
      ctx.font = `${fSize}px "Instrument Serif", serif`;
      const prefix = "fam #";
      const num = String(claimNumber).padStart(4, "0");
      const pw = ctx.measureText(prefix).width;
      const nw = ctx.measureText(num).width;
      const startX = 540 - (pw + nw) / 2;
      ctx.textAlign = "left";
      alphaColor(foreground, 1);
      ctx.fillText(prefix, startX, y + fSize * 0.8);
      alphaColor("#D8C4AB", 1);
      ctx.fillText(num, startX + pw, y + fSize * 0.8);
      y += fSize;

      // Logo + divider + wordmark
      y += 16 * q;
      const logo = new Image();
      logo.src = famusLogo;
      try { await logo.decode(); } catch { /* keep card shareable */ }
      const logoW = 12.5 * q;
      const logoH = logo.naturalWidth ? logoW * (logo.naturalHeight / logo.naturalWidth) : logoW;
      const wSize = 12.5 * q;
      const gap = 2.5 * q;
      ctx.font = `${wSize}px "Canarina", sans-serif`;
      ctx.letterSpacing = `${-0.056 * wSize}px`;
      const famW = ctx.measureText("fam").width;
      const usW = ctx.measureText("US").width;
      const rowH = Math.max(logoH, wSize);
      const groupW = logoW + gap + 2 + gap + famW + usW;
      let x = 540 - groupW / 2;
      ctx.globalAlpha = 1;
      if (logo.naturalWidth) ctx.drawImage(logo, x, y + (rowH - logoH) / 2, logoW, logoH);
      x += logoW + gap;
      alphaColor(foreground, 0.35);
      ctx.fillRect(x, y + (rowH - 7.5 * q) / 2, 2, 7.5 * q);
      x += 2 + gap;
      const wBase = y + rowH / 2 + wSize * 0.35;
      alphaColor("#D8C4AB", 1);
      ctx.fillText("fam", x, wBase);
      alphaColor("#EB5F06", 1);
      ctx.fillText("US", x + famW, wBase);
      ctx.letterSpacing = "0px";

      // Bottom block, anchored 8cqw from bottom
      let by = 1920 - 8 * q;
      const tagSize = 2.7 * q;
      ctx.font = `${tagSize}px "Work Sans", sans-serif`;
      ctx.letterSpacing = `${tagSize * 0.08}px`;
      ctx.textAlign = "center";
      alphaColor(foreground, 0.8);
      ctx.fillText("ONE FAMILY NAME. ONE AGENT. FOR YOUR FAMILY 🫶🏻", 540, by - tagSize * 1.6 / 2 + tagSize * 0.35, 88 * q);
      ctx.letterSpacing = "0px";
      by -= tagSize * 1.6 + 4 * q;
      alphaColor(foreground, 0.15);
      ctx.fillRect(6 * q, by - 1, 88 * q, 2);
      by -= 4 * q;
      const rSize = 3.4 * q;
      ctx.font = `${rSize}px "Work Sans", sans-serif`;
      const a = "Reserve yours at ";
      const b = "famus.si/register";
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
    const blob = await createShareCard();
    if (!blob) {
      setSharing(false);
      return;
    }
    const file = new File([blob], `famus-${handle}-${cardFlipped ? "details" : "welcome"}.png`, { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `The ${cleanSurname}s are on famUS` });
      } else {
        downloadBlob(blob, cardFlipped ? "back" : "front");
      }
    } catch (shareError) {
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) downloadBlob(blob, cardFlipped ? "back" : "front");
    } finally {
      setSharing(false);
    }
  }

  function downloadBlob(blob: Blob, side: "front" | "back" = "back") {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `famus-${handle}-${side === "back" ? "details" : "welcome"}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCard() {
    setSharing(true);
    const blob = await createShareCard("back");
    if (blob) downloadBlob(blob, "back");
    setSharing(false);
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
          ref={videoRef}
          className="size-full object-cover"
          src={scrollVideoAsset.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
        />
        <div className="absolute inset-0 bg-background/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/35 to-background/80" />
      </div>
      <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-10 flex items-center justify-center px-6 py-5 sm:px-10">
        <a href="/" aria-label="famUS home" className="flex items-center gap-3 font-wordmark leading-none text-foreground text-[clamp(1.75rem,7vw,2.5rem)] tracking-[-0.056em]">
          <img src={famusLogo} alt="" className="inline-block size-10 align-middle" />
          <span aria-hidden="true" className="h-6 w-px bg-foreground/35" />
          <span className="whitespace-nowrap"><span className="text-[#D8C4AB]">fam</span><span className="text-[#EB5F06]">US</span></span>
        </a>
      </header>

      <main className={`relative z-10 mx-auto flex w-full max-w-[1200px] flex-col sm:px-10 ${claimed ? "min-h-[calc(100dvh-6rem)] justify-center px-6 pb-12 pt-2" : "px-6 pb-16 pt-16 sm:pt-24"}`}>
        {!claimed ? (
          <>
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
          </>
        ) : null}

        <section className={claimed ? "w-full" : "mt-12 border-t border-border py-8 sm:mt-16 sm:py-10"}>
          {!claimed ? (
            <>
            <div className="mb-6 flex items-center justify-center gap-1 whitespace-nowrap text-[11px] tracking-[0.1em] text-muted-foreground sm:text-[13px] sm:tracking-[0.18em]">
              <span className="font-bold uppercase">ALREADY RESERVED</span>
              <span className="mx-2 text-primary/70">&middot;</span>
              <span className="text-foreground/80">famus.si/</span>
              <TextMarquee speed={2} height={26}>
                {["patel", "garcia", "kimura", "okafor", "sullivan"].map((sampleName) => (
                  <span key={sampleName} className="whitespace-nowrap font-bold text-primary">{sampleName}</span>
                ))}
              </TextMarquee>
            </div>
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
                    className="mt-10 flex flex-col items-center"
                  >
                    <div className="min-w-0 text-center">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Preview your family's agent name</p>
                      <div className="mt-2 flex items-center justify-center gap-3">
                        <ThinkingOrb state={handle ? "weaving" : "breathing"} size={32} theme="dark" color="#EB5F06" className="shrink-0" aria-label="Your family agent" />
                        <p className="truncate text-lg"><span className="text-primary">@</span>{handle || "yourname"}</p>
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
                    <button type="button" aria-label="Flip card" style={{ ["--pop" as string]: "34px" }} onClick={() => setCardFlipped(true)} className={`${priority ? "hidden " : ""}famus-pop absolute top-[3.5cqw] right-[3.5cqw] z-10 grid size-[9cqw] place-items-center rounded-full border border-border bg-background/40 text-foreground backdrop-blur-sm transition-colors hover:bg-background/70`}>
                      <RotateCw className="size-[4.5cqw]" />
                    </button>
                  </div>
                  <div className="famus-card-face famus-card-back absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={cardBackArt.url} alt="" className="absolute inset-0 size-full object-cover" width={941} height={1672} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div className="famus-pop absolute inset-x-[8cqw] top-[65cqw] flex flex-col items-center text-center drop-shadow-lg" style={{ ["--pop" as string]: "14px" }}>
                      <p className="text-[3.2cqw] uppercase leading-[1.6] tracking-[0.18em] text-foreground/90">I JUST RESERVED MY<br />FAMILY NAME IN PERPETUITY<br /></p>
                      <span aria-hidden className="mt-[6cqw] h-px w-[14cqw] bg-foreground/25" />
                      <p className={`famus-pop mt-[6cqw] max-w-full break-words font-display leading-none text-primary ${handle.length > 12 ? "text-[8cqw]" : handle.length > 8 ? "text-[10cqw]" : "text-[13cqw]"}`} style={{ ["--pop" as string]: "30px" }}>@{handle}</p>
                      <p className="famus-pop mt-[9cqw] font-display text-[8cqw] leading-none text-foreground" style={{ ["--pop" as string]: "24px" }}>{"fam #"}<span className="text-[#D8C4AB]">{String(claimNumber ?? 0).padStart(4, "0")}</span></p>
                      <div className="mt-[16cqw] flex items-center justify-center gap-[2.5cqw]">
                        <img src={famusLogo} alt="" className="famus-pop w-[12.5cqw]" style={{ ["--pop" as string]: "18px" }} />
                        <span aria-hidden className="famus-pop h-[7.5cqw] w-px bg-foreground/35" style={{ ["--pop" as string]: "18px" }} />
                        <span aria-hidden="true" className="famus-pop whitespace-nowrap font-wordmark text-[12.5cqw] leading-none tracking-[-0.056em]" style={{ ["--pop" as string]: "18px" }}><span className="text-[#D8C4AB]">fam</span><span className="text-[#EB5F06]">US</span></span>
                      </div>
                    </div>
                    <div className="famus-pop absolute inset-x-[6cqw] bottom-[8cqw] flex flex-col items-center text-center drop-shadow-lg" style={{ ["--pop" as string]: "12px" }}>
                      <p className="text-[3.4cqw] text-foreground">Reserve yours at <span className="text-primary">famus.si/register</span></p>
                      <span aria-hidden className="my-[4cqw] h-px w-full bg-foreground/15" />
                      <p className="text-[2.7cqw] uppercase leading-[1.6] tracking-[0.08em] text-foreground/80">One Family Name. One Agent. For your Family 🫶🏻</p>
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
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Your family name is officially secured on famUS<br />We’ll be in touch as soon as your AI agent is live</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={sharing}><Share2 className="size-4" />{sharing ? "Preparing…" : "Pass the Torch"}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuItem onClick={() => void downloadCard()} className="gap-2">
                        <Download className="size-4" />Download card
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

      </main>
      </div>
    </div>
  );
}
