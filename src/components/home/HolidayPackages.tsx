import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Section";
import type { HolidayPackage } from "@/lib/api/content";
import { getHolidayPackages } from "@/lib/api/content";
import { formatNaira } from "@/lib/utils";

export function PackageCard({ p }: { p: HolidayPackage }) {
  return (
    <Link
      href={`/holiday-packages/${p.slug}`}
      className="hover-lift hover-zoom group flex flex-col overflow-hidden rounded-[18px] border border-[#e3ebf3] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]"
    >
      <div className="relative h-[190px] overflow-hidden bg-[#0a1626]">
        <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 380px, 100vw" className="object-cover" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-ink-900 backdrop-blur">
          <MapPin className="size-3.5 text-blue" /> {p.location}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-extrabold text-ink-900">{p.title}</h3>
        {p.subtitle && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{p.subtitle}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-xs text-ink-500">Packages from</p>
            <p className="font-display text-xl font-black text-ink-900">{formatNaira(p.price)}</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-blue">
            View package <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Home page holiday packages from the backend. Renders nothing when there are none (or no backend). */
export async function HolidayPackages() {
  const packages = await getHolidayPackages();
  if (!packages.length) return null;
  return (
    <section aria-labelledby="packages-title" className="py-[45px]">
      <Container>
        <div data-reveal className="mb-6">
          <span className="inline-flex items-center gap-1 rounded-full border-[0.83px] border-[rgba(245,134,52,0.35)] bg-[rgba(245,134,52,0.1)] px-[14px] py-[6px] text-xs font-bold uppercase leading-[18px] tracking-[0.08em] text-orange">
            ✦ Holiday packages
          </span>
          <h2 id="packages-title" className="mt-[11px] font-display text-[28px] font-black leading-[1.05] tracking-[-0.01em] text-ink-900 md:text-[34px]">
            Holidays, sorted from flight to hotel
          </h2>
          <p className="mt-[13px] max-w-[620px] text-sm font-medium leading-[21px] text-ink-500">Curated getaways with flights, stays and experiences, and you can still pay small small.</p>
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
