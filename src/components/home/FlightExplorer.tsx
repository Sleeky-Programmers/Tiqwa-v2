"use client";

import Link from "next/link";
import { useState } from "react";
import { airlineGroups, bookingGuide, routeRegions } from "@/data/explore";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "routes", label: "Cheap flights from Nigeria" },
  { id: "airlines", label: "Airlines" },
] as const;

export function FlightExplorer() {
  const [guideOpen, setGuideOpen] = useState(false);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("routes");
  const [region, setRegion] = useState(routeRegions[0].id);
  const current = routeRegions.find((r) => r.id === region) ?? routeRegions[0];

  return (
    <section aria-labelledby="explore-title" className="bg-[#f7faff] py-12">
      <div className="mx-auto max-w-[1312px] px-4">
        <div data-reveal className="rounded-[18px] border-[0.83px] border-[#e2eaf3] bg-white px-5 py-[37px] sm:px-[41px]">
          <p className="text-xs font-bold uppercase leading-3 tracking-[0.1em] text-[#087dcc]">Flight booking from Nigeria</p>
          <h2 id="explore-title" className="mt-2 font-display text-[28px] font-bold leading-[1.2] text-[#12233d] md:text-[34px]">
            Find the right flight for your next journey
          </h2>
          <p className="mt-[11px] text-[15px] leading-[1.55] text-[#526277]">
            Explore popular routes and airlines, then search live fares when you are ready to book.
          </p>

          <button
            type="button"
            aria-expanded={guideOpen}
            aria-controls="booking-guide"
            onClick={() => setGuideOpen((v) => !v)}
            className={cn(
              "mt-[23px] border-b-[0.83px] border-[#0057b8] text-sm font-semibold text-[#0057b8]",
              guideOpen && "hidden",
            )}
          >
            About booking flights with TBILS
          </button>

          {guideOpen && (
            <div id="booking-guide" className="mt-6 max-w-[900px] space-y-4 text-[15px] leading-[1.7] text-[#334155]">
              {bookingGuide.map((b, i) => (
                <div key={i} className="space-y-3">
                  {b.h && <h3 className="pt-2 text-lg font-bold text-[#12233d]">{b.h}</h3>}
                  {b.p?.map((t) => <p key={t}>{t}</p>)}
                  {b.list && (
                    <ul className="list-disc space-y-1 pl-6">
                      {b.list.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {b.after?.map((t) => <p key={t}>{t}</p>)}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="border-b-[0.83px] border-[#0057b8] text-sm font-semibold text-[#0057b8]"
              >
                Hide booking guide
              </button>
            </div>
          )}

          <div className="mt-[26px] overflow-hidden rounded-2xl border-[0.83px] border-[#dce8f3] bg-white">
            <div role="tablist" aria-label="Explore" className="no-scrollbar flex gap-1 overflow-x-auto border-b-[0.83px] border-[#e6edf5] bg-[#f3f8fd] p-[6px]">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "whitespace-nowrap rounded-[9px] px-[15px] py-[10px] text-[13px] font-bold leading-[15.6px] transition",
                    tab === t.id ? "bg-white text-[#12233d] shadow-[0_2px_8px_rgba(18,35,61,0.1)]" : "text-[#526277] hover:text-[#12233d]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="px-6 pb-6 pt-6" role="tabpanel">
              {tab === "routes" ? (
                <>
                  <h2 className="max-w-[600px] text-[21px] font-bold leading-[1.2] tracking-[-0.02em] text-[#12233d]">Explore flights from Nigeria</h2>
                  <p className="mt-[5px] text-sm font-medium leading-[21px] text-[#526277]">
                    Choose a region, then explore a destination and its available flight options.
                  </p>
                  <h3 className="mt-[22px] text-[15px] font-bold leading-[1.25] text-[#12233d]">Browse by destination</h3>
                  <div className="mt-[11px] flex flex-wrap gap-[7px]">
                    {routeRegions.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        aria-pressed={r.id === region}
                        onClick={() => setRegion(r.id)}
                        className={cn(
                          "rounded-full border-[0.83px] px-[10px] py-[7px] text-[11px] font-bold leading-[13.2px] transition",
                          r.id === region ? "border-[#087dcc] bg-[#087dcc] text-white" : "border-[#dce7f1] bg-white text-[#526277] hover:border-[#087dcc]",
                        )}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <ul className="mt-3 grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-4">
                    {current.routes.map((rt) => (
                      <li key={rt.label}>
                        <Link
                          href={rt.href}
                          className="hover-lift block rounded-[10px] border-[0.83px] border-[#e3ebf3] bg-white px-4 py-[14px] hover:border-[#087dcc]"
                        >
                          <span className="block text-[15px] font-bold leading-[1.25] tracking-[-0.01em] text-[#1a1a1a]">{rt.label}</span>
                          <span className="mt-3 block text-[13px] font-semibold leading-[1.3] text-[#087dcc]">Flights</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="max-w-[600px] text-[21px] font-bold leading-[1.2] tracking-[-0.02em] text-[#12233d]">Airlines you can compare</h2>
                  <p className="mt-[5px] text-sm font-medium leading-[21px] text-[#526277]">
                    Explore airline information before selecting the fare and schedule that suit your trip.
                  </p>
                  <div className="mt-5 grid gap-8 lg:grid-cols-[446px_1fr] lg:gap-[69px]">
                    {airlineGroups.map((g) => (
                      <div key={g.title}>
                        <h3 className="text-[15px] font-bold leading-[1.3] text-[#12233d]">{g.title}</h3>
                        <ul className="mt-[14px] flex flex-wrap gap-[10px]">
                          {g.names.map((n) => (
                            <li key={n}>
                              <Link
                                href="/flights"
                                className="block rounded-lg border-[0.83px] border-[#dce7f1] bg-white px-3 py-[9px] text-sm font-semibold leading-[16.8px] text-[#264361] transition hover:border-[#087dcc]"
                              >
                                {n}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
