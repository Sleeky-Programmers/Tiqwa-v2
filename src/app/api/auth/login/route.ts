import { clearSession, mockProfile, setSession, toProfile } from "@/lib/api/session";
import type { WlUser } from "@/lib/api/types";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST { email, password } → sets the httpOnly session cookie and returns { user }. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim();
  const password = String(body?.password ?? "");
  if (!EMAIL.test(email)) return fail({ code: "VALIDATION", status: 422, message: "Enter a valid email address.", fields: { email: "Enter a valid email address" } });
  if (!password) return fail({ code: "VALIDATION", status: 422, message: "Enter your password.", fields: { password: "Enter your password" } });

  if (!isLive()) {
    // Demo mode: any well-formed email and password signs in to the demo account.
    await mockDelay(700);
    await setSession("demo");
    return Response.json({ user: mockProfile(), live: false });
  }

  const res = await upstream<WlUser>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
    fallback: "Incorrect email or password. Please try again.",
  });
  if (!res.ok) {
    await clearSession();
    return fail(res.error);
  }
  if (!res.data?.token) return fail({ code: "UPSTREAM_ERROR", status: 502, message: "We couldn't sign you in right now. Please try again." });
  await setSession(res.data.token);
  return Response.json({ user: toProfile(res.data), live: true });
}
