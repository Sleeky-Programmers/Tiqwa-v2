import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Cheap Flights Nigeria" };

export default function Page() {
  return (
    <PageShell title="Cheap Flights Nigeria" intro="Handpicked fares from Lagos and Abuja, updated every week.">
      <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
    </PageShell>
  );
}
