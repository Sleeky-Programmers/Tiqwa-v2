"use client";

import Image from "next/image";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { cabinLabel, fmtDuration, fmtLongDate, fmtTime, naira, stopsLabel } from "@/lib/flights/format";
import type { FlightOffer, Journey } from "@/lib/flights/types";
import { cn } from "@/lib/utils";
import { airlineLogo } from "./FlightCard";

function JourneyItinerary({ journey, label, baggage }: { journey: Journey; label: string; baggage: string }) {
  const first = journey.segments[0];
  return (
    <section className="mb-7 last:mb-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2.5">
        <p className="text-base font-semibold text-[#111827]">
          {label}: <span className="font-medium">{journey.from.city} - {journey.to.city}</span>
        </p>
        <div className="flex items-center gap-3">
          <Image src={airlineLogo(first.airline.code)} alt="" width={32} height={32} className="size-8 rounded object-contain" />
          <span className="rounded bg-[#f3f4f6] px-2 py-1 text-xs text-ink-500">
            Flight {journey.segments.map((s) => s.flightNumber).join(" / ")}
          </span>
        </div>
      </div>
      <h4 className="mt-3 border-b-2 border-[#0290de]/80 pb-2 text-base font-semibold text-[#013557]">Flight Segments</h4>
      <div className="mt-3 space-y-3">
        {journey.segments.map((s, i) => (
          <div key={s.id}>
            <div className="rounded-xl border border-[#eef1f5] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 sm:w-[38%]">
                  <p className="text-[13px] font-semibold text-[#1f2937]">{s.from.name}</p>
                  <p className="text-xs text-ink-500">({s.from.code})</p>
                  <p className="mt-2 text-xs text-ink-500">{fmtLongDate(s.depart)}</p>
                  <p className="text-[15px] font-semibold text-[#111827]">{fmtTime(s.depart)}</p>
                </div>
                <div className="flex flex-col items-center gap-1 pt-3 sm:w-[20%]">
                  <span className="h-[2px] w-full bg-[repeating-linear-gradient(90deg,#0290de_0,#0290de_4px,transparent_0,transparent_8px)]" />
                  <span className="text-[11px] text-ink-500">{fmtDuration(s.durationMin)}</span>
                  <span className="text-[10px] text-ink-400">{s.aircraft}</span>
                </div>
                <div className="min-w-0 sm:w-[38%]">
                  <p className="text-[13px] font-semibold text-[#1f2937]">{s.to.name}</p>
                  <p className="text-xs text-ink-500">({s.to.code})</p>
                  <p className="mt-2 text-xs text-ink-500">{fmtLongDate(s.arrive)}</p>
                  <p className="text-[15px] font-semibold text-[#111827]">{fmtTime(s.arrive)}</p>
                </div>
              </div>
              <p className="mt-4 rounded-md bg-[#f3f4f6] px-4 py-2.5 text-[13px] text-ink-500">Baggage Allowance: {baggage}</p>
            </div>
            {s.layoverMin !== undefined && i < journey.segments.length - 1 && (
              <p className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-[#fff7ed] px-4 py-2.5 text-[13px] text-[#9a3412]">
                <span aria-hidden>⏱</span>
                <span className="font-semibold">Layover:</span> {s.to.name} ({s.to.city})
                <span className="font-bold">{fmtDuration(s.layoverMin)}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

const ruleRow = "grid grid-cols-[120px_1fr] gap-3 border-b border-[#eef1f5] px-4 py-3 text-sm last:border-b-0";

/**
 * "View Details" for a flight, as a modal (tbils.com expands this inline under the card).
 * Tabs: Itinerary / Fare Rules, with the fare summary and Book button alongside.
 */
export function FlightDetailsModal({
  offer,
  onClose,
  onBook,
}: {
  offer: FlightOffer | null;
  onClose: () => void;
  onBook: (offer: FlightOffer) => void;
}) {
  const [tab, setTab] = useState<"itinerary" | "fareRules">("itinerary");
  const close = () => {
    setTab("itinerary");
    onClose();
  };
  if (!offer) return null;

  const isReturn = offer.journeys.length === 2 && offer.journeys[1].to.code === offer.journeys[0].from.code;
  const labels = isReturn ? ["Outbound Flight", "Return Flight"] : offer.journeys.map((_, i) => (offer.journeys.length > 1 ? `Flight ${i + 1}` : "Outbound Flight"));
  const { price } = offer;
  const paxRows = [
    { label: "Adult", ...price.adults },
    { label: "Child", ...price.children },
    { label: "Infant", ...price.infants },
  ].filter((r) => r.count > 0);

  return (
    <Modal open onClose={close} labelledBy="flight-details-title" className="max-w-[920px]">
      <header className="flex items-center gap-3 border-b border-[#eef1f5] px-5 py-4 pr-14">
        <Image src={airlineLogo(offer.airline.code)} alt="" width={36} height={36} className="size-9 rounded object-contain" />
        <div className="min-w-0">
          <h2 id="flight-details-title" className="truncate text-base font-bold text-ink-900">
            {offer.journeys[0].from.city} → {offer.journeys[0].to.city}
            {isReturn ? " (Round trip)" : ""}
          </h2>
          <p className="text-[13px] text-ink-500">
            {offer.airline.name} · {stopsLabel(offer.journeys[0].stops)} · {cabinLabel[offer.cabin]}
          </p>
        </div>
      </header>

      <div className="grid md:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          <div role="tablist" aria-label="Flight details" className="flex">
            {(
              [
                ["itinerary", "Itinerary"],
                ["fareRules", "Fare Rules"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 border-b-2 px-6 py-3.5 text-[15px] font-semibold transition-colors",
                  tab === id ? "border-blue text-blue" : "border-[#eef1f5] text-ink-500 hover:text-ink-900",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="max-h-[60vh] overflow-y-auto px-3 py-6 sm:px-5" key={tab}>
            {tab === "itinerary" ? (
              <div className="animate-[acc-reveal_0.3s_ease]">
                {offer.journeys.map((j, i) => (
                  <JourneyItinerary key={i} journey={j} label={labels[i]} baggage={offer.fareRules.checkedBaggage} />
                ))}
              </div>
            ) : (
              <div className="animate-[acc-reveal_0.3s_ease]">
                <h3 className="text-lg font-bold text-ink-900">Fare Rules &amp; Conditions</h3>
                <p className="mt-1 text-sm text-ink-500">Please review the following terms and conditions for your selected flight.</p>
                <div className="mt-5 overflow-hidden rounded-xl border border-[#eef1f5]">
                  {[
                    ["Baggage", offer.fareRules.checkedBaggage],
                    ["Cabin bag", offer.fareRules.cabinBaggage],
                    ["Cabin", cabinLabel[offer.cabin]],
                    ["Refundable", offer.fareRules.refundNote],
                    ["Changes", offer.fareRules.changeNote],
                    ["Seats left", `${offer.seatsLeft} at this price`],
                  ].map(([k, v]) => (
                    <div key={k} className={ruleRow}>
                      <span className="text-xs font-semibold uppercase tracking-[0.05em] text-ink-500">{k}</span>
                      <span className="font-medium text-[#1f2937]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col border-t border-[#eef1f5] md:border-l md:border-t-0">
          <h3 className="border-b border-[#eef1f5] px-4 py-3.5 text-center text-[15px] font-bold text-ink-900">Fare Summary</h3>
          <div className="flex-1 px-4 py-4">
            {paxRows.map((r) => (
              <div key={r.label} className="flex justify-between py-1.5 text-[13px] text-ink-500">
                <span>
                  {r.label} × {r.count}
                </span>
                <span>{naira(r.unit * r.count)}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t border-[#eef1f5] pt-3 text-[13px] font-bold text-ink-900">
              <span>TOTAL</span>
              <span>{naira(price.total)}</span>
            </div>
            <p className="mt-5 text-xs leading-[1.6] text-ink-400">
              *Total fare displayed above has been rounded off and may thus show a slight difference.
            </p>
          </div>
          <div className="px-4 pb-5">
            <button
              type="button"
              onClick={() => onBook(offer)}
              className="w-full rounded-xl bg-orange py-3 text-[15px] font-bold text-white shadow-[0_6px_16px_rgba(245,134,52,0.3)] transition hover:bg-orange-600 active:scale-[0.98]"
            >
              Book
            </button>
          </div>
        </aside>
      </div>
    </Modal>
  );
}
