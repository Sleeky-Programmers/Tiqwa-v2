"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CalendarClock, ChevronRight, History, Search, Users } from "lucide-react";
import { airlineLogo } from "@/components/flights/FlightCard";
import { Select } from "@/components/ui/Select";
import { firstDeparture, isUpcoming, statusLabel, type BookingStatus, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { fmtShortDate, fmtTime, naira, paxLabel, tripLabel } from "@/lib/flights/format";
import { cn } from "@/lib/utils";
import { BookingDrawer } from "./BookingDrawer";
import { cardCls, EmptyState, primaryBtn, StatusBadge } from "./ui";
import { useBookings } from "./useBookings";

type Tab = "upcoming" | "past";
const statusOptions: Record<Tab, BookingStatus[]> = {
  upcoming: ["confirmed", "pending", "hold"],
  past: ["completed", "cancelled"],
};

function BookingRow({ b, onOpen, style }: { b: HistoryBooking; onOpen: () => void; style?: React.CSSProperties }) {
  const out = b.offer.journeys[0];
  const back = b.search.trip === "round" ? b.offer.journeys[1] : null;
  return (
    <li style={style} className="animate-[fade-up_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full flex-col gap-4 rounded-2xl border border-[#eef1f5] bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)] transition hover:-translate-y-0.5 hover:border-blue sm:flex-row sm:items-center sm:p-5"
      >
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[#eef1f5] bg-white">
            <Image src={airlineLogo(b.offer.airline.code)} alt="" width={34} height={34} className="size-[34px] object-contain" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-extrabold leading-tight text-ink-900">
              {out.from.city} {b.search.trip === "round" ? "⇄" : "→"} {out.to.city}
            </p>
            <p className="mt-0.5 truncate text-[13px] text-ink-500">
              {fmtShortDate(out.depart)} · {fmtTime(out.depart)}
              {back && ` – ${fmtShortDate(back.depart)}`} · {tripLabel[b.search.trip]} · {b.offer.airline.name}
            </p>
            <p className="mt-1.5 flex items-center gap-3 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" /> {paxLabel(b.search.pax)}
              </span>
              <span>Ref {b.reservation.pnr}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-[#eef1f5] pt-3 sm:border-0 sm:pt-0">
          <div className="sm:text-right">
            <StatusBadge status={b.status} />
            <p className="mt-1.5 text-base font-extrabold text-ink-900">{naira(bookingTotals(b).total)}</p>
          </div>
          <ChevronRight className="size-5 text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-blue" />
        </div>
      </button>
    </li>
  );
}

/** /dashboard/bookings — Upcoming / Past tabs, search and status filter, and the detail drawer (`?booking=REF`). */
export function BookingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { bookings, refresh } = useBookings();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const openRef = params.get("booking");
  const selected = bookings?.find((b) => b.reservation.pnr === openRef) ?? null;
  // Opening a booking from the URL lands on its tab.
  const tab: Tab = (params.get("tab") as Tab) ?? (selected && !isUpcoming(selected) ? "past" : "upcoming");

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  };

  const groups = useMemo(() => {
    const all = bookings ?? [];
    return {
      upcoming: all.filter(isUpcoming).sort((a, b) => firstDeparture(a).localeCompare(firstDeparture(b))),
      past: all.filter((b) => !isUpcoming(b)).sort((a, b) => firstDeparture(b).localeCompare(firstDeparture(a))),
    };
  }, [bookings]);

  const term = q.trim().toLowerCase();
  const list = groups[tab].filter((b) => {
    if (status !== "all" && b.status !== status) return false;
    if (!term) return true;
    const j = b.offer.journeys[0];
    return [b.reservation.pnr, b.reservation.orderNo, j.from.city, j.to.city, j.from.code, j.to.code, b.offer.airline.name].some((v) => v.toLowerCase().includes(term));
  });

  const switchTab = (t: Tab) => {
    setStatus("all");
    setParams({ tab: t, booking: null });
  };

  return (
    <div className="space-y-5">
      <div className={cn(cardCls, "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between")}>
        <div role="tablist" aria-label="Bookings" className="flex rounded-xl bg-[#f1f4f8] p-1">
          {(
            [
              ["upcoming", "Upcoming", CalendarClock],
              ["past", "Past", History],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => switchTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none",
                tab === id ? "bg-white text-[#013557] shadow-[0_1px_3px_rgba(1,53,87,0.14)]" : "text-ink-500 hover:text-ink-900",
              )}
            >
              <Icon className="size-4" />
              {label}
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold", tab === id ? "bg-[rgba(2,144,222,0.1)] text-blue" : "bg-white text-ink-500")}>
                {bookings ? groups[id].length : "–"}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative block">
            <span className="sr-only">Search bookings</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ref, city or airline"
              className="h-[42px] w-full rounded-[10px] border border-[#e4e8ee] bg-white pl-9 pr-3 text-sm focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 sm:w-[240px]"
            />
          </label>
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={[{ value: "all", label: "All statuses" }, ...statusOptions[tab].map((s) => ({ value: s, label: statusLabel[s] }))]}
            className="sm:w-[180px]"
            triggerClassName="h-[42px]"
          />
        </div>
      </div>

      <div role="tabpanel" key={tab}>
        {!bookings ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="skeleton h-[104px] rounded-2xl" />
            ))}
          </ul>
        ) : list.length === 0 ? (
          <div className={cardCls}>
            {groups[tab].length === 0 ? (
              <EmptyState
                icon={tab === "upcoming" ? CalendarClock : History}
                title={tab === "upcoming" ? "No upcoming trips" : "No past trips yet"}
                message={tab === "upcoming" ? "Book a flight and it will appear here." : "Trips you've taken will show up here."}
                action={
                  <Link href="/dashboard/flights" className={primaryBtn}>
                    Search flights
                  </Link>
                }
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No bookings match"
                message="Try another reference, city or status."
                action={
                  <button
                    type="button"
                    onClick={() => {
                      setQ("");
                      setStatus("all");
                    }}
                    className={primaryBtn}
                  >
                    Clear filters
                  </button>
                }
              />
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {list.map((b, i) => (
              <BookingRow
                key={b.reservation.pnr}
                b={b}
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                onOpen={() => setParams({ booking: b.reservation.pnr, tab })}
              />
            ))}
          </ul>
        )}
      </div>

      <BookingDrawer booking={selected} onClose={() => setParams({ booking: null })} onChanged={refresh} />
    </div>
  );
}
