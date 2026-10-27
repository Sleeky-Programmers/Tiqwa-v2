import type { Metadata } from "next";
import { Suspense } from "react";
import { FlightResults } from "@/components/flights/FlightResults";

export const metadata: Metadata = { title: "Flight results" };

export default function DashboardFlightResultsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
      <FlightResults variant="dashboard" />
    </Suspense>
  );
}
