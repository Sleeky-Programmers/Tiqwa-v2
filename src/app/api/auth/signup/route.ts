import { clientKey, underLimit } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME = /^[A-Za-z][A-Za-z' -]{1,}$/;

/** POST { firstName, lastName, email, password, phone? } → { ok, email }. The backend emails a 6-digit code. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  const phone = String(body?.phone ?? "").replace(/[^\d+]/g, "");

  const fields: Record<string, string> = {};
  if (!NAME.test(firstName)) fields.firstName = "Use letters only, at least 2";
  if (!NAME.test(lastName)) fields.lastName = "Use letters only, at least 2";
  if (!EMAIL.test(email)) fields.email = "Enter a valid email address";
  if (password.length < 8) fields.password = "Use at least 8 characters";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  if (!(await underLimit(`signup:${clientKey(request)}`, 10, 15 * 60)))
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many attempts. Please wait a few minutes and try again." });

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true, email });
  }

  const res = await upstream("/auth/signup", {
    method: "POST",
    auth: false,
    body: { first_name: firstName, last_name: lastName, email, password, ...(phone ? { phone } : {}) },
    fallback: "We couldn't create your account right now. Please try again.",
  });
  if (!res.ok) {
    // Backend field names → the form's.
    const f = res.error.fields ?? {};
    const mapped = Object.fromEntries(
      Object.entries({ firstName: f.first_name, lastName: f.last_name, email: f.email, password: f.password, phone: f.phone }).filter(([, v]) => v),
    );
    return fail({ ...res.error, fields: Object.keys(mapped).length ? mapped : undefined });
  }
  return Response.json({ ok: true, email });
}
