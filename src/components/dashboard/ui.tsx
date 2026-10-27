import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { statusLabel, type BookingStatus } from "@/lib/booking/history";
import { cn } from "@/lib/utils";

export const cardCls = "rounded-2xl border border-[#eef1f5] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]";

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section data-reveal className={cn(cardCls, className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eef1f5] px-5 py-4">
          <div>
            {title && <h2 className="text-base font-bold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "blue",
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "blue" | "orange" | "green" | "navy";
  style?: React.CSSProperties;
}) {
  const tones = {
    blue: "bg-[rgba(2,144,222,0.1)] text-blue",
    orange: "bg-[rgba(245,134,52,0.12)] text-orange",
    green: "bg-[#dcfce7] text-[#16a34a]",
    navy: "bg-[rgba(1,53,87,0.1)] text-[#013557]",
  };
  return (
    <div style={style} className={cn(cardCls, "hover-lift group flex items-start gap-4 p-5 animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_backwards]")}>
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", tones[tone])}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-ink-500">{label}</p>
        <p className="mt-1 truncate font-display text-[26px] font-extrabold leading-none text-ink-900">{value}</p>
        {hint && <p className="mt-2 text-xs text-ink-400">{hint}</p>}
      </div>
    </div>
  );
}

const statusCls: Record<BookingStatus, string> = {
  confirmed: "bg-[#dcfce7] text-[#15803d]",
  pending: "bg-[#fef3c7] text-[#b45309]",
  hold: "bg-[#ffedd5] text-[#c2410c]",
  completed: "bg-[rgba(2,144,222,0.1)] text-[#0369a1]",
  cancelled: "bg-[#fee2e2] text-[#b91c1c]",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", statusCls[status], className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {statusLabel[status]}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, message, action }: { icon: LucideIcon; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center animate-[fade-up_0.35s_ease]">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-[rgba(2,144,222,0.1)] text-blue">
        <Icon className="size-6" />
      </span>
      <h3 className="font-display text-lg font-extrabold text-ink-900">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-500">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[linear-gradient(90.41deg,#0077f7_0.35%,#004691_106.01%)] disabled:cursor-not-allowed disabled:opacity-50";
export const outlineBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-blue bg-white px-5 py-2.5 text-sm font-bold text-blue transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50";
export const ghostBtn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-tint-200 hover:text-ink-900";
