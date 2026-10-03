import { createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, RotateCw, Share2 } from "lucide-react";
import { ThinkingOrb } from "@/components/agents-ui/thinking-orb";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";


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
import famusLogo from "@/assets/famus-logo-transparent.png";
import cardFrontArt from "@/assets/famus-card-front-embrace.jpg";
import cardBackArt from "@/assets/famus-card-back-arch.jpg";

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

  async function createShareCard(): Promise<Blob | null> {
    if (claimNumber === null) return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const tokens = getComputedStyle(document.documentElement);
    const foreground = tokens.getPropertyValue("--foreground").trim();
    const primary = tokens.getPropertyValue("--primary").trim();
    const background = tokens.getPropertyValue("--background").trim();

    const art = new Image();
    art.src = cardFlipped ? cardBackArt : cardFrontArt;
    try {
      await Promise.all([art.decode(), document.fonts.ready]);
      const ratio = Math.max(canvas.width / art.width, canvas.height / art.height);
      const width = art.width * ratio;
      const height = art.height * ratio;
      context.drawImage(art, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    } catch {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const shade = context.createLinearGradient(0, 0, 0, 1920);
    shade.addColorStop(0, "oklch(0.07 0.007 58 / 0.55)");
    shade.addColorStop(0.3, "oklch(0.07 0.007 58 / 0)");
    shade.addColorStop(0.72, "oklch(0.07 0.007 58 / 0)");
    shade.addColorStop(1, "oklch(0.07 0.007 58 / 0.72)");
    context.fillStyle = shade;
    context.fillRect(0, 0, 1080, 1920);

    context.textAlign = "center";
    if (cardFlipped) {
      context.fillStyle = foreground;
      context.font = '40px "Work Sans", sans-serif';
      context.fillText("A FAMILY NAME, CLAIMED", 540, 1060);
      let surnameSize = 170;
      context.font = `${surnameSize}px "Instrument Serif", serif`;
      while (context.measureText(cleanSurname).width > 860 && surnameSize > 70) {
        surnameSize -= 6;
        context.font = `${surnameSize}px "Instrument Serif", serif`;
      }
      context.fillText(cleanSurname, 540, 1240, 860);
      context.fillStyle = primary;
      context.font = '52px "Work Sans", sans-serif';
      context.fillText(`@${handle}`, 540, 1350, 860);
      context.fillStyle = foreground;
      context.font = '36px "Work Sans", sans-serif';
      context.fillText("FAMILY NO.", 540, 1560);
      context.font = '130px "Instrument Serif", serif';
      context.fillText(`#${claimNumber.toLocaleString("en-US")}`, 540, 1695, 900);
      context.font = '30px "Work Sans", sans-serif';
      context.fillStyle = foreground;
      context.fillText("ONE FAMILY NAME. ONE AGENT. BUILT FOR YOURS.", 540, 1830, 940);
    } else {
      context.fillStyle = foreground;
      await document.fonts.load('113px "Manosque"');
      context.font = '113px "Manosque", serif';
      ["For Generations", "&", "Forever"].forEach((line, i) => context.fillText(line, 540, 200 + i * 113));
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
        downloadBlob(blob);
      }
    } catch (shareError) {
      if (!(shareError instanceof DOMException && shareError.name === "AbortError")) downloadBlob(blob);
    } finally {
      setSharing(false);
    }
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `famus-${handle}-${cardFlipped ? "details" : "welcome"}.png`;
    link.click();
    URL.revokeObjectURL(url);
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
      setError(claimError.code === "23505" ? `@${handle} has already been claimed.` : "We couldn't hold that name. Please try again.");
      return false;
    }
    const claim = data?.[0];
    if (!claim) {
      setError("We couldn't confirm that claim. Please try again.");
      return false;
    }
    setClaimNumber(Number(claim.claim_number));
    setRemaining((value) => Math.max(0, value - 1));
    return true;
  }

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
          <span className="whitespace-nowrap"><span className="text-secondary">fam</span><span className="text-primary">US</span></span>
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
                colors={["#F97316", "#d3b58f", "#f4f2f2"]}
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
                    idleText="Claim my agent"
                    disabled={!cleanSurname || !name.trim() || !email.includes("@")}
                    onAction={submitClaim}
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
                        <ThinkingOrb state={handle ? "weaving" : "breathing"} size={32} theme="dark" color="#F97316" className="shrink-0" aria-label="Your family agent" />
                        <p className="truncate text-lg"><span className="text-primary">@</span>{handle || "yourname"}</p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              {error ? <p role="alert" className="mt-3 text-sm text-primary">{error}</p> : null}

            </>
          ) : (
            <div className="famus-arrive mx-auto grid max-w-3xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)] md:items-center">
              <div className="famus-card-scene w-full max-w-[360px] justify-self-center">
                <div className={`famus-card-inner relative aspect-[9/16] w-full ${cardFlipped ? "is-flipped" : ""}`}>
                  <div className="famus-card-face absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={cardFrontArt} alt="" className="absolute inset-0 size-full object-cover" width={1024} height={1536} />
                    <div className="famus-card-shade absolute inset-0" />
                    <p className="absolute inset-x-0 top-[7cqw] whitespace-pre-line text-center font-manosque text-[10.5cqw] leading-none text-foreground">{"For Generations\n&\nForever \n\n\n"}</p>
                  </div>
                  <div className="famus-card-face famus-card-back absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={cardBackArt} alt="" className="absolute inset-0 size-full object-cover" width={848} height={1264} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div className="absolute inset-x-5 top-[94.5cqw] text-center drop-shadow-lg">
                      <p className="text-[3.7cqw] uppercase leading-none text-foreground">A family name, claimed</p>
                      <h2 className={`mt-[4cqw] break-words font-display leading-none text-foreground ${cleanSurname.length > 12 ? "text-[9.5cqw]" : cleanSurname.length > 8 ? "text-[12.5cqw]" : "text-[15.7cqw]"}`}>{cleanSurname}</h2>
                      <p className="mt-[3cqw] text-[4.8cqw] text-primary">@{handle}</p>
                    </div>
                    <div className="absolute inset-x-5 top-[141cqw] text-center drop-shadow-lg">
                      <p className="text-[3.3cqw] uppercase leading-none text-foreground">Family no.</p>
                      <p className="mt-[3cqw] font-display text-[12cqw] leading-none text-foreground">#{claimNumber?.toLocaleString("en-US")}</p>
                    </div>
                    <p className="absolute inset-x-4 bottom-[7.5cqw] text-center text-[2.8cqw] uppercase text-foreground">One Family Name. One Agent. Built for your Family.</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                {!previewing && <p className="text-[11px] uppercase tracking-[0.22em] text-primary">@{handle} is yours</p>}
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon.</h2>
                {previewing ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A look at the card you'll receive when your family name is reserved.</p> : <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your family agent is warming up. We'll notify <span className="text-foreground">{email}</span> when it's ready to greet you.</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setCardFlipped((flipped) => !flipped)}><RotateCw className="size-4" />Flip card</Button>
                  {previewing ? <Button onClick={() => { setClaimed(false); setPreviewing(false); setSurname(""); setClaimNumber(null); setCardFlipped(false); }}>Claim your own</Button> : <Button onClick={() => void shareCard()} disabled={sharing}><Share2 className="size-4" />{sharing ? "Preparing…" : `Share ${cardFlipped ? "details" : "welcome"}`}</Button>}
                </div>
                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-primary"><LockKeyhole className="size-4" /><span className="text-[10px] uppercase tracking-[0.22em]">Coming soon</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">Invite 3 family members to unlock your Founder badge.</p>
                </div>
                <div className="mt-5">
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
