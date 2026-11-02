import { clearSession } from "@/lib/api/session";

/** POST → clears the session cookie. The backend has no logout endpoint; the token simply stops being sent. */
export async function POST() {
  await clearSession();
  return Response.json({ ok: true });
}
