// Shared flight-search types. The mock generator and every UI consume these,
// so a real provider only has to map its response into this shape.

export type Cabin = "economy" | "premium_economy" | "business" | "first";
export type TripType = "oneway" | "round" | "multi";

export type Pax = { adults: number; children: number; infants: number };

export type SearchLeg = { from: string; to: string; date: string };

export type FlightSearch = {
  trip: TripType;
  legs: SearchLeg[]; // 1 for one-way, 2 for round trip (outbound + return), 2–5 for multi-city
  pax: Pax;
  cabin: Cabin;
};

export type AirportRef = { code: string; city: string; name: string; country: string };
export type AirlineRef = { code: string; name: string };

export type Segment = {
  id: string;
  airline: AirlineRef;
  flightNumber: string;
  aircraft: string;
  from: AirportRef;
  to: AirportRef;
  /** Local wall-clock times, "YYYY-MM-DDTHH:mm". */
  depart: string;
  arrive: string;
  durationMin: number;
  /** Layover at `to` before the next segment (minutes); absent on the last segment. */
  layoverMin?: number;
};

export type Journey = {
  segments: Segment[];
  from: AirportRef;
  to: AirportRef;
  depart: string;
  arrive: string;
  durationMin: number;
  stops: number;
};

export type FareRules = {
  refundable: boolean;
  refundNote: string;
  changeNote: string;
  checkedBaggage: string;
  cabinBaggage: string;
};

export type PriceBreakdown = {
  adults: { count: number; unit: number };
  children: { count: number; unit: number };
  infants: { count: number; unit: number };
  taxes: number;
  total: number;
};

export type FlightOffer = {
  id: string;
  airline: AirlineRef;
  journeys: Journey[];
  cabin: Cabin;
  price: PriceBreakdown;
  fareRules: FareRules;
  seatsLeft: number;
};

export type SearchResponse = { search: FlightSearch; offers: FlightOffer[]; currency: "NGN" };
