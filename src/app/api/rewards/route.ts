import type { WlRewards } from "@/lib/api/types";
import { fail, isLive, mockDelay, sessionToken, upstream } from "@/lib/api/upstream";

export type Rewards = {
  live: boolean;
  total: number;
  code: string;
  referrals: { name: string; date: string }[];
  payouts: { amount: number; date: string }[];
  canWithdraw: boolean;
};

const MOCK: Rewards = {
  live: false,
  total: 12500,
  code: "TUNDE-TB25",
  referrals: [
    { name: "Ada O.", date: "2026-09-14" },
    { name: "Kunle B.", date: "2026-07-02" },
    { name: "Chioma E.", date: "2026-04-21" },
  ],
  payouts: [{ amount: 5000, date: "2026-08-01" }],
  canWithdraw: true,
};

/** GET → Rewards. Live: /user/rewards (referral code, earnings and history). */
export async function GET() {
  await sessionToken();
  if (!isLive()) {
    await mockDelay(400);
    return Response.json(MOCK);
  }
  const res = await upstream<{ rewards?: WlRewards } & WlRewards>("/user/rewards", { fallback: "We couldn't load your rewards right now." });
  if (!res.ok) return fail(res.error);
  const r = res.data?.rewards ?? res.data ?? {};
  const body: Rewards = {
    live: true,
    total: Number(r.total_referral_reward ?? 0),
    code: String(r.referral_code ?? ""),
    referrals: (r.referral_history ?? []).map((h) => ({ name: h.referred_user ?? "Traveller", date: h.date ?? "" })),
    payouts: (r.referral_payment_history ?? []).map((p) => ({ amount: Number(p.amount ?? 0), date: p.date ?? "" })),
    canWithdraw: !!r.allow_withdraw,
  };
  return Response.json(body);
}
