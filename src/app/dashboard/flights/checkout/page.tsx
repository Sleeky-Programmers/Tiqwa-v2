import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Booking details" };

export default function DashboardCheckoutPage() {
  return <CheckoutFlow variant="dashboard" />;
}
