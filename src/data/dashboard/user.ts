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
};
