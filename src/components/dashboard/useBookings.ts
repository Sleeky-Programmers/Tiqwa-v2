"use client";

import { useCallback, useEffect, useState } from "react";
import { refreshSession } from "@/lib/account";
import { isPast, listBookings, type HistoryBooking } from "@/lib/booking/history";

/**
 * The signed-in user's bookings: from the backend when one is configured (`/api/bookings/history`),
 * otherwise the local mock history. `null` while loading; `error` when the backend can't be reached.
 */
export function useBookings() {
  const [bookings, setBookings] = useState<HistoryBooking[] | null>(null);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/bookings/history", { signal: ctrl.signal, cache: "no-store" })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (res.status === 401) void refreshSession();
        if (!res.ok) throw new Error(json?.error?.message ?? "We couldn't load your bookings right now.");
        if (!json?.live) {
          setBookings(listBookings());
        } else {
          // Anything that has already landed is "completed" unless cancelled or unpaid.
          setBookings((json.bookings as HistoryBooking[]).map((b) => (b.status === "confirmed" && isPast(b) ? { ...b, status: "completed" as const } : b)));
        }
        setLive(!!json?.live);
        setError("");
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message);
        setBookings((b) => b ?? []);
      });
    return () => ctrl.abort();
  }, [tick]);

  return { bookings, refresh, error, live };
}
