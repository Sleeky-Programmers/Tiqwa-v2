import { digest, submitOnce } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, upstream } from "@/lib/api/upstream";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

/**
 * POST multipart { reference, file } → { ok }. Uploads proof of a bank transfer for a held booking.
 * Live: /payment/{reference}/evidence.
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const reference = String(form?.get("reference") ?? "").trim();
  const file = form?.get("file");
  if (!/^[A-Za-z0-9_-]{4,60}$/.test(reference))
    return fail({ code: "VALIDATION", status: 422, message: "We couldn't match this payment. Please contact support." });
  if (!(file instanceof File) || !file.size)
    return fail({
      code: "VALIDATION",
      status: 422,
      message: "Choose a photo or PDF of your transfer receipt.",
      fields: { file: "Choose a photo or PDF of your transfer receipt." },
    });
  if (!TYPES.includes(file.type))
    return fail({ code: "VALIDATION", status: 422, message: "Upload a JPG, PNG, WebP or PDF file.", fields: { file: "Upload a JPG, PNG, WebP or PDF file." } });
  if (file.size > MAX_BYTES)
    return fail({
      code: "VALIDATION",
      status: 422,
      message: "That file is too large. The limit is 5 MB.",
      fields: { file: "That file is too large. The limit is 5 MB." },
    });

  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  // The same receipt is uploaded once; a different file for the same payment is allowed.
  const key = `evidence:${reference}:${digest([file.name, file.size, file.lastModified])}`;
  const error = await submitOnce(key, async () => {
    const body = new FormData();
    body.append("evidence", file, file.name);
    const res = await upstream(`/payment/${encodeURIComponent(reference)}/evidence`, {
      method: "POST",
      body,
      timeoutMs: 60_000,
      fallback: "We couldn't upload your receipt right now. Please try again.",
    });
    return res.ok ? null : res.error;
  });
  return error ? fail(error) : Response.json({ ok: true });
}
