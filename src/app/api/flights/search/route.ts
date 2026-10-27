import type { NextRequest } from "next/server";
import { searchFlights } from "@/lib/flights/mock";
import { parseSearch } from "@/lib/flights/search-params";
import type { SearchResponse } from "@/lib/flights/types";

/**
 * MOCK flight search. GET /api/flights/search?trip=oneway&from=LOS&to=LHR&depart=2026-11-02&adults=1&children=0&infants=0&cabin=economy
 * Same query format as the /flights page URL. Swap `searchFlights` for the real supplier later.
 */
export async function GET(request: NextRequest) {
  const search = parseSearch(request.nextUrl.searchParams);
  if (!search) {
    return Response.json({ error: { code: "INVALID_SEARCH", message: "Choose your airports, dates and travellers to search." } }, { status: 400 });
  }
  await new Promise((r) => setTimeout(r, 1800)); // simulate supplier latency so the loader is visible
  const body: SearchResponse = { search, offers: searchFlights(search), currency: "NGN" };
  return Response.json(body);
}
