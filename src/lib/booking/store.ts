"use client";

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

export type Reservation = { pnr: string; airlinePnr: string; orderNo: string; expiresAt: string };

export type BookingDraft = {
  search: FlightSearch;
  offer: FlightOffer;
  travellers?: Traveller[];
  addonIds?: string[];
  promo?: { code: string; discount: number };
  reservation?: Reservation;
  payment?: {
    method: "paystack" | "bank" | "hold";
    status: "confirmed" | "processing" | "reserved";
    transactionRef: string | null;
    paidAt: string | null;
    amount: number;
    fee: number;
  };
  bookedAt?: string;
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
