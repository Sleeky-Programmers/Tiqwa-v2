import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Reset password", description: "Choose a new password for your TBiLS account.", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[420px] rounded-2xl" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
