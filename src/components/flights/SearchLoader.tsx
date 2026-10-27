"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const FALLBACK = "/images/destinations/search-loading-hero.jpg";

/** Destination photo for the loader card, keyed by lower-case city (tbils.com uses the same idea). */
const cityImages: Record<string, string> = {
  london: "/images/destinations/london.jpg",
  manchester: "/images/destinations/manchester.webp",
  "new york": "/images/destinations/new-york.webp",
  washington: "/images/destinations/new-york.webp",
  paris: "/images/destinations/paris.webp",
  dubai: "/images/destinations/dubai-doha.webp",
  doha: "/images/destinations/dubai-doha.webp",
  "abu dhabi": "/images/destinations/dubai-doha.webp",
  toronto: "/images/destinations/toronto.jpg",
  montreal: "/images/destinations/toronto.jpg",
  calgary: "/images/destinations/toronto.jpg",
  accra: "/images/destinations/accra.webp",
  nairobi: "/images/destinations/nairobi.webp",
  johannesburg: "/images/destinations/johannesburg.webp",
  "cape town": "/images/destinations/cape-town.webp",
  lagos: "/images/destinations/lagos.webp",
  atlanta: "/images/destinations/atlanta.webp",
  houston: "/images/destinations/houston.webp",
  istanbul: "/images/destinations/istanbul.webp",
};

export const destinationImage = (city?: string) => (city && cityImages[city.toLowerCase()]) || FALLBACK;

const PlaneIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5L21 16Z"
      fill="currentColor"
    />
  </svg>
);

const trust = [
  { title: "Trusted", sub: "by thousands", icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
  {
    title: "Great fares",
    sub: "every day",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
  {
    title: "Top airlines",
    sub: "worldwide",
    icon: (
      <>
        <path d="M17.8 19.2 16 11l3.5-3.5L21 9l-1.8 1.8" />
        <path d="m2 22 8-8" />
        <path d="M4.5 9.5 9 6l3 3-2.5 2.5" />
        <path d="M13 3 3 8l6 6 5-10-1-1z" />
      </>
    ),
  },
  {
    title: "24/7",
    sub: "support",
    icon: (
      <>
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </>
    ),
  },
];

/**
 * Full-screen "Your next trip is loading…" overlay shown while flights are fetched
 * (ported from tbils.com: video backdrop, top progress bar, destination card, trust strip).
 */
export function SearchLoader({ route, destinationCity }: { route?: string; destinationCity?: string }) {
  const [mounted, setMounted] = useState(false);
  const [src, setSrc] = useState(destinationImage(destinationCity));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs document.body
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const ui = (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[2500] flex h-dvh w-screen flex-col items-center justify-center overflow-y-auto bg-[radial-gradient(120%_90%_at_50%_0,rgba(2,144,222,0.18)_0,rgba(1,25,44,0)_60%),linear-gradient(160deg,#0a1628,#071120_60%,#050c17)] px-4 py-6 font-sans animate-[fade-in_0.25s_ease]"
    >
      <video
        className="pointer-events-none absolute inset-0 z-0 size-full object-cover motion-reduce:hidden"
        src="/videos/search-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_90%_at_50%_0,rgba(2,144,222,0.16)_0,rgba(1,25,44,0)_60%),linear-gradient(160deg,rgba(10,22,40,0.72),rgba(7,17,32,0.78)_60%,rgba(5,12,23,0.82))]" />

      <div className="fixed inset-x-0 top-0 z-[2] h-[3px] overflow-hidden bg-[rgba(2,144,222,0.15)]">
        <span className="absolute h-full w-[35%] animate-[indeterminate_1.15s_ease-in-out_infinite] rounded-sm bg-[linear-gradient(90deg,#0290de,#014e78)]" />
      </div>

      <div className="relative z-[1] flex items-center gap-[9px] pb-[26px] pt-6">
        <span className="size-[9px] animate-[pulse-dot_1.1s_ease-in-out_infinite] rounded-full bg-blue" />
        <span className="text-[15px] font-bold text-white/90">Searching available flights{route ? ` · ${route}` : ""}</span>
      </div>

      <div className="relative z-[1] w-full max-w-[760px] overflow-hidden rounded-[20px] border border-[#eaeef3] bg-white shadow-[0_24px_60px_rgba(1,40,74,0.12)] animate-[rise-in_0.45s_cubic-bezier(0.16,1,0.3,1)]">
        <div className="absolute left-[18px] top-[18px] z-[2] rounded-lg bg-[rgba(4,12,24,0.62)] px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-white">
          TBILS
        </div>
        <div className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden px-6 pb-12 pt-14 text-center text-white max-sm:min-h-[300px] max-sm:px-[18px] max-sm:pb-8 max-sm:pt-10">
          <Image
            src={src}
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 100vw, 760px"
            className="-z-[2] object-cover object-center"
            onError={() => setSrc(FALLBACK)}
          />
          <div className="absolute inset-0 -z-[1] bg-[radial-gradient(120%_130%_at_80%_-10%,rgba(2,144,222,0.35)_0,rgba(1,40,74,0)_55%),linear-gradient(180deg,rgba(1,30,52,0.55),rgba(1,25,44,0.78))]" />
          <div className="relative z-[2]">
            <span className="mb-4 inline-grid size-[46px] place-items-center rounded-xl border border-[rgba(108,196,255,0.45)] bg-[rgba(2,144,222,0.28)] text-[#eaf6ff] backdrop-blur-[2px]">
              <PlaneIcon />
            </span>
            <h2 className="mb-2 font-display text-2xl font-extrabold [text-shadow:0_2px_14px_rgba(0,18,36,0.45)]">Your next trip is loading…</h2>
            <p className="mb-7 text-sm text-white/[0.88] [text-shadow:0_1px_8px_rgba(0,18,36,0.4)]">Great fares · Trusted airlines · Pay in installments</p>
            <div aria-hidden className="relative mx-auto size-[72px]">
              <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-white/[0.16] border-t-blue [animation-duration:0.9s]" />
              <span className="absolute inset-0 grid animate-[bob_1.4s_ease-in-out_infinite] place-items-center text-[#f4a24b]">
                <PlaneIcon className="rotate-45" />
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-[26px] border-b border-[#eef1f5] px-5 py-[18px] max-sm:gap-4">
          {trust.map((t) => (
            <div key={t.title} className="flex items-center gap-[9px]">
              <span className="grid size-[34px] place-items-center rounded-[9px] bg-[rgba(2,144,222,0.1)] text-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {t.icon}
                </svg>
              </span>
              <div>
                <div className="text-[13px] font-bold leading-[1.2] text-[#1d2b3a]">{t.title}</div>
                <div className="text-[11.5px] leading-[1.2] text-[#8792a2] max-sm:hidden">{t.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6">
          <h3 className="mb-2 font-display text-[22px] font-extrabold text-ink-900">Comparing live fares</h3>
          <p className="text-[14.5px] leading-[1.55] text-[#566578]">
            We&apos;re checking live prices, flexible payment options and travel extras for your route. This usually takes a few seconds.
          </p>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(ui, document.body) : ui;
}
