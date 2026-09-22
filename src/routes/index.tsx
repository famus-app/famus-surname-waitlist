import { createFileRoute } from "@tanstack/react-router";
import { Check, Download, House, LockKeyhole, Share2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [remaining, setRemaining] = useState(30_000_000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [claimNumber, setClaimNumber] = useState<number | null>(null);
  const [popularSurnames, setPopularSurnames] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [tickerStep, setTickerStep] = useState(0);

  const cleanSurname = surname.trim().replace(/[^a-zA-ZÀ-ž' -]/g, "");
  const handle = cleanSurname.toLowerCase().replace(/[\s']/g, "-");

  useEffect(() => {
    let active = true;

    async function refreshPublicStatus() {
      const [{ data: stats }, { data: popular }] = await Promise.all([
        supabase.from("waitlist_stats").select("claimed_count").eq("id", true).maybeSingle(),
        supabase.rpc("claimed_popular_surnames"),
      ]);
      if (!active) return;
      if (stats) setRemaining(Math.max(0, 30_000_000 - Number(stats.claimed_count)));
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
    const background = tokens.getPropertyValue("--background").trim();
    const foreground = tokens.getPropertyValue("--foreground").trim();
    const primary = tokens.getPropertyValue("--primary").trim();
    const muted = tokens.getPropertyValue("--muted-foreground").trim();

    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const glow = context.createRadialGradient(220, 260, 20, 220, 260, 700);
    glow.addColorStop(0, primary);
    glow.addColorStop(1, "transparent");
    context.globalAlpha = 0.22;
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.globalAlpha = 1;

    context.fillStyle = foreground;
    context.font = '86px "Instrument Serif", serif';
    context.fillText("fam", 90, 150);
    const famWidth = context.measureText("fam").width;
    context.fillStyle = primary;
    context.fillText("US", 90 + famWidth, 150);

    context.fillStyle = muted;
    context.font = '32px "Work Sans", sans-serif';
    context.fillText("A FAMILY NAME, CLAIMED", 90, 620);
    context.fillStyle = foreground;
    context.font = '142px "Instrument Serif", serif';
    context.fillText(cleanSurname, 90, 805, 900);
    context.fillStyle = primary;
    context.font = '52px "Work Sans", sans-serif';
    context.fillText(`@${handle}`, 90, 900);

    context.fillStyle = foreground;
    context.font = '72px "Instrument Serif", serif';
    context.fillText(`Family #${claimNumber.toLocaleString("en-US")}`, 90, 1370);
    context.fillStyle = muted;
    context.font = '34px "Work Sans", sans-serif';
    context.fillText(`${remaining.toLocaleString("en-US")} family names left.`, 90, 1440);
    context.fillText("Coming home soon.", 90, 1735);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function shareCard() {
    setSharing(true);
    const blob = await createShareCard();
    if (!blob) {
      setSharing(false);
      return;
    }
    const file = new File([blob], `famus-${handle}.png`, { type: "image/png" });
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
    link.download = `famus-${handle}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCard() {
    const blob = await createShareCard();
    if (blob) downloadBlob(blob);
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
    <div className="relative min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
      <div aria-hidden className="famus-aurora pointer-events-none fixed inset-0" />
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="famus-breathe absolute -left-24 -top-32 size-[34rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="famus-breathe absolute -bottom-40 -right-20 size-[38rem] rounded-full bg-primary/10 blur-3xl [animation-delay:4s]" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <a href="/" aria-label="famUS home" className="font-display text-3xl text-foreground">
          fam<span className="text-primary">US</span>
        </a>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[960px] flex-col px-6 pb-16 pt-16 sm:px-10 sm:pt-24">
        <p key={remaining} aria-live="polite" className="famus-count text-center font-display text-[clamp(4.5rem,16vw,9.5rem)] leading-[0.82] tabular-nums">
          {remaining.toLocaleString("en-US")} <span className="text-[clamp(1.5rem,4vw,2.75rem)] text-muted-foreground">left</span>
        </p>
        <h1 className="mx-auto mt-7 max-w-[18ch] text-balance text-center font-display text-[clamp(2.25rem,5vw,4rem)] leading-none text-foreground">
          One family name. One agent. Yours first.
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
                <Button type="submit" disabled={!cleanSurname || !email || submitting}>{submitting ? "Holding your name…" : "Claim my agent"}</Button>
              </form>
              {error ? <p role="alert" className="mt-3 text-sm text-primary">{error}</p> : null}
            </>
          ) : (
            <div className="famus-arrive mx-auto grid max-w-3xl gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.72fr)] md:items-center">
              <div className="famus-share-card relative aspect-[4/5] overflow-hidden rounded-lg border border-border p-7 sm:p-9">
                <div className="flex items-center justify-between">
                  <p className="font-display text-3xl">fam<span className="text-primary">US</span></p>
                  <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-5" /></span>
                </div>
                <div className="absolute inset-x-7 top-[38%] sm:inset-x-9">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">A family name, claimed</p>
                  <h2 className="mt-2 break-words font-display text-5xl leading-none sm:text-6xl">{cleanSurname}</h2>
                  <p className="mt-3 text-lg text-primary">@{handle}</p>
                </div>
                <div className="absolute inset-x-7 bottom-7 sm:inset-x-9 sm:bottom-9">
                  <p className="font-display text-3xl">Family #{claimNumber?.toLocaleString("en-US")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{remaining.toLocaleString("en-US")} family names left.</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">@{handle} is yours</p>
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your family agent is warming up. We'll notify <span className="text-foreground">{email}</span> when it's ready to greet you.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button onClick={() => void shareCard()} disabled={sharing}><Share2 className="size-4" />{sharing ? "Preparing…" : "Share family card"}</Button>
                  <Button variant="outline" onClick={() => void downloadCard()} aria-label="Download family card"><Download className="size-4" />Download</Button>
                </div>
                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-primary"><LockKeyhole className="size-4" /><span className="text-[10px] uppercase tracking-[0.22em]">Coming soon</span></div>
                  <p className="mt-2 text-sm text-muted-foreground">Invite 3 family members to unlock your Founder badge.</p>
                </div>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
