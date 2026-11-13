import { clientKey, underLimit } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

/** POST { email, code, password } → { ok }. `fields.code` means the code is wrong, used or expired. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const code = String(body?.code ?? "").trim();
  const password = String(body?.password ?? "");
  const fields: Record<string, string> = {};
  if (!code) fields.code = "Enter the code from your email";
  if (password.length < 8) fields.password = "Use at least 8 characters";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  if (!(await underLimit(`reset:${clientKey(request)}`, 15, 15 * 60)))
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many attempts. Please wait a few minutes and try again." });

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  const res = await upstream("/auth/reset-password", {
    method: "POST",
    auth: false,
    body: { email, token: code, password },
    fallback: "We couldn't reset your password right now. Please try again.",
  });
  if (!res.ok) {
    const f = res.error.fields;
    const mapped = f ? { ...(f.token ? { code: f.token } : {}), ...(f.password ? { password: f.password } : {}), ...(f.email ? { form: f.email } : {}) } : {};
    return fail({ ...res.error, fields: Object.keys(mapped).length ? mapped : undefined });
  }
  return Response.json({ ok: true });
}
