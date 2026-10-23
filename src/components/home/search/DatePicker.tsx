"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { fieldBox, labelCls, useOutsideClose, valueCls } from "./shared";

/* Dates are handled as "YYYY-MM-DD" strings in local time. */
const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso: string, n: number) => {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
};
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** "Fri, October 23" — the format tbils.com shows in the field. */
export const formatDisplayDate = (iso: string) =>
  fromIso(iso).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric" });

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] shrink-0 fill-none stroke-blue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9h17M8 3v3M16 3v3" />
  </svg>
);

/** 6×7 grid of ISO dates covering `month`, starting on Sunday. */
function monthGrid(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const weeks: string[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: string[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(toIso(start));
      start.setDate(start.getDate() + 1);
    }
    // Drop a trailing week that is entirely in the next month.
    if (w > 3 && fromIso(week[0]).getMonth() !== month.getMonth()) break;
    weeks.push(week);
  }
  return weeks;
}

/**
 * Custom single-date picker styled after tbils.com's calendar popup:
 * one month, Sunday-first, past dates disabled, keyboard navigable.
 */
export function DatePicker({
  name,
  title,
  value,
  min,
  onChange,
  placeholder = "Select date",
  className,
}: {
  name: string;
  title: string;
  value: string;
  min?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date | null>(null);
  const [focused, setFocused] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  const isDisabled = (iso: string) => (min ? iso < min : false);

  const openPicker = () => {
    const start = value || min || toIso(new Date());
    setView(fromIso(start));
    setFocused(start);
    setOpen(true);
  };

  // Move keyboard focus to the focused day while open.
  useEffect(() => {
    if (open && focused) gridRef.current?.querySelector<HTMLElement>(`[data-date="${focused}"]`)?.focus();
  }, [open, focused, view]);

  const select = (iso: string) => {
    if (isDisabled(iso)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const moveFocus = (iso: string) => {
    if (min && iso < min) iso = min;
    setFocused(iso);
    const d = fromIso(iso);
    if (!view || monthKey(d) !== monthKey(view)) setView(d);
  };

  const onGridKey = (e: KeyboardEvent) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in steps) {
      e.preventDefault();
      moveFocus(addDays(focused, steps[e.key]));
    } else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      const d = fromIso(focused);
      d.setMonth(d.getMonth() + (e.key === "PageDown" ? 1 : -1));
      moveFocus(toIso(d));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(focused);
    } else if (e.key === "Escape") {
      setOpen(false);
      triggerRef.current?.focus();
    }
  };

  const shiftMonth = (n: number) => setView((v) => v && new Date(v.getFullYear(), v.getMonth() + n, 1));
  const canPrev = !!view && (!min || monthKey(view) > monthKey(fromIso(min)));
  // Only read the clock once the popup is open (keeps prerendering deterministic).
  const today = open ? toIso(new Date()) : "";
  const monthLabel = view ? view.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {title}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={cn(fieldBox, "w-full text-left", open && "border-blue ring-2 ring-blue/25")}
      >
        <CalendarIcon />
        <span className={cn(valueCls, !value && "text-[#94a3b8]")}>{value ? formatDisplayDate(value) : placeholder}</span>
      </button>
      <input type="hidden" name={name} value={value} />

      {open && view && (
        <div
          role="dialog"
          aria-label={`Choose ${title.toLowerCase()} date`}
          className="absolute inset-x-0 top-full z-40 mt-[10px] rounded-[4.8px] border-[0.83px] border-[#aeaeae] bg-white text-[12.8px] text-black"
        >
          {/* Arrow pointing at the field */}
          <span aria-hidden className="absolute -top-[8px] left-[50px] size-[14px] rotate-45 border-l-[0.83px] border-t-[0.83px] border-[#aeaeae] bg-[#f0f0f0]" />

          <div className="relative rounded-t-[4.8px] border-b-[0.83px] border-[#aeaeae] bg-[#f0f0f0] pt-2">
            {canPrev && (
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className="group absolute left-0.5 top-0.5 flex size-8 items-center justify-center">
                <span className="size-[9px] rotate-[-135deg] border-r-[2.5px] border-t-[2.5px] border-[#ccc] group-hover:border-[#a6a6a6]" />
              </button>
            )}
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="group absolute right-0.5 top-0.5 flex size-8 items-center justify-center">
              <span className="size-[9px] rotate-45 border-r-[2.5px] border-t-[2.5px] border-[#ccc] group-hover:border-[#a6a6a6]" />
            </button>
            <h2 aria-live="polite" className="text-center text-[15.1px] font-bold leading-[18px]">
              {monthLabel}
            </h2>
            <div className="mt-2 grid grid-cols-7 justify-items-center px-[6.4px] pb-0.5" aria-hidden>
              {WEEKDAYS.map((d) => (
                <span key={d} className="m-[2.656px] w-[27px] text-center leading-[27px] text-black">
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div ref={gridRef} role="grid" aria-label={monthLabel} onKeyDown={onGridKey} className="m-[6.4px] text-center">
            {monthGrid(view).map((week) => (
              <div key={week[0]} role="row" className="grid grid-cols-7 justify-items-center">
                {week.map((iso) => {
                  const d = fromIso(iso);
                  const outside = d.getMonth() !== view.getMonth();
                  const disabled = isDisabled(iso) || outside;
                  const selected = iso === value;
                  return (
                    <button
                      key={iso}
                      type="button"
                      role="gridcell"
                      data-date={iso}
                      tabIndex={iso === focused ? 0 : -1}
                      aria-selected={selected}
                      aria-disabled={disabled}
                      aria-label={d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      onClick={() => !disabled && select(iso)}
                      onFocus={() => setFocused(iso)}
                      className={cn(
                        "m-[2.656px] size-[27px] rounded-[4.8px] leading-[27px] outline-none",
                        disabled ? "cursor-default text-[#ccc]" : "cursor-pointer hover:bg-[#f0f0f0]",
                        iso === today && !selected && "font-bold",
                        selected && "bg-[#216ba5] font-bold text-white hover:bg-[#1d5d90]",
                        iso === focused && !selected && !disabled && "bg-[#f0f0f0]",
                        "focus-visible:ring-2 focus-visible:ring-blue/50",
                      )}
                    >
                      {d.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
