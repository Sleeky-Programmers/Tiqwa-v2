"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { airlineLogo } from "@/components/flights/FlightCard";
import { formatDmy } from "@/components/home/search/DatePicker";
import { getCountry } from "@/data/countries";
import type { HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { cabinLabel, fmtDuration, fmtLongDate, fmtTime, naira, stopsLabel } from "@/lib/flights/format";
import { cn } from "@/lib/utils";

// One booking's details, shared by the dashboard drawer and the guest manage-booking page.

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[#eef1f5] px-5 py-5 last:border-b-0">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-400">{title}</h3>
      {children}
    </section>
  );
}

function Timeline({ b }: { b: HistoryBooking }) {
  const paid = b.payment.status === "confirmed";
  const steps = [
    { label: "Booked", date: b.bookedAt, done: true },
    { label: paid ? "Paid" : b.status === "pending" ? "Awaiting transfer" : "Awaiting payment", date: b.payment.paidAt, done: paid },
    b.status === "cancelled"
      ? { label: "Cancelled", date: b.cancelledAt, done: true, bad: true }
      : { label: "Flown", date: b.offer.journeys[0].depart, done: b.status === "completed" },
  ];
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => (
        <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
          {i > 0 && <span aria-hidden className={cn("absolute right-1/2 top-3.5 h-0.5 w-full", s.done ? (s.bad ? "bg-error" : "bg-blue") : "bg-[#e2e8f0]")} />}
          <span
            className={cn(
              "relative grid size-7 place-items-center rounded-full border-2",
              s.done ? (s.bad ? "border-error bg-error text-white" : "border-blue bg-blue text-white") : "border-[#e2e8f0] bg-white text-ink-400",
            )}
          >
            {s.bad ? <X className="size-3.5" /> : s.done ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <span className="mt-2 text-xs font-bold text-ink-900">{s.label}</span>
          <span className="text-[11px] text-ink-500">
            {s.date ? new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Reference, status timeline, itinerary, travellers and payment for one booking. */
export function BookingDetailsBody({ b }: { b: HistoryBooking }) {
  const ref = b.reservation.pnr;
  const t = bookingTotals(b);
  const isReturn = b.search.trip === "round";
  return (
    <>
      <Block title="Reference">
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#e8edf3] bg-[#e8edf3]">
          {[
            ["Order no.", b.reservation.orderNo],
            ["Airline PNR", b.reservation.airlinePnr],
            ["Booking ref", ref],
          ].map(([k, v]) => (
            <div key={k} className="bg-white px-3 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8a94a6]">{k}</dt>
              <dd className="truncate text-sm font-bold tracking-[0.03em] text-ink-900">{v}</dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="Status">
        <Timeline b={b} />
      </Block>

      <Block title="Itinerary">
        <div className="space-y-4">
          {b.offer.journeys.map((j, ji) => (
            <div key={ji} className="rounded-xl border border-[#eef1f5]">
              <div className="flex items-center justify-between gap-2 border-b border-[#eef1f5] px-4 py-2.5">
                <p className="text-sm font-bold text-ink-900">
                  {isReturn ? (ji === 0 ? "Outbound" : "Return") : b.offer.journeys.length > 1 ? `Flight ${ji + 1}` : "Outbound"} · {fmtLongDate(j.depart)}
                </p>
                <span className="text-xs text-ink-500">
                  {stopsLabel(j.stops)} · {fmtDuration(j.durationMin)}
                </span>
              </div>
              <ol className="px-4 py-3">
                {j.segments.map((s, si) => (
                  <li key={s.id}>
                    <div className="flex gap-3">
                      <Image src={airlineLogo(s.airline.code)} alt="" width={28} height={28} className="mt-0.5 size-7 shrink-0 rounded object-contain" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-bold text-ink-900">
                            {fmtTime(s.depart)} {s.from.code} → {fmtTime(s.arrive)} {s.to.code}
                          </p>
                          <span className="shrink-0 text-xs text-ink-500">{fmtDuration(s.durationMin)}</span>
                        </div>
                        <p className="truncate text-xs text-ink-500">
                          {s.airline.name} {s.flightNumber} · {s.aircraft}
                        </p>
                      </div>
                    </div>
                    {s.layoverMin !== undefined && si < j.segments.length - 1 && (
                      <p className="my-2.5 ml-10 rounded-md bg-[#fff7ed] px-3 py-1.5 text-xs text-[#9a3412]">
                        Layover in {s.to.city} · <strong>{fmtDuration(s.layoverMin)}</strong>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="text-xs text-ink-500">
            {cabinLabel[b.offer.cabin]} · Baggage: {b.offer.fareRules.checkedBaggage} · {b.offer.fareRules.refundNote}
          </p>
        </div>
      </Block>

      <Block title={`Travellers (${b.travellers?.length ?? 0})`}>
        <ul className="space-y-2">
          {b.travellers?.map((p, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl bg-tint-100 px-3 py-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-blue">
                {p.firstName[0]}
                {p.surname[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink-900">
                  {p.title} {p.firstName} {p.surname}
                </p>
                <p className="text-xs capitalize text-ink-500">
                  {p.type} · {p.dob ? formatDmy(p.dob) : "—"} · {getCountry(p.passportCountry || p.country)?.name}
                </p>
              </div>
              {i === 0 && <span className="rounded-full bg-[rgba(2,144,222,0.1)] px-2 py-0.5 text-[11px] font-semibold text-blue">Lead</span>}
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Payment">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Flight fare</dt>
            <dd className="font-semibold text-ink-900">{naira(t.fare)}</dd>
          </div>
          {t.addonLines.map((l) => (
            <div key={l.id} className="flex justify-between">
              <dt className="text-ink-500">
                {l.name}
                {l.qty > 1 ? ` × ${l.qty}` : ""}
              </dt>
              <dd className="font-semibold text-ink-900">{naira(l.amount)}</dd>
            </div>
          ))}
          {t.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Promo discount</dt>
              <dd className="font-semibold text-[#15803d]">− {naira(t.discount)}</dd>
            </div>
          )}
          {b.payment.fee > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Payment gateway charge</dt>
              <dd className="font-semibold text-ink-900">{naira(b.payment.fee)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[#eef1f5] pt-2.5 text-base">
            <dt className="font-bold text-ink-900">{b.payment.status === "confirmed" ? "Total paid" : "Total due"}</dt>
            <dd className="font-extrabold text-blue">{naira(b.payment.status === "confirmed" || b.live ? b.payment.amount : t.total)}</dd>
          </div>
          <p className="pt-1 text-xs text-ink-500">
            {b.payment.status === "confirmed"
              ? `Paid with ${b.payment.methodLabel ?? (b.payment.method === "bank" ? "bank transfer" : b.live ? "card" : "Paystack")}${b.payment.transactionRef ? ` · Ref ${b.payment.transactionRef}` : ""}`
              : b.status === "pending"
                ? "We're confirming your bank transfer."
                : "Your seat is reserved until the payment deadline."}
          </p>
        </dl>
      </Block>
    </>
  );
}
