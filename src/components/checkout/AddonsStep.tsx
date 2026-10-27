"use client";

import { addons, type Addon } from "@/data/booking";
import { cn } from "@/lib/utils";

const icons: Record<Addon["icon"], React.ReactNode> = {
  reminder: <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />,
  shield: <path d="M12 3 19 6v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6l7-3Zm-3 9 2 2 4-4" />,
  car: <path d="M5 16h14M6 16v2m12-2v2M4 13l2-5a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 8l2 5v3H4v-3Zm3.5.5h.01M16.5 13.5h.01" />,
  seat: <path d="M7 4v9h10M7 13l-1 7m11-7 1 7M7 4h4" />,
};

/** Optional extras list (tbils.com step 2) with Add / Remove toggles. */
export function AddonsStep({
  selected,
  onToggle,
  paxCount,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  paxCount: number;
}) {
  return (
    <div>
      {addons.map((a, i) => {
        const added = selected.includes(a.id);
        return (
          <div
            key={a.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className="mb-3 flex flex-col justify-between gap-4 rounded-[14px] border border-[#eef1f5] bg-white p-3.5 shadow-[0_1px_2px_rgba(16,40,68,0.04),0_6px_18px_rgba(16,40,68,0.05)] transition-shadow animate-[fade-up_0.35s_ease_both] hover:shadow-[0_2px_4px_rgba(16,40,68,0.06),0_10px_24px_rgba(16,40,68,0.09)] sm:flex-row sm:p-[18px]"
          >
            <div className="flex gap-3 sm:gap-[18px]">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[rgba(2,144,222,0.08)] text-blue sm:size-16">
                <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {icons[a.icon]}
                </svg>
              </span>
              <div className="flex flex-col justify-between gap-1.5">
                <p className="text-[17px] font-bold leading-none text-ink-900">{a.name}</p>
                <p className="text-sm leading-[18px] text-[#4e4e4e] sm:w-[85%]" dangerouslySetInnerHTML={{ __html: a.description }} />
                {a.isPerPassenger && (
                  <span className="w-fit rounded-[10px] bg-[rgba(252,201,167,0.33)] px-2 py-0.5 text-xs font-medium text-[#f60]">
                    Price per passenger{paxCount > 1 ? ` · ×${paxCount}` : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
              <p className="text-base font-semibold text-[#4e4e4e]">₦{a.price.toLocaleString("en-NG")}</p>
              <button
                type="button"
                aria-pressed={added}
                onClick={() => onToggle(a.id)}
                className={cn(
                  "rounded-xl border px-[18px] py-2.5 text-[15px] font-bold leading-none transition sm:w-[110px]",
                  added ? "border-[#e4e8ee] bg-[#f4f6f9] text-ink-500 hover:bg-[#eceff3]" : "border-blue bg-white text-blue hover:bg-[rgba(2,144,222,0.08)]",
                )}
              >
                {added ? "Remove" : "Add"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
