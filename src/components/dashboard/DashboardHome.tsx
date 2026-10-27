"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarCheck, Plane, Route, Search, Wallet } from "lucide-react";
import { airlineLogo, RouteRow } from "@/components/flights/FlightCard";
import { destinationImage } from "@/components/flights/SearchLoader";
import { deals } from "@/data/deals";
import { useProfile } from "@/lib/account";
import { firstDeparture, statusLabel, type HistoryBooking } from "@/lib/booking/history";
import { bookingTotals } from "@/lib/booking/pricing";
import { fmtLongDate, naira, paxLabel, tripLabel } from "@/lib/flights/format";
import { metricsSkeleton } from "./skeletons";
import { dashboardMetrics } from "./metrics";
import { SpendChart } from "./SpendChart";
import { cardCls, EmptyState, outlineBtn, primaryBtn, SectionCard, StatCard, StatusBadge } from "./ui";
import { useBookings } from "./useBookings";

const greeting = (h: number) => (h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock on the client
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  if (now === null) return null;
  const [d, t] = to.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  const ms = Math.max(0, new Date(y, m - 1, day, hh, mm).getTime() - now);
  const parts = [
    [Math.floor(ms / 86_400_000), "days"],
    [Math.floor((ms / 3_600_000) % 24), "hrs"],
    [Math.floor((ms / 60_000) % 60), "mins"],
  ] as const;
  return (
    <div className="flex gap-2" aria-label="Time until departure">
      {parts.map(([n, l]) => (
        <div key={l} className="min-w-[58px] rounded-xl bg-white/10 px-3 py-2 text-center">
          <p className="font-display text-2xl font-extrabold leading-none">{n}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-white/70">{l}</p>
        </div>
      ))}
    </div>
  );
}

function NextTrip({ booking }: { booking: HistoryBooking }) {
  const out = booking.offer.journeys[0];
  return (
    <section className="overflow-hidden rounded-2xl border border-[#eef1f5] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)] animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
      <div className="relative flex min-h-[170px] flex-col justify-between gap-4 overflow-hidden p-5 text-white sm:flex-row sm:items-end">
        <Image src={destinationImage(out.to.city)} alt="" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,14,28,0.35),rgba(3,12,24,0.85))]" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8fd0ff]">Your next trip</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">
            {out.from.city} → {out.to.city}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {fmtLongDate(out.depart)} · {tripLabel[booking.search.trip]} · {paxLabel(booking.search.pax)}
          </p>
        </div>
        <div className="relative">
          <Countdown to={firstDeparture(booking)} />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 px-5 pt-4 sm:w-[210px] sm:pt-0">
          <Image src={airlineLogo(booking.offer.airline.code)} alt="" width={36} height={36} className="size-9 rounded object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-900">{booking.offer.airline.name}</p>
            <p className="text-xs text-ink-500">Ref {booking.reservation.pnr}</p>
          </div>
        </div>
        <RouteRow journey={out} className="flex-1 px-5 sm:px-4" />
        <div className="flex items-center justify-between gap-3 border-t border-[#eef1f5] px-5 py-3 sm:border-l sm:border-t-0 sm:py-5">
          <StatusBadge status={booking.status} />
          <Link href={`/dashboard/bookings?booking=${booking.reservation.pnr}`} className={primaryBtn}>
            View booking
          </Link>
        </div>
      </div>
    </section>
  );
}

/** /dashboard overview: greeting + search CTA, stats, next trip, spend chart, destinations, actions, deals. */
export function DashboardHome() {
  const user = useProfile();
  const { bookings } = useBookings();
  const [hour, setHour] = useState<number | null>(null);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- local time only exists on the client
  useEffect(() => setHour(new Date().getHours()), []);
  const m = bookings ? dashboardMetrics(bookings) : null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(140deg,#0a1628,#013557_45%,#0290de)] px-6 py-7 text-white sm:px-8 animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div aria-hidden className="absolute -right-16 -top-20 size-72 rounded-full bg-[radial-gradient(circle,rgba(2,144,222,0.45),transparent_65%)]" />
        <Plane aria-hidden className="absolute bottom-6 right-8 hidden size-24 -rotate-12 text-white/10 md:block" />
        <div className="relative max-w-[620px]">
          <p className="text-sm font-semibold text-[#8fd0ff]">{hour === null ? "Welcome back" : greeting(hour)},</p>
          <h2 className="mt-1 font-display text-[28px] font-extrabold leading-tight sm:text-[32px]">{user.firstName}, where to next?</h2>
          <p className="mt-2 text-sm text-white/80">
            Compare fares from hundreds of airlines and spread the cost with Pay Small Small on eligible bookings.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/flights" className="inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-bold text-white shadow-[0_6px_16px_rgba(245,134,52,0.35)] transition hover:bg-orange-600">
              <Search className="size-4" /> Search flights
            </Link>
            <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
              My bookings <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {m ? (
          <>
            <StatCard icon={CalendarCheck} label="Upcoming trips" value={String(m.upcoming.length)} hint={m.next ? `Next: ${fmtLongDate(firstDeparture(m.next))}` : "Nothing booked yet"} />
            <StatCard icon={Plane} tone="navy" label="Trips taken" value={String(m.tripsTaken)} hint={`${m.countries} countries visited`} style={{ animationDelay: "60ms" }} />
            <StatCard icon={Wallet} tone="orange" label={`Spent in ${new Date().getFullYear()}`} value={naira(m.spentThisYear)} hint="Paid bookings only" style={{ animationDelay: "120ms" }} />
            <StatCard icon={Route} tone="green" label="Distance flown" value={`${m.km.toLocaleString("en-NG")} km`} hint={`≈ ${(m.km / 40075).toFixed(1)}× around the world`} style={{ animationDelay: "180ms" }} />
          </>
        ) : (
          metricsSkeleton
        )}
      </div>

      {m?.next ? (
        <NextTrip booking={m.next} />
      ) : m ? (
        <section className={cardCls}>
          <EmptyState
            icon={Plane}
            title="No upcoming trips"
            message="When you book a flight it will show up here with a countdown to departure."
            action={
              <Link href="/dashboard/flights" className={primaryBtn}>
                Find a flight
              </Link>
            }
          />
        </section>
      ) : (
        <div className="skeleton h-[250px] rounded-2xl" />
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Spend per month" description="Paid bookings, last 12 months">
          {m ? <SpendChart data={m.months} /> : <div className="skeleton h-[220px] rounded-xl" />}
        </SectionCard>

        <SectionCard title="Needs your attention" bodyClassName="p-3">
          {!m ? (
            <div className="skeleton m-2 h-32 rounded-xl" />
          ) : m.needsAction.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-ink-500">You&apos;re all set. Nothing needs action.</p>
          ) : (
            <ul className="space-y-2">
              {m.needsAction.map((b) => (
                <li key={b.reservation.pnr}>
                  <Link
                    href={`/dashboard/bookings?booking=${b.reservation.pnr}`}
                    className="flex items-start gap-3 rounded-xl border border-[#fde7d3] bg-[#fffaf5] p-3 transition hover:border-orange"
                  >
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-orange" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink-900">
                        {b.offer.journeys[0].from.city} → {b.offer.journeys[0].to.city}
                      </p>
                      <p className="text-xs text-ink-500">
                        {statusLabel[b.status]} · {naira(bookingTotals(b).total)}
                        {b.status === "hold" && ` · pay before ${new Date(b.reservation.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-ink-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <SectionCard title="Top destinations" description="Where you travel most" bodyClassName="p-3">
          {!m ? (
            <div className="skeleton m-2 h-40 rounded-xl" />
          ) : (
            <ul className="space-y-1">
              {m.topDestinations.map((d, i) => (
                <li key={d.city} className="flex items-center gap-3 rounded-xl p-2 hover:bg-tint-100">
                  <span className="w-4 text-center text-xs font-bold text-ink-400">{i + 1}</span>
                  <Image src={destinationImage(d.city)} alt="" width={48} height={48} className="size-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink-900">{d.city}</p>
                    <p className="truncate text-xs text-ink-500">{d.country}</p>
                  </div>
                  <span className="rounded-full bg-[rgba(2,144,222,0.08)] px-2.5 py-1 text-xs font-semibold text-blue">
                    {d.trips} trip{d.trips > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Deals for you"
          description="Handpicked fares from Nigeria this week"
          action={
            <Link href="/dashboard/flights" className={outlineBtn + " px-4 py-2"}>
              Search all
            </Link>
          }
          bodyClassName="p-4"
        >
          <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
            {(m ? deals.slice(0, 6) : []).map((d) => (
              <Link
                key={d.id}
                href={`/dashboard/flights/results?trip=${d.trip === "One way" ? "oneway" : "round"}&from=${d.fromCode}&to=${d.toCode}&depart=${defaultDate(14)}${d.trip === "One way" ? "" : `&return=${defaultDate(21)}`}&adults=1&children=0&infants=0&cabin=economy`}
                className="group relative h-[180px] w-[170px] shrink-0 snap-start overflow-hidden rounded-2xl"
              >
                <Image src={d.image} alt="" fill sizes="170px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(4,14,28,0.2),rgba(3,12,24,0.9))]" />
                <div className="absolute inset-x-3 bottom-3 text-white">
                  <p className="text-[11px] font-semibold text-white/80">{d.from} to</p>
                  <p className="font-display text-lg font-extrabold leading-tight">{d.to}</p>
                  <p className="mt-1 text-sm font-bold">{naira(d.fare)}</p>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function defaultDate(days: number) {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
