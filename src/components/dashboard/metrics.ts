import { getAirport } from "@/data/airports";
import { firstDeparture, isUpcoming, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { distanceKm } from "@/lib/flights/geo";
import type { MonthPoint } from "./SpendChart";

const paidAmount = (b: HistoryBooking) => (b.status === "cancelled" || b.payment.status !== "confirmed" ? 0 : bookingTotals(b).total);

/** Everything the dashboard home shows, derived from the booking list. */
export function dashboardMetrics(bookings: HistoryBooking[]) {
  const upcoming = bookings.filter(isUpcoming).sort((a, b) => firstDeparture(a).localeCompare(firstDeparture(b)));
  const completed = bookings.filter((b) => b.status === "completed");
  const km = completed.reduce(
    (s, b) => s + b.offer.journeys.flatMap((j) => j.segments).reduce((t, seg) => t + distanceKm(seg.from.code, seg.to.code), 0),
    0,
  );
  const countries = new Set(completed.flatMap((b) => b.offer.journeys.map((j) => getAirport(j.to.code)?.country)).filter(Boolean));
  const year = new Date().getFullYear();
  const spentThisYear = bookings.filter((b) => b.bookedAt?.startsWith(String(year))).reduce((s, b) => s + paidAmount(b), 0);

  // Last 12 calendar months of paid spend, by booking date.
  const now = new Date();
  const months: MonthPoint[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      long: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      value: 0,
    };
  });
  for (const b of bookings) {
    const m = months.find((x) => b.bookedAt?.startsWith(x.key));
    if (m) m.value += paidAmount(b);
  }

  // Most-visited destinations (outbound city of each completed or upcoming trip).
  const dest = new Map<string, { city: string; country: string; trips: number }>();
  for (const b of bookings.filter((x) => x.status !== "cancelled")) {
    const to = b.offer.journeys[0].to;
    const cur = dest.get(to.city) ?? { city: to.city, country: to.country, trips: 0 };
    cur.trips += 1;
    dest.set(to.city, cur);
  }

  const needsAction = bookings.filter((b) => b.status === "hold" || b.status === "pending");

  return {
    upcoming,
    next: upcoming[0] ?? null,
    tripsTaken: completed.length,
    km: Math.round(km),
    countries: countries.size,
    spentThisYear,
    months,
    topDestinations: [...dest.values()].sort((a, b) => b.trips - a.trips).slice(0, 4),
    needsAction,
  };
}
