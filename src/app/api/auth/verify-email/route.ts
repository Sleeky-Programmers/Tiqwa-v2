import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

/** POST { email, code } → { ok }. Confirms the 6-digit code emailed at sign-up. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const code = String(body?.code ?? "").replace(/\D/g, "");
  if (code.length !== 6)
    return fail({ code: "VALIDATION", status: 422, message: "Enter the 6-digit code.", fields: { code: "Enter the 6-digit code from your email" } });

  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ ok: true });
  }
  const res = await upstream("/auth/verify-email", {
    method: "POST",
    auth: false,
    body: { email, token: code },
    fallback: "That code didn't work. Check it and try again.",
  });
  if (!res.ok) return fail({ ...res.error, fields: { code: res.error.fields?.token ?? res.error.message } });
  return Response.json({ ok: true });
}
