import type { Cabin, FlightSearch, TripType } from "./types";

const CABINS: Cabin[] = ["economy", "premium_economy", "business", "first"];
const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const isCode = (s: string | null | undefined): s is string => !!s && /^[A-Z]{3}$/.test(s);
const int = (v: string | null, min: number, max: number, fallback: number) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Reads a search from URL params (the format SearchConsole writes). Returns null when incomplete. */
export function parseSearch(params: URLSearchParams): FlightSearch | null {
  const trip = (["oneway", "round", "multi"].includes(params.get("trip") ?? "") ? params.get("trip") : "oneway") as TripType;
  const cabinParam = params.get("cabin") as Cabin | null;
  const cabin: Cabin = cabinParam && CABINS.includes(cabinParam) ? cabinParam : "economy";
  const adults = int(params.get("adults"), 1, 9, 1);
  const pax = {
    adults,
    children: int(params.get("children"), 0, 9, 0),
    infants: Math.min(adults, int(params.get("infants"), 0, 9, 0)),
  };

  if (trip === "multi") {
    const legs = [];
    for (let i = 1; i <= 5; i++) {
      const raw = params.get(`leg${i}`);
      if (!raw) break;
      const [from, to, ...date] = raw.split("-");
      const d = date.join("-");
      if (!isCode(from) || !isCode(to) || !isDate(d) || from === to) return null;
      legs.push({ from, to, date: d });
    }
    return legs.length >= 2 ? { trip, legs, pax, cabin } : null;
  }

  const from = params.get("from");
  const to = params.get("to");
  const depart = params.get("depart");
  if (!isCode(from) || !isCode(to) || from === to || !isDate(depart)) return null;
  const legs = [{ from, to, date: depart }];
  if (trip === "round") {
    const ret = params.get("return");
    if (!isDate(ret) || ret < depart) return null;
    legs.push({ from: to, to: from, date: ret });
  }
  return { trip, legs, pax, cabin };
}

/** Inverse of parseSearch. */
export function searchToParams(s: FlightSearch): URLSearchParams {
  const p = new URLSearchParams({
    trip: s.trip,
    adults: String(s.pax.adults),
    children: String(s.pax.children),
    infants: String(s.pax.infants),
    cabin: s.cabin,
  });
  if (s.trip === "multi") {
    s.legs.forEach((l, i) => p.set(`leg${i + 1}`, `${l.from}-${l.to}-${l.date}`));
  } else {
    p.set("from", s.legs[0].from);
    p.set("to", s.legs[0].to);
    p.set("depart", s.legs[0].date);
    if (s.trip === "round" && s.legs[1]) p.set("return", s.legs[1].date);
  }
  return p;
}

export const searchKey = (s: FlightSearch) => searchToParams(s).toString();
