import type { NextRequest } from "next/server";
import { LockBusyError } from "@/lib/api/idempotency";
import { bookingDetails, issueOnce } from "@/lib/api/issue";
import { bookingStatus, mapBooking } from "@/lib/api/mappers";
import { fail, isLive, upstream } from "@/lib/api/upstream";

// Query params each gateway appends to the return URL, forwarded to /payment/callback as-is.
// Paystack: reference, trxref. Flutterwave: status, tx_ref, transaction_id (verification needs the id).
const GATEWAY_PARAMS = ["reference", "trxref", "tx_ref", "transaction_id", "status"] as const;

/**
 * GET /api/payments/verify?<gateway return params>&booking=<booking reference>
 * After the gateway redirects back: /payment/callback (status 200 = paid, booking → PAID) →
 * issue it once (PAID → BOOKED) → booking details for the confirmation page.
 * Safe to repeat (reloads, "Check again", two tabs): the callback is idempotent upstream and the
 * issue step is guarded by `issueOnce`.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const reference = q.get("reference") ?? q.get("trxref") ?? q.get("tx_ref") ?? "";
  const bookingRef = q.get("booking") ?? "";
  if (!reference) return fail({ code: "INVALID", status: 400, message: "We couldn't find a payment reference to check." });
  if (!isLive()) return fail({ code: "NOT_CONFIGURED", status: 503, message: "Payments aren't connected in demo mode." });

  const query: Record<string, string> = { reference, trxref: q.get("trxref") ?? reference };
  for (const k of GATEWAY_PARAMS) {
    const v = q.get(k);
    if (v) query[k] = v;
  }
  const callback = await upstream<{ status?: number | string; booking_id?: string | number; flight_id?: string }>("/payment/callback", {
    query,
    timeoutMs: 45_000,
    fallback: "We couldn't confirm your payment yet. If you were charged, contact us with your booking reference.",
  });
  // A 4xx from the callback means the gateway has no successful payment for this reference.
  if (!callback.ok && callback.error.status >= 500) return fail(callback.error);
  if (!callback.ok) console.warn("[payments/verify] callback", callback.error.status, callback.error.message);
  const confirmed = callback.ok && Number(callback.data?.status) === 200;
  const bookingId = confirmed ? String(callback.data?.booking_id ?? "") : "";
  const flightId = confirmed ? (callback.data?.flight_id ?? "") : "";

  try {
    if (!bookingId || !flightId) {
      // The booking itself is the source of truth when the gateway check can't confirm (e.g. it was
      // settled in another tab). A paid booking whose issue step failed earlier is issued now.
      const d = bookingRef ? await bookingDetails(bookingRef) : null;
      const paid = confirmed || (!!d && bookingStatus(d.status, !!d.ticket_issued) === "confirmed");
      const booking = paid && d?.booking_id && d.flight_id ? await issueOnce(String(d.booking_id), d.flight_id, bookingRef) : d;
      return Response.json({ paid, booking: booking ? mapBooking(booking) : null });
    }
    const booking = await issueOnce(bookingId, flightId, bookingRef);
    return Response.json({ paid: true, booking: booking ? mapBooking(booking) : null });
  } catch (e) {
    if (e instanceof LockBusyError)
      return fail({ code: "IN_PROGRESS", status: 409, message: "We're still confirming this payment. Please wait a moment and check again." });
    throw e;
  }
}
