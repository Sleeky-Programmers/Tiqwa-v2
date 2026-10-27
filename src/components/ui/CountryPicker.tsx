"use client";

import { useId, useRef, useState } from "react";
import { Chevron, placementCls, useFlipPlacement, useOutsideClose } from "@/components/home/search/shared";
import { countries, flag, getCountry } from "@/data/countries";
import { cn } from "@/lib/utils";

/**
 * Searchable country dropdown. `variant="dial"` shows "Nigeria (+234)" (phone country),
 * `variant="name"` shows just the country (nationality / issuing country).
 */
export function CountryPicker({
  value,
  onChange,
  variant = "name",
  label,
  className,
  invalid,
}: {
  value: string;
  onChange: (iso2: string) => void;
  variant?: "name" | "dial";
  label: string;
  className?: string;
  invalid?: boolean;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const placement = useFlipPlacement(open, triggerRef, menuRef);
  const current = getCountry(value);
  const text = (c: { name: string; dial: string }) => (variant === "dial" ? `${c.name} (${c.dial})` : c.name);
  const term = q.trim().toLowerCase();
  const list = countries.filter((c) => !term || c.name.toLowerCase().includes(term) || c.dial.includes(term) || c.iso2.toLowerCase() === term);

  const pick = (iso2: string) => {
    onChange(iso2);
    setOpen(false);
    setQ("");
    triggerRef.current?.focus();
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label={`${label}: ${current ? text(current) : "none"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setActive(Math.max(0, countries.findIndex((c) => c.iso2 === value)));
          setOpen((o) => !o);
        }}
        className={cn(
          "flex h-[45px] w-full items-center gap-2.5 rounded-[10px] border bg-white px-3.5 text-left text-sm text-[#333] transition-colors hover:border-blue",
          invalid ? "border-error" : "border-[#e4e8ee]",
          open && "border-blue ring-2 ring-blue/20",
        )}
      >
        {current ? (
          <>
            <span aria-hidden className="text-base leading-none">
              {flag(current.iso2)}
            </span>
            <span className="min-w-0 flex-1 truncate">{text(current)}</span>
          </>
        ) : (
          <span className="flex-1 text-[#9ca3af]">Select country</span>
        )}
        <span className={cn("transition-transform duration-200", open && "rotate-180")}>
          <Chevron />
        </span>
      </button>
      {open && (
        <div
          ref={menuRef}
          className={cn("absolute inset-x-0 z-30 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]", placementCls(placement))}
        >
          <div className="border-b border-[#eef2f6] p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(i + 1, list.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter" && list[active]) {
                  e.preventDefault();
                  pick(list[active].iso2);
                } else if (e.key === "Escape") {
                  setOpen(false);
                  triggerRef.current?.focus();
                }
              }}
              placeholder="Search country..."
              aria-label="Search country"
              className="h-9 w-full rounded-lg border border-[#e4e8ee] px-3 text-sm focus:border-blue focus:outline-none"
            />
          </div>
          <ul role="listbox" aria-label={label} className="max-h-60 overflow-y-auto p-1">
            {list.length === 0 && <li className="px-3 py-2 text-sm text-ink-500">No countries found</li>}
            {list.map((c, i) => (
              <li
                key={c.iso2}
                role="option"
                aria-selected={c.iso2 === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(c.iso2);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
                  i === active && "bg-[#f1f5f9]",
                  c.iso2 === value ? "font-bold text-blue" : "text-[#1e293b]",
                )}
              >
                <span aria-hidden className="text-base leading-none">
                  {flag(c.iso2)}
                </span>
                {text(c)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
