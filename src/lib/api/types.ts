// Response shapes of the Tiqwa / Premium Whitelabel API (`/api/v2`), as observed on the sandbox
// and in the travel-agency frontend (src/types/whitelabel.ts). Only the fields this app reads.

export type WlAirportDetails = { city: string; name: string; country: string; city_code?: string; iata_code: string; country_code?: string };

export type WlSegment = {
  baggage?: string | null;
  layover?: number | string | null;
  duration: number;
  airport_from: string;
  airport_to: string;
  arrival_time: string;
  departure_time: string;
  cabin_type?: string;
  booking_class?: string;
  flight_number?: string;
  equipment_type?: string | null;
  airline_details?: { code: string; logo?: string; name: string };
  marketing_airline?: string;
  operating_airline?: string;
  airport_from_details?: WlAirportDetails;
  airport_to_details?: WlAirportDetails;
  fare_rules?: string[];
  refundable?: boolean;
};

export type WlPriceSummary = { quantity: number; total_price: number; passenger_type: string };
export type WlPricing = { tax?: number | null; payable?: number; base_fare?: number | null };

export type WlFlightItem = {
  id: string;
  amount: number;
  currency?: string;
  outbound: WlSegment[];
  inbound?: WlSegment[] | null;
  total_outbound_duration?: number | null;
  total_inbound_duration?: number | null;
  pricing?: WlPricing;
  price_summary?: WlPriceSummary[];
};

export type WlMultiCityItem = {
  id: string;
  amount: number;
  currency?: string;
  routes: { segments: WlSegment[]; total_segment_duration?: number }[];
  pricing?: WlPricing;
  price_summary?: WlPriceSummary[];
};

/** `itemList` is an object of validation messages instead of an array when the search is rejected. */
export type WlSearchData<T> = { itemList: T[] | { message?: Record<string, string[]> }; listing_id?: string };

export type WlConfirmPrice = Partial<WlFlightItem> & {
  document_required?: boolean;
  bookable_seats?: number;
  expires_at?: string;
  price_change?: boolean;
};

export type WlPassenger = {
  passenger_type: string;
  title?: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  dob?: string;
  gender?: string;
  email?: string;
  phone_number?: string;
  documents?: { number?: string; issuing_date?: string; expiry_date?: string; issuing_country?: string; nationality_country?: string } | null;
};

export type WlBookingDetails = {
  reference: string;
  booking_id: string;
  flight_id: string;
  amount: string | number;
  payable_amount?: string | number;
  currency?: string;
  created_at?: string;
  expires_at?: string;
  pnr?: string | null;
  ticket_number?: string | null;
  status?: string;
  query_type?: string;
  outbound: WlSegment[];
  inbound?: WlSegment[] | null;
  total_outbound_duration?: number | null;
  total_inbound_duration?: number | null;
  pricing?: WlPricing;
  price_summary?: WlPriceSummary[];
  passengers?: WlPassenger[];
  ticket_issued?: number | boolean;
};

export type WlAirport = { id?: number; iata_code: string; city: string; name: string; country: string };
export type WlPopularAirport = { city: string; country: string; iata_code?: string; name?: string; image?: string };

export type WlAddon = { id: number; name: string; price: number; passengers?: number; status?: number; for?: string; description?: string | null };
export type WlPaymentMethod = {
  id: number;
  title: string;
  identifier: string;
  description?: string;
  priority?: number;
  status?: number;
  interest_rate?: number;
  instalments?: string | null;
};
export type WlPaymentGateway = { service: string; logo?: string; is_active?: boolean };
export type WlBankAccount = { bank_name: string; account_name: string; account_number: string; status?: number };

export type WlUser = {
  uniqueid?: string;
  id?: number | string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  token?: string;
  created_at?: string;
};

export type WlRewards = {
  total_referral_reward?: number;
  referral_code?: string;
  referral_history?: { referred_user?: string; date?: string }[];
  referral_payment_history?: { amount?: number; date?: string }[];
  allow_withdraw?: boolean;
};

export type WlFlightDeal = {
  id?: number | string;
  origin?: string;
  destination?: string;
  origin_city?: string;
  destination_city?: string;
  amount?: number;
  currency?: string;
  airline_name?: string;
  airline_code?: string;
  airline_logo?: string;
  cabin?: string;
  adults?: number;
  departure_date?: string;
  return_date?: string | null;
  thumbnail?: string;
  image?: string;
};

export type WlHolidayPackage = {
  uniqueid: string;
  title: string;
  subtitle?: string;
  slug: string;
  location: string;
  description?: string;
  long_description?: string | null;
  amount: number;
  currency?: string;
  thumbnail: string;
};
