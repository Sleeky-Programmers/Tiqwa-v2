import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

/**
 * POST { email } → { ok }. Unknown emails still answer "ok" so the form can't be used to
 * discover accounts; 429 asks the user to wait before requesting another code.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return fail({ code: "VALIDATION", status: 422, message: "Enter a valid email address.", fields: { email: "Enter a valid email address" } });
  }

  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ ok: true });
  }
  const res = await upstream("/auth/forgot-password", {
    method: "POST",
    auth: false,
    body: { email },
    fallback: "We couldn't send a reset code right now. Please try again.",
  });
  // The backend answers an unknown email with 404 or a 422 on `email`; both look like success here.
  if (res.ok || res.error.status === 404 || (res.error.status === 422 && res.error.fields?.email)) return Response.json({ ok: true });
  if (res.error.status === 429) return fail({ ...res.error, message: "Too many requests. Please wait a minute before asking for another code." });
  return fail(res.error);
}
