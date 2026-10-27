import { promoCodes } from "@/data/booking";

/** MOCK promo validation. POST { code, amount } → { discount, label } */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = String(body?.code ?? "").trim().toUpperCase();
  const amount = Number(body?.amount) || 0;
  await new Promise((r) => setTimeout(r, 700));
  const promo = promoCodes[code];
  if (!promo) return Response.json({ error: "This promo code is invalid or has expired." }, { status: 422 });
  const raw = promo.type === "percent" ? (amount * promo.value) / 100 : promo.value;
  const discount = Math.round(Math.min(raw, promo.cap ?? raw, amount));
  return Response.json({ code, discount, label: promo.label });
}
