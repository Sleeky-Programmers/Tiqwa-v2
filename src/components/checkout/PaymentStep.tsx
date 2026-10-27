"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { bankTransfer } from "@/data/booking";
import { bookingTotals } from "@/lib/booking/pricing";
import type { BookingDraft } from "@/lib/booking/store";
import { naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";

export type PayMethod = "paystack" | "bank" | "hold";

const tabCls = "inline-flex items-center justify-center gap-2 rounded-[10px] px-2.5 py-3 text-sm font-semibold transition";

/**
 * Step 3: "Choose how to pay" — reservation box, Paystack / bank transfer tabs and
 * "Hold, pay later". All mock: no money moves; `onPay` records the chosen method.
 */
export function PaymentStep({ draft, onPay }: { draft: BookingDraft; onPay: (method: PayMethod, reference?: string) => void }) {
  const [method, setMethod] = useState<"paystack" | "bank">("paystack");
  const [sent, setSent] = useState(false);
  const [paystackOpen, setPaystackOpen] = useState(false);
  const t = bookingTotals(draft);
  const r = draft.reservation;
  const email = draft.travellers?.[0]?.email ?? "";
  const deadline = r ? new Date(r.expiresAt) : null;
  const copy = (v: string) => navigator.clipboard?.writeText(v).catch(() => {});

  return (
    <div>
      <div className="mb-[18px]">
        <h2 className="font-display text-[22px] font-extrabold tracking-[-0.01em] text-ink-900">Choose how to pay</h2>
        <p className="text-[13.5px] leading-[1.5] text-ink-500">Complete your booking securely. Your details are encrypted.</p>
      </div>

      {r && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-[#d5e9f5] bg-[#f2f9fd] px-3.5 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-[#64748b]">Airline PNR</span>
            <span className="text-xl font-bold tabular-nums tracking-[0.06em] text-ink-900">{r.airlinePnr}</span>
          </div>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-[#475569]">
            <span>
              Booking ref <strong className="text-ink-900">{r.pnr}</strong>
            </span>
            <span>
              Order no. <strong className="text-ink-900">{r.orderNo}</strong>
            </span>
            {deadline && (
              <span className="text-[#b45309]">
                Pay before{" "}
                <strong>{deadline.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      <div role="tablist" aria-label="Payment method" className="mb-[18px] grid grid-cols-2 gap-2 rounded-[14px] border border-[#e8edf3] bg-[#f6f8fb] p-1.5">
        {(
          [
            ["paystack", "Pay with Paystack", <path key="p" d="M3 7h18v10H3zM3 11h18" />],
            ["bank", "Bank transfer", <path key="b" d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3 3 8h18l-9-5Z" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={method === id}
            onClick={() => setMethod(id)}
            className={cn(
              tabCls,
              method === id ? "bg-white text-blue shadow-[0_1px_2px_rgba(16,40,68,0.06),0_4px_12px_rgba(2,144,222,0.12)]" : "text-ink-500 hover:text-ink-900",
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {icon}
            </svg>
            {label}
          </button>
        ))}
      </div>

      {method === "paystack" ? (
        <div role="tabpanel" className="animate-[acc-reveal_0.3s_ease]">
          <div className="overflow-hidden rounded-xl border border-[#e8edf3] bg-[#e8edf3]">
            {[
              ["Flight fare", naira(t.total)],
              ["Payment gateway charge", naira(t.gatewayFee)],
              ["Receipt to", email || "—"],
            ].map(([k, v]) => (
              <div key={k} className="mb-px flex items-center justify-between gap-4 bg-white px-3.5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">{k}</span>
                <span className="text-[14.5px] font-semibold text-ink-900">{v}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 bg-white px-3.5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">Total to pay</span>
              <span className="text-lg font-extrabold text-blue">{naira(t.payable)}</span>
            </div>
          </div>
          <p className="my-4 text-[13px] leading-[1.5] text-ink-500">
            You&apos;ll be redirected to Paystack&apos;s secure checkout to complete payment. We never store your card details.
          </p>
          <button
            type="button"
            onClick={() => setPaystackOpen(true)}
            disabled={!email}
            className="w-full rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-[15px] text-[15px] font-bold text-white transition hover:bg-[linear-gradient(90.41deg,#0077f7_0.35%,#004691_106.01%)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pay {naira(t.payable)}
          </button>
          {!email && (
            <p className="mt-2 text-xs text-error">
              Please make sure your email and fare amount are set before paying. Go back to traveler details if your email is missing.
            </p>
          )}
        </div>
      ) : (
        <div role="tabpanel" className="animate-[acc-reveal_0.3s_ease]">
          <p className="mb-3 text-[13.5px] text-ink-500">
            Transfer the exact amount below and quote your order number <strong className="text-ink-900">{r?.orderNo}</strong> as the reference.
          </p>
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#e8edf3] bg-[#e8edf3] sm:grid-cols-2">
            {[
              ["Bank name", bankTransfer.bankName],
              ["Account number", bankTransfer.accountNumber],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-[3px] bg-white px-3.5 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">{k}</span>
                <span className="flex items-center justify-between gap-2 text-[14.5px] font-semibold text-ink-900">
                  {v}
                  {k === "Account number" && (
                    <button type="button" onClick={() => copy(v)} className="text-xs font-bold text-blue hover:underline">
                      Copy
                    </button>
                  )}
                </span>
              </div>
            ))}
            <div className="flex flex-col gap-[3px] bg-white px-3.5 py-3 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">Account name</span>
              <span className="text-[14.5px] font-semibold text-ink-900">{bankTransfer.accountName}</span>
            </div>
            <div className="flex flex-col gap-[3px] bg-white px-3.5 py-3 sm:col-span-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">Expected amount</span>
              <span className="text-lg font-extrabold text-blue">{naira(t.total)}</span>
            </div>
          </div>
          <label className="my-[18px] flex cursor-pointer items-center gap-2.5 text-sm font-medium text-ink-900">
            <input type="checkbox" checked={sent} onChange={(e) => setSent(e.target.checked)} className="size-[18px] cursor-pointer accent-blue" />
            I have sent the money
          </label>
          <button
            type="button"
            disabled={!sent}
            onClick={() => onPay("bank")}
            className="w-full rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-[15px] text-[15px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            I&apos;ve paid, continue
          </button>
        </div>
      )}

      <div className="mt-[18px] flex flex-col gap-3 rounded-[14px] border border-dashed border-[#d5dde7] bg-[#f8fafc] p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold text-ink-900">Not ready to pay?</span>
          <span className="max-w-[420px] text-[13px] leading-[1.4] text-[#64748b]">Your seat is reserved. Hold it and pay later, before the deadline.</span>
        </div>
        <button
          type="button"
          onClick={() => onPay("hold")}
          className="w-full rounded-xl border-[1.5px] border-blue bg-white py-[15px] text-[15px] font-bold text-blue transition hover:bg-blue hover:text-white"
        >
          Hold, pay later
        </button>
      </div>

      <MockPaystack
        open={paystackOpen}
        email={email}
        amount={t.payable}
        onClose={() => setPaystackOpen(false)}
        onSuccess={(ref) => {
          setPaystackOpen(false);
          onPay("paystack", ref);
        }}
      />
    </div>
  );
}

/** Stand-in for Paystack's popup. No card details are collected — it only simulates the outcome. */
function MockPaystack({
  open,
  email,
  amount,
  onClose,
  onSuccess,
}: {
  open: boolean;
  email: string;
  amount: number;
  onClose: () => void;
  onSuccess: (reference: string) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="paystack-title" className="max-w-[400px]">
      <div className="px-6 pb-6 pt-7 text-center">
        <span className="mb-3 inline-block rounded-full bg-[#fff7ed] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#c2410c]">Test mode</span>
        <h2 id="paystack-title" className="font-display text-xl font-extrabold text-ink-900">
          Paystack checkout (mock)
        </h2>
        <p className="mt-1 text-sm text-ink-500">{email}</p>
        <p className="my-5 text-3xl font-extrabold text-ink-900">{naira(amount)}</p>
        <p className="mb-5 text-[13px] text-ink-500">This simulates the Paystack popup. Choose an outcome to continue testing the flow.</p>
        <button
          type="button"
          onClick={() => onSuccess(`T${Date.now()}`)}
          className="w-full rounded-xl bg-[#0ba4db] py-3 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          Simulate successful payment
        </button>
        <button type="button" onClick={onClose} className="mt-2 w-full rounded-xl py-3 text-sm font-semibold text-ink-500 hover:text-ink-900">
          Cancel payment
        </button>
      </div>
    </Modal>
  );
}
