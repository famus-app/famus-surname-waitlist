import { createFileRoute } from "@tanstack/react-router";
import { Check, House, Sparkles } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import homecomingImage from "@/assets/famus-homecoming.jpg";
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

function Index() {
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [remaining, setRemaining] = useState(30_000_000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const cleanSurname = surname.trim().replace(/[^a-zA-ZÀ-ž' -]/g, "");
  const handle = cleanSurname.toLowerCase().replace(/[\s']/g, "-");

  useEffect(() => {
    void supabase
      .from("waitlist_stats")
      .select("claimed_count")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRemaining(Math.max(0, 30_000_000 - Number(data.claimed_count)));
      });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cleanSurname || !email.includes("@")) return;
    setSubmitting(true);
    setError("");
    const { error: claimError } = await supabase.from("waitlist_claims").insert({
      surname: cleanSurname,
      surname_key: handle,
      email: email.trim().toLowerCase(),
    });
    setSubmitting(false);
    if (claimError) {
      setError(claimError.code === "23505" ? `home.${handle} has already found its family.` : "We couldn't hold that name. Please try again.");
      return;
    }
    setRemaining((value) => Math.max(0, value - 1));
    setClaimed(true);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
      <div className="famus-breathe pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_24%,transparent),transparent_68%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28rem] bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklab,var(--secondary)_11%,transparent),transparent_70%)]" />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <a href="/" aria-label="famUS home" className="font-display text-3xl text-foreground">
          fam<span className="text-primary">US</span>
        </a>
        <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Private early access</span>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto grid w-full max-w-[1140px] items-center gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">The family agent registry</p>
            <h1 className="mt-4 max-w-[15ch] text-balance font-display text-[clamp(2.75rem,6.2vw,4.6rem)] leading-[0.96] text-foreground">
              Your name is already waiting at the door.
            </h1>
            <p className="mt-5 max-w-[48ch] text-pretty text-base leading-relaxed text-muted-foreground">
              Claim the AI agent that carries your family's name. Enter a surname, add your email, and we'll hold the one that's been yours all along.
            </p>

            <div className="famus-glass mt-9 inline-flex items-center gap-4 rounded-2xl p-2 pr-5">
              <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-secondary/10">
                <House className="size-6 text-primary" strokeWidth={1.7} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Reserved agent</p>
                <p className="text-lg leading-tight">home<span className="text-primary">.</span>{handle || "hollis"}</p>
              </div>
            </div>

            <div className="mt-10 border-t border-border pt-7">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Names still open</p>
              <p aria-live="polite" className="mt-2 font-display text-[clamp(3.6rem,11vw,7rem)] leading-[0.86] tabular-nums">
                {remaining.toLocaleString("en-US")}
              </p>
              <p className="mt-3 max-w-[44ch] text-pretty text-sm text-muted-foreground">
                Families are being welcomed home as we speak. The counter steps down with every name that finds its door.
              </p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="famus-glass famus-float relative rounded-[22px] p-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img src={homecomingImage} alt="A warmly lit front porch with a brass mailbox and a small welcoming agent" width={1000} height={1300} className="h-full w-full object-cover" />
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-xl border border-border bg-background/65 p-3 backdrop-blur-xl">
                  <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><Sparkles className="size-4" /></span>
                  <span><span className="block text-xs text-muted-foreground">Your family agent</span><span className="font-display text-lg">Almost home</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-16 sm:px-10">
        <div className="famus-glass mx-auto max-w-[1140px] rounded-[22px] p-6 sm:p-8">
          {!claimed ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Reserve your agent</p>
                  <h2 className="mt-1 max-w-[26ch] text-balance font-display text-3xl leading-none">Two lines and you're on the list.</h2>
                </div>
                <p className="max-w-[34ch] text-pretty text-sm text-muted-foreground">We'll email the moment your family's agent is ready to come home.</p>
              </div>
              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-foreground/5 px-4 ring-1 ring-border transition focus-within:ring-primary">
                  <span className="text-sm text-muted-foreground">Surname</span>
                  <input required value={surname} onChange={(event) => setSurname(event.target.value)} autoComplete="family-name" placeholder="Hollis" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50" />
                </label>
                <label className="flex h-12 flex-1 items-center gap-3 rounded-xl bg-foreground/5 px-4 ring-1 ring-border transition focus-within:ring-primary">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@home.co" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground/50" />
                </label>
                <Button type="submit" disabled={!cleanSurname || !email || submitting}>{submitting ? "Holding your name…" : "Claim my agent"}</Button>
              </form>
              {error ? <p role="alert" className="mt-3 text-sm text-primary">{error}</p> : null}
            </>
          ) : (
            <div className="famus-arrive flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative grid size-20 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
                <House className="size-9 text-primary" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" strokeWidth={2.5} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">home.{handle} is yours</p>
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your family agent is warming up. We'll notify <span className="text-foreground">{email}</span> when it's ready to greet you.</p>
              </div>
              <Sparkles className="size-8 shrink-0 text-primary" strokeWidth={1.4} aria-hidden="true" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
