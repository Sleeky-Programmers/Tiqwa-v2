"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { SearchConsole } from "@/components/home/search/SearchConsole";
import { Modal } from "@/components/ui/Modal";
import { saveBooking } from "@/lib/booking/store";
import { parseSearch } from "@/lib/flights/search-params";
import type { FlightOffer, SearchResponse } from "@/lib/flights/types";
import { cn } from "@/lib/utils";
import { AirlineStrip, type AirlineSummary } from "./AirlineStrip";
import { FilterFacets, Filters, FiltersPanel, emptyFilters } from "./FiltersPanel";
import { FlightCard, FlightCardSkeleton } from "./FlightCard";
import { FlightDetailsModal } from "./FlightDetailsModal";
import { ItineraryBand, cityOf, routeTitle } from "./ItineraryBand";
import { SearchLoader } from "./SearchLoader";

const PAGE = 20;
type Sort = "cheapest" | "fastest";
type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: SearchResponse };

const totalDuration = (o: FlightOffer) => o.journeys.reduce((s, j) => s + j.durationMin, 0);
const maxStops = (o: FlightOffer) => Math.max(...o.journeys.map((j) => j.stops));

function facetsOf(offers: FlightOffer[]): FilterFacets & { airlineList: AirlineSummary[] } {
  const prices = offers.map((o) => o.price.total);
  const stops = new Map<number, number>();
  const airlines = new Map<string, AirlineSummary>();
  for (const o of offers) {
    const s = Math.min(2, maxStops(o));
    stops.set(s, Math.min(stops.get(s) ?? Infinity, o.price.total));
    const a = airlines.get(o.airline.code);
    if (!a || o.price.total < a.min) airlines.set(o.airline.code, { ...o.airline, min: o.price.total, stops: maxStops(o) });
  }
  const airlineList = [...airlines.values()].sort((a, b) => a.min - b.min);
  return {
    priceMin: Math.min(...prices),
    priceMax: Math.max(...prices),
    stops: [...stops.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, min]) => ({ value, min, label: value === 0 ? "Non-stop" : value === 1 ? "1 stop" : "2 stops" })),
    airlines: airlineList.map(({ code, name, min }) => ({ code, name, min })),
    airlineList,
  };
}

function applyFilters(offers: FlightOffer[], f: Filters) {
  return offers.filter((o) => {
    if (f.price && (o.price.total < f.price[0] || o.price.total > f.price[1])) return false;
    if (f.stops.length && !f.stops.includes(Math.min(2, maxStops(o)))) return false;
    if (f.airlines.length && !f.airlines.includes(o.airline.code)) return false;
    if (f.flex.length) {
      const kind = o.fareRules.refundable ? "refundable" : "nonRefundable";
      if (!f.flex.includes(kind)) return false;
    }
    return true;
  });
}

/** `variant="dashboard"` renders inside the account shell and keeps searches under /dashboard/flights/results. */
export function FlightResults({ variant = "site" }: { variant?: "site" | "dashboard" }) {
  const dash = variant === "dashboard";
  const resultsPath = dash ? "/dashboard/flights/results" : "/flights";
  const router = useRouter();
  const params = useSearchParams();
  const query = params.toString();
  const search = useMemo(() => parseSearch(new URLSearchParams(query)), [query]);

  const [state, setState] = useState<State>({ status: "loading" });
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<Sort>("cheapest");
  const [visible, setVisible] = useState(PAGE);
  const [details, setDetails] = useState<FlightOffer | null>(null);
  const [modifying, setModifying] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Fetch whenever the search in the URL changes (Modify pushes a new URL).
  useEffect(() => {
    if (!search) return;
    const ctrl = new AbortController();
    /* eslint-disable react-hooks/set-state-in-effect -- reset view state for a new search */
    setState({ status: "loading" });
    setFilters(emptyFilters);
    setVisible(PAGE);
    setModifying(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/flights/search?${query}`, { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't load flights. Please try again.");
        setState({ status: "ready", data: json as SearchResponse });
      })
      .catch((e) => {
        if (e.name !== "AbortError") setState({ status: "error", message: e.message });
      });
    return () => ctrl.abort();
  }, [query, search, attempt]);

  // Brief skeleton when filters or sorting change, like tbils.com re-rendering its list.
  const touch = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setVisible(PAGE);
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 350);
  };
  const changeFilters = touch(setFilters);
  const changeSort = touch(setSort);

  const offers = useMemo(() => (state.status === "ready" ? state.data.offers : []), [state]);
  const facets = useMemo(() => (offers.length ? facetsOf(offers) : null), [offers]);
  const list = useMemo(() => {
    const filtered = applyFilters(offers, filters);
    return sort === "cheapest"
      ? [...filtered].sort((a, b) => a.price.total - b.price.total)
      : [...filtered].sort((a, b) => totalDuration(a) - totalDuration(b) || a.price.total - b.price.total);
  }, [offers, filters, sort]);
  const cheapestId = useMemo(() => [...offers].sort((a, b) => a.price.total - b.price.total)[0]?.id, [offers]);
  const fastestId = useMemo(() => [...offers].sort((a, b) => totalDuration(a) - totalDuration(b))[0]?.id, [offers]);

  const book = (offer: FlightOffer) => {
    if (!search) return;
    saveBooking({ search, offer });
    setDetails(null);
    router.push("/checkout");
  };

  if (!search) return <InvalidSearch dash={dash} resultsPath={resultsPath} />;

  const toggleAirline = (code: string) =>
    changeFilters({ ...filters, airlines: filters.airlines.length === 1 && filters.airlines[0] === code ? [] : [code] });

  return (
    <div className={cn("bg-[#f4f6f9]", dash ? "" : "min-h-screen pb-12")}>
      {state.status === "loading" && <SearchLoader route={routeTitle(search)} destinationCity={cityOf(search.legs[0].to)} />}

      <ItineraryBand embedded={dash} search={search} actionLabel={modifying ? "Close" : "Modify"} onAction={() => setModifying((m) => !m)}>
        {modifying && (
          <div className="mt-4 overflow-visible rounded-2xl animate-[acc-reveal_0.3s_ease]">
            <SearchConsole initial={search} compact resultsPath={resultsPath} />
          </div>
        )}
      </ItineraryBand>

      <div className={cn("mx-auto flex max-w-[1440px] gap-[5px] pt-6", !dash && "px-4 sm:px-6")}>
        {facets && (
          <aside className="sticky top-[80px] hidden max-h-[calc(100vh-80px)] w-[238px] shrink-0 self-start overflow-y-auto pb-[50px] lg:block">
            <FiltersPanel facets={facets} filters={filters} onChange={changeFilters} />
          </aside>
        )}

        <main className="min-w-0 flex-1 lg:pl-1">
          {state.status === "error" ? (
            <EmptyState
              title="We couldn't load flights"
              message={state.message}
              action={{ label: "Try again", onClick: () => setAttempt((n) => n + 1) }}
            />
          ) : state.status === "loading" || !facets ? (
            <div className="space-y-4" aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <FlightCardSkeleton key={i} />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState
              title="No flights found"
              message="We couldn't find flights for this route and date. Try different dates or nearby airports."
              action={{ label: "Modify search", onClick: () => setModifying(true) }}
            />
          ) : (
            <>
              <h1 className="text-[23px] font-normal leading-[27.6px] text-ink-500">
                Flights from{" "}
                <span className="text-[#013557]">
                  {cityOf(search.legs[0].from)} to {cityOf(search.trip === "multi" ? search.legs[search.legs.length - 1].to : search.legs[0].to)}
                </span>
              </h1>

              <AirlineStrip airlines={facets.airlineList} selected={filters.airlines} onSelect={toggleAirline} />

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#eef1f5] bg-white px-[18px] py-3.5 shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-2xl font-semibold text-[#1d1d1d]">Flight Options</h2>
                  <span className="rounded-full bg-[rgba(2,144,222,0.08)] px-2.5 py-[3px] text-[13px] font-semibold text-blue">{list.length} results</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="flex items-center gap-1.5 rounded-full border border-[#e4e8ee] px-3.5 py-2 text-sm font-semibold text-ink-900 lg:hidden"
                  >
                    <SlidersHorizontal className="size-4" /> Filters
                  </button>
                  <span className="hidden text-base text-ink-500 sm:inline">Sort by:</span>
                  <div role="radiogroup" aria-label="Sort flights" className="flex rounded-full border border-[#e4e8ee] bg-[#f1f4f8] p-1">
                    {(["cheapest", "fastest"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={sort === s}
                        onClick={() => changeSort(s)}
                        className={cn(
                          "rounded-full px-5 py-2 text-sm font-semibold capitalize transition",
                          sort === s ? "bg-white text-[#013557] shadow-[0_1px_3px_rgba(1,53,87,0.14)]" : "text-ink-500 hover:text-ink-900",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-[14px]">
                {refreshing ? (
                  Array.from({ length: 3 }, (_, i) => <FlightCardSkeleton key={i} />)
                ) : list.length === 0 ? (
                  <EmptyState
                    title="No flights match your filters"
                    message="Try widening the price range or clearing a filter."
                    action={{ label: "Clear all filters", onClick: () => changeFilters(emptyFilters) }}
                  />
                ) : (
                  list.slice(0, visible).map((o, i) => (
                    <FlightCard
                      key={o.id}
                      offer={o}
                      tag={o.id === cheapestId ? "Cheapest" : o.id === fastestId ? "Fastest" : undefined}
                      onViewDetails={() => setDetails(o)}
                      style={{ animationDelay: `${Math.min(i % PAGE, 8) * 40}ms` }}
                    />
                  ))
                )}
              </div>

              {!refreshing && visible < list.length && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="rounded-xl border-[1.5px] border-blue bg-white px-7 py-3 text-sm font-bold text-blue transition hover:bg-sky-50"
                  >
                    Show more flights ({list.length - visible} more)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <FlightDetailsModal offer={details} onClose={() => setDetails(null)} onBook={book} />

      {facets && (
        <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} labelledBy="filters-title" className="max-w-[420px]">
          <h2 id="filters-title" className="sr-only">
            Filters
          </h2>
          <FiltersPanel facets={facets} filters={filters} onChange={changeFilters} className="max-h-[75vh] overflow-y-auto rounded-none border-0 pr-12 shadow-none" />
          <div className="border-t border-[#eef1f5] p-4">
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="w-full rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-3 text-[15px] font-bold text-white"
            >
              Show {list.length} flights
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EmptyState({ title, message, action }: { title: string; message: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="rounded-[14px] border border-[#eef1f5] bg-white px-6 py-14 text-center animate-[fade-up_0.35s_ease]">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[rgba(2,144,222,0.1)] text-blue">
        <SlidersHorizontal className="size-6" />
      </span>
      <h2 className="font-display text-xl font-extrabold text-ink-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">{message}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-6 py-3 text-sm font-bold text-white"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function InvalidSearch({ dash, resultsPath }: { dash: boolean; resultsPath: string }) {
  return (
    <div className={cn("bg-[#f4f6f9]", !dash && "min-h-screen pb-12")}>
      <ItineraryBand embedded={dash} search={null} actionLabel="" onAction={() => {}}>
        <h1 className="mb-4 font-display text-2xl font-extrabold text-white">Search flights</h1>
        <SearchConsole compact resultsPath={resultsPath} />
      </ItineraryBand>
    </div>
  );
}


