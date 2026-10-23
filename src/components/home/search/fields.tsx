"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/Select";
import { Chevron, fieldBox, labelCls, placementCls, useFlipPlacement, useOutsideClose } from "./shared";

export { AirportCombobox } from "./AirportCombobox";
export { DatePicker } from "./DatePicker";

export type Pax = { adults: number; children: number; infants: number };

const MAX_PER_TYPE = 9;

const paxRows: { key: keyof Pax; label: string; hint: string; min: number }[] = [
  { key: "adults", label: "Adults", hint: "12+ years", min: 1 },
  { key: "children", label: "Children", hint: "2-11 years", min: 0 },
  { key: "infants", label: "Infants", hint: "0-2 years", min: 0 },
];

export const paxSummary = (p: Pax) => {
  const n = p.adults + p.children + p.infants;
  return `${n} Passenger${n > 1 ? "s" : ""}`;
};

const stepBtn =
  "flex size-10 shrink-0 items-center justify-center rounded-[10px] border text-lg font-bold leading-none transition-colors " +
  "border-[#e2e8f0] bg-white text-[#0f172a] hover:border-blue hover:text-blue " +
  "disabled:cursor-not-allowed disabled:border-[#eef2f6] disabled:bg-[#f8fafc] disabled:font-normal disabled:text-[#94a3b8] disabled:hover:border-[#eef2f6]";

/** Passenger picker: one stepper per type (max 9 each); infants can't outnumber adults. */
export function TravellersField({ value, onChange, className }: { value: Pax; onChange: (p: Pax) => void; className?: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const placement = useFlipPlacement(open, triggerRef, panelRef);
  const total = value.adults + value.children + value.infants;
  const max = (key: keyof Pax) => (key === "infants" ? Math.min(MAX_PER_TYPE, value.adults) : MAX_PER_TYPE);
  const set = (key: keyof Pax, delta: number, min: number) => {
    const next = { ...value, [key]: Math.min(max(key), Math.max(min, value[key] + delta)) };
    if (next.infants > next.adults) next.infants = next.adults;
    onChange(next);
  };
  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        Travellers
      </label>
      <div className="relative">
        <button
          ref={triggerRef}
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={cn(fieldBox, "w-full justify-between text-left", open && "border-blue ring-2 ring-blue/25")}
        >
          <span className="text-base font-medium leading-6 text-[#1e293b]">{paxSummary(value)}</span>
          <span className={cn("transition-transform duration-200", open && "rotate-180")}>
            <Chevron />
          </span>
        </button>
        {open && (
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Select passengers"
            className={cn(placementCls(placement), "absolute inset-x-0 z-30 rounded-2xl bg-white px-4 pb-5 pt-[22px] shadow-[0_18px_45px_rgba(15,23,42,0.16)] sm:px-[22px]")}
          >
            <h3 className="border-b border-[#eef2f6] pb-4 text-base font-bold text-[#1e293b]">Select Passengers</h3>
            <ul>
              {paxRows.map((r) => (
                <li key={r.key} className="flex items-center justify-between gap-2 border-b border-[#eef2f6] py-[18px]">
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-5 text-[#1e293b]">{r.label}</span>
                    <span className="mt-1.5 block text-[13px] leading-4 text-[#64748b]">{r.hint}</span>
                  </span>
                  <span className="flex shrink-0 items-center">
                    <button
                      type="button"
                      aria-label={`Fewer ${r.label}`}
                      disabled={value[r.key] <= r.min}
                      onClick={() => set(r.key, -1, r.min)}
                      className={stepBtn}
                    >
                      -
                    </button>
                    <span aria-live="polite" className="w-8 text-center text-base font-bold text-[#0f172a] sm:w-[52px]">
                      {value[r.key]}
                    </span>
                    <button
                      type="button"
                      aria-label={`More ${r.label}`}
                      disabled={value[r.key] >= max(r.key)}
                      onClick={() => set(r.key, 1, r.min)}
                      className={stepBtn}
                    >
                      +
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-[18px] flex items-center justify-between border-t border-[#eef2f6] pt-[18px]">
              <span className="text-[15px] text-[#334155]">Total Passengers</span>
              <span className="text-[15px] font-bold text-blue">{total}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const cabins = [
  { value: "economy", label: "Economy", description: "Standard seating" },
  { value: "business", label: "Business class", description: "Premium comfort" },
  { value: "premium_economy", label: "Premium economy", description: "Premium comfort" },
  { value: "first", label: "First Class", description: "Luxury experience" },
] as const;

export function CabinField({ value, onChange, className }: { value: string; onChange: (v: string) => void; className?: string }) {
  return <Select name="cabin" label="Cabin class" value={value} options={cabins} onChange={onChange} className={className} />;
}
