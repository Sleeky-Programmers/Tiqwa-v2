"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Clock, Copy, CreditCard, Landmark, Lock, type LucideIcon } from "lucide-react";
import type { PaymentOptions, PayOption } from "@/app/api/payment-options/route";
import { InlineLoader } from "@/components/ui/Feedback";
import { bookingTotals } from "@/lib/booking/pricing";
import type { BookingDraft, PaymentMethodId } from "@/lib/booking/store";
import { naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { ReservationBox } from "./PaymentStep";

export type LiveChoice = { method: string; gateway?: string; instalment?: number; kind: PaymentMethodId; label: string };

const ICONS: Record<string, LucideIcon> = { CARD: CreditCard, ONLINE_TRANSFER: Landmark, FLEXI_PAY: CalendarClock, WALK_IN_TRANSFER: Clock };
const KIND: Record<string, PaymentMethodId> = { CARD: "card", ONLINE_TRANSFER: "transfer", FLEXI_PAY: "flexi", WALK_IN_TRANSFER: "hold" };
const btn =
  "press flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-[15px] text-[15px] font-bold text-white hover:bg-[linear-gradient(90.41deg,#0077f7_0.35%,#004691_106.01%)] disabled:cursor-not-allowed disabled:opacity-50";

/** Live payment step: the backend's payment methods, gateways and bank accounts. */
export function LivePayment({ draft, onPay }: { draft: BookingDraft; onPay: (choice: LiveChoice) => void }) {
  const [opts, setOpts] = useState<PaymentOptions | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [methodId, setMethodId] = useState<string>("");
  const [gateway, setGateway] = useState("");
  const [instalment, setInstalment] = useState(0);
  const r = draft.reservation;
  const t = bookingTotals(draft);
  const amount = r?.payable ?? t.payable;

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/payment-options", { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't load payment options.");
        const o = json as PaymentOptions;
        setOpts(o);
        setMethodId((m) => m || o.methods[0]?.id || "");
        setGateway((g) => g || o.gateways[0]?.id || "");
        setError("");
      })
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => ctrl.abort();
  }, [attempt]);

  const method = opts?.methods.find((m) => m.id === methodId);
  const hold = methodId === "WALK_IN_TRANSFER";
  const flexi = methodId === "FLEXI_PAY" && !!method?.instalments.length;
  const parts = flexi ? instalment || method!.instalments[0] : 0;
  const gatewayName = opts?.gateways.find((g) => g.id === gateway)?.name ?? "";
  const needsGateway = !hold && (opts?.gateways.length ?? 0) > 0;

  const submit = () => {
    if (!method) return;
    const label = hold
      ? "Book on hold"
      : flexi
        ? `Pay small small (${parts} instalments) via ${gatewayName}`
        : `${method.title}${gatewayName ? ` via ${gatewayName}` : ""}`;
    onPay({ method: method.id, kind: KIND[method.id] ?? "card", label, ...(needsGateway ? { gateway } : {}), ...(flexi ? { instalment: parts } : {}) });
  };

  return (
    <div>
      <div className="mb-[18px]">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-ink-900">Choose how to pay</h2>
        <p className="flex items-center gap-1.5 text-[13.5px] leading-[1.5] text-ink-500">
          <Lock className="size-3.5" /> Payments are processed securely by our payment partners. We never see your card details.
        </p>
      </div>
      {r && <ReservationBox r={r} />}

      {!opts && !error && <InlineLoader message="Loading payment options..." className="py-6" />}
      {error && (
        <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3.5 text-sm text-[#b91c1c]">
          {error}{" "}
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-bold underline">
            Try again
          </button>
        </div>
      )}

      {opts && (
        <div className="animate-[acc-reveal_0.3s_ease]">
          <div role="radiogroup" aria-label="Payment method" className="grid gap-2.5">
            {opts.methods.map((m, i) => (
              <MethodCard
                key={m.id}
                m={m}
                index={i}
                selected={m.id === methodId}
                deadline={m.id === "WALK_IN_TRANSFER" ? r?.expiresAt : undefined}
                onSelect={() => setMethodId(m.id)}
              />
            ))}
          </div>

          {flexi && method && (
            <div className="mt-4 animate-[acc-reveal_0.3s_ease]">
              <p className="mb-2 text-sm font-bold text-ink-900">How many instalments?</p>
              <div className="flex flex-wrap gap-2">
                {method.instalments.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={parts === n}
                    onClick={() => setInstalment(n)}
                    className={cn(
                      "press rounded-xl border px-4 py-2.5 text-left text-sm",
                      parts === n ? "border-blue bg-[rgba(2,144,222,0.08)] text-blue" : "border-[#e4e8ee] bg-white text-ink-900 hover:border-blue",
                    )}
                  >
                    <span className="block font-bold">{n} instalments</span>
                    <span className="text-xs text-ink-500">about {naira(amount / n)} each</span>
                  </button>
                ))}
              </div>
              {method.interestRate > 0 && (
                <p className="mt-2 text-xs text-ink-500">A {method.interestRate}% flexi-pay charge is added by the payment provider.</p>
              )}
            </div>
          )}

          {needsGateway && opts.gateways.length > 1 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-bold text-ink-900">Pay with</p>
              <div className="flex flex-wrap gap-2">
                {opts.gateways.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={gateway === g.id}
                    onClick={() => setGateway(g.id)}
                    className={cn(
                      "press flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold",
                      gateway === g.id ? "border-blue bg-[rgba(2,144,222,0.08)] text-blue" : "border-[#e4e8ee] bg-white text-ink-900 hover:border-blue",
                    )}
                  >
                    {gateway === g.id && <Check className="size-4" />}
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hold && (
            <div className="mt-4 animate-[acc-reveal_0.3s_ease]">
              <p className="mb-3 text-[13.5px] text-ink-500">
                We&apos;ll hold your seat. Pay by bank transfer before the deadline and quote your booking reference{" "}
                <strong className="text-ink-900">{r?.pnr}</strong>.
              </p>
              {opts.banks.length > 0 ? (
                <div className="grid gap-2">
                  {opts.banks.map((b) => (
                    <BankRow key={b.accountNumber} {...b} />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-tint-100 px-4 py-3 text-sm text-ink-500">Our bank details will be sent to your email with your booking.</p>
              )}
            </div>
          )}

          <div className="mt-[18px] overflow-hidden rounded-xl border border-[#e8edf3]">
            <div className="flex items-center justify-between gap-4 bg-white px-3.5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">
                {flexi ? "Total (spread over instalments)" : "Total to pay"}
              </span>
              <span className="text-lg font-extrabold text-blue">{naira(amount)}</span>
            </div>
          </div>

          <button type="button" onClick={submit} disabled={!method || (needsGateway && !gateway)} className={cn(btn, "mt-4")}>
            {hold ? "Hold my booking" : flexi ? `Continue with ${parts} instalments` : `Pay ${naira(amount)}`}
          </button>
          {!hold && (
            <p className="mt-2 text-center text-xs text-ink-500">
              You&apos;ll be taken to {gatewayName || "our payment partner"} to finish, then brought back here.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MethodCard({ m, index, selected, deadline, onSelect }: { m: PayOption; index: number; selected: boolean; deadline?: string; onSelect: () => void }) {
  const Icon = ICONS[m.id] ?? CreditCard;
  const badge =
    m.id === "FLEXI_PAY" && m.instalments.length
      ? `Pay in ${m.instalments.join(", ")} instalments`
      : deadline
        ? `Pay before ${new Date(deadline).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
        : null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      style={{ animationDelay: `${index * 60}ms` }}
      className={cn(
        "flex w-full items-start gap-3.5 rounded-[14px] border bg-white p-3.5 text-left transition-[border-color,box-shadow] animate-[fade-up_0.35s_ease_backwards]",
        selected ? "border-blue shadow-[0_0_0_3px_rgba(2,144,222,0.12)]" : "border-[#e8edf3] hover:border-[#bfe0f5]",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-xl transition-colors",
          selected ? "bg-blue text-white" : "bg-[rgba(2,144,222,0.08)] text-blue",
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-bold text-ink-900">{m.title}</span>
          {badge && <span className="rounded-full bg-[rgba(245,134,52,0.12)] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">{badge}</span>}
        </span>
        <span className="mt-0.5 block text-[13px] leading-[1.45] text-ink-500">{m.description}</span>
      </span>
      <span
        className={cn("mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors", selected ? "border-blue" : "border-[#cbd5e1]")}
      >
        {selected && <span className="size-2.5 rounded-full bg-blue" />}
      </span>
    </button>
  );
}

function BankRow({ bank, accountName, accountNumber }: { bank: string; accountName: string; accountNumber: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e8edf3] bg-white px-3.5 py-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">{bank}</p>
        <p className="text-lg font-bold tabular-nums tracking-[0.04em] text-ink-900">{accountNumber}</p>
        <p className="text-[13px] text-ink-500">{accountName}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(accountNumber).catch(() => {});
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
        className="press flex items-center gap-1.5 rounded-lg border border-blue px-3 py-1.5 text-xs font-bold text-blue hover:bg-sky-50"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
