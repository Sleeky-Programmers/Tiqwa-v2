"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/ui/Section";
import { faqs } from "@/data/content";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section aria-labelledby="faq-title" className="bg-white py-[52px]">
      <Container>
        <div data-reveal className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 id="faq-title" className="font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#12233d] md:text-[34px]">
              Questions before you book?
            </h2>
            <p className="mt-[10px] text-sm leading-[21px] text-[#617087]">Three quick answers, with more help available when you need it.</p>
          </div>
          <Link
            href="/faq"
            className="inline-flex h-[38px] items-center self-start rounded-full border-[0.83px] border-[#bfd8ec] px-[15px] text-[13px] font-bold text-[#087dcc] transition hover:bg-sky-50 sm:self-auto"
          >
            View all FAQs
          </Link>
        </div>
        <div data-reveal-stagger className="mt-6 grid grid-cols-1 gap-x-[18px] md:grid-cols-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b-[0.83px] border-[#dfe8f0]">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex min-h-[54px] w-full items-center gap-3 py-[15px] pl-[2px] text-left"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-sm leading-none text-[#333]">
                    {isOpen ? "−" : "+"}
                  </span>
                  <span className="text-[15px] font-bold leading-[21px] text-[#333]">{f.q}</span>
                </button>
                <div id={`faq-${i}`} className={cn("grid transition-[grid-template-rows] duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <p className="overflow-hidden pl-11 pr-1 text-sm leading-[1.65] text-[#333]">
                    <span className="block pb-4">{f.a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
