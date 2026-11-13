import { underLimit } from "@/lib/api/idempotency";
import { bookingDetails } from "@/lib/api/issue";
import { mapBooking } from "@/lib/api/mappers";
import { fail, isLive, mockDelay } from "@/lib/api/upstream";

const NOT_FOUND = "We couldn't find a booking with those details. Check the booking reference and the lead passenger's surname or email.";
const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

/**
 * POST { reference, surname } → { booking }. Guest "manage booking" lookup.
 *
 * The backend's booking details are readable by reference alone, so this route adds the check an
 * airline's manage-booking page makes: the second field must match a passenger's surname or email.
 * Wrong details and unknown references get the same answer, and attempts are rate limited per
 * client so references can't be guessed.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const reference = String(body?.reference ?? "")
    .trim()
    .toUpperCase();
  const who = norm(body?.surname);
  const fields: Record<string, string> = {};
  if (!/^[A-Z0-9-]{5,20}$/.test(reference)) fields.reference = "Enter the booking reference from your confirmation, for example TW-ABC123";
  if (who.length < 2) fields.surname = "Enter the lead passenger's surname or email";
  if (Object.keys(fields).length) return fail({ code: "VALIDATION", status: 422, message: "Please check the highlighted fields.", fields });

  const client = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!(await underLimit(`lookup:${client}`, 10, 15 * 60))) {
    return fail({ code: "RATE_LIMITED", status: 429, message: "Too many attempts. Please wait a few minutes and try again, or contact us for help." });
  }

  if (!isLive()) {
    // Demo mode: bookings live in this browser's storage, so the page looks them up itself.
    await mockDelay(700);
    return Response.json({ demo: true });
  }

  const d = await bookingDetails(reference);
  const match = d?.passengers?.some((p) => norm(p.last_name) === who || (who.includes("@") && norm(p.email) === who));
  const booking = d && match ? mapBooking(d) : null;
  if (!booking) return fail({ code: "NOT_FOUND", status: 404, message: NOT_FOUND });
  return Response.json({ booking });
}
