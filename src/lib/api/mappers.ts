// Backend (whitelabel) shapes → this app's shared types, and back. Pure functions, no I/O.

import type { BookingStatus, HistoryBooking } from "@/lib/booking/history";
import type { Traveller } from "@/lib/booking/store";
import type { AirportRef, Cabin, FlightOffer, FlightSearch, Journey, PriceBreakdown, Segment } from "@/lib/flights/types";
import type { WlBookingDetails, WlFlightItem, WlMultiCityItem, WlPassenger, WlPriceSummary, WlSegment } from "./types";

/** "2026-11-20T07:00:00" → "2026-11-20T07:00" (supplier times are already local wall-clock). */
const local = (iso: string) => iso.slice(0, 16);
const minutesBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 60_000);

const airport = (d: WlSegment["airport_from_details"], code: string): AirportRef => ({
  code: d?.iata_code || code,
  city: d?.city || code,
  name: d?.name || code,
  country: d?.country || "",
});

/** "EE-4240" / "504" → "EE 4240" / "UN 504". */
function flightNo(raw: string | undefined, airline: string) {
  const n = (raw ?? "").replace(/[^A-Za-z0-9]/g, "");
  const digits = n.toUpperCase().startsWith(airline.toUpperCase()) ? n.slice(airline.length) : n;
  return `${airline} ${digits}`.trim();
}

function mapSegments(raw: WlSegment[], offerId: string, leg: number): Segment[] {
  return raw.map((s, i) => {
    const code = s.airline_details?.code || s.marketing_airline || "";
    const next = raw[i + 1];
    const given = Number(s.layover);
    const layoverMin = next ? (Number.isFinite(given) && given > 0 ? given : Math.max(0, minutesBetween(s.arrival_time, next.departure_time))) : undefined;
    return {
      id: `${offerId}-${leg}-${i}`,
      airline: { code, name: s.airline_details?.name || code },
      flightNumber: flightNo(s.flight_number, code),
      aircraft: s.equipment_type ?? "",
      from: airport(s.airport_from_details, s.airport_from),
      to: airport(s.airport_to_details, s.airport_to),
      depart: local(s.departure_time),
      arrive: local(s.arrival_time),
      durationMin: s.duration,
      ...(layoverMin !== undefined ? { layoverMin } : {}),
    };
  });
}

function journey(segments: Segment[], total?: number | null): Journey {
  const first = segments[0];
  const last = segments[segments.length - 1];
  const sum = segments.reduce((n, s) => n + s.durationMin + (s.layoverMin ?? 0), 0);
  // The supplier's totals leave out layovers, so door-to-door time is rebuilt from the segments.
  return { segments, from: first.from, to: last.to, depart: first.depart, arrive: last.arrive, durationMin: sum || total || 0, stops: segments.length - 1 };
}

/** Totals per passenger type. `price_summary` rows are tax-inclusive and add up to the fare. */
function price(summary: WlPriceSummary[] | undefined, total: number, fallbackPax?: FlightSearch["pax"]): PriceBreakdown {
  const row = (type: string) => {
    const r = summary?.find((p) => p.passenger_type === type || (type === "infant" && p.passenger_type === "held_infant"));
    return r && r.quantity > 0 ? { count: r.quantity, unit: r.total_price / r.quantity } : { count: 0, unit: 0 };
  };
  const out = { adults: row("adult"), children: row("child"), infants: row("infant") };
  if (!summary?.length && fallbackPax) out.adults = { count: fallbackPax.adults, unit: total / Math.max(1, fallbackPax.adults) };
  const listed = out.adults.count * out.adults.unit + out.children.count * out.children.unit + out.infants.count * out.infants.unit;
  // Anything the rows don't cover (service fees) is shown as taxes & fees.
  return { ...out, taxes: Math.max(0, Math.round(total - listed)), total };
}

const BAG = /checked\s*\(([^)]+)\)/i;
const CABIN = /cabin\s*\(([^)]+)\)/i;

function fareRules(segments: WlSegment[]): FlightOffer["fareRules"] {
  const notes = [
    ...new Set(
      segments
        .flatMap((s) => s.fare_rules ?? [])
        .map((n) => n.trim())
        .filter(Boolean),
    ),
  ];
  const refundable = segments.length > 0 && segments.every((s) => s.refundable);
  const baggage = segments.find((s) => s.baggage)?.baggage ?? "";
  const checked = BAG.exec(baggage)?.[1] ?? (baggage.replace(/^baggage allowance:\s*/i, "") || "As per airline policy");
  return {
    refundable,
    refundNote: notes.find((n) => /refund/i.test(n)) ?? (refundable ? "Refundable (airline fees may apply)" : "Non-refundable"),
    changeNote: notes.find((n) => /chang/i.test(n)) ?? "Changes allowed under the airline's fare rules",
    checkedBaggage: checked.replace(/\s*checkin allowance/i, " checked bag(s)").trim(),
    cabinBaggage: CABIN.exec(baggage)?.[1] ?? "Cabin bag as per airline policy",
    ...(notes.length ? { notes } : {}),
  };
}

export function mapFlightItem(item: WlFlightItem, cabin: Cabin, pax?: FlightSearch["pax"]): FlightOffer | null {
  if (!item.outbound?.length) return null;
  const out = mapSegments(item.outbound, item.id, 0);
  const inbound = item.inbound?.length ? mapSegments(item.inbound, item.id, 1) : null;
  const journeys = [journey(out, item.total_outbound_duration), ...(inbound ? [journey(inbound, item.total_inbound_duration)] : [])];
  const total = Number(item.amount) || item.pricing?.payable || 0;
  return {
    id: item.id,
    airline: out[0].airline,
    journeys,
    cabin,
    price: price(item.price_summary, total, pax),
    fareRules: fareRules([...item.outbound, ...(item.inbound ?? [])]),
  };
}

export function mapMultiCityItem(item: WlMultiCityItem, cabin: Cabin): FlightOffer | null {
  const routes = item.routes?.filter((r) => r.segments?.length) ?? [];
  if (!routes.length) return null;
  const journeys = routes.map((r, i) => journey(mapSegments(r.segments, item.id, i), r.total_segment_duration));
  const total = Number(item.amount) || item.pricing?.payable || 0;
  return {
    id: item.id,
    airline: journeys[0].segments[0].airline,
    journeys,
    cabin,
    price: price(item.price_summary, total),
    fareRules: fareRules(routes.flatMap((r) => r.segments)),
  };
}

/** First validation message when the supplier rejects a search (`itemList` is `{ message }`). */
export function searchError(itemList: unknown): string | null {
  if (Array.isArray(itemList)) return null;
  const messages = (itemList as { message?: Record<string, string[]> } | null)?.message;
  const first = messages ? Object.values(messages).flat()[0] : undefined;
  return first ?? "No flights were found for this search.";
}

// ---------- Passengers ----------

const TITLE_OUT: Record<string, string> = { "Mr.": "mr", "Mrs.": "mrs", "Ms.": "ms", Miss: "miss", Master: "mr" };
const TITLE_IN: Record<string, string> = { mr: "Mr.", mrs: "Mrs.", ms: "Ms.", miss: "Miss", master: "Master" };
const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Our traveller form → create-booking passenger (travel-agency BookingFlow.tsx). Contact comes from the lead. */
export function toPassenger(t: Traveller, lead: Traveller, documentRequired: boolean) {
  return {
    passenger_type: t.type,
    first_name: t.firstName.trim(),
    last_name: t.surname.trim(),
    middle_name: t.middleName.trim() || null,
    dob: t.dob,
    gender: t.gender.toLowerCase(),
    title: TITLE_OUT[t.title] ?? t.title.replace(".", "").toLowerCase(),
    email: lead.email.trim(),
    phone_number: `${lead.phone}`.replace(/[^\d+]/g, ""),
    ...(documentRequired && t.passportNumber
      ? {
          documents: {
            number: t.passportNumber.trim().toUpperCase(),
            issuing_date: t.passportIssued,
            expiry_date: t.passportExpiry,
            issuing_country: t.passportCountry.toUpperCase(),
            nationality_country: t.passportCountry.toUpperCase(),
            document_type: "passport",
            holder: true,
          },
        }
      : {}),
  };
}

function fromPassenger(p: WlPassenger): Traveller {
  const type = p.passenger_type === "child" ? "child" : p.passenger_type === "infant" || p.passenger_type === "held_infant" ? "infant" : "adult";
  return {
    type,
    title: TITLE_IN[(p.title ?? "").toLowerCase()] ?? cap(p.title),
    firstName: p.first_name ?? "",
    middleName: p.middle_name ?? "",
    surname: p.last_name ?? "",
    gender: cap(p.gender),
    dob: p.dob ?? "",
    country: "NG",
    // country is NG, so drop a +234 the backend may have kept (the UI adds the dial code back).
    phone: (p.phone_number ?? "").replace(/^\+?234(?=\d{10}$)/, "0"),
    email: p.email ?? "",
    passportNumber: p.documents?.number ?? "",
    passportIssued: p.documents?.issuing_date ?? "",
    passportExpiry: p.documents?.expiry_date ?? "",
    passportCountry: p.documents?.issuing_country ?? "NG",
    guardian: type === "infant" ? "0" : "",
  };
}

// ---------- Bookings ----------

const CABINS: Cabin[] = ["economy", "premium_economy", "business", "first"];
const cabinOf = (raw?: string): Cabin => {
  const c = (raw ?? "").toLowerCase().replace(/\s+/g, "_");
  return CABINS.find((x) => c.startsWith(x)) ?? (c.includes("business") ? "business" : c.includes("first") ? "first" : "economy");
};

export function bookingStatus(raw?: string, ticketed?: boolean): BookingStatus {
  const s = (raw ?? "").toUpperCase();
  if (/CANCEL|EXPIRE|FAIL|VOID|REFUND/.test(s)) return "cancelled";
  if (/UNPAID|NOT_PAID|PENDING/.test(s)) return ticketed ? "confirmed" : "pending";
  if (ticketed || /BOOKED|CONFIRM|TICKET|PAID|SUCCESS|COMPLETE/.test(s)) return "confirmed";
  if (/RESERV|HOLD/.test(s)) return "hold";
  return "pending";
}

/**
 * True once /flight/book has issued the booking. Payment alone moves a booking to PAID; issuing
 * moves it to BOOKED (and later ticketed), and must happen only once.
 */
export const isIssued = (b: Pick<WlBookingDetails, "status" | "ticket_issued" | "ticket_number">) =>
  /BOOKED|TICKET|ISSUED|COMPLETE/i.test(b.status ?? "") || !!Number(b.ticket_issued) || !!b.ticket_number;

/** Booking details (or a row from /user/flight-bookings) → the dashboard's booking shape. */
export function mapBooking(b: WlBookingDetails): HistoryBooking | null {
  const pax = { adults: 0, children: 0, infants: 0 };
  for (const p of b.price_summary ?? []) {
    if (p.passenger_type === "adult") pax.adults += p.quantity;
    else if (p.passenger_type === "child") pax.children += p.quantity;
    else pax.infants += p.quantity;
  }
  const travellers = (b.passengers ?? []).map(fromPassenger);
  if (!pax.adults && !pax.children && !pax.infants) {
    for (const t of travellers) pax[t.type === "adult" ? "adults" : t.type === "child" ? "children" : "infants"] += 1;
  }
  pax.adults ||= 1;
  const cabin = cabinOf(b.outbound?.[0]?.cabin_type);
  const offer = mapFlightItem({ ...b, id: b.flight_id || b.reference, amount: Number(b.amount) || 0 }, cabin, pax);
  if (!offer) return null;
  const search: FlightSearch = {
    trip: offer.journeys.length > 1 ? "round" : "oneway",
    legs: offer.journeys.map((j) => ({ from: j.from.code, to: j.to.code, date: j.depart.slice(0, 10) })),
    pax,
    cabin,
  };
  const status = bookingStatus(b.status, !!b.ticket_issued);
  const payable = Number(b.payable_amount ?? b.amount) || offer.price.total;
  const paid = status === "confirmed";
  return {
    search,
    offer,
    travellers,
    reservation: {
      pnr: b.reference,
      airlinePnr: b.pnr || "Pending",
      orderNo: String(b.booking_id ?? ""),
      expiresAt: b.expires_at || b.created_at || new Date().toISOString(),
      bookingId: String(b.booking_id ?? ""),
      flightId: String(b.flight_id ?? ""),
    },
    payment: {
      method: status === "hold" ? "hold" : "card",
      status: paid ? "confirmed" : status === "hold" ? "reserved" : "processing",
      transactionRef: b.ticket_number ?? null,
      paidAt: null,
      amount: payable,
      fee: 0,
    },
    bookedAt: b.created_at,
    status,
    live: true,
  };
}
