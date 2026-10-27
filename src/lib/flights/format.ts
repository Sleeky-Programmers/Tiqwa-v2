import type { Cabin, FlightSearch, Pax } from "./types";

/** "2026-10-26T15:30" → "15:30" */
export const fmtTime = (local: string) => local.slice(11, 16);

/** 1015 → "16h 55m" */
export const fmtDuration = (min: number) => `${Math.floor(min / 60)}h ${min % 60}m`;

const toDate = (local: string) => {
  const [y, m, d] = local.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** Whole days between two local timestamps' dates (for the "+1" marker). */
export const dayDiff = (from: string, to: string) => Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);

/** "Mon, Oct 26, 2026" */
export const fmtLongDate = (local: string) =>
  toDate(local).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/** "26 Oct 2026" */
export const fmtShortDate = (local: string) =>
  toDate(local).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
/** "₦ 726,025" — spaced variant tbils.com uses in filters and summaries. */
export const nairaSpaced = (n: number) => `₦ ${Math.round(n).toLocaleString("en-NG")}`;

export const cabinLabel: Record<Cabin, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business class",
  first: "First Class",
};

export const tripLabel = { oneway: "One-way", round: "Round trip", multi: "Multi-city" } as const;

export const paxCount = (p: Pax) => p.adults + p.children + p.infants;
export const paxLabel = (p: Pax) => {
  const n = paxCount(p);
  return `${n} Passenger${n > 1 ? "s" : ""}`;
};

/** "One-way · 26 Oct 2026 · 1 Passenger · Economy" */
export const searchMeta = (s: FlightSearch) => {
  const dates =
    s.trip === "round" ? `${fmtShortDate(s.legs[0].date)} – ${fmtShortDate(s.legs[1].date)}` : fmtShortDate(s.legs[0].date);
  return [tripLabel[s.trip], dates, paxLabel(s.pax), cabinLabel[s.cabin].replace(" class", "")].join(" · ");
};

export const stopsLabel = (stops: number) => (stops === 0 ? "Non-stop" : `${stops} Stop${stops > 1 ? "s" : ""}`);

/** Time-of-day bucket for the coloured route dots (tbils.com: dawn / day / dusk / night). */
export const timeOfDay = (local: string): "dawn" | "day" | "dusk" | "night" => {
  const h = Number(local.slice(11, 13));
  if (h >= 5 && h < 9) return "dawn";
  if (h >= 9 && h < 17) return "day";
  if (h >= 17 && h < 21) return "dusk";
  return "night";
};
