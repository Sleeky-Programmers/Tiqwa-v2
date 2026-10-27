"use client";

import { useSyncExternalStore } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; kind: "success" | "error"; message: string };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Show a toast from anywhere: toast.success("Saved"), toast.error("Something went wrong"). */
export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
};

function push(kind: Toast["kind"], message: string) {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, kind, message }];
  emit();
  window.setTimeout(() => dismiss(id), 4000);
}
function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const empty: Toast[] = [];

/** Mount once per layout; renders the toast stack bottom-right. */
export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => empty,
  );
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-5 right-5 z-[2600] flex w-[calc(100%-40px)] max-w-[380px] flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-[0_14px_36px_rgba(18,35,61,0.16)] animate-[fade-up_0.3s_cubic-bezier(0.16,1,0.3,1)]",
            t.kind === "success" ? "border-[#bbf7d0]" : "border-[#fecaca]",
          )}
        >
          {t.kind === "success" ? <CircleCheck className="mt-0.5 size-5 shrink-0 text-[#16a34a]" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-error" />}
          <p className="flex-1 text-sm font-medium text-ink-900">{t.message}</p>
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-ink-400 hover:text-ink-900">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
