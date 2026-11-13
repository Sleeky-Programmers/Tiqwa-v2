import { digest, submitOnce } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, sessionToken, upstream } from "@/lib/api/upstream";

/** POST → { ok }. Asks for a payout of the signed-in user's referral rewards. Live: /user/rewards/payment-request. */
export async function POST() {
  const token = await sessionToken();
  if (isLive() && !token) return fail({ code: "UNAUTHORIZED", status: 401, message: "Please sign in to withdraw your rewards." });
  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  // One request at a time per user; a double click is answered without a second payout request.
  const error = await submitOnce(
    `withdraw:${digest(token)}`,
    async () => {
      const res = await upstream("/user/rewards/payment-request", {
        method: "POST",
        body: {},
        fallback: "We couldn't send your withdrawal request right now. Please try again.",
      });
      return res.ok ? null : res.error;
    },
    2 * 60,
  );
  return error ? fail(error) : Response.json({ ok: true });
}
