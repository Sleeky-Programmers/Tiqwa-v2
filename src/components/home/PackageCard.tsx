import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import type { HolidayPackage } from "@/lib/api/content";
import { formatNaira } from "@/lib/utils";

/** One holiday package tile (home row, listing page, "You might also like"). Kept apart from the data fetchers so client components can use it. */
export function PackageCard({ p, eager = false }: { p: HolidayPackage; /** Above the fold: load now instead of lazily. */ eager?: boolean }) {
  return (
    <Link
      href={`/holiday-packages/${p.slug}`}
      className="hover-lift hover-zoom group flex flex-col overflow-hidden rounded-[18px] border border-[#e3ebf3] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]"
    >
      <div className="relative h-[190px] overflow-hidden bg-[#0a1626]">
        <Image src={p.image} alt={p.title} fill sizes="(min-width: 1024px) 380px, 100vw" loading={eager ? "eager" : "lazy"} className="object-cover" />
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
