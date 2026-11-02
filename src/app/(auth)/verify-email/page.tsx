import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Verify your email", description: "Confirm the code we emailed you.", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[420px] rounded-2xl" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
