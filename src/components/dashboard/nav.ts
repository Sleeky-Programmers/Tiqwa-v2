import { CalendarCheck, LayoutDashboard, Plane, UserRound } from "lucide-react";

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/flights", label: "Flights", icon: Plane },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
] as const;

export type PageMeta = { title: string; crumbs: { label: string; href?: string }[]; back?: { href: string; label: string } };

/**
 * Title, breadcrumb and back target for the top bar, from the current path. The booking flow
 * (search → results → booking details → confirmation) nests under Flights, so the sidebar,
 * breadcrumb and back button always agree. `resultsHref` is the results URL for the flight being booked.
 */
export function pageMeta(path: string, resultsHref = "/dashboard/flights/results"): PageMeta {
  const flights = { label: "Flights", href: "/dashboard/flights" };
  if (path.startsWith("/dashboard/flights/checkout")) {
    return {
      title: "Booking details",
      crumbs: [flights, { label: "Results", href: resultsHref }, { label: "Booking details" }],
      back: { href: resultsHref, label: "Back to results" },
    };
  }
  if (path.startsWith("/dashboard/flights/booking-success")) {
    return { title: "Booking confirmation", crumbs: [flights, { label: "Confirmation" }] };
  }
  if (path.startsWith("/dashboard/flights/results")) {
    return { title: "Flight results", crumbs: [flights, { label: "Results" }], back: { href: "/dashboard/flights", label: "Back to search" } };
  }
  if (path.startsWith("/dashboard/flights")) return { title: "Search flights", crumbs: [{ label: "Flights" }] };
  if (path.startsWith("/dashboard/bookings")) return { title: "My bookings", crumbs: [{ label: "Bookings" }] };
  if (path.startsWith("/dashboard/profile")) return { title: "Profile", crumbs: [{ label: "Profile" }] };
  return { title: "Dashboard", crumbs: [{ label: "Overview" }] };
}
