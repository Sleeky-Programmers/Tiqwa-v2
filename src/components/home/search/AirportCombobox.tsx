"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Airport } from "@/data/airports";
import { cn } from "@/lib/utils";
import { fieldBox, labelCls, useOutsideClose, valueCls } from "./shared";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

/** "Abuja, Nigeria" — how a picked airport reads in the field. */
export const airportDisplay = (a: Airport) => `${a.city}, ${a.country}`;

async function fetchAirports(q: string, signal: AbortSignal): Promise<Airport[]> {
  const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error("Airport search failed");
  return (await res.json()).results as Airport[];
}

const PinIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-[18px] shrink-0 fill-none stroke-blue" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

/**
 * Airport picker: opens on click with popular airports, then searches /api/airports
 * once the user has typed 2+ characters (debounced; stale requests are aborted).
 */
export function AirportCombobox({
  name,
  title,
  value,
  onChange,
  className,
}: {
  name: string;
  title: string;
  value: Airport | null;
  onChange: (a: Airport | null) => void;
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [results, setResults] = useState<Airport[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(0);

  const close = () => {
    setOpen(false);
    setEditing(false);
    setQuery("");
  };
  const ref = useOutsideClose<HTMLDivElement>(close);

  // Popular list on open / under 2 chars; live search from 2 chars.
  const term = query.trim().length >= MIN_CHARS ? query.trim() : "";
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(
      () => {
        setStatus("loading");
        fetchAirports(term, ctrl.signal)
          .then((r) => {
            setResults(r);
            setActive(0);
            setStatus("idle");
          })
          .catch((e) => {
            if (e.name !== "AbortError") setStatus("error");
          });
      },
      term ? DEBOUNCE_MS : 0,
    );
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [open, term]);

  // Keep the highlighted option in view while arrowing through the list.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (a: Airport) => {
    onChange(a);
    close();
    inputRef.current?.blur();
  };

  const shown = editing ? query : value ? airportDisplay(value) : "";
  const listId = `${id}-list`;

  return (
    <div ref={ref} className={cn("relative min-w-0", className)}>
      <label htmlFor={id} className={labelCls}>
        {title}
      </label>
      <div className={cn(fieldBox, open && "border-blue ring-2 ring-blue/25")}>
        <PinIcon />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="City or airport"
          value={shown}
          onFocus={() => {
            if (!open) setStatus("loading");
            setOpen(true);
            setEditing(true);
            setQuery("");
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setEditing(true);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && open && results[active]) {
              e.preventDefault();
              pick(results[active]);
            } else if (e.key === "Escape" || e.key === "Tab") {
              close();
            }
          }}
          className={valueCls}
        />
        {(value || query) && (
          <button
            type="button"
            aria-label={`Clear ${title.toLowerCase()}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange(null);
              setQuery("");
              inputRef.current?.focus();
            }}
            className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-lg leading-none text-[#94a3b8] hover:bg-tint-200 hover:text-[#334155]"
          >
            ×
          </button>
        )}
      </div>
      <input type="hidden" name={name} value={value?.code ?? ""} />

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 max-h-[400px] w-full overflow-y-auto rounded border-[0.83px] border-[#ddd] bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
          <div className="sticky top-0 flex items-center justify-between gap-2 border-b-[0.83px] border-[#f1f5f9] bg-white p-4">
            <span className="whitespace-nowrap text-sm font-medium leading-[21px] text-[#333]">Select a location</span>
            <span className="whitespace-nowrap rounded-md bg-[#f1f5f9] px-2 py-1 text-xs font-medium leading-[18px] text-[#475569]">
              {status === "loading" ? "Searching…" : `${results.length} results`}
            </span>
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label={`${title} airports`} className="flex flex-col gap-[2px] px-2 pb-4 pt-2">
            {status === "error" && <li className="px-2 py-2 text-sm text-error">Couldn&apos;t load airports. Try again.</li>}
            {status !== "error" && results.length === 0 && status !== "loading" && (
              <li className="px-2 py-2 text-sm text-[#666]">No locations found</li>
            )}
            {results.map((a, i) => (
              <li
                key={a.code}
                id={`${id}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(a);
                }}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-[9px] text-sm font-semibold leading-[18px] text-[#333] transition-colors duration-200",
                  i === active && "bg-[#f1f5f9]",
                )}
              >
                {a.city} ({a.code}) - <span className="text-xs text-[#666]">{a.country}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
