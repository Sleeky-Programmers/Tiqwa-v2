import type { Metadata } from "next";
import { BookingSuccess } from "@/components/checkout/BookingSuccess";

export const metadata: Metadata = { title: "Booking confirmation" };

export default function BookingSuccessPage() {
  return <BookingSuccess />;
}
