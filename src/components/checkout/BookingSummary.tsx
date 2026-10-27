"use client";

import { useState } from "react";
import { bookingTotals } from "@/lib/booking/pricing";
import type { BookingDraft } from "@/lib/booking/store";
import { fmtLongDate, fmtTime, nairaSpaced, stopsLabel } from "@/lib/flights/format";
import { cn } from "@/lib/utils";

const section = "border-b border-[#f4f6f9] px-[18px] py-4";
const row = "flex items-start justify-between gap-4 text-[15px] leading-[1.35] text-[#878787]";
const amount = "shrink-0 text-right text-[#4e4e4e]";

/** Right-hand "Booking Summary" card on checkout, with promo code entry. */
export function BookingSummary({
  draft,
  onPromo,
  locked,
}: {
  draft: BookingDraft;
  onPromo: (promo: { code: string; discount: number } | undefined) => void;
  /** Disables promo changes once payment has started. */
  locked?: boolean;
}) {
  const [code, setCode] = useState(draft.promo?.code ?? "");
  const [status, setStatus] = useState<"idle" | "applying" | "error">("idle");
  const [error, setError] = useState("");
  const t = bookingTotals(draft);
  const { offer, search } = draft;
  const isReturn = search.trip === "round";

  const apply = async () => {
    setStatus("applying");
    setError("");
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, amount: t.fare + t.addonsTotal }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't apply this code");
      onPromo({ code: json.code, discount: json.discount });
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't apply this code");
      setStatus("error");
      onPromo(undefined);
    }
  };

  const paxRows = [
    { label: "Adults", ...offer.price.adults },
    { label: "Children", ...offer.price.children },
    { label: "Infants", ...offer.price.infants },
  ].filter((r) => r.count > 0);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#eef1f5] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]">
      <h3 className="border-b border-[#eef1f5] px-[18px] py-4 text-lg font-bold text-ink-900">Booking Summary</h3>

      <div className={section}>
        {offer.journeys.map((j, i) => (
          <div key={i} className={cn(i > 0 && "mt-4")}>
            <p className="border-b border-[#eef1f5] pb-3 text-base text-[#1d1d1d]">
              {isReturn && i === 1 ? "Return" : search.trip === "multi" ? `Flight ${i + 1}` : "Depart"} · {fmtLongDate(j.depart)} · {stopsLabel(j.stops)}
            </p>
            <div className="mt-3 flex justify-between gap-4 text-[15px] text-[#878787]">
              <div className="min-w-0 space-y-1.5">
                <p>
                  {fmtTime(j.depart)} ({j.from.code})
                </p>
                <p>{j.from.name}</p>
                <p>{j.from.city}</p>
              </div>
              <div className="min-w-0 max-w-[45%] space-y-1.5 text-right">
                <p>
                  {fmtTime(j.arrive)} ({j.to.code})
                </p>
                <p>{j.to.name}</p>
                <p>{j.to.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={section}>
        <p className="text-[17px] text-[#1d1d1d]">Flight Fare</p>
        {paxRows.map((r) => (
          <div key={r.label} className="mt-2">
            <p className="text-[15px] text-[#1d1d1d]">
              {r.label} x {r.count}
            </p>
            <div className={cn(row, "mt-2")}>
              <span>Fare</span>
              <span className={amount}>{nairaSpaced(r.unit * r.count)}</span>
            </div>
          </div>
        ))}
      </div>

      {t.addonLines.length > 0 && (
        <div className={section}>
          <p className="text-[17px] text-[#1d1d1d]">Add-ons</p>
          {t.addonLines.map((l) => (
            <div key={l.id} className={cn(row, "mt-2")}>
              <span>
                {l.name}
                {l.qty > 1 ? ` x ${l.qty}` : ""}
              </span>
              <span className={amount}>{nairaSpaced(l.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div className={section}>
        <p className="text-[17px] text-[#1d1d1d]">Baggage Information</p>
        <div className={cn(row, "mt-3 items-center")}>
          <span>
            Baggage Allowance
            <br />
            <span className="text-sm text-[#333]">(Per Passenger)</span>
          </span>
          <span className={amount}>{offer.fareRules.checkedBaggage}</span>
        </div>
      </div>

      <div className={section}>
        <label htmlFor="promoCode" className="text-[15px] font-medium text-[#1d1d1d]">
          Enter Promo Code
        </label>
        <div className="mt-2.5 flex gap-2.5">
          <input
            id="promoCode"
            value={code}
            disabled={locked}
            onChange={(e) => {
              setCode(e.target.value);
              if (draft.promo) onPromo(undefined);
              setStatus("idle");
            }}
            placeholder="Enter promo code"
            className="h-[45px] min-w-0 flex-1 rounded-md border border-[#e5e7eb] px-4 text-[15px] uppercase placeholder:normal-case focus:border-blue focus:outline-none disabled:bg-tint-100"
          />
          <button
            type="button"
            onClick={apply}
            disabled={!code.trim() || status === "applying" || locked}
            className="rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-5 text-sm font-bold text-white transition disabled:bg-none disabled:bg-[#9ca3af]"
          >
            {status === "applying" ? "Applying…" : "Apply"}
          </button>
        </div>
        {draft.promo && <p className="mt-2 text-sm font-semibold text-[#15803d]">Promo code applied: {nairaSpaced(draft.promo.discount)} off</p>}
        {status === "error" && <p className="mt-2 text-sm font-medium text-error">{error}</p>}
        {!draft.promo && status !== "error" && <p className="mt-2 text-xs text-ink-400">Try TBILS10 or WELCOME5000 (mock codes)</p>}
      </div>

      <div className={section}>
        {t.discount > 0 && (
          <div className={cn(row, "mb-3")}>
            <span>Promo discount</span>
            <span className={cn(amount, "text-[#15803d]")}>− {nairaSpaced(t.discount)}</span>
          </div>
        )}
        <div className={cn(row, "font-bold")}>
          <span className="text-ink-900">Total</span>
          <span className="text-ink-900">{nairaSpaced(t.total)}</span>
        </div>
      </div>

      <div className="m-[18px] flex items-center gap-2.5 rounded-lg bg-[#fff7ef] px-4 py-3">
        <span aria-hidden className="text-[17px] text-orange">⚠</span>
        <p className="text-[13px] font-medium leading-[1.45] text-[#8a4a17]">This price may increase if you book later.</p>
      </div>
    </div>
  );
}
