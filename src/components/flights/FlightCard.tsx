import Image from "next/image";
import { cabinLabel, dayDiff, fmtDuration, fmtTime, naira, stopsLabel, timeOfDay } from "@/lib/flights/format";
import type { FlightOffer, Journey } from "@/lib/flights/types";
import { cn } from "@/lib/utils";

export const airlineLogo = (code: string) => `/images/airlines/${code}.png`;

const todDot = {
  dawn: "bg-[#f5a623] shadow-[0_0_0_3px_rgba(245,166,35,0.16)]",
  day: "bg-blue shadow-[0_0_0_3px_rgba(2,144,222,0.14)]",
  dusk: "bg-orange shadow-[0_0_0_3px_rgba(245,134,52,0.16)]",
  night: "bg-[#3b4a68] shadow-[0_0_0_3px_rgba(59,74,104,0.18)]",
} as const;

export function RouteRow({ journey, className }: { journey: Journey; className?: string }) {
  const plus = dayDiff(journey.depart, journey.arrive);
  return (
    <div className={cn("flex items-center justify-between gap-3 px-4 py-4 sm:px-[30px]", className)}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold leading-[27px] text-[#1d1d1d]">{fmtTime(journey.depart)}</span>
        <span className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.05em] text-ink-500">{journey.from.code}</span>
      </div>
      <div className="flex w-full max-w-[200px] flex-col items-center gap-[5px]">
        <span className="rounded-full bg-[rgba(2,144,222,0.08)] px-3 py-[3px] text-xs font-semibold leading-[18px] tracking-[0.02em] text-blue">
          {stopsLabel(journey.stops)}
        </span>
        <div className="flex w-full items-center gap-2">
          <span className={cn("size-[9px] shrink-0 rounded-full", todDot[timeOfDay(journey.depart)])} />
          <div className="route-bar" />
          <span className={cn("size-[9px] shrink-0 rounded-full", todDot[timeOfDay(journey.arrive)])} />
        </div>
        <span className="text-base font-medium leading-6 text-[#374151]">{fmtDuration(journey.durationMin)}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold leading-[27px] text-[#1d1d1d]">
          {fmtTime(journey.arrive)}
          {plus > 0 && <sup className="text-[15px]">+{plus}</sup>}
        </span>
        <span className="text-[13px] font-semibold uppercase leading-[19.5px] tracking-[0.05em] text-ink-500">{journey.to.code}</span>
      </div>
    </div>
  );
}

export function FlightCard({
  offer,
  tag,
  onViewDetails,
  style,
}: {
  offer: FlightOffer;
  tag?: "Cheapest" | "Fastest";
  onViewDetails: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <article
      style={style}
      className="hover-lift flex flex-col overflow-hidden rounded-[14px] border border-[#eef1f5] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)] animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_backwards] hover:border-[#bfe0f5] md:flex-row"
    >
      <div className="min-w-0 flex-1">
        <div className="ml-[10px] flex items-center justify-between gap-3 border-b border-[#ccc] py-[5px] pr-[10px]">
          <div className="flex min-w-0 items-center gap-[10px]">
            <Image src={airlineLogo(offer.airline.code)} alt="" width={30} height={30} className="size-[30px] shrink-0 rounded object-contain" />
            <h3 className="truncate text-sm font-bold text-[#1d1d1d]">{offer.airline.name}</h3>
          </div>
          {tag && (
            <span className="shrink-0 rounded-md bg-[#013557] px-3 py-1 text-xs font-semibold uppercase tracking-[0.04em] text-white">{tag}</span>
          )}
        </div>
        {offer.journeys.map((j, i) => (
          <RouteRow key={i} journey={j} className={i > 0 ? "border-t border-dashed border-[#e5e7eb]" : undefined} />
        ))}
      </div>
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-t border-[#eef1f5] bg-white px-4 py-3 md:w-[200px] md:shrink-0 md:flex-col md:items-start md:justify-center md:gap-[10px] md:border-l md:border-t-0 md:px-[18px] md:py-[14px]">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#9099a6]">{cabinLabel[offer.cabin].replace(" class", "")}</span>
          <span className="text-2xl font-bold leading-9 text-ink-900">{naira(offer.price.total)}</span>
        </div>
        <button
          type="button"
          onClick={onViewDetails}
          className="min-w-[140px] flex-1 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:bg-[linear-gradient(90.41deg,#0077f7_0.35%,#004691_106.01%)] md:w-full md:flex-none"
        >
          View Details
        </button>
      </div>
    </article>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="flex h-[145px] overflow-hidden rounded-[14px] border border-[#eef1f5] bg-white">
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="flex items-center justify-between gap-6">
          <div className="skeleton h-10 w-14 rounded" />
          <div className="skeleton h-3 flex-1 rounded" />
          <div className="skeleton h-10 w-14 rounded" />
        </div>
      </div>
      <div className="hidden w-[200px] flex-col justify-center gap-3 border-l border-[#eef1f5] p-4 md:flex">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-7 w-28 rounded" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}
