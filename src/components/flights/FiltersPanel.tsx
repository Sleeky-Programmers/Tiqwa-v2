"use client";

import type { ReactNode } from "react";
import { nairaSpaced, naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";

export type Filters = {
  price: [number, number] | null; // null = full range
  stops: number[]; // 0 = non-stop, 1, 2 (= 2+)
  airlines: string[];
  flex: ("refundable" | "nonRefundable")[];
};

export const emptyFilters: Filters = { price: null, stops: [], airlines: [], flex: [] };

export type FilterFacets = {
  priceMin: number;
  priceMax: number;
  stops: { value: number; label: string; min: number }[];
  airlines: { code: string; name: string; min: number }[];
};

function Section({ title, onClear, children }: { title: string; onClear?: () => void; children: ReactNode }) {
  return (
    <div className="border-t border-[#eef1f5] px-0.5 pb-1.5 pt-3.5 first:border-t-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-normal uppercase text-[#1d1d1d]">{title}</h3>
        {onClear && (
          <button type="button" onClick={onClear} className="text-sm font-medium text-blue hover:underline">
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ checked, onChange, label, price }: { checked: boolean; onChange: () => void; label: string; price?: number }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 py-[7px] pl-2">
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-0.5 size-4 shrink-0 cursor-pointer accent-blue" />
      <span className="min-w-0 flex-1 text-sm leading-[18.9px] text-[#212529]">{label}</span>
      {price !== undefined && <span className="shrink-0 text-sm font-medium text-[#212529]">{nairaSpaced(price)}</span>}
    </label>
  );
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

/** Left-hand filter card: price range, stops, airlines, flexibility (tbils.com layout). */
export function FiltersPanel({
  facets,
  filters,
  onChange,
  className,
}: {
  facets: FilterFacets;
  filters: Filters;
  onChange: (f: Filters) => void;
  className?: string;
}) {
  const [lo, hi] = filters.price ?? [facets.priceMin, facets.priceMax];
  const span = Math.max(1, facets.priceMax - facets.priceMin);
  const pct = (v: number) => ((v - facets.priceMin) / span) * 100;
  const step = Math.max(1000, Math.round(span / 200 / 1000) * 1000);
  const setPrice = (a: number, b: number) =>
    onChange({ ...filters, price: a <= facets.priceMin && b >= facets.priceMax ? null : [Math.min(a, b), Math.max(a, b)] });

  return (
    <div
      className={cn(
        "rounded-[14px] border border-[#eef1f5] bg-white px-4 pb-4 shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[#eef1f5] pb-3 pt-3.5">
        <span className="text-[15px] font-bold tracking-[0.04em] text-ink-900">FILTER</span>
        <button type="button" onClick={() => onChange(emptyFilters)} className="text-[13px] font-semibold text-blue hover:underline">
          Clear All
        </button>
      </div>

      <Section title="Price" onClear={() => onChange({ ...filters, price: null })}>
        <div className="relative mx-0.5 mt-6 h-[6px]">
          <div className="absolute inset-0 rounded-full bg-[#e5e7eb]" />
          <div className="absolute inset-y-0 rounded-full bg-blue" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
          <input
            type="range"
            aria-label="Minimum price"
            min={facets.priceMin}
            max={facets.priceMax}
            step={step}
            value={lo}
            onChange={(e) => setPrice(Math.min(Number(e.target.value), hi), hi)}
            className="dual-range"
          />
          <input
            type="range"
            aria-label="Maximum price"
            min={facets.priceMin}
            max={facets.priceMax}
            step={step}
            value={hi}
            onChange={(e) => setPrice(lo, Math.max(Number(e.target.value), lo))}
            className="dual-range"
          />
        </div>
        <div className="mt-8 flex justify-between pb-2 text-sm font-medium text-black">
          <span>{naira(lo)}</span>
          <span>{naira(hi)}</span>
        </div>
      </Section>

      {facets.stops.length > 0 && (
        <Section title="Stops" onClear={() => onChange({ ...filters, stops: [] })}>
          {facets.stops.map((s) => (
            <CheckRow
              key={s.value}
              label={s.label}
              price={s.min}
              checked={filters.stops.includes(s.value)}
              onChange={() => onChange({ ...filters, stops: toggle(filters.stops, s.value) })}
            />
          ))}
        </Section>
      )}

      <Section title="Airlines" onClear={() => onChange({ ...filters, airlines: [] })}>
        {facets.airlines.map((a) => (
          <CheckRow
            key={a.code}
            label={a.name}
            price={a.min}
            checked={filters.airlines.includes(a.code)}
            onChange={() => onChange({ ...filters, airlines: toggle(filters.airlines, a.code) })}
          />
        ))}
      </Section>

      <Section title="Flexibility" onClear={() => onChange({ ...filters, flex: [] })}>
        <CheckRow
          label="Refundable"
          checked={filters.flex.includes("refundable")}
          onChange={() => onChange({ ...filters, flex: toggle(filters.flex, "refundable") })}
        />
        <CheckRow
          label="Non-Refundable"
          checked={filters.flex.includes("nonRefundable")}
          onChange={() => onChange({ ...filters, flex: toggle(filters.flex, "nonRefundable") })}
        />
      </Section>
    </div>
  );
}
