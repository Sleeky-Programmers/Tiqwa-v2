"use client";

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/* Measured from tbils.com: 50px fields, 10px radius, #E2E8F0 border, 14px side padding. */
export const fieldBox =
  "relative flex h-[50px] items-center gap-[10px] rounded-[10px] border border-[#e2e8f0] bg-white px-[14px] transition-colors hover:border-blue focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/25";
export const labelCls = "mb-[6px] block text-[11px] font-bold uppercase leading-[14px] tracking-[0.06em] text-[#94a3b8]";
export const valueCls =
  "w-full min-w-0 truncate bg-transparent text-[15px] font-semibold text-[#0f172a] placeholder:font-semibold placeholder:text-[#94a3b8] focus:outline-none";

/**
 * Calls `onClose` on a mousedown outside the returned ref's element. `inside` is another element
 * that counts as inside, e.g. a dropdown rendered in a portal by <Floating>.
 */
export function useOutsideClose<T extends HTMLElement>(onClose: () => void, inside?: RefObject<HTMLElement | null>) {
  const ref = useRef<T>(null);
  const cb = useRef(onClose);
  useEffect(() => {
    cb.current = onClose;
  });
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t) && !inside?.current?.contains(t)) cb.current();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [inside]);
  return ref;
}

export const Chevron = () => (
  <svg viewBox="0 0 20 20" aria-hidden className="size-5 shrink-0 fill-none stroke-[#64748b]" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 7.5L10 12.5L15 7.5" />
  </svg>
);

/** Height of the fixed top bar; space under it doesn't count as room above a trigger. */
const FIXED_BAR = 72;

export type Placement = "bottom" | "top";
type Pos = { top: number; left: number; width: number; placement: Placement };

/**
 * A dropdown / calendar / popover layer. It renders into document.body with fixed positioning, so
 * no section's overflow or stacking context can clip it or hide it under the next section. It
 * matches the anchor's width (at least `minWidth`), opens below the anchor or above it when there
 * is more room there, and follows scrolling, resizing and its own content changing size.
 * z-[2350]: above sticky headers, modals and drawers (2200), below blocking overlays and toasts.
 */
export function Floating({
  anchorRef,
  floatingRef,
  gap = 8,
  minWidth = 0,
  className,
  children,
  ...rest
}: {
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLDivElement | null>;
  gap?: number;
  minWidth?: number;
  className?: string;
  children: ReactNode | ((placement: Placement) => ReactNode);
} & Omit<HTMLAttributes<HTMLDivElement>, "children">) {
  const [pos, setPos] = useState<Pos | null>(null);

  useLayoutEffect(() => {
    let frame = 0;
    const update = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      const f = floatingRef.current;
      if (!a || !f) return;
      const width = Math.max(a.width, minWidth);
      const h = f.offsetHeight;
      const below = window.innerHeight - a.bottom - gap;
      const above = a.top - gap - FIXED_BAR;
      const placement: Placement = below < h && above > below ? "top" : "bottom";
      setPos({
        placement,
        width,
        top: placement === "bottom" ? a.bottom + gap : a.top - gap - h,
        left: Math.max(8, Math.min(a.left, window.innerWidth - width - 8)),
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    const resize = new ResizeObserver(schedule);
    if (floatingRef.current) resize.observe(floatingRef.current);
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
    };
  }, [anchorRef, floatingRef, gap, minWidth]);

  const placement = pos?.placement ?? "bottom";
  return createPortal(
    <div
      {...rest}
      ref={floatingRef}
      data-placement={placement}
      // Transparent until measured, so the first frame never flashes at the wrong spot. (Opacity, not
      // visibility: content that takes focus on open, like a calendar day or a search box, must be focusable.)
      style={pos ? { position: "fixed", top: pos.top, left: pos.left, width: pos.width } : { position: "fixed", top: 0, left: 0, opacity: 0, pointerEvents: "none" }}
      className={cn("pop-in z-[2350]", className)}
    >
      {typeof children === "function" ? children(placement) : children}
    </div>,
    document.body,
  );
}
