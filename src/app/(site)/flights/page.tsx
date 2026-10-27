import type { Metadata } from "next";
import { Suspense } from "react";
import { FlightResults } from "@/components/flights/FlightResults";

export const metadata: Metadata = { title: "Flight Results | Compare Fares & Book Instantly" };

export default function FlightsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f4f6f9]" />}>
      <FlightResults />
    </Suspense>
  );
}
