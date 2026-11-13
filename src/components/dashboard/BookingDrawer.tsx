"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, MessageCircle, Printer, X } from "lucide-react";
import { BookingDetailsBody } from "@/components/booking/BookingDetails";
import { LivePayment, type LiveChoice } from "@/components/checkout/LivePayment";
import { postJson } from "@/components/ui/form";
import { ProcessingOverlay } from "@/components/ui/Feedback";
import { toast } from "@/components/ui/Toast";
import { useContact } from "@/components/layout/ContactProvider";
import { updateBooking, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { saveBooking } from "@/lib/booking/store";
import { fmtLongDate, naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { ghostBtn, outlineBtn, primaryBtn, StatusBadge } from "./ui";

/**
 * Right-hand slide-in panel with one booking's details and actions.
 * Live bookings: "Pay now" restarts payment with the backend (card via the first active gateway).
 * Demo bookings: it is simulated in localStorage via `updateBooking`.
 * There is no cancel action: the backend does not let customers cancel a booking.
 */
export function BookingDrawer({ booking, onClose, onChanged }: { booking: HistoryBooking | null; onClose: () => void; onChanged: () => void }) {
  const [visible, setVisible] = useState<HistoryBooking | null>(booking);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const contact = useContact();
  /** Reference of the booking whose payment options are open. */
  const [choosing, setChoosing] = useState<string | null>(null);
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [booking, onClose]);

  if (!visible || typeof document === "undefined") return null;
  const b = visible;
  const t = bookingTotals(b);
  const ref = b.reservation.pnr;
  const canPay = b.status === "hold" || b.status === "pending";
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

  /** Start payment with the method the customer picked, then hand over to the gateway. */
  const payWith = async (choice: LiveChoice) => {
    setBusy(choice.method === "WALK_IN_TRANSFER" ? "Holding your seat, please wait..." : "Connecting to secure payment...");
    try {
      const { errors, data } = await postJson<{ authorizationUrl?: string; transactionRef?: string; held?: boolean; alreadyPaid?: boolean }>("/api/bookings", {
        action: "pay",
        bookingId: b.reservation.bookingId,
        flightId: b.reservation.flightId,
        reference: ref,
        ...choice,
      });
      if (Object.keys(errors).length || !data) throw new Error(errors.form ?? Object.values(errors)[0]);
      if (data.alreadyPaid) {
        // Settled elsewhere (another tab or device); refresh instead of opening a second payment.
        setBusy(null);
        setChoosing(null);
        onChanged();
        toast.success("This booking is already paid. We've refreshed its status.");
        return;
      }
      if (data.held) {
        setBusy(null);
        setChoosing(null);
        onChanged();
        toast.success("Your seat is on hold. Pay by bank transfer before the deadline.");
        return;
      }
      if (!data.authorizationUrl) throw new Error();
      saveBooking({
        ...b,
        payment: { ...b.payment, method: choice.kind, methodLabel: choice.label, status: "processing", transactionRef: data.transactionRef ?? null },
      });
      sessionStorage.setItem("tbils.paymentReturn", JSON.stringify({ variant: "dashboard", reference: ref }));
      window.location.assign(data.authorizationUrl);
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error && e.message ? e.message : "We couldn't start your payment. Please try again.");
    }
  };

  const payNow = () =>
    act(
      "Processing your payment, please wait...",
      () => {
        const now = new Date();
        return {
          status: "confirmed",
          payment: {
            ...b.payment,
            method: "paystack",
            status: "confirmed",
            paidAt: now.toISOString(),
            transactionRef: `T${now.getTime()}`,
            amount: t.payable,
            fee: t.gatewayFee,
          },
        };
      },
      `Payment received. Booking ${ref} is confirmed.`,
    );

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[2200] bg-[rgba(5,20,35,0.55)] backdrop-blur-[4px] transition-opacity duration-300 print:hidden",
          open ? "opacity-100" : "opacity-0",
        )}
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
          <BookingDetailsBody b={b} />
          {b.live && canPay && choosing === ref && (
            <section aria-label="Payment" className="m-5 rounded-2xl border border-[#e3ebf3] bg-white p-5 animate-[acc-reveal_0.3s_ease] print:hidden">
              <LivePayment draft={b} onPay={payWith} />
            </section>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-[#eef1f5] bg-white px-5 py-4 print:hidden">
          {canPay && !(b.live && choosing === ref) && (
            <button type="button" onClick={b.live ? () => setChoosing(ref) : payNow} className={cn(primaryBtn, "press flex-1")}>
              Pay {naira(b.live ? b.payment.amount : t.payable)} now
            </button>
          )}
          <button type="button" onClick={() => window.print()} className={cn(outlineBtn, "px-4")} aria-label="Print booking">
            <Printer className="size-4" /> <span className="max-sm:hidden">Print</span>
          </button>
          {b.payment.status === "confirmed" && b.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => (b.live ? window.print() : toast.success(`E-ticket for ${ref} downloaded (mock).`))}
              className={cn(outlineBtn, "px-4")}
            >
              <Download className="size-4" /> <span className="max-sm:hidden">E-ticket</span>
            </button>
          )}
          {contact.whatsapp && (
            <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
              <MessageCircle className="size-4" /> Support
            </a>
          )}
        </footer>
      </div>

      <ProcessingOverlay open={!!busy} message={busy ?? ""} />
    </>,
    document.body,
  );
}
