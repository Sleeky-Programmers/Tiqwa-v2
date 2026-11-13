import { cacheLife } from "next/cache";
import type { Deal } from "@/data/deals";
import type { WlFlightDeal, WlHolidayPackage } from "./types";

// Public marketing content from the backend (deals, holiday packages). Cached for an hour so the
// home page stays static and fast; any failure returns null and the caller falls back to local data.

const API_URL = process.env.TIQWA_API_URL?.replace(/\/+$/, "");

export async function publicData<T>(path: string): Promise<T | null> {
  "use cache";
  if (!API_URL) {
    cacheLife("hours");
    return null;
  }
  let data: T | null = null;
  let answered = false;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json", Origin: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4545" },
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success !== false) {
      data = (json?.data ?? null) as T | null;
      answered = true;
    }
  } catch {}
  // An answer (even an empty one) is kept for an hour. A failure is kept for a minute, so a blip can't hide live data for long;
  // it is not shorter because very short caches are treated as dynamic and would break prerendering.
  if (answered) cacheLife("hours");
  else cacheLife("minutes");
  return data;
}

export type HolidayPackage = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  description: string;
  details: string;
  price: number;
  image: string;
};

const toPackage = (p: WlHolidayPackage): HolidayPackage => ({
  id: p.uniqueid,
  slug: p.slug,
  title: p.title,
  subtitle: p.subtitle ?? "",
  location: p.location,
  description: p.description ?? "",
  details: p.long_description ?? p.description ?? "",
  price: Number(p.amount) || 0,
  image: p.thumbnail,
});

/** Live flight deals mapped to the deal cards, or null to use the local list. */
export async function getDeals(): Promise<Deal[] | null> {
  "use cache";
  cacheLife("hours");
  const rows = await publicData<WlFlightDeal[]>("/get/flight-deals");
  if (!rows?.length) return null;
  // Deals can outlive their travel dates; past dates are dropped so the link opens the route instead.
  const today = new Date().toISOString().slice(0, 10);
  const future = (d?: string | null) => (d && d.slice(0, 10) >= today ? d.slice(0, 10) : undefined);
  return rows
    .filter((d) => d.origin && d.destination && d.amount)
    .map((d) => ({
      id: String(d.id ?? `${d.origin}-${d.destination}`),
      from: d.origin_city || d.origin!,
      fromCode: d.origin!,
      to: d.destination_city || d.destination!,
      toCode: d.destination!,
      trip: d.return_date ? "Round trip" : "One way",
      airline: { code: d.airline_code ?? "", name: d.airline_name ?? "" },
      image: d.thumbnail || d.image || "/images/destinations/default.webp",
      fare: Number(d.amount),
      // Pay Small Small spreads a fare over up to 4 instalments.
      installment: Math.round(Number(d.amount) / 4),
      depart: future(d.departure_date),
      returnDate: future(d.return_date),
    }));
}

export async function getHolidayPackages(): Promise<HolidayPackage[]> {
  const home = await publicData<{ holiday_packages?: WlHolidayPackage[] }>("/");
  return (home?.holiday_packages ?? []).map(toPackage);
}

/** Every published package (GET /holiday-packages), for the listing page; falls back to the home page's list. */
export async function getAllHolidayPackages(): Promise<HolidayPackage[]> {
  const all = await publicData<WlHolidayPackage[]>("/holiday-packages");
  return Array.isArray(all) && all.length ? all.map(toPackage) : getHolidayPackages();
}

export async function getHolidayPackage(slug: string): Promise<{ pkg: HolidayPackage; related: HolidayPackage[] } | null> {
  const data = await publicData<{ package?: WlHolidayPackage; related_packages?: WlHolidayPackage[] }>(`/holiday-packages/${encodeURIComponent(slug)}/details`);
  if (!data?.package) return null;
  return { pkg: toPackage(data.package), related: (data.related_packages ?? []).map(toPackage) };
}
