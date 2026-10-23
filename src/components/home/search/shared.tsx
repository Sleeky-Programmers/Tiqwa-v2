"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

/* Measured from tbils.com: 50px fields, 10px radius, #E2E8F0 border, 14px side padding. */
export const fieldBox =
  "relative flex h-[50px] items-center gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-[14px] transition-colors hover:border-blue focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/25";
export const labelCls = "mb-[6px] block text-[11px] font-bold uppercase leading-[14px] tracking-[0.06em] text-[#94a3b8]";
export const valueCls =
  "w-full min-w-0 truncate bg-transparent text-[15px] font-semibold text-[#0f172a] placeholder:font-semibold placeholder:text-[#94a3b8] focus:outline-none";

/** Calls `onClose` on a mousedown outside the returned ref's element. */
export function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onClose);
  useEffect(() => {
    cb.current = onClose;
  });
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return ref;
}

export const Chevron = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="size-5 shrink-0 fill-none stroke-[#64748b]" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7.5L10 12.5L15 7.5" />
  </svg>
);

/** Height of the fixed top bar; space under it doesn't count as room above a trigger. */
const FIXED_BAR = 72;

/**
 * Opens a dropdown below its trigger, or above when there isn't room below but there is more above.
 * Re-checks on scroll and resize while open.
 */
export function useFlipPlacement(open: boolean, anchorRef: RefObject<HTMLElement | null>, menuRef: RefObject<HTMLElement | null>, gap = 8) {
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!anchor || !menu) return;
      const below = window.innerHeight - anchor.bottom - gap;
      const above = anchor.top - gap - FIXED_BAR;
      setPlacement(below < menu.offsetHeight && above > below ? "top" : "bottom");
    };
    update();
    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, menuRef, gap]);
  return placement;
}

/** Tailwind classes that attach a dropdown to its trigger for a given placement. */
export const placementCls = (p: "bottom" | "top") => (p === "top" ? "bottom-full mb-2" : "top-full mt-2");
