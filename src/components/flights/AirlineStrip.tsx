"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { nairaSpaced } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { airlineLogo } from "./FlightCard";

export type AirlineSummary = { code: string; name: string; min: number; stops: number };

/** "Airlines on this route" carousel: cheapest fare per airline; clicking a chip filters to it. */
export function AirlineStrip({
  airlines,
  selected,
  onSelect,
}: {
  airlines: AirlineSummary[];
  selected: string[];
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
  const arrow =
    "flex size-[34px] items-center justify-center rounded-full border border-[#e4e8ee] bg-white text-ink-900 transition hover:border-blue hover:text-blue";

  return (
    <section aria-label="Airlines on this route" className="mt-6">
      <div className="mb-[18px] flex items-center justify-between">
        <h3 className="text-base font-bold text-ink-900">Airlines on this route</h3>
        <div className="flex gap-2">
          <button type="button" aria-label="Scroll airlines left" onClick={() => scroll(-1)} className={arrow}>
            <ArrowLeft className="size-4" />
          </button>
          <button type="button" aria-label="Scroll airlines right" onClick={() => scroll(1)} className={arrow}>
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 pt-1">
        {airlines.map((a, i) => {
          const cheapest = i === 0;
          const on = selected.includes(a.code);
          return (
            <button
              key={a.code}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(a.code)}
              className={cn(
                "relative flex h-[155px] w-[168px] shrink-0 snap-start flex-col items-center rounded-[14px] border bg-white px-3.5 pb-3.5 pt-[18px] text-center transition hover:-translate-y-0.5",
                cheapest || on
                  ? "border-blue shadow-[0_0_0_1px_#0290de,0_8px_24px_rgba(2,144,222,0.1)]"
                  : "border-[#eef1f5] shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]",
              )}
            >
              {cheapest && (
                <span className="absolute right-2 top-2 rounded-full bg-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
                  Cheapest
                </span>
              )}
              <Image src={airlineLogo(a.code)} alt="" width={44} height={44} className="size-11 rounded object-contain" />
              <span className="mt-1.5 line-clamp-1 text-[13px] font-semibold text-ink-900">{a.name}</span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.02em] text-ink-500">
                {a.stops === 0 ? "Non-stop" : a.stops === 1 ? "1 stop" : "2+ stops"}
              </span>
              <span className="mt-auto text-[17px] font-bold text-[#013557]">{nairaSpaced(a.min)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
