"use client";

// Booking history for the customer dashboard: mock past/upcoming trips generated with the
// flight mock, merged with bookings made through /checkout in this browser (localStorage).

import { HOLD_HOURS } from "@/data/booking";
import { demoUser } from "@/data/dashboard/user";
import { searchFlights } from "@/lib/flights/mock";
import type { FlightSearch, TripType } from "@/lib/flights/types";
import { bookingTotals } from "./pricing";
import type { BookingDraft, Traveller } from "./store";

export type BookingStatus = "confirmed" | "pending" | "hold" | "completed" | "cancelled";
export type HistoryBooking = BookingDraft & {
  reservation: NonNullable<BookingDraft["reservation"]>;
  payment: NonNullable<BookingDraft["payment"]>;
  status: BookingStatus;
  cancelledAt?: string;
};

const KEY = "tbils.bookings";
const OVERRIDES = "tbils.bookings.overrides";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

const lead: Traveller = {
  type: "adult",
  title: demoUser.title,
  firstName: demoUser.firstName,
  middleName: "",
  surname: demoUser.surname,
  gender: demoUser.gender,
  dob: demoUser.dob,
  country: demoUser.country,
  phone: demoUser.phone,
  email: demoUser.email,
  passportNumber: demoUser.passportNumber,
  passportIssued: "2021-03-15",
  passportExpiry: demoUser.passportExpiry,
  passportCountry: demoUser.passportCountry,
  guardian: "",
};
const companion = (type: Traveller["type"], first: string, title: string, gender: string, dob: string): Traveller => ({
  ...lead,
  type,
  title,
  firstName: first,
  gender,
  dob,
  phone: "",
  email: "",
  passportNumber: "",
  passportIssued: "",
  passportExpiry: "",
  guardian: type === "infant" ? "0" : "",
});

type Seed = {
  ref: string;
  trip: TripType;
  route: [string, string];
  departIn: number; // days from today (negative = past)
  stay?: number;
  adults?: number;
  children?: number;
  cabin?: FlightSearch["cabin"];
  pick: number;
  status: BookingStatus;
  bookedDaysBefore: number;
  addons?: string[];
};

const seeds: Seed[] = [
  { ref: "TBX4QL", trip: "round", route: ["LOS", "LHR"], departIn: 9, stay: 14, pick: 1, status: "confirmed", bookedDaysBefore: 34, addons: ["travel-insurance"] },
  { ref: "TBK7MA", trip: "oneway", route: ["LOS", "ABV"], departIn: 3, pick: 0, status: "confirmed", bookedDaysBefore: 6 },
  { ref: "TBP2DX", trip: "round", route: ["ABV", "DXB"], departIn: 27, stay: 7, adults: 2, pick: 2, status: "hold", bookedDaysBefore: 0 },
  { ref: "TBR9AC", trip: "oneway", route: ["LOS", "ACC"], departIn: 41, pick: 0, status: "pending", bookedDaysBefore: 1 },
  { ref: "TBC5YZ", trip: "round", route: ["LOS", "YYZ"], departIn: 64, stay: 21, adults: 2, children: 1, pick: 3, status: "confirmed", bookedDaysBefore: 12, addons: ["flight-reminder"] },
  { ref: "TBN1PH", trip: "oneway", route: ["LOS", "PHC"], departIn: -12, pick: 1, status: "completed", bookedDaysBefore: 20 },
  { ref: "TBD8NB", trip: "round", route: ["LOS", "NBO"], departIn: -48, stay: 6, pick: 0, status: "completed", bookedDaysBefore: 70 },
  { ref: "TBQ3DO", trip: "round", route: ["ABV", "DOH"], departIn: -95, stay: 10, adults: 2, pick: 1, status: "completed", bookedDaysBefore: 120, addons: ["car-hire"] },
  { ref: "TBF6CD", trip: "oneway", route: ["LOS", "CDG"], departIn: -140, pick: 2, status: "cancelled", bookedDaysBefore: 160 },
  { ref: "TBJ2NY", trip: "round", route: ["LOS", "JFK"], departIn: -205, stay: 18, pick: 0, status: "completed", bookedDaysBefore: 240, addons: ["travel-insurance"] },
  { ref: "TBL4KN", trip: "oneway", route: ["ABV", "KAN"], departIn: -260, pick: 0, status: "completed", bookedDaysBefore: 268 },
  { ref: "TBI0IS", trip: "round", route: ["LOS", "IST"], departIn: -318, stay: 9, pick: 1, status: "completed", bookedDaysBefore: 350 },
];

function fromSeed(s: Seed): HistoryBooking | null {
  const adults = s.adults ?? 1;
  const children = s.children ?? 0;
  const legs = [{ from: s.route[0], to: s.route[1], date: addDays(s.departIn) }];
  if (s.trip === "round") legs.push({ from: s.route[1], to: s.route[0], date: addDays(s.departIn + (s.stay ?? 7)) });
  const search: FlightSearch = { trip: s.trip, legs, pax: { adults, children, infants: 0 }, cabin: s.cabin ?? "economy" };
  const offers = searchFlights(search);
  const offer = offers[Math.min(s.pick, offers.length - 1)];
  if (!offer) return null;
  const travellers = [
    lead,
    ...(adults > 1 ? [companion("adult", "Ada", "Mrs.", "Female", "1992-09-02")] : []),
    ...(children > 0 ? [companion("child", "Tobi", "Master", "Male", "2017-06-21")] : []),
  ];
  const bookedAt = new Date(Date.now() - s.bookedDaysBefore * 86_400_000);
  const draft = { search, offer, travellers, addonIds: s.addons ?? [] };
  const t = bookingTotals(draft);
  const paid = s.status === "confirmed" || s.status === "completed" || s.status === "cancelled";
  return {
    ...draft,
    status: s.status,
    reservation: {
      pnr: s.ref,
      airlinePnr: s.ref.split("").reverse().join(""),
      orderNo: `TB${String(hash(s.ref)).slice(0, 8)}`,
      expiresAt: new Date(bookedAt.getTime() + HOLD_HOURS * 3600_000 + (s.status === "hold" ? 18 * 3600_000 : 0)).toISOString(),
    },
    payment: {
      method: s.status === "hold" ? "hold" : s.status === "pending" ? "bank" : "paystack",
      status: paid ? "confirmed" : s.status === "pending" ? "processing" : "reserved",
      transactionRef: paid ? `T${hash(s.ref + "tx")}` : null,
      paidAt: paid ? bookedAt.toISOString() : null,
      amount: paid ? t.payable : t.total,
      fee: paid ? t.gatewayFee : 0,
    },
    bookedAt: bookedAt.toISOString(),
    ...(s.status === "cancelled" ? { cancelledAt: new Date(bookedAt.getTime() + 5 * 86_400_000).toISOString() } : {}),
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) % 1e10;
}

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

let cache: HistoryBooking[] | null = null;
const mockBookings = () => (cache ??= seeds.map(fromSeed).filter((b): b is HistoryBooking => !!b));

/** Status changes made from the dashboard (pay now / cancel), keyed by booking ref. */
type Override = { status: BookingStatus; cancelledAt?: string; payment?: HistoryBooking["payment"] };

/** All bookings: made in this browser first, then mock history; dashboard edits applied. */
export function listBookings(): HistoryBooking[] {
  const overrides = read<Record<string, Override>>(OVERRIDES, {});
  return [...read<HistoryBooking[]>(KEY, []), ...mockBookings()].map((b) => {
    const o = overrides[b.reservation.pnr];
    const merged = o ? { ...b, ...o, payment: o.payment ?? b.payment } : b;
    // Anything that has already landed is "completed" unless cancelled or unpaid.
    if (merged.status === "confirmed" && isPast(merged)) return { ...merged, status: "completed" as const };
    return merged;
  });
}

export function updateBooking(ref: string, change: Override) {
  const overrides = read<Record<string, Override>>(OVERRIDES, {});
  write(OVERRIDES, { ...overrides, [ref]: change });
}

/** Called after a successful checkout so the booking shows up in the dashboard. */
export function recordBooking(b: BookingDraft) {
  if (!b.reservation || !b.payment) return;
  const status: BookingStatus = b.payment.status === "confirmed" ? "confirmed" : b.payment.status === "processing" ? "pending" : "hold";
  const list = read<HistoryBooking[]>(KEY, []).filter((x) => x.reservation.pnr !== b.reservation!.pnr);
  write(KEY, [{ ...b, status } as HistoryBooking, ...list]);
}

const lastArrival = (b: BookingDraft) => {
  const j = b.offer.journeys[b.offer.journeys.length - 1];
  return j.arrive;
};
export const firstDeparture = (b: BookingDraft) => b.offer.journeys[0].depart;
/** Local wall-clock "YYYY-MM-DDTHH:mm", comparable with journey times. */
const nowLocal = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const isPast = (b: BookingDraft) => lastArrival(b) < nowLocal();
/** Upcoming tab = not cancelled and not yet completed. */
export const isUpcoming = (b: HistoryBooking) => b.status !== "cancelled" && b.status !== "completed" && !isPast(b);

export const statusLabel: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending payment",
  hold: "On hold",
  completed: "Completed",
  cancelled: "Cancelled",
};
