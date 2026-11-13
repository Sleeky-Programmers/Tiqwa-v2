"use client";

import { useRef, useState } from "react";
import { CircleCheck, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_MB = 5;

/** Lets a customer who paid by bank transfer send their receipt (photo or PDF) to the team. */
export function TransferProof({ reference }: { reference: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const pick = (f: File | null) => {
    setError("");
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      return setError(`That file is too large. The limit is ${MAX_MB} MB.`);
    }
    setFile(f);
  };

  const send = async () => {
    if (!file) return;
    setState("sending");
    setError("");
    const body = new FormData();
    body.append("reference", reference);
    body.append("file", file);
    try {
      const res = await fetch("/api/payments/evidence", { method: "POST", body });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't upload your receipt. Please try again.");
      setState("done");
    } catch (e) {
      setState("idle");
      setError(e instanceof Error ? e.message : "We couldn't upload your receipt. Please try again.");
    }
  };

  if (state === "done") {
    return (
      <p className="mt-5 flex items-center gap-2 rounded-xl bg-[#f0fdf4] px-4 py-3 text-sm font-semibold text-[#15803d] print:hidden">
        <CircleCheck className="size-4" /> Receipt sent. We&apos;ll confirm your payment and email your ticket.
      </p>
    );
  }

  return (
    <div className="mt-5 rounded-xl border border-dashed border-[#cbd5e1] p-4 print:hidden">
      <p className="text-sm font-bold text-ink-900">Already paid? Send your receipt</p>
      <p className="mt-0.5 text-xs text-ink-500">A photo or PDF of your transfer receipt (up to {MAX_MB} MB) helps us confirm your payment faster.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="sr-only"
          aria-label="Transfer receipt"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="press inline-flex items-center gap-2 rounded-xl border-[1.5px] border-blue px-4 py-2.5 text-sm font-bold text-blue hover:bg-sky-50"
        >
          <FileUp className="size-4" /> {file ? "Change file" : "Choose file"}
        </button>
        {file && <span className="max-w-[220px] truncate text-sm text-ink-500">{file.name}</span>}
        <button
          type="button"
          onClick={send}
          disabled={!file || state === "sending"}
          className={cn(
            "press inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {state === "sending" ? "Sending…" : "Send receipt"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
