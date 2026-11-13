import type { NextRequest } from "next/server";
import { mapFlightItem, mapMultiCityItem, searchError } from "@/lib/api/mappers";
import type { WlFlightItem, WlMultiCityItem, WlSearchData } from "@/lib/api/types";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";
import { searchFlights } from "@/lib/flights/mock";
import { parseSearch } from "@/lib/flights/search-params";
import type { FlightOffer, FlightSearch, SearchResponse } from "@/lib/flights/types";

const SEARCH_TIMEOUT = 90_000; // suppliers regularly take 40s+ on long-haul searches
const FALLBACK = "We couldn't load flights right now. Please try again in a moment.";

async function liveSearch(search: FlightSearch) {
  const { adults, children, infants } = search.pax;
  if (search.trip === "multi") {
    return upstream<WlSearchData<WlMultiCityItem>>("/flight/multi-city/search", {
      method: "POST",
      body: {
        destinations: search.legs.map((l) => ({ origin: l.from, destination: l.to, departure_date: l.date })),
        adults,
        children,
        infants,
        cabin: search.cabin,
        return_type: null,
      },
      timeoutMs: SEARCH_TIMEOUT,
      fallback: FALLBACK,
    });
  }
  const [out, back] = search.legs;
  return upstream<WlSearchData<WlFlightItem>>("/flight/search", {
    query: {
      origin: out.from,
      destination: out.to,
      departure_date: out.date,
      adults,
      children,
      infants,
      cabin: search.cabin,
      return_date: search.trip === "round" ? (back?.date ?? "") : "",
    },
    timeoutMs: SEARCH_TIMEOUT,
    fallback: FALLBACK,
  });
}

/**
 * GET /api/flights/search?trip=oneway&from=LOS&to=LHR&depart=2026-11-02&adults=1&children=0&infants=0&cabin=economy
 * Same query format as the /flights page URL. Live: /flight/search (one-way, return) or
 * /flight/multi-city/search, mapped into FlightOffer[]. Mock: the deterministic generator.
 */
export async function GET(request: NextRequest) {
  const search = parseSearch(request.nextUrl.searchParams);
  if (!search) {
    return fail({ code: "INVALID_SEARCH", status: 400, message: "Choose your airports, dates and travellers to search." });
  }

  if (!isLive()) {
    await mockDelay(1800); // simulate supplier latency so the loader is visible
    const body: SearchResponse = { search, offers: searchFlights(search), currency: "NGN" };
    return Response.json(body);
  }

  const res = await liveSearch(search);
  if (!res.ok) return fail(res.error);
  const problem = searchError(res.data?.itemList);
  if (problem) {
    // The supplier answers "no flights" as a validation message; show it as an empty result.
    if (/no (flight|result)|not found|unavailable/i.test(problem))
      return Response.json({ search, offers: [], currency: "NGN", live: true } satisfies SearchResponse);
    return fail({ code: "INVALID_SEARCH", status: 422, message: problem });
  }
  const items = res.data.itemList as (WlFlightItem | WlMultiCityItem)[];
  const offers = items
    .map((item) =>
      search.trip === "multi" ? mapMultiCityItem(item as WlMultiCityItem, search.cabin) : mapFlightItem(item as WlFlightItem, search.cabin, search.pax),
    )
    .filter((o): o is FlightOffer => !!o);
  const body: SearchResponse = { search, offers, currency: (items[0] as WlFlightItem | undefined)?.currency ?? "NGN", live: true };
  return Response.json(body);
}
