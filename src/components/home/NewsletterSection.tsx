"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { Container } from "@/components/ui/Section";

const input =
  "h-[45px] w-full rounded-[10px] border-[0.83px] border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm text-ink-800 placeholder:text-ink-400 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20";
const lbl = "mb-[5px] block text-[13px] font-semibold text-[#444]";

const stats = [
  ["10k+", "Subscribers"],
  ["Weekly", "Deals sent"],
  ["Free", "Always"],
];

export function NewsletterSection() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong");
      setStatus("done");
      form.reset();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden bg-[#edf6ff] px-0 py-[58px]">
      <div aria-hidden className="absolute -left-[224px] -top-[180px] size-[500px] rounded-full bg-[rgba(2,144,222,0.08)]" />
      <div aria-hidden className="absolute -bottom-[180px] -right-[80px] size-[380px] rounded-full bg-[rgba(18,35,61,0.04)]" />
      <Container className="relative grid items-center gap-11 lg:grid-cols-2">
        <div data-reveal="left">
          <span className="block text-[11px] font-bold uppercase leading-[16.5px] tracking-[0.13em] text-[#087dcc]">Free Newsletter</span>
          <h2 id="newsletter-title" className="mt-[19px] max-w-[594px] text-[28px] font-extrabold leading-[1.2] text-[#12233d] md:text-[34px]">
            Get Free Nigeria Flight Deal Alerts{" "}
            <span className="inline-block text-[17px] leading-[25.5px] tracking-[0.01em] text-[#087dcc]">Every Week</span>
          </h2>
          <p className="mt-[17px] max-w-[480px] text-sm leading-[1.55] text-[#526277]">
            Join thousands of Nigerian travelers who get hand-picked discounts, visa tips, and flash sales delivered straight to their inbox every week.
          </p>
          <dl className="mt-[27px] flex items-center gap-[18px]">
            {stats.map(([v, l], i) => (
              <div key={l} className="flex items-center gap-[18px]">
                {i > 0 && <span aria-hidden className="h-9 w-px bg-[#cbd9e8]" />}
                <div className="flex flex-col-reverse">
                  <dt className="text-xs uppercase leading-[18px] tracking-[0.067em] text-[#526277]">{l}</dt>
                  <dd className="text-[22px] font-extrabold leading-[33px] text-[#12233d]">{v}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div data-reveal="right" className="rounded-2xl border-[0.83px] border-[#dce8f3] bg-white p-[30px] shadow-[0_14px_36px_rgba(18,35,61,0.1)]">
          <h3 className="text-xl font-extrabold text-[#0a1f44]">Subscribe for free</h3>
          <p className="mt-1 text-[13px] leading-[19.5px] text-[#5a5a5a]">No spam. Unsubscribe anytime.</p>
          {status === "done" ? (
            <p role="status" className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#087dcc]">
              <CircleCheck aria-hidden className="size-5" /> You&apos;re in! Watch your inbox for this week&apos;s deals.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-5">
              <div className="grid gap-[14px] sm:grid-cols-2">
                <div>
                  <label htmlFor="nl-name" className={lbl}>
                    Your name
                  </label>
                  <input id="nl-name" name="name" type="text" autoComplete="name" className={input} />
                </div>
                <div>
                  <label htmlFor="nl-email" className={lbl}>
                    Email address <span className="text-sm text-[#e53e3e]">*</span>
                  </label>
                  <input id="nl-email" name="email" type="email" required autoComplete="email" className={input} />
                </div>
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-4 h-[50px] w-full rounded-[10px] bg-[#087dcc] text-[15px] font-bold text-white transition hover:bg-[#0670b8] disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send me free deals"}
              </button>
              {status === "error" && (
                <p role="alert" className="mt-2 text-sm font-semibold text-error">
                  {message}
                </p>
              )}
              <p className="mt-[14px] text-xs leading-[18px] text-[#5a5a5a]">
                By subscribing you agree to our{" "}
                <Link href="/privacy-policy" className="font-semibold text-[#0265a3] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
