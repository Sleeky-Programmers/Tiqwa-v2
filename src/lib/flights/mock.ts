// MOCK flight generator. Produces deterministic, believable offers for any search so the
// results and checkout flow can be exercised end to end. Replace `searchFlights` with a call
// to the real supplier when one is connected; the rest of the app only depends on ./types.

import { getAirport } from "@/data/airports";
import { blockMinutes, distanceKm, utcOffset } from "./geo";
import type { AirportRef, Cabin, FlightOffer, FlightSearch, Journey, SearchLeg, Segment } from "./types";

/* ---------- deterministic randomness ---------- */

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: string) {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = () => number;
const pick = <T,>(r: Rand, arr: readonly T[]) => arr[Math.floor(r() * arr.length)];
const between = (r: Rand, min: number, max: number) => min + r() * (max - min);

/* ---------- carriers ---------- */

type Carrier = {
  code: string;
  name: string;
  hub: string;
  /** Extra stop before the hub, used for 2-stop itineraries. */
  feeder?: string;
  /** Airports served non-stop from Nigeria besides the hub. */
  direct?: string[];
  /** Regional carriers only sell connections within Africa. */
  africaOnly?: boolean;
  factor: number;
  slots: string[];
  aircraft: string[];
  baggage: string;
};

const INTL: Carrier[] = [
  { code: "QR", name: "Qatar Airways", hub: "DOH", factor: 0.9, slots: ["15:30", "23:40"], aircraft: ["Boeing 787-8", "Airbus A350-900"], baggage: "2 checkin allowance" },
  { code: "KQ", name: "Kenya Airways", hub: "NBO", factor: 0.92, slots: ["12:45"], aircraft: ["Boeing 787-8", "Embraer 190"], baggage: "2 checkin allowance" },
  { code: "AT", name: "Royal Air Maroc", hub: "CMN", factor: 1.0, slots: ["19:05"], aircraft: ["Boeing 737-800", "Boeing 787-9"], baggage: "2 checkin allowance" },
  { code: "WB", name: "Rwandair Express", hub: "KGL", factor: 1.02, slots: ["14:45"], aircraft: ["Airbus A330-200", "Boeing 737-800"], baggage: "2 checkin allowance" },
  { code: "ET", name: "Ethiopian Airlines", hub: "ADD", factor: 1.04, slots: ["13:15", "09:50"], aircraft: ["Boeing 787-9", "Airbus A350-900"], baggage: "2 checkin allowance" },
  { code: "MS", name: "Egyptair", hub: "CAI", factor: 1.12, slots: ["15:00"], aircraft: ["Boeing 737-800", "Airbus A330-300"], baggage: "2 checkin allowance" },
  { code: "TK", name: "Turkish Airlines", hub: "IST", factor: 1.15, slots: ["22:10", "10:35"], aircraft: ["Airbus A330-300", "Boeing 787-9"], baggage: "2 checkin allowance" },
  { code: "EK", name: "Emirates", hub: "DXB", factor: 1.18, slots: ["16:45"], aircraft: ["Boeing 777-300ER"], baggage: "2 checkin allowance" },
  { code: "EY", name: "Etihad Airways", hub: "AUH", factor: 1.1, slots: ["21:25"], aircraft: ["Boeing 787-9"], baggage: "2 checkin allowance" },
  { code: "LH", name: "Lufthansa", hub: "FRA", factor: 1.32, slots: ["23:55"], aircraft: ["Airbus A330-300", "Airbus A320neo"], baggage: "1 checkin allowance" },
  { code: "LX", name: "Swiss International Air Lines", hub: "ZRH", feeder: "ACC", factor: 1.3, slots: ["23:55"], aircraft: ["Airbus A330-300", "Airbus A220-300"], baggage: "1 checkin allowance" },
  { code: "SN", name: "Brussels Airlines", hub: "BRU", feeder: "ACC", factor: 1.33, slots: ["21:50"], aircraft: ["Airbus A330-300", "Airbus A320"], baggage: "1 checkin allowance" },
  { code: "AF", name: "Air France", hub: "CDG", factor: 1.28, slots: ["23:15"], aircraft: ["Airbus A350-900", "Airbus A320"], baggage: "1 checkin allowance" },
  { code: "KL", name: "KLM Royal Dutch Airlines", hub: "AMS", factor: 1.27, slots: ["22:45"], aircraft: ["Boeing 787-10", "Embraer 175"], baggage: "1 checkin allowance" },
  { code: "BA", name: "British Airways", hub: "LHR", factor: 1.42, slots: ["23:15"], aircraft: ["Boeing 787-9", "Airbus A320"], baggage: "2 checkin allowance" },
  { code: "VS", name: "Virgin Atlantic", hub: "LHR", factor: 1.38, slots: ["22:55"], aircraft: ["Airbus A330-300"], baggage: "1 checkin allowance" },
  { code: "DL", name: "Delta Air Lines", hub: "ATL", direct: ["JFK"], factor: 1.36, slots: ["22:30"], aircraft: ["Airbus A330-900neo", "Boeing 757-200"], baggage: "2 checkin allowance" },
  { code: "UA", name: "United Airlines", hub: "IAD", factor: 1.34, slots: ["23:10"], aircraft: ["Boeing 787-8", "Boeing 737 MAX 9"], baggage: "2 checkin allowance" },
  { code: "SA", name: "South African Airways", hub: "JNB", factor: 1.08, slots: ["14:20"], aircraft: ["Airbus A340-300", "Airbus A320"], baggage: "2 checkin allowance" },
  { code: "AW", name: "Africa World Airlines", hub: "ACC", africaOnly: true, factor: 1.05, slots: ["07:40", "16:20"], aircraft: ["Embraer 145", "Boeing 737-800"], baggage: "1 checkin allowance" },
];

const DOMESTIC: Carrier[] = [
  { code: "P4", name: "Air Peace", hub: "LOS", factor: 1.0, slots: ["07:00", "10:15", "13:30", "17:45"], aircraft: ["Boeing 737-500", "Embraer 195-E2"], baggage: "1 checkin allowance (23kg)" },
  { code: "QI", name: "Ibom Air", hub: "QUO", factor: 1.08, slots: ["08:20", "15:10"], aircraft: ["Bombardier CRJ900", "Airbus A220-300"], baggage: "1 checkin allowance (23kg)" },
  { code: "W3", name: "Arik Air", hub: "LOS", factor: 0.95, slots: ["09:40", "16:30"], aircraft: ["Boeing 737-700", "Bombardier Q400"], baggage: "1 checkin allowance (20kg)" },
  { code: "VK", name: "ValueJet", hub: "LOS", factor: 0.9, slots: ["06:30", "12:00", "18:20"], aircraft: ["Bombardier CRJ900"], baggage: "1 checkin allowance (20kg)" },
];

const LAYOVERS = [85, 140, 205, 330, 455, 575, 760];
const CABIN_MULT: Record<Cabin, number> = { economy: 1, premium_economy: 1.65, business: 3.4, first: 5.2 };

/* ---------- time helpers (local "YYYY-MM-DDTHH:mm" ⇄ absolute UTC minutes) ---------- */

const toUtcMin = (local: string, code: string) => {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  return Date.UTC(y, m - 1, day, hh, mm) / 60000 - utcOffset(code) * 60;
};
const toLocal = (utcMin: number, code: string) => {
  const d = new Date((utcMin + utcOffset(code) * 60) * 60000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
};

const ref = (code: string): AirportRef => {
  const a = getAirport(code);
  return a ? { code: a.code, city: a.city, name: a.name, country: a.country } : { code, city: code, name: `${code} Airport`, country: "" };
};

const isNigeria = (code: string) => getAirport(code)?.country === "Nigeria";
const AFRICA = new Set(["Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Ethiopia", "Rwanda", "Morocco", "Senegal", "Côte d'Ivoire", "Togo", "Benin", "Angola", "Tanzania"]);
const inAfrica = (code: string) => AFRICA.has(getAirport(code)?.country ?? "");

/* ---------- journey building ---------- */

type Option = { carrier: Carrier; journey: Journey; base: number };

function buildJourney(r: Rand, carrier: Carrier, path: string[], date: string, slot: string, layovers: number[]): Journey {
  const segments: Segment[] = [];
  let t = toUtcMin(`${date}T${slot}`, path[0]);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dur = blockMinutes(a, b);
    const departLocal = toLocal(t, a);
    // Different departure times on a sector are different flights.
    const flightNumber = `${carrier.code}${100 + (hash(`${carrier.code}${a}${b}${departLocal.slice(11)}`) % 880)}`;
    segments.push({
      id: `${flightNumber}-${departLocal}`,
      airline: { code: carrier.code, name: carrier.name },
      flightNumber,
      aircraft: pick(r, carrier.aircraft),
      from: ref(a),
      to: ref(b),
      depart: departLocal,
      arrive: toLocal(t + dur, b),
      durationMin: dur,
      ...(i < path.length - 2 ? { layoverMin: layovers[i] } : {}),
    });
    t += dur + (layovers[i] ?? 0);
  }
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    segments,
    from: first.from,
    to: last.to,
    depart: first.depart,
    arrive: last.arrive,
    durationMin: toUtcMin(last.arrive, last.to.code) - toUtcMin(first.depart, first.from.code),
    stops: segments.length - 1,
  };
}

/** All believable itineraries for one leg of a search. */
function legOptions(leg: SearchLeg, cabin: Cabin, seed: string): Option[] {
  const r = rng(seed);
  const { from, to, date } = leg;
  const direct = distanceKm(from, to);
  const out: Option[] = [];
  const add = (carrier: Carrier, path: string[], variants: number) => {
    const slot = pick(r, carrier.slots);
    const pool = [...LAYOVERS].sort(() => r() - 0.5);
    for (let v = 0; v < variants; v++) {
      const lays = path.slice(1, -1).map((_, i) => pool[(v + i) % pool.length]);
      const journey = buildJourney(r, carrier, path, date, slot, lays);
      // Shorter connections and fewer stops cost more; later variants drift upward.
      const stopFactor = journey.stops === 0 ? 1.22 : journey.stops === 1 ? 1 : 1.04;
      const layoverFactor = 1 + Math.max(0, 300 - (lays[0] ?? 300)) / 1600;
      const domestic = isNigeria(from) && isNigeria(to);
      const km = domestic ? direct : Math.max(direct, 900);
      const perKm = domestic ? 65 : 142;
      const floor = domestic ? 62000 : 180000;
      const base = Math.max(floor, km * perKm) * carrier.factor * stopFactor * layoverFactor * (1 + v * 0.06) * between(r, 0.96, 1.12) * CABIN_MULT[cabin];
      out.push({ carrier, journey, base });
    }
  };

  if (isNigeria(from) && isNigeria(to)) {
    for (const c of DOMESTIC) {
      for (const slot of c.slots) {
        const journey = buildJourney(r, c, [from, to], date, slot, []);
        const base = Math.max(62000, direct * 65) * c.factor * between(r, 0.95, 1.2) * CABIN_MULT[cabin];
        out.push({ carrier: c, journey, base });
      }
    }
    return out;
  }

  for (const c of INTL) {
    if (c.africaOnly && !(inAfrica(from) && inAfrica(to))) continue;
    const viaHub = c.hub !== from && c.hub !== to;
    if (!viaHub || c.direct?.includes(to)) {
      add(c, [from, to], 1);
      continue;
    }
    const detour = (distanceKm(from, c.hub) + distanceKm(c.hub, to)) / Math.max(direct, 1);
    // Generous detour limit: Gulf and East African hubs really do sell Lagos–London connections.
    // Short intra-African hops still connect via regional hubs (Addis, Nairobi, Lomé…), so allow a longer detour there.
    const limit = inAfrica(from) && inAfrica(to) ? 6 : 2.6;
    if (detour <= limit) add(c, [from, c.hub, to], 2 + Math.floor(r() * 5));
    if (c.feeder && c.feeder !== from && c.feeder !== to && detour <= limit) add(c, [from, c.feeder, c.hub, to], 1 + Math.floor(r() * 4));
  }
  if (out.length === 0) {
    // Far-flung pairs: fall back to the big Gulf / Istanbul connectors.
    for (const code of ["QR", "EK", "TK"]) add(INTL.find((c) => c.code === code)!, [from, INTL.find((c) => c.code === code)!.hub, to], 2);
  }
  return out;
}

/* ---------- offers ---------- */

function priceOf(base: number, search: FlightSearch) {
  const unit = Math.round(base);
  const childUnit = Math.round(unit * 0.75);
  const infantUnit = Math.round(unit * 0.1);
  const total = unit * search.pax.adults + childUnit * search.pax.children + infantUnit * search.pax.infants;
  return {
    adults: { count: search.pax.adults, unit },
    children: { count: search.pax.children, unit: childUnit },
    infants: { count: search.pax.infants, unit: infantUnit },
    taxes: Math.round(total * 0.18),
    total,
  };
}

function fareRules(r: Rand, baggage: string, total: number) {
  const refundable = r() < 0.3;
  const fee = Math.round((total * 0.12) / 1000) * 1000;
  return {
    refundable,
    refundNote: refundable ? `Refundable with a ₦${fee.toLocaleString("en-NG")} cancellation fee` : "Non-refundable",
    changeNote: r() < 0.6 ? "Date change allowed (change fee + fare difference)" : "Changes not permitted after departure",
    checkedBaggage: baggage,
    cabinBaggage: "1 piece, 7kg hand luggage",
  };
}

export function searchFlights(search: FlightSearch): FlightOffer[] {
  const seed = JSON.stringify(search);
  const r = rng(`${seed}:offers`);
  const perLeg = search.legs.map((leg, i) => legOptions(leg, search.cabin, `${seed}:${i}`));
  const offers: FlightOffer[] = [];

  const make = (options: Option[], discount: number): FlightOffer => {
    const base = options.reduce((s, o) => s + o.base, 0) * discount;
    const price = priceOf(base, search);
    const carrier = options[0].carrier;
    const id = `${hash(options.map((o) => o.journey.segments.map((s) => s.id).join(",")).join("|") + search.cabin).toString(36)}`;
    return {
      id,
      airline: { code: carrier.code, name: carrier.name },
      journeys: options.map((o) => o.journey),
      cabin: search.cabin,
      price,
      fareRules: fareRules(r, carrier.baggage, price.total),
      seatsLeft: 1 + Math.floor(r() * 9),
    };
  };

  if (search.legs.length === 1) {
    for (const o of perLeg[0]) offers.push(make([o], 1));
  } else if (search.trip === "round") {
    // Pair outbound and return on the same carrier.
    for (const out of perLeg[0]) {
      const backs = perLeg[1].filter((b) => b.carrier.code === out.carrier.code).slice(0, 2);
      for (const back of backs) offers.push(make([out, back], 0.92));
    }
  } else {
    // Multi-city: combine the cheaper options of each leg.
    const sorted = perLeg.map((opts) => [...opts].sort((a, b) => a.base - b.base).slice(0, 8));
    for (let i = 0; i < 24; i++) offers.push(make(sorted.map((opts) => opts[(i + Math.floor(r() * 3)) % opts.length]), 0.95));
  }

  const unique = new Map(offers.map((o) => [o.id, o]));
  return [...unique.values()].sort((a, b) => a.price.total - b.price.total);
}
