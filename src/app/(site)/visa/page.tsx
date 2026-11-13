import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { VisaForm } from "@/components/visa/VisaForm";

export const metadata: Metadata = {
  title: "Visa assistance",
  description: "Tell us where you want to go and our visa team will guide you through the requirements and application.",
};

export default function Page() {
  return (
    <PageShell title="Visa assistance" intro="Tell us where you're headed and our visa team will guide you through the requirements and the application.">
      <div className="mx-auto max-w-[760px]">
        <VisaForm />
      </div>
    </PageShell>
  );
}
