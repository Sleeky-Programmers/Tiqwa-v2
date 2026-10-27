"use client";

import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { getAirport } from "@/data/airports";
import { searchMeta } from "@/lib/flights/format";
import type { FlightSearch } from "@/lib/flights/types";

export const cityOf = (code: string) => getAirport(code)?.city ?? code;

/** "Lagos → London" for one-way/round trip, "Lagos → London → Dubai" for multi-city. */
export const routeTitle = (s: FlightSearch) =>
  s.trip === "multi" ? [s.legs[0].from, ...s.legs.map((l) => l.to)].map(cityOf).join(" → ") : `${cityOf(s.legs[0].from)} → ${cityOf(s.legs[0].to)}`;

/**
 * Gradient band under the transparent top bar with the itinerary pill
 * (tbils.com results and checkout header). `before` sits above the pill (e.g. Go Back + step title).
 */
export function ItineraryBand({
  search,
  actionLabel,
  onAction,
  before,
  children,
  embedded = false,
}: {
  search: FlightSearch | null;
  actionLabel: string;
  onAction: () => void;
  before?: ReactNode;
  children?: ReactNode;
  /** Inside the dashboard: no site header, rounded card instead of a full-bleed band. */
  embedded?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative bg-[linear-gradient(140deg,#0a1628,#013557_40%,#0290de)] px-4 pb-6 sm:px-6",
        embedded ? "rounded-2xl pt-5" : "overflow-hidden pt-[100px] max-md:pt-[80px]",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-[480px] max-w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_85%_20%,rgba(2,144,222,0.28)_0,transparent_60%)]" />
      {!embedded && <Header />}
      <div className="relative mx-auto max-w-[1440px]">
        {before}
        {search && (
          <div className="flex items-center justify-between gap-4 rounded-[14px] border border-white/[0.16] bg-white/[0.08] px-5 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-extrabold leading-[22px] text-white">
                {routeTitle(search)
                  .split(" → ")
                  .map((c, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-1.5 text-sm font-bold text-[#8fd0ff]">→</span>}
                      {c}
                    </span>
                  ))}
              </p>
              <p className="mt-1 truncate text-[13px] font-medium text-[rgba(234,246,255,0.82)]">{searchMeta(search)}</p>
            </div>
            <button
              type="button"
              onClick={onAction}
              className="shrink-0 rounded-full bg-white px-[22px] py-2.5 text-sm font-bold leading-[14px] text-[#014e78] transition hover:bg-sky-50"
            >
              {actionLabel}
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
