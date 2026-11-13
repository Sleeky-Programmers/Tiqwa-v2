import { digest, submitOnce } from "@/lib/api/idempotency";
import { fail, isLive, mockDelay, sessionToken, upstream, type ApiError } from "@/lib/api/upstream";

const field = (name: string, message: string) => fail({ code: "VALIDATION", status: 422, message, fields: { [name]: message } });

/**
 * POST { amount, bankName, accountNumber } → { ok }. Asks for a payout of the signed-in user's referral
 * rewards to a bank account. Live: /user/rewards/payment-request (amount, bank_name, account_number).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const amount = Math.floor(Number(body?.amount));
  const bankName = String(body?.bankName ?? "").trim();
  const accountNumber = String(body?.accountNumber ?? "").replace(/\D/g, "");
  if (!Number.isFinite(amount) || amount < 1) return field("amount", "Enter the amount to withdraw");
  if (!bankName) return field("bankName", "Choose your bank");
  if (accountNumber.length !== 10) return field("accountNumber", "Enter your 10-digit account number");

  const token = await sessionToken();
  if (isLive() && !token) return fail({ code: "UNAUTHORIZED", status: 401, message: "Please sign in to withdraw your rewards." });
  if (!isLive()) {
    await mockDelay(900);
    return Response.json({ ok: true });
  }
  // One request at a time per user and amount; a double click is answered without a second payout request.
  const rename = (e: ApiError): ApiError => ({
    ...e,
    fields: e.fields && Object.fromEntries(Object.entries(e.fields).map(([k, m]) => [k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()), m])),
  });
  const error = await submitOnce(
    `withdraw:${digest([token, amount, bankName, accountNumber])}`,
    async () => {
      const res = await upstream("/user/rewards/payment-request", {
        method: "POST",
        body: { amount, bank_name: bankName, account_number: accountNumber },
        fallback: "We couldn't send your withdrawal request right now. Please try again.",
      });
      return res.ok ? null : rename(res.error);
    },
    2 * 60,
  );
  return error ? fail(error) : Response.json({ ok: true });
}
