import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyPayment } from "@/components/checkout/VerifyPayment";

export const metadata: Metadata = { title: "Confirming payment", robots: { index: false } };

export default function VerifyPaymentPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPayment />
    </Suspense>
  );
}
