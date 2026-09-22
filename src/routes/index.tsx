import { createFileRoute } from "@tanstack/react-router";
import { Check, House } from "lucide-react";
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
        <p aria-live="polite" className="text-center font-display text-[clamp(4.5rem,16vw,9.5rem)] leading-[0.82] tabular-nums">
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
                  <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Reserve your agent</p>
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
            <div className="famus-arrive flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="relative grid size-16 shrink-0 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
                <House className="size-7 text-primary" strokeWidth={1.5} />
                <span className="absolute -right-1 -top-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" strokeWidth={2.5} /></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-primary">@{handle} is yours</p>
                <h2 className="mt-1 font-display text-4xl leading-none">Coming home soon.</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your family agent is warming up. We'll notify <span className="text-foreground">{email}</span> when it's ready to greet you.</p>
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
