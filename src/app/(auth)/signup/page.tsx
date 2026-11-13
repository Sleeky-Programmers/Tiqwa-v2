import type { Metadata } from "next";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a TBiLS account to book faster and pay in instalments.",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[420px] rounded-2xl" />}>
      <SignupForm />
    </Suspense>
  );
}
