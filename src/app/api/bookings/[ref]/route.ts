import { mapBooking } from "@/lib/api/mappers";
import type { WlBookingDetails } from "@/lib/api/types";
import { fail, isLive, upstream } from "@/lib/api/upstream";

/** GET /api/bookings/{reference} → { booking }. Live: /flight/booking-details/{reference}. */
export async function GET(_request: Request, ctx: RouteContext<"/api/bookings/[ref]">) {
  const { ref } = await ctx.params;
  if (!isLive()) return fail({ code: "NOT_FOUND", status: 404, message: "Booking not found." });

  const res = await upstream<WlBookingDetails>(`/flight/booking-details/${encodeURIComponent(ref)}`, {
    fallback: "We couldn't load this booking right now. Please try again.",
  });
  if (!res.ok) return fail(res.error);
  const booking = mapBooking(res.data);
  if (!booking) return fail({ code: "NOT_FOUND", status: 404, message: "Booking not found." });
  return Response.json({ booking });
}
