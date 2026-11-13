import { clientKey, underLimit } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

/** POST { email } → { ok }. Sends a new email verification code. Live: /auth/resend-verification. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail({ code: "VALIDATION", status: 422, message: "Enter a valid email address.", fields: { email: "Enter a valid email address" } });
  }
  // Each code is an email: cap them per address and per caller so the form can't be used to flood an inbox.
  if (!(await underLimit(`resend:${email}`, 3, 10 * 60)) || !(await underLimit(`resend-ip:${clientKey(request)}`, 10, 10 * 60))) {
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many requests. Please wait a few minutes before asking for another code." });
  }

  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ ok: true });
  }
  const res = await upstream("/auth/resend-verification", {
    method: "POST",
    auth: false,
    body: { email },
    fallback: "We couldn't send a new code right now. Please try again.",
  });
  return res.ok ? Response.json({ ok: true }) : fail(res.error);
}
