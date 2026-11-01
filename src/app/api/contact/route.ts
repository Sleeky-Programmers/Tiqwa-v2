import { DAY, digest, LockBusyError, recall, remember, withLock } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST { name, email, phone?, subject, message } → { ok }. Live: /send-message.
 * Also used by the dashboard to request a booking cancellation (there's no cancel endpoint).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const v = {
    name: String(body?.name ?? "").trim(),
    email: String(body?.email ?? "").trim(),
    phone: String(body?.phone ?? "").trim(),
    subject: String(body?.subject ?? "").trim(),
    message: String(body?.message ?? "").trim(),
  };
  const fields: Record<string, string> = {};
  if (v.name.length < 2) fields.name = "Enter your name";
  if (!EMAIL.test(v.email)) fields.email = "Enter a valid email address";
  if (!v.subject) fields.subject = "Choose a subject";
  if (v.message.length < 10) fields.message = "Tell us a little more (at least 10 characters)";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  // The same message is sent once: double submits and retries within the window are answered "ok"
  // without a second email to the team. Cancellation requests are held for a day.
  const key = `msg:${digest(v)}`;
  const ttl = /^cancellation request/i.test(v.subject) ? DAY : 10 * 60;
  try {
    const error = await withLock(
      key,
      async () => {
        if (await recall<boolean>(key)) return null;
        const res = await upstream("/send-message", { method: "POST", body: v, fallback: "We couldn't send your message right now. Please try again, or reach us on WhatsApp." });
        if (!res.ok) return res.error;
        await remember(key, true, ttl);
        return null;
      },
      { waitMs: 20_000 },
    );
    return error ? fail(error) : Response.json({ ok: true });
  } catch (e) {
    if (e instanceof LockBusyError) return Response.json({ ok: true });
    throw e;
  }
}
