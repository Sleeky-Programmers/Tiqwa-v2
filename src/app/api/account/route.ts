import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const NAME = /^[A-Za-z][A-Za-z' -]{1,}$/;
const field = (name: string, message: string) => fail({ code: "VALIDATION", status: 422, message, fields: { [name]: message } });

/**
 * POST { action, ... } — account changes the backend stores (name and phone).
 *  - "name":    { firstName, surname, middleName?, phone }  → PUT /user/profile/update
 *  - "details": { firstName, surname, phone }               → PUT /user/profile/update
 * Everything else on the profile (title, DOB, passport…) has no endpoint and is saved on the device.
 * Passwords change through /api/auth/forgot-password + /api/auth/reset-password.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? "").trim();
  const surname = String(body?.surname ?? "").trim();
  const phone = String(body?.phone ?? "").replace(/[^\d+]/g, "");

  if (body?.action !== "name" && body?.action !== "details") return fail({ code: "UNKNOWN_ACTION", status: 400, message: "Unknown action." });
  if (!NAME.test(firstName)) return field("firstName", "Use letters only, at least 2");
  if (!NAME.test(surname)) return field("surname", "Use letters only, at least 2");
  if (body.middleName && !NAME.test(String(body.middleName).trim())) return field("middleName", "Use letters only, at least 2");
  if (phone && !/^\+?\d{7,15}$/.test(phone)) return field("phone", "Please enter a valid phone number");

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  const res = await upstream("/user/profile/update", {
    method: "PUT",
    body: { first_name: firstName, last_name: surname, phone },
    fallback: "We couldn't save your changes right now. Please try again.",
  });
  if (!res.ok) {
    const f = res.error.fields;
    const mapped = f ? { ...(f.first_name ? { firstName: f.first_name } : {}), ...(f.last_name ? { surname: f.last_name } : {}), ...(f.phone ? { phone: f.phone } : {}) } : {};
    return fail({ ...res.error, fields: Object.keys(mapped).length ? mapped : undefined });
  }
  return Response.json({ ok: true });
}
