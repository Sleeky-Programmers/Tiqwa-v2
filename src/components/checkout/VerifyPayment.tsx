"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CircleCheck, CircleX, Plane } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { contact } from "@/data/contact";
import { bookingRoutes, type BookingVariant } from "@/lib/booking/routes";
import { loadBooking, saveBooking, type BookingDraft } from "@/lib/booking/store";
import { cn } from "@/lib/utils";

type State = { phase: "checking" } | { phase: "paid" } | { phase: "failed"; message: string };
type Verified = { ok: boolean; json: { paid?: boolean; booking?: BookingDraft | null; error?: { message?: string } } | null };

// One request per check: a remounted effect (React Strict Mode) reuses the request already in flight
// instead of asking the gateway and issuing the booking twice.
const inflight = new Map<string, Promise<Verified>>();
function verify(url: string, attempt: number): Promise<Verified> {
  const key = `${attempt}:${url}`;
  let p = inflight.get(key);
  if (!p) {
    p = fetch(url).then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => null) }));
    inflight.set(key, p);
    p.finally(() => inflight.delete(key)).catch(() => {});
  }
  return p;
}

/**
 * Where the payment gateway sends the traveller back (Paystack: ?reference=&trxref=, Flutterwave:
 * ?status=&tx_ref=). Confirms the payment with the backend, issues the booking and moves on to the
 * confirmation page of whichever flow (site or dashboard) started the payment.
 */
export function VerifyPayment() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<State>({ phase: "checking" });
  const [attempt, setAttempt] = useState(0);
  const reference = params.get("reference") ?? params.get("trxref") ?? params.get("tx_ref") ?? "";
  // The query string, not the params object: a new object with the same values must not re-run the check.
  const search = params.toString();
  const [back, setBack] = useState<{ variant: BookingVariant; reference: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sp = new URLSearchParams(search);
    let ret: { variant: BookingVariant; reference: string } | null = null;
    try {
      ret = JSON.parse(sessionStorage.getItem("tbils.paymentReturn") ?? "null");
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only
    setBack(ret);
    const routes = bookingRoutes(ret?.variant ?? "site");

    (async () => {
      if (sp.get("status") === "cancelled") return setState({ phase: "failed", message: "You cancelled the payment. Your seat is still reserved until the payment deadline." });
      if (!reference) return setState({ phase: "failed", message: "We couldn't find a payment to check. If you were charged, contact us with your booking reference." });
      try {
        // Forward everything the gateway sent back: Flutterwave is only verified with its transaction_id.
        const qs = new URLSearchParams(sp);
        qs.set("booking", ret?.reference ?? "");
        const { ok, json } = await verify(`/api/payments/verify?${qs}`, attempt);
        if (cancelled) return;
        if (!ok || !json) throw new Error(json?.error?.message);
        if (!json.paid) {
          return setState({ phase: "failed", message: "Your payment wasn't completed. No booking has been issued yet. You can try again before the payment deadline." });
        }
        const booking = json.booking ?? null;
        // The saved checkout draft is richer (add-ons, labels), but only when it is this booking.
        const ref = ret?.reference || booking?.reservation?.pnr;
        const draft = loadBooking();
        const base: BookingDraft | null = (draft && (!ref || draft.reservation?.pnr === ref) ? draft : null) ?? booking;
        if (base) {
          saveBooking({
            ...base,
            live: true,
            reservation: base.reservation && booking?.reservation ? { ...base.reservation, airlinePnr: booking.reservation.airlinePnr || base.reservation.airlinePnr } : base.reservation ?? booking?.reservation,
            payment: {
              method: base.payment?.method ?? "card",
              methodLabel: base.payment?.methodLabel,
              amount: base.payment?.amount ?? booking?.payment?.amount ?? 0,
              fee: 0,
              status: "confirmed",
              transactionRef: reference,
              paidAt: new Date().toISOString(),
            },
            bookedAt: base.bookedAt ?? new Date().toISOString(),
          });
        }
        sessionStorage.removeItem("tbils.paymentReturn");
        setState({ phase: "paid" });
        window.setTimeout(() => router.replace(`${routes.success}?payment_method=card`), 1400);
      } catch (e) {
        if (!cancelled) setState({ phase: "failed", message: e instanceof Error && e.message ? e.message : "We couldn't confirm your payment yet. If you were charged, contact us with your booking reference." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt, search, reference, router]);

  const routes = bookingRoutes(back?.variant ?? "site");

  return (
    <main id="main" className="flex min-h-screen flex-1 flex-col items-center justify-center bg-[linear-gradient(160deg,#f4f6f9,#eaf4fb)] px-4 py-10">
      <Logo tone="dark" width={120} className="mb-8" />
      <div className="w-full max-w-[460px] rounded-[20px] border border-[#e3ecf5] bg-white p-8 text-center shadow-[0_24px_60px_rgba(1,40,74,0.1)] animate-[rise-in_0.5s_cubic-bezier(0.16,1,0.3,1)]">
        <span
          className={cn(
            "mx-auto mb-5 grid size-16 place-items-center rounded-full",
            state.phase === "failed" ? "bg-[#fef2f2] text-error" : state.phase === "paid" ? "bg-[#dcfce7] text-[#16a34a]" : "glow-ring bg-[rgba(2,144,222,0.1)] text-blue",
          )}
        >
          {state.phase === "failed" ? (
            <CircleX className="size-8" />
          ) : state.phase === "paid" ? (
            <CircleCheck className="size-8 animate-[rise-in_0.4s_ease]" />
          ) : (
            <Plane className="size-7 animate-[bob_1.6s_ease-in-out_infinite]" />
          )}
        </span>
        <h1 className="font-display text-2xl font-extrabold text-ink-900" aria-live="polite">
          {state.phase === "checking" ? "Confirming your payment…" : state.phase === "paid" ? "Payment confirmed" : "Payment not confirmed"}
        </h1>
        <p className="mt-2 text-[15px] leading-[1.55] text-ink-500">
          {state.phase === "checking"
            ? "Please keep this page open while we confirm your payment with the airline. This can take up to a minute."
            : state.phase === "paid"
              ? "Your booking is being issued. Taking you to your confirmation…"
              : state.message}
        </p>
        {state.phase === "checking" && (
          <div className="relative mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-[#e5eef6]">
            <span className="absolute inset-y-0 w-1/3 rounded-full bg-[linear-gradient(90deg,#0290de,#f58634)] animate-[indeterminate_1.3s_ease-in-out_infinite]" />
          </div>
        )}
        {state.phase === "failed" && (
          <div className="mt-6 grid gap-2.5">
            {reference && (
              <button
                type="button"
                onClick={() => {
                  setState({ phase: "checking" });
                  setAttempt((n) => n + 1);
                }}
                className="press rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-3 text-[15px] font-bold text-white"
              >
                Check again
              </button>
            )}
            <Link href={routes.checkout} className="press rounded-xl border-[1.5px] border-blue py-3 text-[15px] font-bold text-blue hover:bg-sky-50">
              Back to my booking
            </Link>
            <p className="mt-2 text-xs text-ink-500">
              Need help? WhatsApp{" "}
              <a href={contact.whatsapp.href} className="font-semibold text-ink-900">
                {contact.whatsapp.display}
              </a>{" "}
              {back?.reference ? <>and quote {back.reference}</> : null}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
