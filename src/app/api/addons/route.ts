import { addons, type Addon } from "@/data/booking";
import type { WlAddon } from "@/lib/api/types";
import { isLive, mockDelay, sessionToken, upstream } from "@/lib/api/upstream";

const iconFor = (name: string): Addon["icon"] =>
  /insur|cover|protect/i.test(name) ? "shield" : /car|ride|transfer|taxi/i.test(name) ? "car" : /seat/i.test(name) ? "seat" : "reminder";

/**
 * GET → { addons: Addon[], live }. Live: /get/essential-addons (flight add-ons that are switched on).
 * If the backend has none or can't be reached, checkout simply shows no add-ons — never mock extras
 * on a real booking.
 */
export async function GET() {
  await sessionToken();
  if (!isLive()) {
    await mockDelay(800);
    return Response.json({ addons, live: false });
  }
  const res = await upstream<WlAddon[]>("/get/essential-addons", { auth: false });
  const list: Addon[] = res.ok
    ? (res.data ?? [])
        .filter((a) => (a.for ?? "flight") === "flight" && (a.status ?? 1) === 1)
        .map((a) => ({
          id: String(a.id),
          name: a.name,
          description: a.description ?? "",
          price: Number(a.price) || 0,
          isPerPassenger: (a.passengers ?? 1) > 0,
          icon: iconFor(a.name),
        }))
    : [];
  return Response.json({ addons: list, live: true });
}
