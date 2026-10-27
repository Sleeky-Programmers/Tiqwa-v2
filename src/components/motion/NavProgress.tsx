"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Thin brand-blue bar across the top while a page navigation is in flight.
 * Starts on clicks of internal links, completes when the URL changes.
 */
export function NavProgress() {
  const path = usePathname();
  const query = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      setState("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- finish the bar once the new URL is rendered
    setState((s) => (s === "loading" ? "done" : s));
    const t = window.setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 400);
    return () => window.clearTimeout(t);
  }, [path, query]);

  if (state === "idle") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[3000] h-[3px]">
      <div
        className="h-full rounded-r-full bg-[linear-gradient(90deg,#0290de,#f58634)] shadow-[0_0_10px_rgba(2,144,222,0.6)]"
        style={
          state === "loading"
            ? { animation: "nav-progress 2.5s cubic-bezier(0.16,1,0.3,1) forwards" }
            : { width: "100%", opacity: 0, transition: "width 0.2s ease, opacity 0.35s ease 0.15s" }
        }
      />
    </div>
  );
}
