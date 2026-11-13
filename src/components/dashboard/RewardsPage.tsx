"use client";

import { useState } from "react";
import { Banknote, Check, Copy, Gift, MessageCircle, Share2, UserPlus, Users } from "lucide-react";
import { naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { postJson } from "@/components/ui/form";
import { toast } from "@/components/ui/Toast";
import { EmptyState, SectionCard, StatCard, primaryBtn } from "./ui";
import { useRewards } from "./useRewards";

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");

const steps = [
  { icon: Share2, title: "Share your code", body: "Send your referral code to friends and family who travel." },
  { icon: UserPlus, title: "They book a flight", body: "They enter your code when they book." },
  { icon: Banknote, title: "You earn rewards", body: "Your reward lands here once their trip is paid for." },
];

/** /dashboard/rewards — referral code, earnings and history (backend: /user/rewards). */
export function RewardsPage() {
  const { data, error, retry } = useRewards();
  const [copied, setCopied] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const paidOut = data?.payouts.reduce((s, p) => s + p.amount, 0) ?? 0;
  const shareText = data?.code ? `Book flights from Nigeria and pay small small with TBiLS. Use my code ${data.code} when you book.` : "";

  const copy = () => {
    if (!data?.code) return;
    navigator.clipboard?.writeText(data.code).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const withdraw = async () => {
    setWithdrawing(true);
    const { errors } = await postJson("/api/rewards/withdraw", {});
    setWithdrawing(false);
    if (Object.keys(errors).length) return toast.error(errors.form ?? "We couldn't send your withdrawal request.");
    toast.success("Withdrawal requested. We'll confirm once it's processed.");
    retry();
  };

  if (error) {
    return (
      <SectionCard>
        <EmptyState
          icon={Gift}
          title="We couldn't load your rewards"
          message={error}
          action={
            <button type="button" onClick={retry} className={primaryBtn}>
              Try again
            </button>
          }
        />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#0a1628,#013557_45%,#0290de)] px-6 py-7 text-white sm:px-8 animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-[radial-gradient(circle,rgba(245,134,52,0.35),transparent_65%)]" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-semibold text-[#8fd0ff]">Refer &amp; earn</p>
            <h2 className="mt-1 font-display text-[28px] font-extrabold leading-tight sm:text-[32px]">Invite friends, earn on every trip</h2>
            <p className="mt-2 max-w-[520px] text-sm text-white/80">Share your code. When someone you refer books and pays for a flight, you earn a reward.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {data ? (
                <>
                  <div className="flex items-center gap-3 rounded-xl border border-white/25 bg-white/10 py-2 pl-4 pr-2 backdrop-blur">
                    <span className="font-display text-xl font-extrabold tracking-[0.12em]">{data.code || "—"}</span>
                    <button
                      type="button"
                      onClick={copy}
                      disabled={!data.code}
                      className="press flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#014e78] disabled:opacity-50"
                    >
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  {data.code && (
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(245,134,52,0.35)] hover:bg-orange-600"
                    >
                      <MessageCircle className="size-4" /> Share on WhatsApp
                    </a>
                  )}
                </>
              ) : (
                <div className="skeleton h-12 w-64 rounded-xl opacity-30" />
              )}
            </div>
          </div>
          <div aria-hidden className="float-card hidden size-32 place-items-center rounded-[28px] bg-white/10 backdrop-blur md:grid">
            <Gift className="size-16 text-[#ffd2b0]" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {data ? (
          <>
            <StatCard
              icon={Gift}
              tone="orange"
              label="Total earned"
              value={naira(data.total)}
              hint={data.canWithdraw ? "Available to withdraw" : "Earned from referrals"}
              action={
                data.canWithdraw && data.total > 0 ? (
                  <button type="button" onClick={withdraw} disabled={withdrawing} className="link-underline text-xs font-bold text-blue disabled:opacity-50">
                    {withdrawing ? "Sending…" : "Withdraw"}
                  </button>
                ) : undefined
              }
            />
            <StatCard
              icon={Users}
              label="Friends referred"
              value={String(data.referrals.length)}
              hint="People who joined with your code"
              style={{ animationDelay: "60ms" }}
            />
            <StatCard
              icon={Banknote}
              tone="green"
              label="Paid out"
              value={naira(paidOut)}
              hint={`${data.payouts.length} payout${data.payouts.length === 1 ? "" : "s"}`}
              style={{ animationDelay: "120ms" }}
            />
          </>
        ) : (
          Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton h-[104px] rounded-2xl" />)
        )}
      </div>

      <SectionCard title="How it works">
        <ol data-reveal-stagger className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="group flex gap-3 rounded-xl border border-[#eef1f5] p-4 transition hover:border-[#bfe0f5] hover:bg-tint-100">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(2,144,222,0.1)] text-blue transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink-900">
                  {i + 1}. {s.title}
                </p>
                <p className="mt-0.5 text-[13px] leading-[1.45] text-ink-500">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <History
          title="Referrals"
          empty="No referrals yet. Share your code to get started."
          rows={data?.referrals.map((r) => ({ key: r.name + r.date, left: r.name, right: fmtDate(r.date) }))}
        />
        <History
          title="Payouts"
          empty="Payouts you receive will show here."
          rows={data?.payouts.map((p) => ({ key: p.date + p.amount, left: naira(p.amount), right: fmtDate(p.date) }))}
        />
      </div>
    </div>
  );
}

function History({ title, rows, empty }: { title: string; rows?: { key: string; left: string; right: string }[]; empty: string }) {
  return (
    <SectionCard title={title} bodyClassName="p-3">
      {!rows ? (
        <div className="skeleton m-2 h-28 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="px-2 py-8 text-center text-sm text-ink-500">{empty}</p>
      ) : (
        <ul data-reveal-stagger className="divide-y divide-[#eef1f5]">
          {rows.map((r) => (
            <li key={r.key} className={cn("flex items-center justify-between gap-3 px-2 py-3 text-sm")}>
              <span className="font-semibold text-ink-900">{r.left}</span>
              <span className="text-ink-500">{r.right}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
