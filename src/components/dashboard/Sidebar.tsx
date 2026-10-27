"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { contact } from "@/data/contact";
import { cn } from "@/lib/utils";
import { dashboardNav } from "./nav";

export function isActive(path: string, href: string, exact?: boolean) {
  return exact ? path === href : path === href || path.startsWith(`${href}/`);
}

/** Left navigation: logo, main links, help card and sign out. */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center border-b border-[#eef1f5] px-6">
        <Logo tone="dark" width={120} />
      </div>

      <nav aria-label="Dashboard" className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">Menu</p>
        <ul className="space-y-1">
          {dashboardNav.map(({ href, label, icon: Icon, ...rest }) => {
            const on = isActive(path, href, "exact" in rest && rest.exact);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition-colors",
                    on ? "bg-[rgba(2,144,222,0.08)] text-blue" : "text-[#475569] hover:bg-tint-200 hover:text-ink-900",
                  )}
                >
                  {on && <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-blue" />}
                  <Icon className="size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-3 p-4">
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#0a1628,#013557_55%,#0290de)] p-4 text-white">
          <div aria-hidden className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
          <p className="relative font-display text-base font-extrabold">Need help?</p>
          <p className="relative mt-1 text-xs text-white/80">Our travel experts are available 24/7.</p>
          <div className="relative mt-3 flex gap-2">
            <a
              href={contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2 text-xs font-bold text-[#014e78] transition hover:bg-sky-50"
            >
              <MessageCircle className="size-3.5" /> Chat
            </a>
            <a
              href={contact.phone.href}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/30 py-2 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <Phone className="size-3.5" /> Call
            </a>
          </div>
        </div>
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-[#475569] transition hover:bg-[#fef2f2] hover:text-error"
        >
          <LogOut className="size-5" /> Sign out
        </Link>
      </div>
    </div>
  );
}
