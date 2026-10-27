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

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "12 / Mar / 1990" — the checkout date format. */
export const formatDmy = (iso: string) => {
  const d = fromIso(iso);
  return `${pad(d.getDate())} / ${MONTHS_SHORT[d.getMonth()]} / ${d.getFullYear()}`;
};

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
  max,
  onChange,
  placeholder = "Select date",
  format = "long",
  jump = false,
  invalid = false,
  describedBy,
  className,
  labelClassName,
  fieldClassName,
}: {
  name: string;
  title: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  /** "long" = "Fri, October 23" (search); "dmy" = "23 / Oct / 2026" (checkout). */
  format?: "long" | "dmy";
  /** Let the user jump by year/month (birth dates, passport dates). */
  jump?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  labelClassName?: string;
  fieldClassName?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "years" | "months">("days");
  const [view, setView] = useState<Date | null>(null);
  const [focused, setFocused] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const ref = useOutsideClose<HTMLDivElement>(() => setOpen(false));

  const isDisabled = (iso: string) => (min ? iso < min : false) || (max ? iso > max : false);

  const openPicker = () => {
    const now = toIso(new Date());
    // Birth dates open at the latest allowed day; search dates at the earliest.
    const start = value || (max ? (max < now ? max : now) : min || now);
    setView(fromIso(start));
    setFocused(start);
    setMode("days");
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
    if (max && iso > max) iso = max;
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
  const canPrev = !!view && mode === "days" && (!min || monthKey(view) > monthKey(fromIso(min)));
  const canNext = !!view && mode === "days" && (!max || monthKey(view) < monthKey(fromIso(max)));
  const minYear = min ? fromIso(min).getFullYear() : (view?.getFullYear() ?? 2000) - 100;
  const maxYear = max ? fromIso(max).getFullYear() : (view?.getFullYear() ?? 2000) + 20;
  const pickYearMonth = (year: number, month: number) => {
    const target = toIso(new Date(year, month, 1));
    setView(new Date(year, month, 1));
    setFocused(min && target < min ? min : max && target > max ? max : target);
    setMode("days");
  };
  // Only read the clock once the popup is open (keeps prerendering deterministic).
  const today = open ? toIso(new Date()) : "";
  const monthLabel = view ? view.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className={labelClassName ?? labelCls}>
        {title}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={cn(fieldBox, "w-full text-left", fieldClassName, invalid && "border-error", open && "border-blue ring-2 ring-blue/25")}
      >
        {format === "long" && <CalendarIcon />}
        <span className={cn(valueCls, !value && "font-normal text-[#9ca3af]")}>
          {value ? (format === "dmy" ? formatDmy(value) : formatDisplayDate(value)) : placeholder}
        </span>
        {format === "dmy" && <CalendarIcon />}
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
            {canNext && (
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className="group absolute right-0.5 top-0.5 flex size-8 items-center justify-center">
                <span className="size-[9px] rotate-45 border-r-[2.5px] border-t-[2.5px] border-[#ccc] group-hover:border-[#a6a6a6]" />
              </button>
            )}
            <h2 aria-live="polite" className="text-center text-[15.1px] font-bold leading-[18px]">
              {jump ? (
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === "days" ? "years" : "days"))}
                  className="inline-flex items-center gap-1 rounded px-1.5 hover:bg-black/5"
                  aria-label={mode === "days" ? `${monthLabel}, choose year and month` : "Back to days"}
                >
                  {mode === "months" ? view.getFullYear() : monthLabel}
                  <span aria-hidden className={cn("text-[10px] transition-transform", mode !== "days" && "rotate-180")}>▼</span>
                </button>
              ) : (
                monthLabel
              )}
            </h2>
            {mode === "days" && (
              <div className="mt-2 grid grid-cols-7 justify-items-center px-[6.4px] pb-0.5" aria-hidden>
                {WEEKDAYS.map((d) => (
                  <span key={d} className="m-[2.656px] w-[27px] text-center leading-[27px] text-black">
                    {d}
                  </span>
                ))}
              </div>
            )}
            {mode !== "days" && <div className="h-2" />}
          </div>

          {mode === "years" && (
            <div className="grid max-h-[216px] grid-cols-4 gap-1 overflow-y-auto p-2" role="listbox" aria-label="Choose year">
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map((y) => (
                <button
                  key={y}
                  type="button"
                  role="option"
                  aria-selected={y === view.getFullYear()}
                  ref={(el) => {
                    if (el && y === view.getFullYear()) el.scrollIntoView({ block: "center" });
                  }}
                  onClick={() => {
                    setView(new Date(y, view.getMonth(), 1));
                    setMode("months");
                  }}
                  className={cn("rounded-[4.8px] py-1.5", y === view.getFullYear() ? "bg-[#216ba5] font-bold text-white" : "hover:bg-[#f0f0f0]")}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {mode === "months" && (
            <div className="grid grid-cols-3 gap-1 p-2" role="listbox" aria-label="Choose month">
              {MONTHS_SHORT.map((m, i) => {
                const first = toIso(new Date(view.getFullYear(), i, 1));
                const last = toIso(new Date(view.getFullYear(), i + 1, 0));
                const off = (max && first > max) || (min && last < min);
                return (
                  <button
                    key={m}
                    type="button"
                    role="option"
                    aria-selected={i === view.getMonth()}
                    disabled={!!off}
                    onClick={() => pickYearMonth(view.getFullYear(), i)}
                    className={cn("rounded-[4.8px] py-2", off ? "text-[#ccc]" : i === view.getMonth() ? "bg-[#216ba5] font-bold text-white" : "hover:bg-[#f0f0f0]")}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {mode === "days" && (
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
          )}
        </div>
      )}
    </div>
  );
}
