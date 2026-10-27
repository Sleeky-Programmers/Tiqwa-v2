"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Blue spinner used inside pages ("Validating flight details…", "Loading add-ons…"). */
export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-10 animate-spin rounded-full border-4 border-[rgba(2,144,222,0.15)] border-t-blue [animation-duration:0.8s]", className)} />;
}

export function InlineLoader({ message, className }: { message: string; className?: string }) {
  return (
    <div role="status" className={cn("flex flex-col items-center justify-center gap-4 py-20", className)}>
      <Spinner />
      <p className="text-[15px] font-medium text-[#4e4e4e]">{message}</p>
    </div>
  );
}

/** Full-screen blocking overlay ("Creating your booking, please wait…"). */
export function ProcessingOverlay({ open, message }: { open: boolean; message: string }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div role="status" aria-live="assertive" className="fixed inset-0 z-[2400] grid place-items-center bg-[rgba(5,20,35,0.66)] p-6 backdrop-blur-[5px] animate-[fade-in_0.18s_ease-out]">
      <div className="flex w-full max-w-[360px] flex-col items-center gap-4 rounded-[18px] bg-white px-7 py-8 text-center shadow-[0_24px_60px_rgba(1,20,45,0.28)] animate-[modal-in_0.2s_ease]">
        <Spinner className="size-12" />
        <p className="text-[15px] font-semibold text-ink-900">{message}</p>
      </div>
    </div>,
    document.body,
  );
}

/** Small centred alert ("This fare is no longer available"). */
export function AlertDialog({
  open,
  title,
  message,
  actionLabel = "OK",
  onClose,
}: {
  open: boolean;
  title?: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[2450] grid place-items-center bg-[rgba(5,20,35,0.66)] p-6 backdrop-blur-[5px] animate-[fade-in_0.18s_ease-out]">
      <div role="alertdialog" aria-modal="true" aria-labelledby="alert-title" className="w-full max-w-[420px] rounded-[18px] bg-white px-7 pb-6 pt-8 text-center shadow-[0_24px_60px_rgba(1,20,45,0.28)] animate-[modal-in_0.18s_ease]">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#fff1e8] text-xl font-bold text-orange">!</span>
        {title && (
          <h2 id="alert-title" className="mb-2 font-display text-xl font-extrabold text-ink-900">
            {title}
          </h2>
        )}
        <p className="mb-6 text-[15px] leading-[1.5] text-[#4b5563]">{message}</p>
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="w-full rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] py-3 text-[15px] font-bold text-white transition hover:opacity-90"
        >
          {actionLabel}
        </button>
      </div>
    </div>,
    document.body,
  );
}
