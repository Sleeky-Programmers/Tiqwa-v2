"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Six single-digit boxes: typing advances, Backspace goes back, pasting a code fills them all. */
export function OtpInput({ value, onChange, invalid, length = 6 }: { value: string; onChange: (v: string) => void; invalid?: boolean; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={`${length}-digit code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          maxLength={1}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (!v) return setAt(i, "");
            setAt(i, v[v.length - 1]);
            focus(i + 1);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !d) focus(i - 1);
            if (e.key === "ArrowLeft") focus(i - 1);
            if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e) => {
            const code = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!code) return;
            e.preventDefault();
            onChange(code);
            focus(code.length);
          }}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border bg-white text-center font-display text-2xl font-extrabold text-ink-900 transition duration-200 focus:-translate-y-0.5 focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 motion-reduce:focus:translate-y-0",
            invalid ? "border-error" : d ? "border-blue" : "border-[#e4e8ee]",
          )}
        />
      ))}
    </div>
  );
}
