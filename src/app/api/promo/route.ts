import { promoCodes } from "@/data/booking";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const invalid = () => fail({ code: "INVALID_PROMO", status: 422, message: "This promo code is invalid or has expired." });

/** POST { code, amount } → { code, discount, label }. Live: /rewards/coupon/validate (service FLIGHT). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = String(body?.code ?? "").trim().toUpperCase();
  const amount = Number(body?.amount) || 0;
  if (!code) return fail({ code: "VALIDATION", status: 422, message: "Enter a promo code." });

  if (!isLive()) {
    await mockDelay(700);
    const promo = promoCodes[code];
    if (!promo) return invalid();
    const raw = promo.type === "percent" ? (amount * promo.value) / 100 : promo.value;
    const discount = Math.round(Math.min(raw, promo.cap ?? raw, amount));
    return Response.json({ code, discount, label: promo.label });
  }

  const res = await upstream<{ is_valid?: boolean; discount?: number; coupon_code?: string }>("/rewards/coupon/validate", {
    method: "POST",
    body: { payment_amount: amount, coupon_code: code, service: "FLIGHT" },
    fallback: "This promo code is invalid or has expired.",
  });
  if (!res.ok) return fail({ ...res.error, code: "INVALID_PROMO", status: res.error.status >= 500 ? res.error.status : 422 });
  if (!res.data?.is_valid || !res.data.discount) return invalid();
  const discount = Math.round(Math.min(Number(res.data.discount), amount));
  return Response.json({ code: res.data.coupon_code ?? code, discount, label: `₦${discount.toLocaleString("en-NG")} off` });
}
