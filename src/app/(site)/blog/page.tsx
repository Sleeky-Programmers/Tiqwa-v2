import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";

export const metadata: Metadata = { title: "Blog" };

export default function Page() {
  return (
    <PageShell title="Blog" intro="Travel tips, visa guides and flight deals.">
      <p className="max-w-2xl text-on-surface-variant">This page is coming soon. For help now, call or WhatsApp our Lagos team.</p>
    </PageShell>
  );
}
