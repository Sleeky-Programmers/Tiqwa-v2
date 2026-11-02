"use client";

import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const submitCls =
  "press flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(2,144,222,0.25)] hover:bg-[linear-gradient(90.41deg,#0077f7_0.35%,#004691_106.01%)] disabled:cursor-not-allowed disabled:opacity-60";
export const textLink = "link-underline font-semibold text-blue";

export function AuthHeading({ title, sub, icon }: { title: string; sub?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-7">
      {icon && <span className="glow-ring mb-5 grid size-14 place-items-center rounded-2xl bg-[rgba(2,144,222,0.1)] text-blue">{icon}</span>}
      <h1 className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.02em] text-ink-900">{title}</h1>
      {sub && <p className="mt-2 text-[15px] leading-[1.55] text-ink-500">{sub}</p>}
    </div>
  );
}

export function Notice({ tone = "success", children }: { tone?: "success" | "error" | "info"; children: ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm animate-[acc-reveal_0.3s_ease]",
        tone === "success" && "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]",
        tone === "error" && "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
        tone === "info" && "border-[#d5e9f5] bg-[#f2f9fd] text-[#0c4a6e]",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Only allow same-site paths as post-login destinations. */
export const safeRedirect = (raw: string | null, fallback = "/dashboard") => (raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback);
