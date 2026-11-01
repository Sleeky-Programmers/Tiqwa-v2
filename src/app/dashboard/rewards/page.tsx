import type { Metadata } from "next";
import { RewardsPage } from "@/components/dashboard/RewardsPage";

export const metadata: Metadata = { title: "Rewards" };

export default function DashboardRewardsPage() {
  return <RewardsPage />;
}
