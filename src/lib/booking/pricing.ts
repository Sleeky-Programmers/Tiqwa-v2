import { addons as allAddons, PAYMENT_GATEWAY_FEE } from "@/data/booking";
import { paxCount } from "@/lib/flights/format";
import type { BookingDraft } from "./store";

/** Money maths shared by the checkout summary, payment step and confirmation page. */
export function bookingTotals(b: Pick<BookingDraft, "offer" | "search" | "addonIds" | "promo">) {
  const pax = paxCount(b.search.pax);
  const addonLines = allAddons
    .filter((a) => b.addonIds?.includes(a.id))
    .map((a) => ({ id: a.id, name: a.name, qty: a.isPerPassenger ? pax : 1, amount: a.price * (a.isPerPassenger ? pax : 1) }));
  const fare = b.offer.price.total;
  const addonsTotal = addonLines.reduce((s, l) => s + l.amount, 0);
  const discount = Math.min(b.promo?.discount ?? 0, fare + addonsTotal);
  const total = fare + addonsTotal - discount;
  return { fare, addonLines, addonsTotal, discount, total, gatewayFee: PAYMENT_GATEWAY_FEE, payable: total + PAYMENT_GATEWAY_FEE };
}
