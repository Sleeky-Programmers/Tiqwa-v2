import { clientKey, digest, submitOnce, underLimit } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown) => String(v ?? "").trim();
const count = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));

type Reservation = { package_title?: string; amount?: number; payable_amount?: number };

/** POST a holiday package reservation request → { ok, packageTitle, total }. Live: /holiday-packages/reserve. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const v = {
    package_id: str(b?.packageId),
    first_name: str(b?.firstName),
    last_name: str(b?.lastName),
    email: str(b?.email),
    phone: str(b?.phone),
    departure_date: str(b?.departureDate),
    return_date: str(b?.returnDate),
    adults: count(b?.adults),
    children: count(b?.children),
  };
  const today = new Date().toISOString().slice(0, 10);
  const fields: Record<string, string> = {};
  if (!v.package_id) fields.form = "This package can't be reserved right now.";
  if (v.first_name.length < 2) fields.firstName = "Enter your first name";
  if (v.last_name.length < 2) fields.lastName = "Enter your last name";
  if (!EMAIL.test(v.email)) fields.email = "Enter a valid email address";
  if (v.phone.replace(/\D/g, "").length < 7) fields.phone = "Enter a phone number we can reach you on";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.departure_date) || v.departure_date < today) fields.departureDate = "Choose a departure date in the future";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.return_date) || v.return_date <= v.departure_date) fields.returnDate = "Choose a return date after departure";
  if (v.adults < 1 || v.adults > 9) fields.adults = "Between 1 and 9 adults";
  if (v.children > 9) fields.children = "Up to 9 children";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  if (!(await underLimit(`reserve-pkg:${clientKey(request)}`, 8, 15 * 60))) {
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many requests. Please wait a few minutes and try again." });
  }
  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true, packageTitle: "", total: 0 });
  }

  let reservation: Reservation | undefined;
  const error = await submitOnce(`pkg:${digest(v)}`, async () => {
    const res = await upstream<Reservation>("/holiday-packages/reserve", {
      method: "POST",
      body: v,
      auth: false,
      fallback: "We couldn't send your reservation right now. Please try again in a moment.",
    });
    if (res.ok) {
      reservation = res.data;
      return null;
    }
    const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    return { ...res.error, fields: res.error.fields && Object.fromEntries(Object.entries(res.error.fields).map(([k, m]) => [camel(k), m])) };
  });
  if (error) return fail(error);
  // A repeat submission is answered without the backend's details, so the page falls back to its own wording.
  return Response.json({ ok: true, packageTitle: reservation?.package_title ?? "", total: reservation?.payable_amount ?? reservation?.amount ?? 0 });
}
