import { addons as allAddons, PAYMENT_GATEWAY_FEE } from "@/data/booking";
import { paxCount } from "@/lib/flights/format";
import type { BookingDraft } from "./store";

/** Money maths shared by the checkout summary, payment step and confirmation page. */
export function bookingTotals(b: Pick<BookingDraft, "offer" | "search" | "addonIds" | "promo" | "addons" | "live">) {
  const pax = paxCount(b.search.pax);
  const addonLines = (b.addons ?? (b.live ? [] : allAddons))
    .filter((a) => b.addonIds?.includes(a.id))
    .map((a) => ({ id: a.id, name: a.name, qty: a.isPerPassenger ? pax : 1, amount: a.price * (a.isPerPassenger ? pax : 1) }));
  const fare = b.offer.price.total;
  const addonsTotal = addonLines.reduce((s, l) => s + l.amount, 0);
  const discount = Math.min(b.promo?.discount ?? 0, fare + addonsTotal);
  const total = fare + addonsTotal - discount;
  // Live bookings are charged what the backend says (gateway charges included), so no mock fee on top.
  const gatewayFee = b.live ? 0 : PAYMENT_GATEWAY_FEE;
  return { fare, addonLines, addonsTotal, discount, total, gatewayFee, payable: total + gatewayFee };
}
