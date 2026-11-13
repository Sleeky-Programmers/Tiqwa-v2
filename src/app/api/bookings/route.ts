import { HOLD_HOURS } from "@/data/booking";
import { digest, LockBusyError, recall, remember, withLock } from "@/lib/api/idempotency";
import { bookingDetails, issueOnce } from "@/lib/api/issue";
import { bookingStatus, mapBooking, toPassenger } from "@/lib/api/mappers";
import type { WlBookingDetails } from "@/lib/api/types";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";
import type { Reservation, Traveller } from "@/lib/booking/store";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const code = (len: number, chars = `${LETTERS}23456789`) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

type ReserveBody = { offerId?: string; travellers?: Traveller[]; documentRequired?: boolean; addonIds?: string[]; couponCode?: string };
/** Progress of one reservation, so a retry resumes instead of starting over. */
type ReserveState = { digest: string; bookingId: string; reference: string; reservation?: Reservation };

const FARE_RELEASED = "The airline released this fare while you were booking. Please search again to see current prices.";
const FARE_USED = "This fare was already booked with different traveller details. Please search again to book with the new details.";

const sameName = (a = "", b = "") => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * After a lost response the backend refuses a second create for the same fare. For a signed-in
 * traveller the booking it made can be found in their booking list.
 */
async function findBooking(flightId: string, lead: Traveller) {
  const res = await upstream<WlBookingDetails[] | { itemList?: WlBookingDetails[] }>("/user/flight-bookings");
  if (!res.ok) return null;
  const rows = Array.isArray(res.data) ? res.data : (res.data?.itemList ?? []);
  const row = rows.find((r) => r.flight_id === flightId);
  const pax = row?.passengers?.[0];
  if (!row || (pax && !(sameName(pax.first_name, lead.firstName) && sameName(pax.last_name, lead.surname)))) return null;
  return { bookingId: String(row.booking_id), reference: row.reference };
}

/**
 * create → reserve → read back the PNR and payment deadline.
 *
 * Repeat-safe. A fare (offer id) can only be booked once upstream, so it is the idempotency key: the
 * progress is remembered per fare, and a retry (double click, lost response, reload) gets the same
 * reservation or resumes at the step that failed. `reserve` itself is safe to repeat upstream.
 */
async function liveReserve(body: ReserveBody) {
  const flightId = String(body.offerId ?? "");
  const travellers = Array.isArray(body.travellers) ? body.travellers : [];
  if (!flightId || !travellers.length)
    return fail({ code: "INVALID", status: 400, message: "Your booking details are incomplete. Please go back and try again." });
  const documentRequired = !!body.documentRequired;
  const addonIds = body.addonIds ?? [];
  const couponCode = String(body.couponCode ?? "")
    .trim()
    .toUpperCase();
  const dg = digest({ travellers, documentRequired, addonIds, couponCode });
  const key = `reserve:${flightId}`;

  try {
    // The locked body returns a factory: identical requests share one run, but each needs its own Response.
    const reply = await withLock(
      key,
      async () => {
        let state = await recall<ReserveState>(key);
        if (state && state.digest !== dg) return () => fail({ code: "FARE_UNAVAILABLE", status: 409, message: FARE_USED });
        const done = state?.reservation;
        if (done) return () => Response.json(done);

        if (!state) {
          console.info("[reserve] creating booking for fare", flightId);
          const create = await upstream<{ booking_id: string | number; reference: string }>(`/flight/book/create/${encodeURIComponent(flightId)}`, {
            method: "POST",
            body: {
              document_required: documentRequired,
              passengers: travellers.map((t) => toPassenger(t, travellers[0], documentRequired)),
              ...(addonIds.length ? { flight_addons: addonIds.map((id) => ({ id: Number(id) || id })) } : {}),
              ...(couponCode ? { coupon_code: couponCode } : {}),
            },
            timeoutMs: 45_000,
            fallback: "We couldn't create your booking. Please check your passenger details and try again.",
          });
          if (create.ok) {
            state = { digest: dg, bookingId: String(create.data.booking_id), reference: create.data.reference };
          } else if (create.error.status === 404 || create.error.status === 410) {
            return () => fail({ code: "FARE_UNAVAILABLE", status: 409, message: FARE_RELEASED });
          } else if (/supply flight details/i.test(create.error.message)) {
            // The backend's answer to a second create for a fare: it was already used, most likely by
            // our own earlier attempt whose response was lost.
            const found = await findBooking(flightId, travellers[0]);
            if (!found) return () => fail({ code: "FARE_UNAVAILABLE", status: 409, message: FARE_RELEASED });
            state = { digest: dg, ...found };
          } else {
            return () => fail(create.error);
          }
          await remember(key, state);
        }

        const reserve = await upstream(`/flight/book/reserve`, {
          method: "POST",
          body: { booking_id: state.bookingId, flight_id: flightId },
          timeoutMs: 45_000,
          fallback: "We couldn't reserve this flight. The fare may have changed. Please go back and search again.",
        });
        // The booking is kept: retrying resumes here rather than creating another one.
        if (!reserve.ok) return () => fail(reserve.error.status === 404 ? { ...reserve.error, code: "FARE_UNAVAILABLE", status: 409 } : reserve.error);

        const d = await bookingDetails(state.reference);
        const reservation: Reservation = {
          pnr: state.reference,
          airlinePnr: d?.pnr || "Pending",
          orderNo: state.bookingId,
          expiresAt: d?.expires_at || new Date(Date.now() + HOLD_HOURS * 3600_000).toISOString(),
          bookingId: state.bookingId,
          flightId,
          ...(d?.payable_amount ? { payable: Number(d.payable_amount) } : {}),
        };
        await remember(key, { ...state, reservation });
        return () => Response.json(reservation);
      },
      { share: dg },
    );
    return reply();
  } catch (e) {
    if (e instanceof LockBusyError)
      return fail({ code: "IN_PROGRESS", status: 409, message: "We're still reserving this flight. Please wait a moment and try again." });
    throw e;
  }
}

// A checkout link is reused for the same payment choice within this window instead of opening a
// second gateway transaction (Flutterwave's hosted page allows 15 minutes).
const LINK_TTL = 10 * 60;

type PayBody = { bookingId?: string; flightId?: string; method?: string; gateway?: string; instalment?: number; reference?: string };
type PayResult = { authorizationUrl: string; transactionRef?: string } | { held: true; expiresAt?: string; transactionRef?: string };

/**
 * Start payment for a reserved booking: card / transfer / flexi redirect to the gateway; walk-in is a hold.
 * Repeat-safe: under a per-booking lock it re-reads the booking (already paid → `alreadyPaid`,
 * expired → refused) and reuses a recent checkout link for the same choice.
 */
async function livePay(body: PayBody) {
  if (!body.bookingId || !body.flightId || !body.method) return fail({ code: "INVALID", status: 400, message: "Choose a payment method to continue." });
  const { bookingId, flightId, method } = body;
  const hold = method === "WALK_IN_TRANSFER";
  const choice = { method, gateway: hold ? undefined : body.gateway, instalment: body.instalment || undefined };
  const linkKey = `pay:${bookingId}:${digest(choice)}`;

  try {
    const reply = await withLock(
      `pay:${bookingId}`,
      async () => {
        if (body.reference) {
          const d = await bookingDetails(body.reference);
          const status = d ? bookingStatus(d.status, !!d.ticket_issued) : null;
          if (d && status === "confirmed") {
            // Paid already (another tab, or a payment whose return page never loaded): make sure it's issued.
            const issued = await issueOnce(bookingId, flightId, body.reference);
            return () => Response.json({ alreadyPaid: true, booking: mapBooking(issued ?? d) });
          }
          if (status === "cancelled")
            return () =>
              fail({
                code: "BOOKING_CLOSED",
                status: 409,
                message: "This booking has expired or been cancelled, so it can't be paid. Please search again to book.",
              });
        }
        const saved = await recall<PayResult>(linkKey);
        if (saved) return () => Response.json({ ...saved, reused: true });

        console.info("[pay] starting payment", bookingId, method, choice.gateway ?? "");
        const res = await upstream<{ authorization_url?: string; tranx_reference?: string }>("/payment/flight/initiate", {
          method: "POST",
          body: {
            flight_id: flightId,
            booking_id: bookingId,
            payment_method: method,
            currency: "NGN",
            ...(choice.gateway ? { payment_gateway: choice.gateway } : {}),
            ...(choice.instalment ? { instalment: choice.instalment } : {}),
          },
          timeoutMs: 30_000,
          fallback: "We couldn't start your payment. Please try again, or choose a different payment method.",
        });
        if (!res.ok) {
          if (/already been booked/i.test(res.error.message)) return () => Response.json({ alreadyPaid: true, booking: null });
          return () => fail(res.error);
        }
        let result: PayResult;
        if (hold) {
          const d = body.reference ? await bookingDetails(body.reference) : null;
          result = { held: true, expiresAt: d?.expires_at, transactionRef: res.data?.tranx_reference };
        } else {
          if (!res.data?.authorization_url)
            return () =>
              fail({
                code: "GATEWAY_ERROR",
                status: 502,
                message: "We couldn't connect to the payment provider. Please try again or choose a different payment method.",
              });
          result = { authorizationUrl: res.data.authorization_url, transactionRef: res.data.tranx_reference };
        }
        await remember(linkKey, result, LINK_TTL);
        return () => Response.json(result);
      },
      { share: linkKey, waitMs: 30_000 },
    );
    return reply();
  } catch (e) {
    if (e instanceof LockBusyError)
      return fail({ code: "IN_PROGRESS", status: 409, message: "We're already starting a payment for this booking. Please wait a moment and try again." });
    throw e;
  }
}

/**
 * Booking API.
 * POST { action: "reserve", offerId, travellers, documentRequired, addonIds, couponCode? } → Reservation (PNR + deadline)
 * POST { action: "pay", bookingId, flightId, method, gateway?, instalment?, reference } → { authorizationUrl } | { held }  (live)
 * POST { action: "confirm", method, reference? } → demo-mode payment result (paystack | bank | hold)
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (isLive()) {
    if (action === "reserve") return liveReserve(body);
    if (action === "pay") return livePay(body);
    return fail({ code: "UNKNOWN_ACTION", status: 400, message: "Unknown action." });
  }

  if (action === "reserve") {
    await mockDelay(1600);
    // ~1 in 25 reservations fail so the "fare no longer available" path can be seen.
    if (body?.offerId && Math.random() < 0.04) {
      return fail({
        code: "FARE_UNAVAILABLE",
        status: 409,
        message: "The airline released this fare while you were booking. Please search again to see current prices.",
      });
    }
    return Response.json({
      pnr: code(6),
      airlinePnr: code(6, LETTERS),
      orderNo: `TB${Date.now().toString().slice(-8)}`,
      expiresAt: new Date(Date.now() + HOLD_HOURS * 3600_000).toISOString(),
    } satisfies Reservation);
  }

  if (action === "confirm") {
    await mockDelay(1400);
    const method = body?.method;
    if (!["paystack", "bank", "hold"].includes(method)) return fail({ code: "INVALID_METHOD", status: 400, message: "Choose a payment method." });
    return Response.json({
      status: method === "paystack" ? "confirmed" : method === "bank" ? "processing" : "reserved",
      transactionRef: method === "paystack" ? (body?.reference ?? `T${code(12, "0123456789")}`) : null,
      paidAt: method === "paystack" ? new Date().toISOString() : null,
    });
  }

  return fail({ code: "UNKNOWN_ACTION", status: 400, message: "Unknown action." });
}
