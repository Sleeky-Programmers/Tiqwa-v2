import { mapBooking } from "@/lib/api/mappers";
import type { WlBookingDetails } from "@/lib/api/types";
import { fail, isLive, sessionToken, upstream } from "@/lib/api/upstream";
import type { HistoryBooking } from "@/lib/booking/history";

/**
 * GET → { live, bookings }. Live: /user/flight-bookings for the signed-in user.
 * Demo mode answers `{ live: false }` and the dashboard uses its local mock history instead.
 */
export async function GET() {
  await sessionToken();
  if (!isLive()) return Response.json({ live: false, bookings: [] });

  const res = await upstream<WlBookingDetails[] | { itemList?: WlBookingDetails[] }>("/user/flight-bookings", {
    fallback: "We couldn't load your bookings right now. Please try again.",
  });
  if (!res.ok) return fail(res.error);
  const rows = Array.isArray(res.data) ? res.data : res.data?.itemList ?? [];
  const bookings = rows.map((r) => mapBooking(r)).filter((b): b is HistoryBooking => !!b);
  bookings.sort((a, b) => (b.bookedAt ?? "").localeCompare(a.bookedAt ?? ""));
  return Response.json({ live: true, bookings });
}
