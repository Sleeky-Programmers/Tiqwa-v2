import type { NextRequest } from "next/server";
import { getAirport, popularAirportCodes, searchAirports, type Airport } from "@/data/airports";
import { isLive, mockDelay, upstream } from "@/lib/api/upstream";
import type { WlAirport, WlPopularAirport } from "@/lib/api/types";

/**
 * The backend matches anywhere in the name, unranked. Order like the local search: exact code, then
 * city prefixes (Nigerian, then well-known airports first), then name / code prefixes. "lag" → Lagos.
 */
function rank(list: Airport[], q: string) {
  const s = q.trim().toLowerCase();
  const score = (a: Airport) => {
    if (a.code.toLowerCase() === s) return 0;
    if (a.city.toLowerCase().startsWith(s)) return a.country === "Nigeria" ? 1 : getAirport(a.code) ? 2 : 3;
    if (a.name.toLowerCase().startsWith(s)) return 4;
    if (a.code.toLowerCase().startsWith(s)) return 5;
    return 6;
  };
  return [...list].sort((a, b) => score(a) - score(b) || a.city.localeCompare(b.city));
}

/**
 * GET /api/airports?q=la → { results: Airport[] }
 * Live: /get/airports?keyword= (2+ chars) and /get/popular-airports for the empty box.
 * The local list fills in when the backend has nothing or is unreachable, so the field never dead-ends.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!isLive()) {
    await mockDelay(150);
    return Response.json({ results: searchAirports(q) });
  }

  if (q.trim().length < 2) {
    // Comes back either as a plain list or paginated under `itemList`.
    const res = await upstream<WlPopularAirport[] | { itemList?: WlPopularAirport[] }>("/get/popular-airports", { auth: false });
    const rows = res.ok ? (Array.isArray(res.data) ? res.data : (res.data?.itemList ?? [])) : [];
    const popular: Airport[] = rows
      .filter((a) => a.iata_code)
      .map((a) => ({ code: a.iata_code!, city: a.city, name: a.name || getAirport(a.iata_code!)?.name || a.city, country: a.country }));
    // Top up with our own popular list so the box never looks empty.
    const local = popularAirportCodes.map((c) => getAirport(c)!).filter((a) => a && !popular.some((p) => p.code === a.code));
    return Response.json({ results: [...popular, ...local].slice(0, 8) });
  }

  const res = await upstream<WlAirport[]>("/get/airports", { query: { keyword: q.trim() }, auth: false });
  const live = res.ok ? res.data.map((a) => ({ code: a.iata_code, city: a.city, name: a.name, country: a.country })) : [];
  return Response.json({ results: live.length ? rank(live, q).slice(0, 25) : searchAirports(q) });
}
