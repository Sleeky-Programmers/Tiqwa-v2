import type { NextRequest } from "next/server";
import { mapFlightItem } from "@/lib/api/mappers";
import type { WlConfirmPrice } from "@/lib/api/types";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";
import type { Cabin, FlightOffer } from "@/lib/flights/types";

export type ConfirmPrice = {
  /** Re-priced offer when the supplier returned a full itinerary; otherwise keep the one from search. */
  offer?: FlightOffer;
  total?: number;
  priceChanged: boolean;
  documentRequired?: boolean;
  seatsLeft?: number;
};

/**
 * GET /api/checkout/confirm-price?id=<offerId>&cabin=economy
 * Live: /flight/confirm-price/{id}, which re-checks the fare with the airline before checkout.
 * A 404/422 here means the fare is gone → FARE_UNAVAILABLE so the page can send the user back to search.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const cabin = (request.nextUrl.searchParams.get("cabin") ?? "economy") as Cabin;
  if (!id) return fail({ code: "INVALID", status: 400, message: "Missing flight." });

  if (!isLive()) {
    await mockDelay(1200);
    return Response.json({ priceChanged: false } satisfies ConfirmPrice);
  }

  const res = await upstream<WlConfirmPrice>(`/flight/confirm-price/${encodeURIComponent(id)}`, {
    timeoutMs: 45_000,
    fallback: "We couldn't confirm this fare with the airline. Please try again.",
  });
  if (!res.ok) {
    if (res.error.status === 404 || res.error.status === 422 || res.error.status === 410) {
      return fail({ code: "FARE_UNAVAILABLE", status: 409, message: "This fare is no longer available. Please search again to see current prices." });
    }
    return fail(res.error);
  }
  const d = res.data ?? {};
  const offer = d.outbound?.length
    ? (mapFlightItem({ ...d, id, amount: Number(d.amount) || 0, outbound: d.outbound } as Parameters<typeof mapFlightItem>[0], cabin) ?? undefined)
    : undefined;
  const body: ConfirmPrice = {
    offer: offer ? { ...offer, seatsLeft: d.bookable_seats || undefined } : undefined,
    total: Number(d.amount) || d.pricing?.payable || undefined,
    priceChanged: !!d.price_change,
    documentRequired: d.document_required,
    seatsLeft: d.bookable_seats || undefined,
  };
  return Response.json(body);
}
