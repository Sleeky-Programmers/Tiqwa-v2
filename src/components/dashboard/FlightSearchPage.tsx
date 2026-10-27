"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Clock, History, MapPin } from "lucide-react";
import { SearchConsole } from "@/components/home/search/SearchConsole";
import { cityOf, routeTitle } from "@/components/flights/ItineraryBand";
import { searchMeta } from "@/lib/flights/format";
import { recentSearches } from "@/lib/flights/recent";
import { searchToParams } from "@/lib/flights/search-params";
import type { FlightSearch } from "@/lib/flights/types";
import { SectionCard } from "./ui";

const popular: [string, string][] = [
  ["LOS", "ABV"],
  ["LOS", "LHR"],
  ["ABV", "DXB"],
  ["LOS", "ACC"],
  ["LOS", "JFK"],
  ["LOS", "YYZ"],
  ["PHC", "LOS"],
  ["LOS", "DOH"],
];

const iso = (days: number) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** /dashboard/flights: search box plus recent searches and popular routes. */
export function FlightSearchPage() {
  const [recent, setRecent] = useState<FlightSearch[] | null>(null);
  const [inTwoWeeks, setInTwoWeeks] = useState("");
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- localStorage and the clock are client-only */
    setRecent(recentSearches());
    setInTwoWeeks(iso(14));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <div className="space-y-6">
      <section className="relative rounded-2xl bg-[linear-gradient(140deg,#0a1628,#013557_45%,#0290de)] p-4 sm:p-6 animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="mb-4 px-1 text-white">
          <h2 className="font-display text-2xl font-extrabold">Where are you flying to?</h2>
          <p className="mt-1 text-sm text-white/80">Compare fares, then pay in full or in installments.</p>
        </div>
        <SearchConsole resultsPath="/dashboard/flights/results" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Recent searches" bodyClassName="p-3">
          {recent === null ? (
            <div className="skeleton m-2 h-28 rounded-xl" />
          ) : recent.length === 0 ? (
            <div className="flex items-center gap-3 px-3 py-6 text-sm text-ink-500">
              <History className="size-5 text-ink-400" /> Your recent searches will appear here.
            </div>
          ) : (
            <ul className="space-y-1">
              {recent.map((s) => (
                <li key={searchToParams(s).toString()}>
                  <Link
                    href={`/dashboard/flights/results?${searchToParams(s)}`}
                    className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-tint-100"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[rgba(2,144,222,0.1)] text-blue">
                      <Clock className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink-900">{routeTitle(s)}</span>
                      <span className="block truncate text-xs text-ink-500">{searchMeta(s)}</span>
                    </span>
                    <ArrowRight className="size-4 text-ink-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Popular routes from Nigeria" description="One-way, 1 adult, in two weeks">
          <div className="flex flex-wrap gap-2">
            {popular.map(([from, to]) => (
              <Link
                key={from + to}
                href={inTwoWeeks ? `/dashboard/flights/results?trip=oneway&from=${from}&to=${to}&depart=${inTwoWeeks}&adults=1&children=0&infants=0&cabin=economy` : "#"}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dce7f1] bg-white px-3.5 py-2 text-sm font-semibold text-[#264361] transition hover:border-blue hover:text-blue"
              >
                <MapPin className="size-3.5" />
                {cityOf(from)} → {cityOf(to)}
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
