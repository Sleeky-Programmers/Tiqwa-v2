"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Lock, MessageCircle, Printer, Search, TicketCheck } from "lucide-react";
import { LivePayment, type LiveChoice } from "@/components/checkout/LivePayment";
import { ghostBtn, outlineBtn, StatusBadge } from "@/components/dashboard/ui";
import { AlertDialog, ProcessingOverlay } from "@/components/ui/Feedback";
import { Field, inputCls, postJson, spinner, type Errors } from "@/components/ui/form";
import { toast } from "@/components/ui/Toast";
import { useContact } from "@/components/layout/ContactProvider";
import { isPast, listBookings, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { saveBooking } from "@/lib/booking/store";
import { fmtLongDate } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { BookingDetailsBody } from "./BookingDetails";

const submitCls =
  "press flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-[14px] text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60";
const norm = (s: string) => s.trim().toLowerCase();

/** Demo mode: the same check the server makes, against bookings stored in this browser. */
function findDemoBooking(reference: string, who: string) {
  const ref = reference.trim().toUpperCase();
  return listBookings().find(
    (b) =>
      b.reservation.pnr.toUpperCase() === ref &&
      (b.travellers ?? []).some((t) => norm(t.surname) === norm(who) || (who.includes("@") && norm(t.email) === norm(who))),
  );
}

/**
 * /manage-booking: a guest finds a booking with its reference and the lead passenger's surname or
 * email, then sees the same details as the dashboard and can pay or print.
 */
export function ManageBooking() {
  const router = useRouter();
  const params = useSearchParams();
  const [v, setV] = useState({ reference: params.get("ref") ?? "", surname: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [booking, setBooking] = useState<HistoryBooking | null>(null);
  // When the booking was fetched; deadlines are compared to this, not the clock during render.
  const [checkedAt, setCheckedAt] = useState(0);
  const [overlay, setOverlay] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);
  const contact = useContact();
  const [paying, setPaying] = useState(false);

  const find = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    const { errors, data } = await postJson<{ booking?: HistoryBooking; demo?: boolean }>("/api/bookings/lookup", v);
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    const found = data?.demo ? findDemoBooking(v.reference, v.surname) : data?.booking;
    if (!found)
      return setErrors({ form: "We couldn't find a booking with those details. Check the booking reference and the lead passenger's surname or email." });
    setErrors({});
    setPaying(false);
    setCheckedAt(Date.now());
    setBooking(found);
  };

  /** Same hand-off as checkout: start payment with the backend, then go to the gateway. */
  const pay = async (choice: LiveChoice) => {
    const b = booking;
    const r = b?.reservation;
    if (!b || !r?.bookingId || !r.flightId) return;
    setOverlay(choice.method === "WALK_IN_TRANSFER" ? "Holding your seat, please wait..." : "Connecting to secure payment...");
    try {
      const { errors, data } = await postJson<{
        authorizationUrl?: string;
        transactionRef?: string;
        held?: boolean;
        alreadyPaid?: boolean;
        expiresAt?: string;
      }>("/api/bookings", {
        action: "pay",
        bookingId: r.bookingId,
        flightId: r.flightId,
        reference: r.pnr,
        ...choice,
      });
      if (Object.keys(errors).length || !data) throw new Error(errors.form ?? Object.values(errors)[0]);
      const amount = r.payable ?? b.payment.amount ?? bookingTotals(b).payable;
      if (data.alreadyPaid) {
        setOverlay(null);
        toast.success("This booking is already paid.");
        return find();
      }
      if (data.held) {
        saveBooking({
          ...b,
          reservation: { ...r, expiresAt: data.expiresAt ?? r.expiresAt },
          payment: { method: "hold", methodLabel: choice.label, status: "reserved", transactionRef: data.transactionRef ?? null, paidAt: null, amount, fee: 0 },
        });
        router.push("/booking-success?payment_method=hold&status=reserved");
        return;
      }
      if (!data.authorizationUrl) throw new Error();
      saveBooking({
        ...b,
        payment: {
          method: choice.kind,
          methodLabel: choice.label,
          status: "processing",
          transactionRef: data.transactionRef ?? null,
          paidAt: null,
          amount,
          fee: 0,
        },
      });
      sessionStorage.setItem("tbils.paymentReturn", JSON.stringify({ variant: "site", reference: r.pnr }));
      window.location.assign(data.authorizationUrl);
    } catch (err) {
      setOverlay(null);
      setAlert({
        title: "We couldn't start your payment",
        message: err instanceof Error && err.message ? err.message : "Please try again, or choose a different payment method.",
      });
    }
  };

  if (!booking) {
    return (
      <div className="mx-auto grid max-w-[980px] items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="animate-[fade-up_0.55s_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none">
          <span className="float-card inline-grid size-14 place-items-center rounded-2xl bg-[rgba(2,144,222,0.1)] text-blue">
            <TicketCheck className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-[28px] font-extrabold leading-tight text-ink-900">Find your booking</h2>
          <p className="mt-2 max-w-[440px] text-[15px] leading-[1.6] text-ink-500">
            Use the booking reference from your confirmation email (it starts with TW-) and the lead passenger&apos;s surname or email. You can check your trip,
            pay for a booking on hold, print it, or contact support.
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-500">
            <Lock className="size-4 text-blue" /> We only show a booking when both details match.
          </p>
        </div>

        <form
          onSubmit={find}
          noValidate
          className="animate-[fade-up_0.55s_cubic-bezier(0.16,1,0.3,1)_120ms_backwards] motion-reduce:animate-none rounded-[20px] border border-[#e3ebf3] bg-white p-6 shadow-[0_18px_44px_rgba(1,40,74,0.08)]"
        >
          {errors.form && (
            <p role="alert" className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-3 text-sm text-[#b91c1c] animate-[acc-reveal_0.3s_ease]">
              {errors.form}
            </p>
          )}
          <div className="grid gap-4">
            <Field label="Booking reference" htmlFor="mb-ref" error={errors.reference}>
              <input
                id="mb-ref"
                value={v.reference}
                onChange={(e) => setV((s) => ({ ...s, reference: e.target.value.toUpperCase() }))}
                placeholder="TW-ABC123XYZ"
                autoComplete="off"
                spellCheck={false}
                className={cn(inputCls, "uppercase tracking-[0.04em]", errors.reference && "border-error")}
              />
            </Field>
            <Field label="Lead passenger's surname or email" htmlFor="mb-who" error={errors.surname}>
              <input
                id="mb-who"
                value={v.surname}
                onChange={(e) => setV((s) => ({ ...s, surname: e.target.value }))}
                placeholder="e.g. Okafor"
                autoComplete="family-name"
                className={cn(inputCls, errors.surname && "border-error")}
              />
            </Field>
            <button type="submit" disabled={busy} className={submitCls}>
              {busy ? spinner : <Search className="size-4" />}
              {busy ? "Finding your booking…" : "Find booking"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const b = booking;
  // An unpaid booking past its payment deadline has been released by the airline: nothing left to pay or cancel.
  const expired = b.payment.status !== "confirmed" && b.status !== "confirmed" && new Date(b.reservation.expiresAt).getTime() < checkedAt;
  const canPay = (b.status === "hold" || b.status === "pending") && b.payment.status !== "confirmed" && !isPast(b) && !expired && !!b.live;

  return (
    <div className="mx-auto max-w-[760px] animate-[rise-in_0.45s_cubic-bezier(0.16,1,0.3,1)]">
      <button type="button" onClick={() => setBooking(null)} className={cn(ghostBtn, "mb-3 -ml-3 print:hidden")}>
        <ArrowLeft className="size-4" /> Find another booking
      </button>

      <div className="overflow-hidden rounded-[20px] border border-[#e3ebf3] bg-white shadow-[0_18px_44px_rgba(1,40,74,0.08)]">
        <header className="bg-[linear-gradient(140deg,#0a1628,#013557_55%,#0290de)] px-5 py-5 text-white">
          <p className="text-xs font-semibold text-[#8fd0ff]">Booking {b.reservation.pnr}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">
            {b.offer.journeys[0].from.city} → {b.offer.journeys[0].to.city}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {b.search.trip === "round" ? "Round trip" : b.search.trip === "multi" ? "Multi-city" : "One-way"} · {fmtLongDate(b.offer.journeys[0].depart)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge status={b.status} className="bg-white" />
            {b.status === "hold" && (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">
                {expired ? "Payment deadline passed" : "Pay before"}{" "}
                {new Date(b.reservation.expiresAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </header>
        {expired && (
          <p role="status" className="border-b border-[#fde68a] bg-[#fffbeb] px-5 py-3 text-sm text-[#92400e] print:hidden">
            The payment deadline for this booking has passed, so the seat has been released. Search again to book this route, or contact us if you&apos;ve
            already paid.
          </p>
        )}

        <BookingDetailsBody b={b} />

        <footer className="flex flex-wrap items-center gap-2 border-t border-[#eef1f5] px-5 py-4 print:hidden">
          {canPay && !paying && (
            <button
              type="button"
              onClick={() => setPaying(true)}
              className="press flex-1 rounded-xl bg-orange px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              Complete payment
            </button>
          )}
          <button type="button" onClick={() => window.print()} className={cn(outlineBtn, "px-4")}>
            <Printer className="size-4" /> Print
          </button>
          {contact.whatsapp && (
            <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <MessageCircle className="size-4" /> Support
            </a>
          )}
        </footer>
      </div>

      {canPay && paying && (
        <section
          aria-label="Payment"
          className="mt-5 rounded-[20px] border border-[#e3ebf3] bg-white p-5 shadow-[0_18px_44px_rgba(1,40,74,0.08)] animate-[acc-reveal_0.3s_ease] print:hidden"
        >
          <LivePayment draft={b} onPay={pay} />
        </section>
      )}

      <ProcessingOverlay open={!!overlay} message={overlay ?? ""} />
      <AlertDialog open={!!alert} title={alert?.title} message={alert?.message ?? ""} onClose={() => setAlert(null)} />
    </div>
  );
}
