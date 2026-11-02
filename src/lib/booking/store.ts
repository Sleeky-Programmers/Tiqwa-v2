"use client";

import type { Addon } from "@/data/booking";
import type { FlightOffer, FlightSearch } from "@/lib/flights/types";

/**
 * Client-side booking state carried between /flights → /checkout → /booking-success.
 * Kept in sessionStorage (per tab) because there is no backend yet.
 */

export type Traveller = {
  type: "adult" | "child" | "infant";
  title: string;
  firstName: string;
  middleName: string;
  surname: string;
  gender: string;
  dob: string;
  country: string;
  phone: string;
  email: string;
  passportNumber: string;
  passportIssued: string;
  passportExpiry: string;
  passportCountry: string;
  /** Infants only: index of the adult they travel on the lap of ("" until chosen). */
  guardian: string;
};

export type Reservation = {
  pnr: string;
  airlinePnr: string;
  orderNo: string;
  expiresAt: string;
  /** Backend ids needed to pay for a live booking. */
  bookingId?: string;
  flightId?: string;
  /** Amount the backend will charge, when it differs from our own sum. */
  payable?: number;
};

/** paystack/bank/hold are the demo methods; card/transfer/flexi come from the live payment methods. */
export type PaymentMethodId = "paystack" | "bank" | "hold" | "card" | "transfer" | "flexi";

export type BookingDraft = {
  search: FlightSearch;
  offer: FlightOffer;
  travellers?: Traveller[];
  addonIds?: string[];
  promo?: { code: string; discount: number };
  reservation?: Reservation;
  payment?: {
    method: PaymentMethodId;
    /** Shown on confirmations, e.g. "Card via Paystack" or "Pay small small (3 instalments)". */
    methodLabel?: string;
    status: "confirmed" | "processing" | "reserved";
    transactionRef: string | null;
    paidAt: string | null;
    amount: number;
    fee: number;
  };
  bookedAt?: string;
  /** Came from the booking backend (no mock gateway fee, real ids). */
  live?: boolean;
  /** Live fares: whether passport details must be sent with the booking. */
  documentRequired?: boolean;
  /** Live fares: the price moved when we re-checked it on checkout. */
  priceChanged?: boolean;
  /** Add-ons offered for this booking, so totals don't depend on which catalogue is loaded. */
  addons?: Addon[];
};

const KEY = "tbils.booking";

export function loadBooking(): BookingDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookingDraft) : null;
  } catch {
    return null;
  }
}

export function saveBooking(draft: BookingDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {}
}

export function updateBooking(patch: Partial<BookingDraft>) {
  const current = loadBooking();
  if (current) saveBooking({ ...current, ...patch });
}
