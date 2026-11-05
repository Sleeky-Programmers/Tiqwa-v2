import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Section";
import { getHolidayPackages } from "@/lib/api/content";
import { PackageCard } from "./PackageCard";

export { PackageCard };

/** Home page holiday packages from the backend. Renders nothing when there are none (or no backend). */
export async function HolidayPackages() {
  const packages = await getHolidayPackages();
  if (!packages.length) return null;
  return (
    <section aria-labelledby="packages-title" className="py-[45px]">
      <Container>
        <div data-reveal className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border-[0.83px] border-[rgba(245,134,52,0.35)] bg-[rgba(245,134,52,0.1)] px-[14px] py-[6px] text-xs font-bold uppercase leading-[18px] tracking-[0.08em] text-orange">
              ✦ Holiday packages
            </span>
            <h2 id="packages-title" className="mt-[11px] font-display text-[28px] font-black leading-[1.05] tracking-[-0.01em] text-ink-900 md:text-[34px]">
              Holidays, sorted from flight to hotel
            </h2>
            <p className="mt-[13px] max-w-[620px] text-sm font-medium leading-[21px] text-ink-500">Curated getaways with flights, stays and experiences, and you can still pay small small.</p>
          </div>
          <Link href="/holiday-packages" className="link-underline inline-flex items-center gap-1 text-sm font-bold text-blue">
            View all packages <ArrowRight className="size-4" />
          </Link>
        </div>
        <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {packages.slice(0, 6).map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
