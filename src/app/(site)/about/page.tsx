import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "About TBILS" };

export default function Page() {
  return (
    <PageShell title="About TBILS" intro="Nigeria's trusted flight booking agency.">
      <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
    </PageShell>
  );
}
