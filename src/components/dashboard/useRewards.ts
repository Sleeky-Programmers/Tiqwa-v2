"use client";

import { useEffect, useState } from "react";
import type { Rewards } from "@/app/api/rewards/route";

let cache: Rewards | null = null;

/** Referral rewards for the signed-in user (cached for the session). */
export function useRewards() {
  const [data, setData] = useState<Rewards | null>(cache);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache && attempt === 0) return;
    const ctrl = new AbortController();
    fetch("/api/rewards", { signal: ctrl.signal })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't load your rewards.");
        cache = json as Rewards;
        setData(cache);
        setError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => ctrl.abort();
  }, [attempt]);

  return { data, error, loading: !data && !error, retry: () => setAttempt((n) => n + 1) };
}
