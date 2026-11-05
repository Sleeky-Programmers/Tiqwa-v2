import type { Metadata } from "next";
import { Suspense } from "react";
import { PackageBrowser } from "@/components/home/PackageBrowser";
import { PageShell } from "@/components/layout/PageShell";
import { getAllHolidayPackages } from "@/lib/api/content";

export const metadata: Metadata = {
  title: "Holiday packages",
  description: "Curated holiday packages with flights, stays and experiences. Pay in full or spread the cost.",
};

async function Packages() {
  return <PackageBrowser packages={await getAllHolidayPackages()} />;
}

export default function Page() {
  return (
    <PageShell title="Holiday packages" intro="Curated getaways with flights, stays and experiences, and you can still pay small small.">
      <Suspense
        fallback={
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="skeleton h-[330px] rounded-[18px]" />
            ))}
          </div>
        }
      >
        <Packages />
      </Suspense>
    </PageShell>
  );
}
