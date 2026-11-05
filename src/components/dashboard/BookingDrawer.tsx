"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, MessageCircle, Printer, X } from "lucide-react";
import { BookingDetailsBody, CancelDialog } from "@/components/booking/BookingDetails";
import { ProcessingOverlay } from "@/components/ui/Feedback";
import { toast } from "@/components/ui/Toast";
import { contact } from "@/data/contact";
import { fullName, useProfile } from "@/lib/account";
import { isPast, updateBooking, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { saveBooking } from "@/lib/booking/store";
import { fmtLongDate, naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { ghostBtn, outlineBtn, primaryBtn, StatusBadge } from "./ui";

/**
 * Right-hand slide-in panel with one booking's details and actions.
 * Live bookings: "Pay now" restarts payment with the backend (card via the first active gateway) and
 * cancelling sends a request to the support team (the backend has no cancel endpoint).
 * Demo bookings: both are simulated in localStorage via `updateBooking`.
 */
export function BookingDrawer({ booking, onClose, onChanged }: { booking: HistoryBooking | null; onClose: () => void; onChanged: () => void }) {
  const [visible, setVisible] = useState<HistoryBooking | null>(booking);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const user = useProfile();
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

  const payLive = async () => {
    setBusy("Connecting to secure payment...");
    try {
      const opts = await fetch("/api/payment-options").then((r) => r.json());
      const method = opts?.methods?.find((m: { id: string }) => m.id === "CARD") ?? opts?.methods?.find((m: { id: string }) => m.id !== "WALK_IN_TRANSFER");
      const gateway = opts?.gateways?.[0];
      if (!method || !gateway) throw new Error("Online payment isn't available right now. Please contact support to pay.");
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay", bookingId: b.reservation.bookingId, flightId: b.reservation.flightId, reference: ref, method: method.id, gateway: gateway.id }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.alreadyPaid) {
        // Settled elsewhere (another tab or device); refresh instead of opening a second payment.
        setBusy(null);
        onChanged();
        toast.success("This booking is already paid. We've refreshed its status.");
        return;
      }
      if (!res.ok || !json?.authorizationUrl) throw new Error(json?.error?.message ?? "We couldn't start your payment. Please try again.");
      saveBooking({ ...b, payment: { ...b.payment, method: "card", methodLabel: `${method.title} via ${gateway.name}`, status: "processing" } });
      sessionStorage.setItem("tbils.paymentReturn", JSON.stringify({ variant: "dashboard", reference: ref }));
      window.location.assign(json.authorizationUrl);
    } catch (e) {
      setBusy(null);
      toast.error(e instanceof Error ? e.message : "We couldn't start your payment.");
    }
  };

  const requestCancel = async () => {
    setConfirmCancel(false);
    setBusy("Sending your cancellation request...");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName(user) || "TBiLS customer",
          email: user.email,
          phone: user.phone,
          subject: `Cancellation request: ${ref}`,
          message: `Please cancel booking ${ref} (${b.offer.journeys[0].from.code} to ${b.offer.journeys[0].to.code}, departing ${fmtLongDate(b.offer.journeys[0].depart)}). Airline PNR: ${b.reservation.airlinePnr}.`,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't send your request.");
      toast.success("Cancellation request sent. Our team will confirm by email, including any refund under the fare rules.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "We couldn't send your request. Please contact support.");
    } finally {
      setBusy(null);
    }
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
    if (b.live) return requestCancel();
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
          <BookingDetailsBody b={b} />
        </div>

        <footer className="flex flex-wrap items-center gap-2 border-t border-[#eef1f5] bg-white px-5 py-4 print:hidden">
          {canPay && (
            <button type="button" onClick={b.live ? payLive : payNow} className={cn(primaryBtn, "press flex-1")}>
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
          <a href={contact.whatsapp.href} target="_blank" rel="noopener noreferrer" className={ghostBtn}>
            <MessageCircle className="size-4" /> Support
          </a>
          {canCancel && (
            <button type="button" onClick={() => setConfirmCancel(true)} className={cn(ghostBtn, "ml-auto text-error hover:bg-[#fef2f2] hover:text-error")}>
              {b.live ? "Request cancellation" : "Cancel booking"}
            </button>
          )}
        </footer>
      </div>

      <ProcessingOverlay open={!!busy} message={busy ?? ""} />
      {confirmCancel && <CancelDialog live={!!b.live} onKeep={() => setConfirmCancel(false)} onCancel={cancel} refundNote={b.offer.fareRules.refundNote} />}
    </>,
    document.body,
  );
}

