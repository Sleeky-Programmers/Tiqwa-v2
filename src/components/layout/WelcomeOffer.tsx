"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleCheck, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const KEY = "tbils-welcome-offer-seen";

export function WelcomeOffer() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
  };

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "welcome-offer" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-navy-950/70 p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative grid w-full max-w-[820px] overflow-hidden rounded-2xl bg-white shadow-overlay md:grid-cols-2"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={close}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full text-ink-500 hover:bg-tint-200 max-md:text-white max-md:hover:bg-white/10"
        >
          <X className="size-5" />
        </button>

        <div className="relative flex flex-col justify-center gap-3 bg-gradient-to-br from-blue-900 to-navy-900 p-8 text-white">
          <Logo className="mb-6 hidden md:inline-flex" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-200">Welcome offer</span>
          <p className="font-display text-5xl font-extrabold text-orange">10% OFF</p>
          <p className="font-display text-2xl font-extrabold">Your next flight.</p>
          <p className="text-sm text-slate-200">Join the TBiLS email list and we&apos;ll send your offer straight to your inbox.</p>
          <ul className="mt-2 space-y-2 text-sm font-bold">
            {["Exclusive flight offers", "Travel inspiration and tips"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CircleCheck aria-hidden className="size-5 fill-orange text-navy-900" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-center p-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-orange">TBiLS welcome offer</span>
          <h2 id="welcome-title" className="mt-2 font-display text-3xl font-extrabold text-navy-950">
            Unlock 10% off.
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Enter your email and we&apos;ll send a 10% offer for your next TBiLS flight booking.
          </p>
          {status === "done" ? (
            <p role="status" className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary">
              <CircleCheck aria-hidden className="size-5" /> Check your inbox for your offer.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <label htmlFor="welcome-email" className="block text-xs font-bold text-outline">
                Email address
              </label>
              <input
                id="welcome-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line px-3 py-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/35"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full rounded-xl bg-blue py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-[0.98] disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Get my 10% offer"}
              </button>
              {status === "error" && <p role="alert" className="text-sm font-semibold text-error">{error}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
