"use client";

import { useCallback, useEffect, useState } from "react";
import { listBookings, type HistoryBooking } from "@/lib/booking/history";

/** Bookings read on the client (they depend on today's date and localStorage). `null` while loading. */
export function useBookings() {
  const [bookings, setBookings] = useState<HistoryBooking[] | null>(null);
  const refresh = useCallback(() => setBookings(listBookings()), []);
  useEffect(() => {
    // Small delay so the skeletons register as a loading state rather than a flash.
    const t = window.setTimeout(refresh, 350);
    return () => window.clearTimeout(t);
  }, [refresh]);
  return { bookings, refresh };
}
