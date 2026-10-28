"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Toaster } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** App frame for /dashboard: fixed sidebar (slide-in drawer on mobile), sticky top bar, content area. */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();

  // Close the mobile drawer after navigating.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setDrawer(false), [path]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawer]);

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] border-r border-[#eef1f5] lg:block print:hidden">
        <Sidebar />
      </aside>

      <div
        aria-hidden
        onClick={() => setDrawer(false)}
        className={cn(
          "fixed inset-0 z-[2100] bg-[rgba(3,12,24,0.5)] backdrop-blur-[6px] transition-[opacity,visibility] duration-300 lg:hidden",
          drawer ? "visible opacity-100" : "invisible opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!drawer}
        className={cn(
          "fixed inset-y-0 left-0 z-[2101] w-[280px] max-w-[85vw] shadow-[16px_0_50px_rgba(3,12,24,0.25)] transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          drawer ? "translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setDrawer(false)}
          className="absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full text-ink-500 hover:bg-tint-200"
        >
          <X className="size-5" />
        </button>
        <Sidebar onNavigate={() => setDrawer(false)} />
      </div>

      <div className="lg:pl-[264px] print:pl-0">
        <Topbar onMenu={() => setDrawer(true)} />
        <main id="main" className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
