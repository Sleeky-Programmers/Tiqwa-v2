import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password", description: "Get a code to reset your TBiLS password.", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[420px] rounded-2xl" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
