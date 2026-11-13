import type { WlBankAccount, WlPaymentGateway, WlPaymentMethod } from "@/lib/api/types";
import { fail, isLive, sessionToken, upstream } from "@/lib/api/upstream";

export type PayOption = {
  id: string; // backend identifier: CARD, ONLINE_TRANSFER, FLEXI_PAY, WALK_IN_TRANSFER, …
  title: string;
  description: string;
  instalments: number[];
  interestRate: number;
};
export type PaymentOptions = {
  live: boolean;
  methods: PayOption[];
  gateways: { id: string; name: string; logo?: string }[];
  banks: { bank: string; accountName: string; accountNumber: string }[];
};

/** `"[2,3,4]"`, `"\"[4]\""` or null → [2, 3, 4] (ported from travel-agency parseInstalments). */
function instalments(raw?: string | null): number[] {
  if (!raw || raw === "null") return [];
  try {
    let s = raw.trim();
    if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => n > 1) : [];
  } catch {
    return [];
  }
}

const COPY: Record<string, { title: string; description: string }> = {
  CARD: { title: "Debit / credit card", description: "Pay with Mastercard, Visa or Verve. Confirmed instantly." },
  ONLINE_TRANSFER: { title: "Bank transfer", description: "Pay by transfer through our secure checkout. Confirmed once it lands." },
  FLEXI_PAY: { title: "Pay small small", description: "Pay part now and spread the rest over easy instalments." },
  WALK_IN_TRANSFER: { title: "Book on hold", description: "Reserve your seat now and pay by bank transfer before the hold expires." },
};

/** GET → PaymentOptions. Live: /get/payment-methods + /get/payment-gateways + /get/bank-accounts. */
export async function GET() {
  await sessionToken();
  if (!isLive()) return Response.json({ live: false, methods: [], gateways: [], banks: [] } satisfies PaymentOptions);

  const [methods, gateways, banks] = await Promise.all([
    upstream<WlPaymentMethod[]>("/get/payment-methods", { auth: false, fallback: "We couldn't load payment options. Please try again." }),
    upstream<WlPaymentGateway[]>("/get/payment-gateways", { auth: false }),
    upstream<WlBankAccount[]>("/get/bank-accounts", { auth: false }),
  ]);
  if (!methods.ok) return fail(methods.error);

  const body: PaymentOptions = {
    live: true,
    methods: (methods.data ?? [])
      .filter((m) => (m.status ?? 1) === 1)
      .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
      .map((m) => ({
        id: m.identifier,
        title: COPY[m.identifier]?.title ?? m.title,
        description: COPY[m.identifier]?.description ?? (m.description ?? "").replace(/<[^>]*>/g, ""),
        instalments: instalments(m.instalments),
        interestRate: Number(m.interest_rate) || 0,
      })),
    gateways: gateways.ok
      ? (gateways.data ?? [])
          .filter((g) => g.is_active !== false)
          .map((g) => ({ id: g.service, name: g.service.charAt(0).toUpperCase() + g.service.slice(1), logo: g.logo }))
      : [],
    banks: banks.ok
      ? (banks.data ?? [])
          .filter((b) => (b.status ?? 1) === 1)
          .map((b) => ({ bank: b.bank_name, accountName: b.account_name, accountNumber: b.account_number }))
      : [],
  };
  return Response.json(body);
}
