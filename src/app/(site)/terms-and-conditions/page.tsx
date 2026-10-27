import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function Page() {
  return (
    <PageShell title="Terms & conditions" intro="The terms that apply when you book with TBILS.">
      <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
    </PageShell>
  );
}
