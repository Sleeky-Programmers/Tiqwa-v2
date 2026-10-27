import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingsPage } from "@/components/dashboard/BookingsPage";

export const metadata: Metadata = { title: "My bookings" };

export default function DashboardBookingsPage() {
  return (
    <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
      <BookingsPage />
    </Suspense>
  );
}
