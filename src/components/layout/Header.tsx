"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronRight, User, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { mainNav, mobileNav, suiteLinks } from "@/data/nav";
import { cn } from "@/lib/utils";

/** tbils.com switches the bar to its solid state once the page scrolls past this point. */
const SCROLL_THRESHOLD = 110;

const isExternal = (href: string) => href.startsWith("http");

/**
 * Fixed top bar, ported from tbils.com:
 * - Desktop: a floating pill (90% wide, 15px from the top) that animates over 0.3s into a
 *   full-width white bar once scrolled.
 * - Mobile: a 54px transparent bar that fades to frosted white; the menu slides in from the right.
 * `solid` keeps the scrolled look and reserves space, for pages without a dark hero.
 */
export function Header({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [suiteOpen, setSuiteOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const suiteRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    const onDown = (e: MouseEvent) => {
      if (suiteRef.current && !suiteRef.current.contains(e.target as Node)) setSuiteOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSuiteOpen(false);
        setDrawerOpen(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Lock page scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const solidBar = solid || scrolled;
  const link = cn(
    "inline-block px-3 py-[3.5px] text-sm font-medium leading-[14px] transition duration-300 hover:scale-[1.04] hover:opacity-85",
    solidBar ? "text-black" : "text-white",
  );

  return (
    <>
      {solid && <div aria-hidden className="h-[54px] md:h-[66px]" />}

      {/* Desktop / tablet bar */}
      <div className={cn("fixed inset-x-0 top-0 z-[1000] hidden md:block", solidBar && "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.1)]")}>
        <nav
          aria-label="Main"
          className={cn(
            "relative mx-auto flex max-w-[1440px] items-center justify-between transition-[width,top,padding,border-radius] duration-300",
            solidBar ? "top-0 w-full rounded-none px-6 py-3" : "top-[15px] w-[90%] rounded-full px-8 py-[17px]",
          )}
        >
          <Logo tone={solidBar ? "dark" : "light"} />

          <ul className="ml-12 mr-auto hidden items-center gap-[15px] lg:flex">
            {mainNav.slice(0, 2).map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="relative" ref={suiteRef}>
              <button
                type="button"
                aria-expanded={suiteOpen}
                aria-haspopup="menu"
                onClick={() => setSuiteOpen((v) => !v)}
                className={cn(link, "flex items-center font-normal hover:scale-100")}
              >
                Tbils Suite
                <span aria-hidden className={cn("ml-1.5 inline-block text-sm transition-transform duration-200", suiteOpen && "rotate-180")}>
                  ▾
                </span>
              </button>
              <ul
                role="menu"
                className={cn(
                  "absolute inset-x-0 top-[calc(100%+10px)] z-[1100] rounded-[10px] border border-black/[0.08] bg-white py-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-[opacity,transform] duration-150",
                  suiteOpen ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-1 opacity-0",
                )}
              >
                {suiteLinks.map((s) => (
                  <li key={s.label} role="none">
                    <a
                      role="menuitem"
                      href={s.href}
                      tabIndex={suiteOpen ? 0 : -1}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSuiteOpen(false)}
                      className="block px-[14px] py-[10px] text-sm font-medium text-black transition-colors hover:bg-[rgba(0,102,204,0.08)] hover:text-[#0066cc]"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
            {mainNav.slice(2).map((l) => (
              <li key={l.label}>
                <Link href={l.href} className={link}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href="/contact"
              className="flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-orange px-[22px] py-[11px] text-sm font-bold leading-[14px] tracking-[0.01em] text-white shadow-[0_1px_2px_rgba(74,34,4,0.2)] transition hover:bg-orange-600"
            >
              <User aria-hidden className="size-4" />
              Log in/Sign up
            </Link>
            <MenuButton light={!solidBar} onClick={() => setDrawerOpen(true)} className="lg:hidden" />
          </div>
        </nav>
      </div>

      {/* Mobile bar */}
      <div
        className={cn(
          "fixed inset-x-0 top-0 z-[1000] transition-[background-color,box-shadow] duration-[250ms] md:hidden",
          solidBar ? "bg-white/95 shadow-[0_2px_10px_rgba(0,0,0,0.1)] backdrop-blur-[10px]" : "bg-transparent",
        )}
      >
        <nav aria-label="Mobile" className="flex h-[54px] items-center justify-between px-5 py-2">
          <Logo tone={solidBar ? "dark" : "light"} width={92} />
          <MenuButton light={!solidBar} onClick={() => setDrawerOpen(true)} />
        </nav>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

function MenuButton({ light, onClick, className }: { light: boolean; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Open menu"
      aria-controls="mobile-drawer"
      onClick={onClick}
      className={cn(
        "flex size-[38px] items-center justify-center rounded-[10px] border-[0.83px] transition-colors duration-[250ms]",
        light ? "border-white/[0.22] bg-white/[0.12] text-white" : "border-[rgba(11,34,51,0.08)] bg-[rgba(11,34,51,0.06)] text-[#0b2233]",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    </button>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const card =
    "flex w-full items-center gap-[14px] rounded-2xl border-[0.83px] px-4 py-[13px] text-left text-base font-semibold text-white transition-[background-color,transform] duration-[180ms] hover:translate-x-0.5";
  const items = [...mobileNav];
  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[2100] bg-[rgba(3,12,24,0.5)] backdrop-blur-[20px] backdrop-saturate-[1.1] transition-[opacity,visibility] duration-[280ms]",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      />
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        data-open={open}
        className={cn(
          "fixed right-0 top-0 z-[2101] flex h-dvh w-full max-w-[420px] flex-col overflow-hidden shadow-[-16px_0_50px_rgba(3,12,24,0.45)] transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          "bg-[radial-gradient(120%_80%_at_85%_0px,rgba(2,144,222,0.2)_0px,transparent_45%),linear-gradient(160deg,#0a1628,#012a49_55%,#013f68)]",
          open ? "translate-x-0" : "invisible translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 pb-4 pt-5">
          <Logo width={92} />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex size-[42px] items-center justify-center rounded-full border-[0.83px] border-white/[0.16] bg-white/[0.08] text-white"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav aria-label="Mobile menu" className="flex-1 overflow-y-auto px-4">
          <span className="block py-[10px] text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#8fa3b8]">Explore</span>
          <ul className="space-y-[10px]">
            {items.map((l, i) => (
              <li key={l.label} className="drawer-card" style={{ "--i": i } as React.CSSProperties}>
                <Link
                  href={l.href}
                  onClick={onClose}
                  {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className={cn(card, "border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.09]")}
                >
                  {l.label}
                  <ChevronRight aria-hidden className="ml-auto size-[18px] text-white/40" />
                </Link>
              </li>
            ))}
            <li className="drawer-card pt-[6px]" style={{ "--i": items.length } as React.CSSProperties}>
              <Link
                href="/contact"
                onClick={onClose}
                className={cn(card, "border-[rgba(2,152,218,0.4)] bg-[rgba(2,144,222,0.16)] hover:bg-[rgba(2,144,222,0.24)]")}
              >
                Log in / Sign up
                <ChevronRight aria-hidden className="ml-auto size-[18px] text-white/40" />
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-4 pb-4 pt-6">
          <Link
            href="/flights"
            onClick={onClose}
            className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#f58634,#ff9d52)] text-base font-bold text-white shadow-[0_10px_26px_rgba(245,134,52,0.38)]"
          >
            Book a Flight <ArrowRight aria-hidden className="size-4" />
          </Link>
          <p className="mt-3 text-center text-[11.5px] font-semibold tracking-[0.02em] text-[#8fa3b8]">IATA-accredited · Pay in ₦ with Paystack</p>
        </div>
      </div>
    </>
  );
}
