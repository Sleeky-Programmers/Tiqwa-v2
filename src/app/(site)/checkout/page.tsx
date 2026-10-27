import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

export const metadata: Metadata = { title: "Checkout | Travellers, Add-ons & Payment" };

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
