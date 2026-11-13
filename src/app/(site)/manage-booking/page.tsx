import type { Metadata } from "next";
import { Suspense } from "react";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Manage booking",
  description: "Find your TBiLS booking with your booking reference and surname. Check your trip, pay for a booking on hold or print it.",
};

export default function Page() {
  return (
    <PageShell title="Manage booking" intro="Check your trip, complete payment or print your booking. No account needed.">
      <Suspense fallback={<div className="skeleton mx-auto h-[360px] max-w-[980px] rounded-[20px]" />}>
        <ManageBooking />
      </Suspense>
    </PageShell>
  );
}
