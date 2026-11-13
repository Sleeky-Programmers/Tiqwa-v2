import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { deals as localDeals } from "@/data/deals";
import { getDeals } from "@/lib/api/content";
import { isLive } from "@/lib/api/upstream";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  // The same live deals as the home page. Sample deals are for demo mode only; a live site shows none rather than made-up fares.
  const deals = (await getDeals()) ?? (isLive() ? [] : localDeals);
  return <DashboardHome deals={deals} />;
}
