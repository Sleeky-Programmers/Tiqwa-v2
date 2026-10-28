"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CircleCheck, Clock, Printer } from "lucide-react";
import { airlineLogo } from "@/components/flights/FlightCard";
import { ItineraryBand } from "@/components/flights/ItineraryBand";
import { InlineLoader } from "@/components/ui/Feedback";
import { formatDmy } from "@/components/home/search/DatePicker";
import { bankTransfer } from "@/data/booking";
import { contact } from "@/data/contact";
import { getCountry } from "@/data/countries";
import { bookingTotals } from "@/lib/booking/pricing";
import { bookingRoutes, type BookingVariant } from "@/lib/booking/routes";
import { loadBooking, type BookingDraft } from "@/lib/booking/store";
import { cabinLabel, fmtDuration, fmtLongDate, fmtTime, naira } from "@/lib/flights/format";
import { cn } from "@/lib/utils";

const card = "overflow-hidden rounded-[16px] border border-[#dce8f3] bg-white shadow-[0_14px_36px_rgba(18,35,61,0.06)]";
const label = "text-[11px] font-bold uppercase tracking-[0.06em] text-[#8a94a6]";

function Block({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn(card, "animate-[fade-up_0.4s_ease_both]", className)}>
      <h2 className="border-b border-[#eef1f5] px-5 py-4 text-lg font-bold text-ink-900">{title}</h2>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Booking confirmation (tbils.com /booking-success), driven by the booking kept in sessionStorage. */
export function BookingSuccess({ variant = "site" }: { variant?: BookingVariant }) {
  const dash = variant === "dashboard";
  const routes = bookingRoutes(variant);
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read sessionStorage on the client
    setDraft(loadBooking());
  }, []);

  if (draft === undefined) return <InlineLoader message="Loading your booking..." className={dash ? "py-24" : "min-h-screen"} />;
  if (!draft?.payment || !draft.reservation) {
    return (
      <div className={cn("bg-[#f4f6f9]", !dash && "min-h-screen")}>
        <ItineraryBand embedded={dash} search={null} actionLabel="" onAction={() => {}} />
        <div className="mx-auto max-w-[560px] px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-extrabold text-ink-900">No booking to show</h1>
          <p className="mt-2 text-sm text-ink-500">Complete a booking to see its confirmation here.</p>
          <Link href={routes.search} className="mt-6 inline-block rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-7 py-3 text-sm font-bold text-white">
            Search flights
          </Link>
        </div>
      </div>
    );
  }

  const { payment, reservation, offer, travellers = [] } = draft;
  const t = bookingTotals(draft);
  const status = payment.status;
  const heading =
    status === "confirmed" ? "Your booking is confirmed!" : status === "processing" ? "We're confirming your transfer" : "Your seat is on hold";
  const sub =
    status === "confirmed"
      ? `Your e-ticket has been sent to ${travellers[0]?.email}. Have a great trip!`
      : status === "processing"
        ? "Thanks! We'll confirm your transfer and email your ticket once it arrives."
        : `Pay before ${new Date(reservation.expiresAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} to keep your seat.`;

  const ids = [
    ["Order no.", reservation.orderNo],
    ["Airline PNR", reservation.airlinePnr],
    ["Booking ref", reservation.pnr],
    ["Booking date", draft.bookedAt ? new Date(draft.bookedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"],
    ["Payment status", status === "confirmed" ? "Paid" : status === "processing" ? "Processing" : "Pending"],
    ["Method", payment.method === "paystack" ? "Paystack" : payment.method === "bank" ? "Bank transfer" : "Hold, pay later"],
  ];

  return (
    <div className={cn("bg-[#f4f6f9] print:bg-white", dash ? "" : "min-h-screen pb-14")}>
      <div className="print:hidden">
        <ItineraryBand embedded={dash} search={draft.search} actionLabel="New search" onAction={() => router.push(routes.search)} />
      </div>

      <div className={cn("mx-auto max-w-[960px] space-y-5 pt-8", !dash && "px-4")}>
        <section className={cn(card, "px-6 py-8 text-center animate-[rise-in_0.45s_cubic-bezier(0.16,1,0.3,1)]")}>
          <span
            className={cn(
              "mx-auto mb-4 grid size-16 place-items-center rounded-full",
              status === "confirmed" ? "bg-[#dcfce7] text-[#16a34a]" : "bg-[#fff7ed] text-[#ea580c]",
            )}
          >
            {status === "confirmed" ? <CircleCheck className="size-9" /> : <Clock className="size-9" />}
          </span>
          <h1 className="font-display text-[28px] font-extrabold leading-tight text-ink-900">{heading}</h1>
          <p className="mx-auto mt-2 max-w-[520px] text-[15px] text-ink-500">{sub}</p>
          <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#e8edf3] bg-[#e8edf3] text-left sm:grid-cols-3">
            {ids.map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-3">
                <p className={label}>{k}</p>
                <p className="mt-1 font-bold tracking-[0.02em] text-ink-900">{v}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
            <Link
              href={`/dashboard/bookings?booking=${reservation.pnr}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              View in My bookings
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-blue px-6 py-3 text-sm font-bold text-blue transition hover:bg-sky-50"
            >
              <Printer className="size-4" /> Print Booking
            </button>
          </div>
        </section>

        <Block title="Payment details">
          {payment.method === "paystack" && (
            <dl className="grid gap-3 sm:grid-cols-2">
              {[
                ["Payment Method:", "Paystack"],
                ["Transaction Reference:", payment.transactionRef ?? "—"],
                ["Amount Paid:", naira(payment.amount)],
                ["Payment Date:", payment.paidAt ? new Date(payment.paidAt).toLocaleString("en-NG") : "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-ink-500">{k}</dt>
                  <dd className="font-semibold text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {payment.method !== "paystack" && (
            <>
              <p className="mb-4 text-sm text-ink-500">
                {payment.method === "bank" ? "We're matching your transfer to these details:" : "When you're ready, transfer to:"}
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Bank", bankTransfer.bankName],
                  ["Account Name", bankTransfer.accountName],
                  ["Account Number", bankTransfer.accountNumber],
                  ["Expected Amount", naira(t.total)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-sm text-ink-500">{k}</dt>
                    <dd className="font-semibold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </Block>

        <Block title="Personal Information">
          <div className="space-y-4">
            {travellers.map((p, i) => (
              <dl key={i} className="grid gap-3 rounded-xl border border-[#eef1f5] p-4 sm:grid-cols-3">
                {[
                  ["Passenger Name", `${p.title} ${p.firstName} ${p.middleName ? p.middleName + " " : ""}${p.surname}`],
                  ["Nationality", getCountry(p.passportCountry || p.country)?.name ?? "—"],
                  ["Gender", p.gender],
                  ["Date of birth", p.dob ? formatDmy(p.dob) : "—"],
                  ...(p.phone ? [["Phone Number", `${getCountry(p.country)?.dial ?? ""} ${p.phone}`]] : []),
                  ...(p.email ? [["Email Address", p.email]] : []),
                  ...(p.passportNumber ? [["Passport Number", p.passportNumber.toUpperCase()]] : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-ink-500">{k}</dt>
                    <dd className="font-semibold text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        </Block>

        <Block title="Flight Details">
          <div className="space-y-3">
            {offer.journeys.flatMap((j) => j.segments).map((s) => (
              <div key={s.id} className="flex flex-col gap-4 rounded-xl border border-[#eef1f5] p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 sm:w-[180px]">
                  <Image src={airlineLogo(s.airline.code)} alt="" width={32} height={32} className="size-8 rounded object-contain" />
                  <div>
                    <p className="text-sm font-bold text-ink-900">{s.airline.name}</p>
                    <p className="text-xs text-ink-500">{s.flightNumber}</p>
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-ink-900">{fmtTime(s.depart)}</p>
                    <p className="text-xs text-ink-500">
                      {s.from.city} ({s.from.code}) · {fmtLongDate(s.depart)}
                    </p>
                  </div>
                  <span className="text-xs text-ink-500">{fmtDuration(s.durationMin)}</span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-ink-900">{fmtTime(s.arrive)}</p>
                    <p className="text-xs text-ink-500">
                      {s.to.city} ({s.to.code}) · {fmtLongDate(s.arrive)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:w-[200px]">
                  <div>
                    <p className={label}>Check in</p>
                    <p className="text-xs font-semibold text-ink-900">{offer.fareRules.checkedBaggage}</p>
                  </div>
                  <div>
                    <p className={label}>Cabin</p>
                    <p className="text-xs font-semibold text-ink-900">{cabinLabel[offer.cabin]}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        <Block title="Fare Summary">
          <dl className="space-y-2.5 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-500">Flight fare</dt>
              <dd className="font-semibold text-ink-900">{naira(t.fare)}</dd>
            </div>
            {t.addonLines.length === 0 ? (
              <div className="flex justify-between">
                <dt className="text-ink-500">Add-ons</dt>
                <dd className="text-ink-500">No add-ons selected</dd>
              </div>
            ) : (
              t.addonLines.map((l) => (
                <div key={l.id} className="flex justify-between">
                  <dt className="text-ink-500">
                    {l.name}
                    {l.qty > 1 ? ` x ${l.qty}` : ""}
                  </dt>
                  <dd className="font-semibold text-ink-900">{naira(l.amount)}</dd>
                </div>
              ))
            )}
            {t.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-500">Promo discount</dt>
                <dd className="font-semibold text-[#15803d]">− {naira(t.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-500">Paystack Transaction Fee</dt>
              <dd className="font-semibold text-ink-900">{naira(payment.fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-[#eef1f5] pt-3 text-lg">
              <dt className="font-bold text-ink-900">Total Amount</dt>
              <dd className="font-extrabold text-blue">{naira(t.total + payment.fee)}</dd>
            </div>
          </dl>
        </Block>

        <p className="text-center text-sm text-ink-500">
          Need help? Hotline: <a className="font-semibold text-ink-900" href={contact.phone.href}>{contact.phone.display}</a> · WhatsApp:{" "}
          <a className="font-semibold text-ink-900" href={contact.whatsapp.href}>{contact.whatsapp.display}</a> · Email:{" "}
          <a className="font-semibold text-ink-900" href={contact.email.href}>{contact.email.display}</a>
        </p>
      </div>
    </div>
  );
}
