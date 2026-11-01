import { clearSession, mockProfile, toProfile } from "@/lib/api/session";
import type { WlUser } from "@/lib/api/types";
import { isLive, sessionToken, upstream } from "@/lib/api/upstream";

/**
 * GET → { user, live }. `user` is null when signed out. Demo mode is always signed in as the
 * demo account, so the dashboard can be explored without a backend.
 */
export async function GET() {
  const token = await sessionToken(); // request-time: keeps this handler out of prerendering
  if (!isLive()) return Response.json({ user: mockProfile(), live: false });
  if (!token) return Response.json({ user: null, live: true });

  const res = await upstream<WlUser>("/user/profile", { fallback: "We couldn't load your account." });
  if (res.ok) return Response.json({ user: toProfile(res.data), live: true });
  if (res.error.status === 401) {
    await clearSession();
    return Response.json({ user: null, live: true });
  }
  return Response.json({ user: null, live: true, error: { code: res.error.code, message: res.error.message } }, { status: res.error.status });
}
