"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Download, MessageCircle, Printer, X } from "lucide-react";
import { airlineLogo } from "@/components/flights/FlightCard";
import { formatDmy } from "@/components/home/search/DatePicker";
import { ProcessingOverlay } from "@/components/ui/Feedback";
import { toast } from "@/components/ui/Toast";
import { contact } from "@/data/contact";
import { getCountry } from "@/data/countries";
import { isPast, updateBooking, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { cabinLabel, fmtDuration, fmtLongDate, fmtTime, naira, stopsLabel } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { ghostBtn, outlineBtn, primaryBtn, StatusBadge } from "./ui";

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
          <span className="text-[11px] text-ink-500">{s.date ? new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Right-hand slide-in panel with one booking's details and actions.
 * Pay now / cancel are mock: they update the booking in localStorage via `updateBooking`.
 */
export function BookingDrawer({ booking, onClose, onChanged }: { booking: HistoryBooking | null; onClose: () => void; onChanged: () => void }) {
  const [visible, setVisible] = useState<HistoryBooking | null>(booking);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the last booking mounted during the slide-out animation.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- drive enter/exit transitions */
    if (booking) {
      setVisible(booking);
      requestAnimationFrame(() => setOpen(true));
    } else {
      setOpen(false);
      const t = window.setTimeout(() => setVisible(null), 380);
      return () => window.clearTimeout(t);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [booking]);

  useEffect(() => {
    if (!booking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !confirmCancel && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [booking, onClose, confirmCancel]);

  if (!visible || typeof document === "undefined") return null;
  const b = visible;
  const t = bookingTotals(b);
  const ref = b.reservation.pnr;
  const canPay = b.status === "hold" || b.status === "pending";
  const canCancel = (b.status === "confirmed" || b.status === "hold" || b.status === "pending") && !isPast(b);
  const isReturn = b.search.trip === "round";

  /** Mock server round-trip; `change` is built after the wait so timestamps are real. */
  const act = async (message: string, change: () => Parameters<typeof updateBooking>[1], done: string) => {
    setBusy(message);
    await new Promise((r) => setTimeout(r, 1300));
    updateBooking(ref, change());
    setBusy(null);
    onChanged();
    toast.success(done);
  };

  const payNow = () =>
    act(
      "Processing your payment, please wait...",
      () => {
        const now = new Date();
        return {
          status: "confirmed",
          payment: { ...b.payment, method: "paystack", status: "confirmed", paidAt: now.toISOString(), transactionRef: `T${now.getTime()}`, amount: t.payable, fee: t.gatewayFee },
        };
      },
      `Payment received. Booking ${ref} is confirmed.`,
    );

  const cancel = () => {
    setConfirmCancel(false);
    act("Cancelling your booking...", () => ({ status: "cancelled", cancelledAt: new Date().toISOString(), payment: b.payment }), `Booking ${ref} has been cancelled.`);
  };

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn("fixed inset-0 z-[2200] bg-[rgba(5,20,35,0.55)] backdrop-blur-[4px] transition-opacity duration-300 print:hidden", open ? "opacity-100" : "opacity-0")}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-drawer-title"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-[2201] flex w-full max-w-[560px] flex-col bg-white shadow-[-16px_0_50px_rgba(3,12,24,0.25)] outline-none transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] print:static print:max-w-none print:shadow-none",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="relative bg-[linear-gradient(140deg,#0a1628,#013557_55%,#0290de)] px-5 pb-5 pt-5 text-white">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 print:hidden"
          >
            <X className="size-5" />
          </button>
          <p className="text-xs font-semibold text-[#8fd0ff]">Booking {ref}</p>
          <h2 id="booking-drawer-title" className="mt-1 pr-10 font-display text-2xl font-extrabold">
            {b.offer.journeys[0].from.city} → {b.offer.journeys[0].to.city}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {isReturn ? "Round trip" : b.search.trip === "multi" ? "Multi-city" : "One-way"} · {fmtLongDate(b.offer.journeys[0].depart)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={b.status} className="bg-white" />
            {b.status === "hold" && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                Pay before {new Date(b.reservation.expiresAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
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
                <dd className="font-extrabold text-blue">{naira(b.payment.status === "confirmed" ? b.payment.amount : t.total)}</dd>
              </div>
              <p className="pt-1 text-xs text-ink-500">
                {b.payment.status === "confirmed"
                  ? `Paid with ${b.payment.method === "bank" ? "bank transfer" : "Paystack"}${b.payment.transactionRef ? ` · Ref ${b.payment.transactionRef}` : ""}`
                  : b.status === "pending"
                    ? "We're confirming your bank transfer."
                    : "Your seat is reserved until the payment deadline."}
              </p>
            </dl>
          </Block>
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-[#eef1f5] bg-white px-5 py-4 print:hidden">
          {canPay && (
            <button type="button" onClick={payNow} className={cn(primaryBtn, "flex-1")}>
              Pay {naira(t.payable)} now
            </button>
          )}
          <button type="button" onClick={() => window.print()} className={cn(outlineBtn, "px-4")} aria-label="Print booking">
            <Printer className="size-4" /> <span className="max-sm:hidden">Print</span>
          </button>
          {b.payment.status === "confirmed" && b.status !== "cancelled" && (
            <button type="button" onClick={() => toast.success(`E-ticket for ${ref} downloaded (mock).`)} className={cn(outlineBtn, "px-4")}>
              <Download className="size-4" /> <span className="max-sm:hidden">E-ticket</span>
            </button>
          )}
          <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
            <MessageCircle className="size-4" /> Support
          </a>
          {canCancel && (
            <button type="button" onClick={() => setConfirmCancel(true)} className={cn(ghostBtn, "ml-auto text-error hover:bg-[#fef2f2] hover:text-error")}>
              Cancel booking
            </button>
          )}
        </footer>
      </div>

      <ProcessingOverlay open={!!busy} message={busy ?? ""} />
      {confirmCancel && <CancelDialog onKeep={() => setConfirmCancel(false)} onCancel={cancel} refundNote={b.offer.fareRules.refundNote} />}
    </>,
    document.body,
  );
}

function CancelDialog({ onKeep, onCancel, refundNote }: { onKeep: () => void; onCancel: () => void; refundNote: string }) {
  return (
    <div className="fixed inset-0 z-[2450] grid place-items-center bg-[rgba(5,20,35,0.66)] p-6 animate-[fade-in_0.18s_ease-out]">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" className="w-full max-w-[420px] rounded-[18px] bg-white px-7 pb-6 pt-8 text-center shadow-[0_24px_60px_rgba(1,20,45,0.28)] animate-[modal-in_0.18s_ease]">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#fee2e2] text-xl font-bold text-error">!</span>
        <h2 id="cancel-title" className="mb-2 font-display text-xl font-extrabold text-ink-900">
          Cancel this booking?
        </h2>
        <p className="mb-6 text-[15px] leading-[1.5] text-[#4b5563]">This can&apos;t be undone. Fare rule: {refundNote}.</p>
        <div className="flex gap-3">
          <button type="button" autoFocus onClick={onKeep} className={cn(outlineBtn, "flex-1")}>
            Keep booking
          </button>
          <button type="button" onClick={onCancel} className="flex-1 rounded-xl bg-error py-2.5 text-sm font-bold text-white transition hover:opacity-90">
            Yes, cancel
          </button>
        </div>
      </div>
    </div>
  );
}

