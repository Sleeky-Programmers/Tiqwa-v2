export type Deal = {
  id: string;
  from: string;
  fromCode: string;
  to: string;
  toCode: string;
  trip: "Round trip" | "One way";
  airline: { code: string; name: string };
  image: string;
  fare: number;
  installment: number;
};

const airline = {
  TK: { code: "TK", name: "Turkish Airlines" },
  WN: { code: "WN", name: "Airline" },
  MS: { code: "MS", name: "EgyptAir" },
  AA: { code: "AA", name: "American Airlines" },
  BA: { code: "BA", name: "British Airways" },
} as const;

export const airlineLogo = (code: string) => `/images/airlines/${code}.png`;

export const deals: Deal[] = [
  { id: "los-lhr", from: "Lagos", fromCode: "LOS", to: "London", toCode: "LHR", trip: "Round trip", airline: airline.TK, image: "/images/deals/london.webp", fare: 1220000, installment: 398434 },
  { id: "abv-los", from: "Abuja", fromCode: "ABV", to: "Lagos", toCode: "LOS", trip: "One way", airline: airline.WN, image: "/images/deals/lagos.jpg", fare: 94143, installment: 26360 },
  { id: "abv-doh", from: "Abuja", fromCode: "ABV", to: "Doha", toCode: "DOH", trip: "Round trip", airline: airline.MS, image: "/images/deals/doha-abuja.webp", fare: 2541152, installment: 711522 },
  { id: "los-iad", from: "Lagos", fromCode: "LOS", to: "Washington", toCode: "IAD", trip: "Round trip", airline: airline.AA, image: "/images/deals/washington.webp", fare: 2112446, installment: 591484 },
  { id: "los-doh", from: "Lagos", fromCode: "LOS", to: "Doha", toCode: "DOH", trip: "Round trip", airline: airline.BA, image: "/images/deals/doha-lagos.webp", fare: 1422982, installment: 398434 },
  { id: "los-abv", from: "Lagos", fromCode: "LOS", to: "Abuja", toCode: "ABV", trip: "One way", airline: airline.WN, image: "/images/deals/lagos.jpg", fare: 94143, installment: 26360 },
  { id: "los-yyz", from: "Lagos", fromCode: "LOS", to: "Toronto", toCode: "YYZ", trip: "Round trip", airline: airline.AA, image: "/images/deals/washington.webp", fare: 1422982, installment: 398434 },
  { id: "abv-lhr", from: "Abuja", fromCode: "ABV", to: "London", toCode: "LHR", trip: "One way", airline: airline.TK, image: "/images/deals/london.webp", fare: 1422982, installment: 398434 },
];
