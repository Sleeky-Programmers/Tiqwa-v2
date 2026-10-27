"use client";

import { useState } from "react";
import { naira } from "@/lib/flights/format";

export type MonthPoint = { key: string; label: string; long: string; value: number };

const W = 640;
const H = 220;
const PAD = { top: 22, right: 8, bottom: 26, left: 52 };
const BAR = 24;

const compact = (n: number) => (n >= 1e6 ? `₦${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `₦${Math.round(n / 1e3)}K` : `₦${n}`);

function niceMax(v: number) {
  if (v <= 0) return 1000;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

/**
 * Single-series column chart (monthly spend). One hue, ≤24px columns with 4px rounded caps,
 * hairline grid, the peak labelled on its cap, hover/focus tooltip and a screen-reader table.
 */
export function SpendChart({ data }: { data: MonthPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const ticks = [0, max / 2, max];
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const band = plotW / data.length;
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Spend per month, last 12 months">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#eef1f5" strokeWidth={1} />
            <text x={PAD.left - 10} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-400 text-[11px]">
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2;
          const h = Math.max(0, (d.value / max) * plotH);
          const top = PAD.top + plotH - h;
          const r = Math.min(4, h);
          const x = cx - BAR / 2;
          const active = hover === i;
          return (
            <g key={d.key}>
              {h > 0 && (
                <path
                  d={`M${x},${PAD.top + plotH} V${top + r} Q${x},${top} ${x + r},${top} H${x + BAR - r} Q${x + BAR},${top} ${x + BAR},${top + r} V${PAD.top + plotH} Z`}
                  className="transition-opacity"
                  fill="#0290de"
                  opacity={hover === null || active ? 1 : 0.45}
                />
              )}
              {i === peak && d.value > 0 && (
                <text x={cx} y={top - 7} textAnchor="middle" className="fill-ink-900 text-[11px] font-bold">
                  {compact(d.value)}
                </text>
              )}
              <text x={cx} y={H - 8} textAnchor="middle" className={active ? "fill-ink-900 text-[11px] font-bold" : "fill-ink-400 text-[11px]"}>
                {d.label}
              </text>
              {/* Hit target: the whole band, not just the bar. */}
              <rect
                x={PAD.left + band * i}
                y={PAD.top}
                width={band}
                height={plotH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${d.long}: ${naira(d.value)}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="cursor-pointer outline-none"
              />
            </g>
          );
        })}
        <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + plotH} y2={PAD.top + plotH} stroke="#cbd9e8" strokeWidth={1} />
      </svg>

      {hover !== null && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 shadow-[0_12px_30px_rgba(15,23,42,0.14)]"
          style={{
            left: `${((PAD.left + band * hover + band / 2) / W) * 100}%`,
            top: `${(Math.max(PAD.top, y(data[hover].value)) / H) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="whitespace-nowrap text-[11px] text-ink-500">{data[hover].long}</p>
          <p className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-ink-900">
            <span className="size-2 rounded-sm bg-blue" />
            {naira(data[hover].value)}
          </p>
        </div>
      )}

      <table className="sr-only">
        <caption>Spend per month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Spend</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.long}</th>
              <td>{naira(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
