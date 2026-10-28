import type { Traveller } from "./store";
import type { UserProfile } from "@/data/dashboard/user";

/**
 * The booking flow (results → checkout → confirmation) runs in two places with the same
 * components: the public site, and inside the signed-in dashboard where it never leaves /dashboard.
 */
export type BookingVariant = "site" | "dashboard";

export const bookingRoutes = (variant: BookingVariant) =>
  variant === "dashboard"
    ? {
        search: "/dashboard/flights",
        results: "/dashboard/flights/results",
        checkout: "/dashboard/flights/checkout",
        success: "/dashboard/flights/booking-success",
      }
    : { search: "/", results: "/flights", checkout: "/checkout", success: "/booking-success" };

/** Lead-traveller fields taken from the signed-in account. */
export const travellerFromProfile = (u: UserProfile): Partial<Traveller> => ({
  title: u.title,
  firstName: u.firstName,
  middleName: u.middleName,
  surname: u.surname,
  gender: u.gender,
  dob: u.dob,
  country: u.country,
  phone: u.phone,
  email: u.email,
  passportNumber: u.passportNumber,
  passportIssued: u.passportIssued,
  passportExpiry: u.passportExpiry,
  passportCountry: u.passportCountry,
});
