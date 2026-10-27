import { CalendarCheck, LayoutDashboard, Plane, UserRound } from "lucide-react";

export const dashboardNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/flights", label: "Flights", icon: Plane },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
] as const;

/** Title + breadcrumb for the top bar, from the current path. */
export function pageMeta(path: string): { title: string; crumbs: { label: string; href?: string }[] } {
  if (path.startsWith("/dashboard/flights/results")) {
    return { title: "Flight results", crumbs: [{ label: "Flights", href: "/dashboard/flights" }, { label: "Results" }] };
  }
  if (path.startsWith("/dashboard/flights")) return { title: "Search flights", crumbs: [{ label: "Flights" }] };
  if (path.startsWith("/dashboard/bookings")) return { title: "My bookings", crumbs: [{ label: "Bookings" }] };
  if (path.startsWith("/dashboard/profile")) return { title: "Profile", crumbs: [{ label: "Profile" }] };
  return { title: "Dashboard", crumbs: [{ label: "Overview" }] };
}
