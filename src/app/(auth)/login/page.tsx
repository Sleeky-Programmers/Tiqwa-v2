import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your TBiLS account to manage trips and payments.", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="skeleton h-[420px] rounded-2xl" />}>
      <LoginForm />
    </Suspense>
  );
}
