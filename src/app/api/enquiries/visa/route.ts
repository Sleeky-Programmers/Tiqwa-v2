import { digest, submitOnce, underLimit, clientKey } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (v: unknown) => String(v ?? "").trim();

/** POST a visa assistance enquiry → { ok }. Live: /visa-enquiry. */
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const v = {
    first_name: str(b?.firstName),
    last_name: str(b?.lastName),
    email: str(b?.email),
    phone: str(b?.phone),
    resident_country: str(b?.residentCountry),
    destination_country: str(b?.destinationCountry),
    date_of_birth: str(b?.dateOfBirth),
    marital_status: str(b?.maritalStatus),
    has_passport: b?.hasPassport === true,
    has_travel_history: b?.hasTravelHistory === true,
    message: str(b?.message),
  };
  const fields: Record<string, string> = {};
  if (v.first_name.length < 2) fields.firstName = "Enter your first name";
  if (v.last_name.length < 2) fields.lastName = "Enter your last name";
  if (!EMAIL.test(v.email)) fields.email = "Enter a valid email address";
  if (v.phone.replace(/\D/g, "").length < 7) fields.phone = "Enter a phone number we can reach you on";
  if (!v.resident_country) fields.residentCountry = "Choose where you live";
  if (!v.destination_country) fields.destinationCountry = "Choose where you want to go";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date_of_birth) || v.date_of_birth > new Date().toISOString().slice(0, 10)) fields.dateOfBirth = "Enter your date of birth";
  if (!v.marital_status) fields.maritalStatus = "Choose your marital status";
  if (typeof b?.hasPassport !== "boolean") fields.hasPassport = "Tell us if you have a passport";
  if (typeof b?.hasTravelHistory !== "boolean") fields.hasTravelHistory = "Tell us if you have travelled before";
  if (v.message.length < 10) fields.message = "Tell us a little more (at least 10 characters)";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  if (!(await underLimit(`visa:${clientKey(request)}`, 5, 15 * 60))) {
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many requests. Please wait a few minutes and try again." });
  }
  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  const error = await submitOnce(`visa:${digest(v)}`, async () => {
    const res = await upstream("/visa-enquiry", {
      method: "POST",
      body: v,
      auth: false,
      fallback: "We couldn't send your enquiry right now. Please try again in a moment.",
    });
    if (res.ok) return null;
    // The backend names fields in snake_case; the form uses camelCase.
    const camel = (k: string) => k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
    return { ...res.error, fields: res.error.fields && Object.fromEntries(Object.entries(res.error.fields).map(([k, m]) => [camel(k), m])) };
  });
  return error ? fail(error) : Response.json({ ok: true });
}
