"use client";

import { useId, useRef, useState } from "react";
import { Chevron, fieldBox, placementCls, useFlipPlacement, useOutsideClose } from "@/components/home/search/shared";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; description?: string };

/**
 * Custom dropdown used in place of every native <select>.
 * The menu matches the trigger's width and opens above or below it depending on available space.
 * Keyboard: ↑/↓ to move, Enter/Space to pick, Esc to close.
 */
export function Select({
  name,
  label,
  value,
  options,
  onChange,
  className,
  triggerClassName,
}: {
  name?: string;
  /** Accessible name, e.g. "Cabin class". */
  label: string;
  value: string;
  options: readonly SelectOption[] | readonly string[];
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
}) {
  const id = useId();
  const items: SelectOption[] = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = items.find((o) => o.value === value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const placement = useFlipPlacement(open, triggerRef, menuRef);

  const openMenu = () => {
    setActive(Math.max(0, items.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label}: ${current?.label ?? "none"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) return openMenu();
            setActive((i) => (e.key === "ArrowDown" ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0)));
          } else if ((e.key === "Enter" || e.key === " ") && open) {
            e.preventDefault();
            pick(items[active].value);
          } else if (e.key === "Escape" || e.key === "Tab") {
            setOpen(false);
          }
        }}
        className={cn(fieldBox, "w-full justify-between text-left", open && "border-blue ring-2 ring-blue/25", triggerClassName)}
      >
        <span className="truncate text-[15px] font-medium leading-6 text-[#1e293b]">{current?.label}</span>
        <span className={cn("transition-transform duration-200", open && "rotate-180")}>
          <Chevron />
        </span>
      </button>
      {name && <input type="hidden" name={name} value={value} />}
      {open && (
        <ul
          ref={menuRef}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          className={cn(
            "absolute inset-x-0 z-30 space-y-1 rounded-xl border border-[#e2e8f0] bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)]",
            placementCls(placement),
          )}
        >
          {items.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(o.value);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-[10px] px-[14px] py-3 transition-colors",
                  (selected || i === active) && "bg-[#f1f5f9]",
                )}
              >
                <span className="min-w-0">
                  <span className={cn("block text-[15px] leading-5", selected ? "font-bold text-blue" : "font-medium text-[#334155]")}>{o.label}</span>
                  {o.description && <span className="mt-1.5 block text-[13px] leading-4 text-[#64748b]">{o.description}</span>}
                </span>
                {selected && (
                  <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0 fill-none stroke-blue" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
