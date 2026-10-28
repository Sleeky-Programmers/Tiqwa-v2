"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, Globe, LogOut, Menu, Plane, UserRound } from "lucide-react";
import { useOutsideClose } from "@/components/home/search/shared";
import { notifications } from "@/data/dashboard/user";
import { fullName, initials, useProfile } from "@/lib/account";
import { loadBooking } from "@/lib/booking/store";
import { searchToParams } from "@/lib/flights/search-params";
import { cn } from "@/lib/utils";
import { pageMeta } from "./nav";

const menuCls =
  "absolute right-0 top-[calc(100%+10px)] z-50 rounded-xl border border-[#e2e8f0] bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)] animate-[acc-reveal_0.2s_ease]";

/** Sticky top bar: hamburger (mobile), page title + breadcrumb, Book a flight, notifications, account menu. */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const [resultsHref, setResultsHref] = useState<string>();
  const { title, crumbs, back } = pageMeta(path, resultsHref);
  // Already inside the booking flow, so the "Book a flight" shortcut would only abandon it.
  const inFlights = path.startsWith("/dashboard/flights");

  // Point "Results" back at the search the current booking came from (kept in sessionStorage).
  useEffect(() => {
    const draft = loadBooking();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only
    setResultsHref(draft ? `/dashboard/flights/results?${searchToParams(draft.search)}` : undefined);
  }, [path]);
  const user = useProfile();
  const [open, setOpen] = useState<"notes" | "account" | null>(null);
  const [read, setRead] = useState(false);
  const notesRef = useOutsideClose<HTMLDivElement>(() => setOpen((o) => (o === "notes" ? null : o)));
  const accountRef = useOutsideClose<HTMLDivElement>(() => setOpen((o) => (o === "account" ? null : o)));
  const unread = read ? 0 : notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-[#eef1f5] bg-white/95 px-4 backdrop-blur sm:px-6 print:hidden">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open menu"
        className="flex size-10 items-center justify-center rounded-[10px] border border-[#e4e8ee] text-ink-900 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {back && (
        <Link
          href={back.href}
          aria-label={back.label}
          title={back.label}
          className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e4e8ee] text-ink-900 transition hover:border-blue hover:text-blue"
        >
          <ArrowLeft className="size-5" />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden text-xs text-ink-400 sm:block">
          <Link href="/dashboard" className="hover:text-blue">
            Account
          </Link>
          {crumbs.map((c, i) => (
            <span key={c.label} aria-current={i === crumbs.length - 1 ? "page" : undefined}>
              <span className="mx-1.5">/</span>
              {c.href ? (
                <Link href={c.href} className="hover:text-blue">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink-500">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="truncate font-display text-lg font-extrabold leading-tight text-ink-900 sm:text-xl">{title}</h1>
      </div>

      <Link
        href="/dashboard/flights"
        className={cn(inFlights ? "hidden" : "hidden md:flex", "items-center gap-2 rounded-[10px] bg-orange px-4 py-2.5 text-sm font-bold text-white shadow-[0_1px_2px_rgba(74,34,4,0.2)] transition hover:bg-orange-600")}
      >
        <Plane className="size-4" /> Book a flight
      </Link>

      <div ref={notesRef} className="relative">
        <button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          aria-expanded={open === "notes"}
          onClick={() => setOpen((o) => (o === "notes" ? null : "notes"))}
          className="relative flex size-10 items-center justify-center rounded-full border border-[#e4e8ee] text-ink-900 transition hover:border-blue hover:text-blue"
        >
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-orange text-[10px] font-bold text-white">{unread}</span>
          )}
        </button>
        {open === "notes" && (
          <div className={cn(menuCls, "w-[320px] max-w-[calc(100vw-32px)]")}>
            <div className="flex items-center justify-between border-b border-[#eef1f5] px-4 py-3">
              <p className="text-sm font-bold text-ink-900">Notifications</p>
              <button type="button" onClick={() => setRead(true)} className="text-xs font-semibold text-blue hover:underline">
                Mark all as read
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto p-1">
              {notifications.map((n) => (
                <li key={n.id} className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-tint-100">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.unread && !read ? "bg-blue" : "bg-transparent")} />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{n.title}</p>
                    <p className="text-xs leading-[1.45] text-ink-500">{n.body}</p>
                    <p className="mt-1 text-[11px] text-ink-400">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div ref={accountRef} className="relative">
        <button
          type="button"
          aria-expanded={open === "account"}
          aria-haspopup="menu"
          onClick={() => setOpen((o) => (o === "account" ? null : "account"))}
          className="flex items-center gap-2 rounded-full border border-[#e4e8ee] py-1 pl-1 pr-2 transition hover:border-blue sm:pr-3"
        >
          <span className="grid size-8 place-items-center rounded-full bg-[linear-gradient(140deg,#013557,#0290de)] text-xs font-bold text-white">{initials(user)}</span>
          <span className="hidden max-w-[120px] truncate text-sm font-semibold text-ink-900 sm:block">{user.firstName}</span>
          <ChevronDown className={cn("size-4 text-ink-500 transition-transform", open === "account" && "rotate-180")} />
        </button>
        {open === "account" && (
          <div role="menu" className={cn(menuCls, "w-60 p-1.5")}>
            <div className="border-b border-[#eef1f5] px-3 pb-2.5 pt-1.5">
              <p className="truncate text-sm font-bold text-ink-900">{fullName(user)}</p>
              <p className="truncate text-xs text-ink-500">{user.email}</p>
            </div>
            {[
              { href: "/dashboard/profile", label: "Profile", icon: UserRound },
              { href: "/", label: "Back to website", icon: Globe },
              { href: "/", label: "Sign out", icon: LogOut },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={label}
                role="menuitem"
                href={href}
                onClick={() => setOpen(null)}
                className={cn(
                  "mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  label === "Sign out" ? "text-error hover:bg-[#fef2f2]" : "text-ink-800 hover:bg-tint-200",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
