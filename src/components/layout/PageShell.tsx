import type { ReactNode } from "react";
import { Header } from "./Header";
import { Container } from "@/components/ui/Section";

export function PageShell({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <>
      <div className="bg-navy-900">
        <Header solid />
        <Container className="pb-14 pt-10">
          <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
          {intro && <p className="mt-2 max-w-2xl text-slate-300">{intro}</p>}
        </Container>
      </div>
      <Container className="py-12">{children}</Container>
    </>
  );
}
