// MOCK signed-in customer. Profile edits are layered on top of this from localStorage (see lib/account.ts).

export type UserProfile = {
  title: string;
  firstName: string;
  middleName: string;
  surname: string;
  email: string;
  country: string; // ISO2 for the phone dial code
  phone: string;
  dob: string;
  gender: string;
  nationality: string; // ISO2
  passportNumber: string;
  passportIssued: string;
  passportExpiry: string;
  passportCountry: string; // ISO2
  memberSince: string;
  tier: "Explorer" | "Silver" | "Gold";
  points: number;
};

export const demoUser: UserProfile = {
  title: "Mr.",
  firstName: "Tunde",
  middleName: "",
  surname: "Adeyemi",
  email: "tunde.adeyemi@example.com",
  country: "NG",
  phone: "8030000000",
  dob: "1990-04-18",
  gender: "Male",
  nationality: "NG",
  passportNumber: "A0000000",
  passportIssued: "2021-03-15",
  passportExpiry: "2031-03-14",
  passportCountry: "NG",
  memberSince: "2023-02-11",
  tier: "Silver",
  points: 12450,
};

/** Mock password the "current password" field is checked against. */
export const DEMO_PASSWORD = "Password123!";

export const notifications = [
  { id: "n1", title: "Payment reminder", body: "Your Abuja → Dubai hold expires in 18 hours.", time: "2h ago", unread: true },
  { id: "n2", title: "Check-in opens soon", body: "Online check-in for your London trip opens 48 hours before departure.", time: "Yesterday", unread: true },
  { id: "n3", title: "Price drop", body: "Lagos → Accra fares are down 12% this week.", time: "3 days ago", unread: false },
];
