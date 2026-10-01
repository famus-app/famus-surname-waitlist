import { createFileRoute } from "@tanstack/react-router";
import { House, LockKeyhole, RotateCw, Share2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import scrollVideoAsset from "@/assets/famus-scroll.webm.asset.json";
import famusLogo from "@/assets/famus-logo-transparent.png";
import familyGarden from "@/assets/famus-family-garden.jpg";

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

const alphabeticalHandles = [
  ["@a", "@b", "@c", "@d", "@e", "@f", "@g", "@h", "@i"],
  ["@j", "@k", "@l", "@m", "@n", "@o", "@p", "@q", "@r"],
  ["@s", "@t", "@u", "@v", "@w", "@x", "@y", "@z"],
];

function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [remaining, setRemaining] = useState(130_000_000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [claimNumber, setClaimNumber] = useState<number | null>(null);
  const [popularSurnames, setPopularSurnames] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [tickerStep, setTickerStep] = useState(0);

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
      const [{ data: stats }, { data: popular }] = await Promise.all([
        supabase.from("waitlist_stats").select("claimed_count").eq("id", true).maybeSingle(),
        supabase.rpc("claimed_popular_surnames"),
      ]);
      if (!active) return;
      if (stats) setRemaining(Math.max(0, 130_000_000 - Number(stats.claimed_count)));
      if (popular) setPopularSurnames(popular.map((item) => item.surname));
    }

    void refreshPublicStatus();
    const interval = window.setInterval(() => void refreshPublicStatus(), 8_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTickerStep((step) => (step + 1) % 72);
    }, 1_800);
    return () => window.clearInterval(interval);
  }, []);

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
    const garden = new Image();
    garden.src = familyGarden;
    try {
      await Promise.all([garden.decode(), document.fonts.ready]);
      const ratio = Math.max(canvas.width / garden.width, canvas.height / garden.height);
      const width = garden.width * ratio;
      const height = garden.height * ratio;
      context.drawImage(garden, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
    } catch {
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const shade = context.createLinearGradient(0, 0, 0, 1920);
    shade.addColorStop(0, "oklch(0.07 0.007 58 / 0.56)");
    shade.addColorStop(0.4, "oklch(0.07 0.007 58 / 0.05)");
    shade.addColorStop(1, "oklch(0.07 0.007 58 / 0.8)");
    context.fillStyle = shade;
    context.fillRect(0, 0, 1080, 1920);

    const logo = new Image();
    logo.src = famusLogo;
    try {
      await logo.decode();
      context.drawImage(logo, 90, 76, 112, 112);
    } catch {
      // The card remains shareable if the image cannot load.
    }
    context.fillStyle = foreground;
    context.font = '78px "Instrument Serif", serif';
    context.fillText("fam", 215, 157);
    const famWidth = context.measureText("fam").width;
    context.fillStyle = primary;
    context.fillText("US", 215 + famWidth, 157);

    context.textAlign = "center";
    if (cardFlipped) {
      context.fillStyle = foreground;
      context.font = '32px "Work Sans", sans-serif';
      context.fillText("A FAMILY NAME, CLAIMED", 540, 670);
      let surnameSize = 220;
      context.font = `${surnameSize}px "Instrument Serif", serif`;
      while (context.measureText(cleanSurname).width > 850 && surnameSize > 70) {
        surnameSize -= 4;
        context.font = `${surnameSize}px "Instrument Serif", serif`;
      }
      context.fillText(cleanSurname, 540, 860, 850);
      context.fillStyle = primary;
      context.font = '55px "Work Sans", sans-serif';
      context.fillText(`@${handle}`, 540, 965, 850);
      context.fillStyle = foreground;
      context.font = '40px "Work Sans", sans-serif';
      context.fillText("FAMILY NO.", 540, 1570);
      context.font = '124px "Instrument Serif", serif';
      context.fillText(`#${claimNumber.toLocaleString("en-US")}`, 540, 1700, 850);
    } else {
      context.fillStyle = foreground;
      context.font = '51px "Work Sans", sans-serif';
      context.fillText("WELCOME TO", 540, 1295);
      context.font = '160px "Instrument Serif", serif';
      context.fillText("the famUS fam.", 540, 1460, 930);
      context.font = '36px "Work Sans", sans-serif';
      context.fillText("Your family name has found its place.", 540, 1550, 900);
    }
    context.font = '31px "Work Sans", sans-serif';
    context.fillStyle = foreground;
    context.fillText("ONE FAMILY NAME. ONE AGENT. BUILT FOR YOURS.", 540, 1835, 900);

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


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cleanSurname || !email.includes("@")) return;
    setSubmitting(true);
    setError("");
    const { data, error: claimError } = await supabase.rpc("claim_waitlist_surname", {
      p_surname: cleanSurname,
      p_surname_key: handle,
      p_email: email.trim().toLowerCase(),
    });
    setSubmitting(false);
    if (claimError) {
      setError(claimError.code === "23505" ? `@${handle} has already been claimed.` : "We couldn't hold that name. Please try again.");
      return;
    }
    const claim = data?.[0];
    if (!claim) {
      setError("We couldn't confirm that claim. Please try again.");
      return;
    }
    setClaimNumber(Number(claim.claim_number));
    setRemaining((value) => Math.max(0, value - 1));
    if (["smith", "patel", "kim", "gupta", "garcia", "williams", "singh", "chen"].includes(handle)) {
      setPopularSurnames((current) => current.includes(cleanSurname) ? current : [...current, cleanSurname]);
    }
    setClaimed(true);
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
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <a href="/" aria-label="famUS home" className="font-display text-3xl text-foreground">
          <img src={famusLogo} alt="" className="mr-2 inline-block size-10 align-middle" />
          fam<span className="text-primary">US</span>
        </a>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col px-6 pb-16 pt-16 sm:px-10 sm:pt-24">
        <p key={remaining} aria-live="polite" className="famus-count text-center font-display text-[clamp(4rem,13vw,9rem)] leading-[0.82] tabular-nums">
          <span className="whitespace-nowrap">{remaining.toLocaleString("en-US")}</span> <span className="whitespace-nowrap text-[clamp(1.5rem,3.5vw,2.5rem)] text-muted-foreground">left</span>
        </p>
        <h1 className="mx-auto mt-16 whitespace-nowrap text-center font-display text-[clamp(1.5rem,3vw,2.5rem)] leading-none text-foreground">
          One family name. One agent. Built for yours.
        </h1>

        <section className="mt-12 border-y border-border py-8 sm:mt-16 sm:py-10">
          {!claimed ? (
            <>
              <div className="flex flex-col items-center">
                <div className="min-w-0 text-center">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">RESERVE YOUR FAMILY AGENT</p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <House className="size-5 shrink-0 text-primary" strokeWidth={1.7} />
                    <p className="truncate text-lg"><span className="text-primary">@</span>{handle || "yourname"}</p>
                  </div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="mt-7 grid gap-3 sm:grid-cols-[1fr_1.25fr_auto] sm:items-center">
                <label className="famus-glass flex h-12 items-center gap-3 rounded-lg px-4 transition focus-within:ring-2 focus-within:ring-primary/60">
                  <span className="sr-only">Surname</span>
                  <input required value={surname} onChange={(event) => setSurname(event.target.value)} autoComplete="family-name" placeholder="Surname" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
                </label>
                <label className="famus-glass flex h-12 items-center gap-3 rounded-lg px-4 transition focus-within:ring-2 focus-within:ring-primary/60">
                  <span className="sr-only">Email</span>
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="Email address" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" />
                </label>
                <Button type="submit" variant="premium" disabled={!cleanSurname || !email || submitting}>{submitting ? "Holding your name…" : "Claim my agent"}</Button>
              </form>
              {error ? <p role="alert" className="mt-3 text-sm text-primary">{error}</p> : null}
            </>
          ) : (
            <div className="famus-arrive mx-auto grid max-w-3xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)] md:items-center">
              <div className="famus-card-scene w-full max-w-[360px] justify-self-center">
                <div className={`famus-card-inner relative aspect-[9/16] w-full ${cardFlipped ? "is-flipped" : ""}`}>
                  <div className="famus-card-face absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={familyGarden} alt="" className="absolute inset-0 size-full object-cover" width={1080} height={1920} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div className="absolute inset-x-6 top-6 flex items-center gap-2 font-display text-2xl"><img src={famusLogo} alt="" className="size-9" />fam<span className="-ml-2 text-primary">US</span></div>
                    <div className="absolute inset-x-5 bottom-[19%] text-center drop-shadow-lg">
                      <p className="text-xs uppercase text-foreground">Welcome to</p>
                      <p className="mt-1 font-display text-5xl leading-none text-foreground">the famUS fam.</p>
                      <p className="mt-3 text-xs text-foreground">Your family name has found its place.</p>
                    </div>
                    <p className="absolute inset-x-4 bottom-5 text-center text-[9px] uppercase text-foreground">One family name. One agent. Built for yours.</p>
                  </div>
                  <div className="famus-card-face famus-card-back absolute inset-0 overflow-hidden rounded-md border border-border">
                    <img src={familyGarden} alt="" className="absolute inset-0 size-full object-cover" width={1080} height={1920} />
                    <div className="famus-card-shade absolute inset-0" />
                    <div className="absolute inset-x-6 top-6 flex items-center gap-2 font-display text-2xl"><img src={famusLogo} alt="" className="size-9" />fam<span className="-ml-2 text-primary">US</span></div>
                    <div className="absolute inset-x-5 top-[34%] text-center drop-shadow-lg">
                      <p className="text-xs uppercase text-foreground">A family name, claimed</p>
                      <h2 className={`mt-3 break-words font-display leading-none text-foreground ${cleanSurname.length > 12 ? "text-3xl" : cleanSurname.length > 8 ? "text-5xl" : "text-6xl"}`}>{cleanSurname}</h2>
                      <p className="mt-2 text-lg text-primary">@{handle}</p>
                    </div>
                    <div className="absolute inset-x-5 bottom-[11%] text-center drop-shadow-lg">
                      <p className="text-xs uppercase text-foreground">Family no.</p>
                      <p className="font-display text-5xl text-foreground">#{claimNumber?.toLocaleString("en-US")}</p>
                    </div>
                    <p className="absolute inset-x-4 bottom-5 text-center text-[9px] uppercase text-foreground">One family name. One agent. Built for yours.</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">@{handle} is yours</p>
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your family agent is warming up. We'll notify <span className="text-foreground">{email}</span> when it's ready to greet you.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setCardFlipped((flipped) => !flipped)}><RotateCw className="size-4" />Flip card</Button>
                  <Button onClick={() => void shareCard()} disabled={sharing}><Share2 className="size-4" />{sharing ? "Preparing…" : `Share ${cardFlipped ? "details" : "welcome"}`}</Button>
                </div>
                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-primary"><LockKeyhole className="size-4" /><span className="text-[10px] uppercase tracking-[0.22em]">Coming soon</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">Invite 3 family members to unlock your Founder badge.</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {!claimed ? (
          <div className="flex flex-col items-center gap-3 pt-8" aria-label="Already on list">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Already on list</p>
            <div className="flex items-center gap-2" aria-live="off">
              {alphabeticalHandles.map((group, groupIndex) => {
                const visibleHandle = group[tickerStep % group.length];
                return (
                  <span key={`${groupIndex}-${visibleHandle}`} className="famus-ticker inline-flex h-10 min-w-16 items-center justify-center overflow-hidden rounded-lg px-4 font-display text-xl text-foreground">
                    {visibleHandle}
                  </span>
                );
              })}
            </div>
            {popularSurnames.length > 0 ? <p className="text-xs text-muted-foreground">Including {popularSurnames.map((name) => `@${name.toLowerCase()}`).join(", ")}</p> : null}
          </div>
        ) : null}

      </main>
      </div>
    </div>
  );
}
