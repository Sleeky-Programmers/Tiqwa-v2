import type { Metadata } from "next";
import { FlightSearchPage } from "@/components/dashboard/FlightSearchPage";

export const metadata: Metadata = { title: "Search flights" };

export default function DashboardFlightsPage() {
  return <FlightSearchPage />;
}
