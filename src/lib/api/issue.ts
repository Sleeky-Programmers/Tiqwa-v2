import { recall, remember, withLock } from "./idempotency";
import { isIssued } from "./mappers";
import type { WlBookingDetails } from "./types";
import { upstream } from "./upstream";

export const bookingDetails = async (ref: string) => {
  const res = await upstream<WlBookingDetails>(`/flight/booking-details/${encodeURIComponent(ref)}`);
  return res.ok ? res.data : null;
};

/**
 * Issue a paid booking (/flight/book: PAID → BOOKED) at most once, and return its details.
 * Runs under a per-booking lock and re-reads the booking first, so reloads, retries and parallel
 * tabs find it already issued and skip the call. A failed issue is left for the next attempt.
 */
export function issueOnce(bookingId: string, flightId: string, bookingRef = "") {
  return withLock(`issue:${bookingId}`, async () => {
    const issuedRef = await recall<string>(`issued:${bookingId}`);
    const ref = bookingRef || issuedRef || "";
    const d = ref ? await bookingDetails(ref) : null;
    if (issuedRef || (d && isIssued(d))) return d;

    console.info("[issue] issuing booking", bookingId);
    const finalize = await upstream<WlBookingDetails>("/flight/book", {
      method: "POST",
      body: { booking_id: bookingId, flight_id: flightId },
      timeoutMs: 45_000,
    });
    if (!finalize.ok) {
      // Ticketing can lag behind payment; the booking still shows as paid and a retry issues it.
      console.warn("[issue] finalize failed", bookingId, finalize.error.status, finalize.error.message);
      return d;
    }
    // The response is the issued booking; remember it so repeats skip straight to the details.
    await remember(`issued:${bookingId}`, finalize.data?.reference || ref);
    return finalize.data?.reference ? finalize.data : ref ? await bookingDetails(ref) : d;
  });
}
