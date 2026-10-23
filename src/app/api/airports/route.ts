import type { NextRequest } from "next/server";
import { searchAirports } from "@/data/airports";

/**
 * MOCK airport search. GET /api/airports?q=la
 * Under 2 characters returns the popular list. Swap the body for the real provider later;
 * keep the response shape: { results: Airport[] }.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  await new Promise((r) => setTimeout(r, 150)); // simulate network latency
  return Response.json({ results: searchAirports(q) });
}
