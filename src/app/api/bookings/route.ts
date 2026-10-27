import { HOLD_HOURS } from "@/data/booking";

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const code = (len: number, chars = LETTERS + "23456789") =>
  Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

/**
 * MOCK booking API.
 * POST { action: "reserve" }                      → reserves seats, returns PNR + payment deadline
 * POST { action: "confirm", method, reference? }  → records a payment (paystack | bank | hold)
 * Nothing is persisted; the client keeps the booking in sessionStorage.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const action = body?.action;

  if (action === "reserve") {
    await new Promise((r) => setTimeout(r, 1600));
    // ~1 in 25 reservations fail so the "fare no longer available" path can be seen.
    if (body?.offerId && Math.random() < 0.04) {
      return Response.json(
        { error: { code: "FARE_UNAVAILABLE", message: "The airline released this fare while you were booking. Please search again to see current prices." } },
        { status: 409 },
      );
    }
    return Response.json({
      pnr: code(6),
      airlinePnr: code(6, LETTERS),
      orderNo: `TB${Date.now().toString().slice(-8)}`,
      expiresAt: new Date(Date.now() + HOLD_HOURS * 3600_000).toISOString(),
    });
  }

  if (action === "confirm") {
    await new Promise((r) => setTimeout(r, 1400));
    const method = body?.method;
    if (!["paystack", "bank", "hold"].includes(method)) {
      return Response.json({ error: { code: "INVALID_METHOD", message: "Choose a payment method." } }, { status: 400 });
    }
    return Response.json({
      status: method === "paystack" ? "confirmed" : method === "bank" ? "processing" : "reserved",
      transactionRef: method === "paystack" ? body?.reference ?? `T${code(12, "0123456789")}` : null,
      paidAt: method === "paystack" ? new Date().toISOString() : null,
    });
  }

  return Response.json({ error: { code: "UNKNOWN_ACTION", message: "Unknown action." } }, { status: 400 });
}
