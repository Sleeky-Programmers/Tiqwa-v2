import type { ReactNode } from "react";
import { Header } from "./Header";
import { Container } from "@/components/ui/Section";

export function PageShell({ title, intro, children }: { title: string; intro?: string; children?: ReactNode }) {
  return (
    <>
      <div className="relative bg-navy-900">
        {/* Clipped on its own layer: overflow on the wrapper would cut off the header's menus. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="float-card absolute -right-24 -top-24 size-[340px] rounded-full bg-[radial-gradient(circle,rgba(2,144,222,0.28)_0,transparent_65%)]" />
        </div>
        <Header solid />
        <Container className="relative pb-14 pt-10">
          <h1 className="hero-in font-display text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
          {intro && <p className="hero-in mt-2 max-w-2xl text-slate-300 [--hero-delay:120ms]">{intro}</p>}
        </Container>
      </div>
      <Container data-reveal className="py-12">
        {children}
      </Container>
    </>
  );
}
