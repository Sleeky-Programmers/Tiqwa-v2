"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Palmtree, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { HolidayPackage } from "@/lib/api/content";
import { cn } from "@/lib/utils";
import { PackageCard } from "./PackageCard";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

const chip = (on: boolean) =>
  cn(
    "press rounded-full border px-4 py-2 text-sm font-semibold",
    on ? "border-blue bg-blue text-white shadow-[0_6px_16px_rgba(2,144,222,0.25)]" : "border-[#e2e8f0] bg-white text-ink-800 hover:border-blue hover:text-blue",
  );

// Entrance animations here are CSS, not data-reveal: this renders inside a streamed Suspense boundary,
// and ScrollReveal would add classes before hydration.

/** /holiday-packages: every package with search, a destination filter and price sorting (all client-side; the list is small). */
export function PackageBrowser({ packages }: { packages: HolidayPackage[] }) {
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
  const [sort, setSort] = useState("featured");
  const places = useMemo(() => [...new Set(packages.map((p) => p.location).filter(Boolean))].sort(), [packages]);

  const term = q.trim().toLowerCase();
  const shown = packages
    .filter((p) => !place || p.location === place)
    .filter((p) => !term || [p.title, p.subtitle, p.location, p.description].some((s) => s?.toLowerCase().includes(term)))
    .sort((a, b) => (sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0));

  if (!packages.length) {
    return (
      <div className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none mx-auto max-w-[520px] rounded-[20px] border border-[#e3ebf3] bg-white px-6 py-12 text-center">
        <span className="float-card mx-auto grid size-14 place-items-center rounded-2xl bg-[rgba(245,134,52,0.12)] text-orange">
          <Palmtree className="size-7" />
        </span>
        <h2 className="mt-4 font-display text-xl font-extrabold text-ink-900">New packages are on the way</h2>
        <p className="mt-2 text-sm text-ink-500">Tell us where you&apos;d like to go and our travel experts will put a holiday together for you.</p>
        <Link href="/contact?type=holiday" className="press mt-5 inline-flex rounded-xl bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
          Plan my holiday
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none mb-6 flex flex-wrap items-center gap-3">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">Search packages</span>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by destination or package"
            className="h-[45px] w-full rounded-[10px] border border-[#e4e8ee] bg-white pl-10 pr-3.5 text-sm text-ink-900 transition-colors hover:border-blue focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
          />
        </label>
        <Select label="Sort packages" value={sort} options={SORTS} onChange={setSort} className="w-[210px]" triggerClassName="h-[45px]" />
      </div>

      {places.length > 1 && (
        <div role="group" aria-label="Destination" className="animate-[fade-up_0.5s_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none [animation-delay:80ms] no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
          <button type="button" aria-pressed={!place} onClick={() => setPlace("")} className={chip(!place)}>
            All destinations
          </button>
          {places.map((l) => (
            <button key={l} type="button" aria-pressed={place === l} onClick={() => setPlace(l)} className={chip(place === l)}>
              {l}
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="mb-4 text-sm text-ink-500">
        {shown.length} package{shown.length === 1 ? "" : "s"}
        {place ? ` in ${place}` : ""}
      </p>

      {shown.length ? (
        // Keyed on the filters so a change replays the cascade instead of popping in.
        <div key={`${place}|${term}|${sort}`} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p, i) => (
            <div key={p.id} className="animate-[fade-up_0.45s_cubic-bezier(0.16,1,0.3,1)_backwards] motion-reduce:animate-none" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
              <PackageCard p={p} eager={i < 3} />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-[#e3ebf3] bg-white px-6 py-10 text-center animate-[fade-up_0.35s_ease]">
          <p className="font-display text-lg font-extrabold text-ink-900">No packages match</p>
          <p className="mt-1 text-sm text-ink-500">Try another destination or clear your search.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPlace("");
            }}
            className="press mt-4 rounded-xl border-[1.5px] border-blue px-5 py-2.5 text-sm font-bold text-blue hover:bg-sky-50"
          >
            Show all packages
          </button>
        </div>
      )}
    </div>
  );
}
