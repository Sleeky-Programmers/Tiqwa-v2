"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAirport, type Airport } from "@/data/airports";
import { rememberSearch } from "@/lib/flights/recent";
import { parseSearch } from "@/lib/flights/search-params";
import type { FlightSearch } from "@/lib/flights/types";
import { AirportCombobox, CabinField, DatePicker, TravellersField, type Pax } from "./fields";

type Trip = "round" | "oneway" | "multi";
type Leg = { id: number; from: Airport | null; to: Airport | null; date: string };

const ic = "size-4 shrink-0 fill-none stroke-current";
const tabs: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: "flight",
    label: "Flight",
    icon: (
      <svg viewBox="0 0 24 24" className={ic} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M10.5 21l1.5-1v-5l8 2.5v-2L12 10V4.5a1.5 1.5 0 0 0-3 0V10l-8 5.5v2L9 15v5l1.5 1Z" />
      </svg>
    ),
  },
  {
    id: "hotels",
    label: "Hotels",
    icon: (
      <svg viewBox="0 0 24 24" className={ic} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 21V4h12v17M16 9h4v12M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1M2 21h20" />
      </svg>
    ),
  },
  {
    id: "holiday",
    label: "Holiday",
    icon: (
      <svg viewBox="0 0 24 24" className={ic} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 21h14M7 21V9l5-5 5 5v12M10 21v-5h4v5M12 4V2" />
      </svg>
    ),
  },
  {
    id: "properties",
    label: "Properties",
    icon: (
      <svg viewBox="0 0 24 24" className={ic} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    id: "study",
    label: "Study Abroad",
    icon: (
      <svg viewBox="0 0 24 24" className={ic} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M2 9l10-5 10 5-10 5L2 9ZM6 11v5c3 2 9 2 12 0v-5" />
      </svg>
    ),
  },
];

const tripOptions: { id: Trip; label: string }[] = [
  { id: "round", label: "Round trip" },
  { id: "oneway", label: "One way" },
  { id: "multi", label: "Multi-city" },
];

const other: Record<string, { text: string; cta: string; href: string }> = {
  hotels: { text: "Hotel booking is coming soon. Talk to our team and we'll book it for you.", cta: "Contact us", href: "/contact?type=hotel" },
  holiday: { text: "Looking for a holiday package? Our travel experts will put one together for you.", cta: "Plan my holiday", href: "/contact?type=holiday" },
  properties: { text: "Browse verified homes, list your property, and connect with trustworthy buyers or renters.", cta: "Visit TBiLS Properties", href: "https://www.tbilprop.com/" },
  study: { text: "Expert advisory and application support to help you study abroad with confidence.", cta: "Start my application", href: "/contact?type=study" },
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const searchBtn =
  "flex h-[52px] items-center justify-center rounded-xl bg-blue px-7 text-base font-semibold text-white transition hover:bg-blue-600 active:scale-[0.98]";

const airport = (code?: string) => (code ? (getAirport(code) ?? null) : null);

/**
 * Flight search box. `initial` pre-fills it (used by "Modify" on the results page);
 * `compact` drops the Flight/Hotels/… tabs and the card chrome.
 */
export function SearchConsole({
  initial,
  compact = false,
  resultsPath = "/flights",
}: {
  initial?: FlightSearch;
  compact?: boolean;
  /** Where "Search flights" goes (the dashboard has its own results page). */
  resultsPath?: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("flight");
  const [trip, setTrip] = useState<Trip>(initial?.trip ?? "oneway");
  const [from, setFrom] = useState<Airport | null>(airport(initial?.legs[0]?.from));
  const [to, setTo] = useState<Airport | null>(airport(initial?.legs[0]?.to));
  const [depart, setDepart] = useState(initial?.legs[0]?.date ?? "");
  const [ret, setRet] = useState(initial?.trip === "round" ? (initial.legs[1]?.date ?? "") : "");
  const [pax, setPax] = useState<Pax>(initial?.pax ?? { adults: 1, children: 0, infants: 0 });
  const [cabin, setCabin] = useState<string>(initial?.cabin ?? "economy");
  const [legs, setLegs] = useState<Leg[]>(
    initial?.trip === "multi"
      ? initial.legs.map((l, i) => ({ id: i + 1, from: airport(l.from), to: airport(l.to), date: l.date }))
      : [
          { id: 1, from: null, to: null, date: "" },
          { id: 2, from: null, to: null, date: "" },
        ],
  );
  const [error, setError] = useState("");
  const [minDate, setMinDate] = useState<string>();

  // Default departure to today, set on the client to avoid a server/client date mismatch.
  useEffect(() => {
    const t = today();
    /* eslint-disable react-hooks/set-state-in-effect */
    setMinDate(t);
    setDepart((d) => d || t);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const updateLeg = (id: number, patch: Partial<Leg>) => setLegs((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ trip, adults: String(pax.adults), children: String(pax.children), infants: String(pax.infants), cabin });
    if (trip === "multi") {
      if (legs.some((l) => !l.from || !l.to || !l.date || l.from.code === l.to.code)) {
        setError("Choose different airports and a date for every flight.");
        return;
      }
      legs.forEach((l, i) => params.append(`leg${i + 1}`, `${l.from!.code}-${l.to!.code}-${l.date}`));
    } else {
      if (!from || !to || from.code === to.code) {
        setError("Choose two different airports.");
        return;
      }
      if (!depart) {
        setError("Choose a departure date.");
        return;
      }
      if (trip === "round" && (!ret || ret < depart)) {
        setError("Choose a return date on or after departure.");
        return;
      }
      params.set("from", from.code);
      params.set("to", to.code);
      params.set("depart", depart);
      if (trip === "round") params.set("return", ret);
    }
    setError("");
    const parsed = parseSearch(params);
    if (parsed) rememberSearch(parsed);
    router.push(`${resultsPath}?${params.toString()}`);
  };

  const o = other[tab];

  return (
    <div className={cn("rounded-2xl bg-white", !compact && "border border-[#e5e9f0] shadow-[0_20px_50px_rgba(10,22,40,0.18)]")}>
      {!compact && (
        <div
          role="tablist"
          aria-label="Search type"
          className="no-scrollbar flex items-end overflow-x-auto rounded-t-2xl border-b border-[#e2e8f0] bg-[#f4f6f9] px-3 pt-2"
        >
          {tabs.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={on}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-t-[10px] px-[18px] py-3 text-sm leading-[14px] transition-colors",
                  on ? "bg-white font-bold text-blue" : "font-semibold text-[#64748b] hover:text-blue",
                )}
              >
                {t.label}
                {t.icon}
              </button>
            );
          })}
        </div>
      )}

      {tab !== "flight" ? (
        <div className="flex flex-col items-start justify-between gap-4 px-6 pb-6 pt-5 sm:flex-row sm:items-center">
          <p className="max-w-xl text-[15px] font-semibold text-[#1e293b]">{o.text}</p>
          <a href={o.href} className={searchBtn}>
            {o.cta}
          </a>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="px-4 pb-6 pt-5 sm:px-6">
          <div role="radiogroup" aria-label="Trip type" className="inline-flex rounded-full bg-[#eef1f5] p-1">
            {tripOptions.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={trip === t.id}
                onClick={() => setTrip(t.id)}
                className={cn(
                  "h-[34px] whitespace-nowrap rounded-full px-3 text-[13.5px] font-semibold transition-colors sm:px-[18px]",
                  trip === t.id ? "bg-blue text-white" : "text-[rgba(51,65,85,0.5)] hover:text-[#334155]",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {trip !== "multi" ? (
            <div
              className={cn(
                "mt-[18px] grid grid-cols-1 items-end gap-3 md:grid-cols-2",
                trip === "round" ? "lg:grid-cols-[1fr_40px_1fr_1fr_1fr_1fr]" : "lg:grid-cols-[1fr_40px_1fr_1fr_1fr]",
              )}
            >
              <AirportCombobox name="from" title="From" value={from} onChange={setFrom} />
              <button
                type="button"
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
                aria-label="Swap origin and destination"
                className="mb-[17px] hidden size-10 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-blue transition hover:bg-sky-50 lg:flex"
              >
                <SwapIcon />
              </button>
              <AirportCombobox name="to" title="To" value={to} onChange={setTo} />
              <DatePicker
                name="depart"
                title="Departure"
                value={depart}
                min={minDate}
                onChange={(v) => {
                  setDepart(v);
                  if (ret && ret < v) setRet("");
                }}
              />
              {trip === "round" && <DatePicker name="return" title="Return" value={ret} min={depart || undefined} onChange={setRet} />}
              <TravellersField value={pax} onChange={setPax} />
            </div>
          ) : (
            <div className="mt-[18px] space-y-3">
              {legs.map((l, i) => (
                <div key={l.id} className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_40px]">
                  <AirportCombobox name={`leg${i + 1}from`} title={`Flight ${i + 1} · From`} value={l.from} onChange={(v) => updateLeg(l.id, { from: v })} />
                  <AirportCombobox name={`leg${i + 1}to`} title="To" value={l.to} onChange={(v) => updateLeg(l.id, { to: v })} />
                  <DatePicker name={`leg${i + 1}date`} title="Departure" value={l.date} min={minDate} onChange={(v) => updateLeg(l.id, { date: v })} />
                  {legs.length > 2 ? (
                    <button
                      type="button"
                      aria-label={`Remove flight ${i + 1}`}
                      onClick={() => setLegs((ls) => ls.filter((x) => x.id !== l.id))}
                      className="mb-[5px] flex size-10 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:text-ink-900"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <span className="hidden lg:block" />
                  )}
                </div>
              ))}
              <div className="flex flex-wrap items-end justify-between gap-3">
                {legs.length < 5 && (
                  <button
                    type="button"
                    onClick={() => setLegs((ls) => [...ls, { id: Date.now(), from: ls[ls.length - 1].to, to: null, date: "" }])}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-blue hover:underline"
                  >
                    <Plus className="size-4" /> Add another flight
                  </button>
                )}
                <TravellersField value={pax} onChange={setPax} className="w-full sm:w-[274px]" />
              </div>
            </div>
          )}

          <div className="mt-[18px] flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            <CabinField value={cabin} onChange={setCabin} className="sm:w-[200px]" />
            <button type="submit" className={cn(searchBtn, "sm:w-[162px]")}>
              Search flights
            </button>
          </div>
          <p role="alert" className={cn("mt-3 text-sm font-semibold text-error", !error && "hidden")}>
            {error}
          </p>
        </form>
      )}
    </div>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-4 fill-none stroke-current" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.8 5.8H4.2M10.5 8.5l3.3-2.7-3.3-2.6M6.2 14.2h9.6M9.5 11.5l-3.3 2.7 3.3 2.6" />
    </svg>
  );
}
