// MOCK booking data: add-ons, promo codes and bank-transfer details.
// Bank details are placeholders — replace with the real account before going live.

export type Addon = {
  id: string;
  name: string;
  description: string;
  price: number;
  isPerPassenger: boolean;
  icon: "reminder" | "car" | "shield" | "seat";
};

export const addons: Addon[] = [
  {
    id: "flight-reminder",
    name: "Flight Reminder",
    description: "Get SMS and email reminders <b>24 hours</b> and <b>3 hours</b> before departure, plus gate change alerts.",
    price: 1500,
    isPerPassenger: true,
    icon: "reminder",
  },
  {
    id: "travel-insurance",
    name: "Travel Insurance",
    description: "Medical cover up to <b>€30,000</b>, trip cancellation and lost-baggage protection for your whole trip.",
    price: 18500,
    isPerPassenger: true,
    icon: "shield",
  },
  {
    id: "car-hire",
    name: "Airport Car Hire",
    description: "A private car waiting at arrivals to take you to your hotel or home. Driver tracks your flight.",
    price: 35000,
    isPerPassenger: false,
    icon: "car",
  },
];

export const promoCodes: Record<string, { type: "percent" | "flat"; value: number; cap?: number; label: string }> = {
  TBILS10: { type: "percent", value: 10, cap: 50000, label: "10% off (up to ₦50,000)" },
  WELCOME5000: { type: "flat", value: 5000, label: "₦5,000 off" },
};

export const PAYMENT_GATEWAY_FEE = 2000;
export const HOLD_HOURS = 24;

export const bankTransfer = {
  bankName: "Mock Bank Plc",
  accountNumber: "0000000000",
  accountName: "TBIL Travels (Mock Account)",
};
