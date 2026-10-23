import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";
import { contact } from "@/data/contact";

export const metadata: Metadata = { title: "Flights" };

async function SearchSummary({ searchParams }: { searchParams: PageProps<"/flights">["searchParams"] }) {
  const params = await searchParams;
  const entries = Object.entries(params).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v ?? ""]]));
  if (entries.length === 0) return null;
  return (
    <dl className="mb-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 rounded-xl border border-line bg-white p-5 text-sm">
      {entries.map(([k, v], i) => (
        <div key={`${k}-${i}`} className="contents">
          <dt className="font-bold capitalize text-outline">{k}</dt>
          <dd className="font-semibold text-ink-800">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function FlightsPage(props: PageProps<"/flights">) {
  return (
    <PageShell title="Flight search" intro="Live fares are coming soon. Your search is saved below; our team can quote it now.">
      <Suspense fallback={null}>
        <SearchSummary searchParams={props.searchParams} />
      </Suspense>
      <div className="flex flex-wrap gap-3">
        <Button href={contact.whatsapp.href} variant="primary">Get a quote on WhatsApp</Button>
        <Button href="/contact" variant="outline">Contact our team</Button>
      </div>
    </PageShell>
  );
}
