import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "FAQs" };

export default function Page() {
  return (
    <PageShell title="FAQs" intro="Answers to common questions about booking and installments.">
      <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
    </PageShell>
  );
}
