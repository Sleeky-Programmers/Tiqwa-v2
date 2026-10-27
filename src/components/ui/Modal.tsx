"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animated dialog (fade-in backdrop + slide-down panel, as on tbils.com).
 * Closes on Escape or backdrop click, locks page scroll and returns focus to the opener.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  children,
  className,
  hideClose = false,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: ReactNode;
  className?: string;
  hideClose?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2200] flex items-start justify-center overflow-y-auto bg-[rgba(5,20,35,0.66)] p-4 backdrop-blur-[5px] animate-[fade-in_0.18s_ease-out] sm:p-6 sm:pt-[6vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-[760px] overflow-hidden rounded-[20px] border border-[#eaeef3] bg-white shadow-[0_24px_60px_rgba(1,40,74,0.12)] outline-none animate-[modal-in_0.25s_cubic-bezier(0.16,1,0.3,1)]",
          className,
        )}
      >
        {!hideClose && (
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-ink-500 transition hover:bg-tint-200 hover:text-ink-900"
          >
            <X className="size-5" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
