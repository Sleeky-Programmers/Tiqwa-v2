"use client";

import { useEffect, useRef } from "react";
import { Baby, Check, User, UserRound } from "lucide-react";
import type { Traveller } from "@/lib/booking/store";
import { cn } from "@/lib/utils";
import { typeInfo } from "./TravellerForm";

export type TravellerStatus = "complete" | "attention" | "progress" | "empty";

const statusUi: Record<TravellerStatus, { text: string; cls: string }> = {
  complete: { text: "Completed", cls: "bg-[#dcfce7] text-[#15803d]" },
  attention: { text: "Needs attention", cls: "bg-[#fee2e2] text-[#b91c1c]" },
  progress: { text: "In progress", cls: "bg-[#fef3c7] text-[#b45309]" },
  empty: { text: "Not started", cls: "bg-[#f1f5f9] text-[#64748b]" },
};

const icons = { adult: User, child: UserRound, infant: Baby } as const;

/**
 * Card controls above the traveller form: one card per passenger showing type, name and
 * completion; selecting a card shows that passenger's form. Arrow keys move between cards.
 */
export function TravellerSwitcher({
  travellers,
  labels,
  statuses,
  errorCounts,
  active,
  onSelect,
  panelId,
}: {
  travellers: Traveller[];
  labels: string[];
  statuses: TravellerStatus[];
  errorCounts: number[];
  active: number;
  onSelect: (i: number) => void;
  panelId: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const completed = statuses.filter((s) => s === "complete").length;

  // Keep the active card in view when switching from the bottom controls.
  useEffect(() => {
    refs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [active]);

  const move = (to: number) => {
    const i = (to + travellers.length) % travellers.length;
    onSelect(i);
    refs.current[i]?.focus();
  };

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink-900">
          {completed} of {travellers.length} traveller{travellers.length > 1 ? "s" : ""} completed
        </p>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#eef1f5]" aria-hidden>
          <div className="h-full rounded-full bg-blue transition-all duration-500" style={{ width: `${(completed / travellers.length) * 100}%` }} />
        </div>
      </div>
      <div role="tablist" aria-label="Travellers" className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 pt-1">
        {travellers.map((t, i) => {
          const Icon = icons[t.type];
          const on = i === active;
          const name = [t.firstName, t.surname].filter(Boolean).join(" ");
          const status = statuses[i];
          return (
            <button
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`traveller-tab-${i}`}
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                  e.preventDefault();
                  move(i + 1);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  move(i - 1);
                }
              }}
              className={cn(
                "relative flex w-[200px] shrink-0 snap-start items-start gap-3 rounded-[14px] border bg-white p-3.5 text-left transition hover:-translate-y-0.5",
                on
                  ? "border-blue shadow-[0_0_0_1px_#0290de,0_8px_24px_rgba(2,144,222,0.12)]"
                  : "border-[#eef1f5] shadow-[0_1px_2px_rgba(16,40,68,0.04),0_6px_18px_rgba(16,40,68,0.05)]",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-full",
                  status === "complete" ? "bg-[#16a34a] text-white" : on ? "bg-blue text-white" : "bg-[rgba(2,144,222,0.1)] text-blue",
                )}
              >
                {status === "complete" ? <Check className="size-5" /> : <Icon className="size-5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold leading-5 text-ink-900">
                  {labels[i]}
                  {i === 0 && <span className="ml-1.5 text-[11px] font-semibold text-blue">Lead</span>}
                </span>
                <span className="block truncate text-xs text-ink-500">{name || typeInfo[t.type].age}</span>
                <span className={cn("mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", statusUi[status].cls)}>
                  {status === "attention" ? `${errorCounts[i]} to fix` : statusUi[status].text}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
