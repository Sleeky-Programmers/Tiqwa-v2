import type { Metadata } from "next";
import { Suspense } from "react";
import { ManageBooking } from "@/components/booking/ManageBooking";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Manage booking",
  description: "Find your TBiLS booking with your booking reference and surname. Check your trip, pay for a booking on hold, print it or request a cancellation.",
};

export default function Page() {
  return (
    <PageShell title="Manage booking" intro="Check your trip, complete payment, print your booking or ask us to cancel. No account needed.">
      <Suspense fallback={<div className="skeleton mx-auto h-[360px] max-w-[980px] rounded-[20px]" />}>
        <ManageBooking />
      </Suspense>
    </PageShell>
  );
}
