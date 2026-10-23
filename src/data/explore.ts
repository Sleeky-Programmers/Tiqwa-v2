// Content for the "Find the right flight for your next journey" block.

export type RouteRegion = { id: string; label: string; routes: { label: string; href: string }[] };

const route = (from: string, to: string, fc: string, tc: string) => ({
  label: `${from} to ${to}`,
  href: `/flights?from=${fc}&to=${tc}`,
});
const dest = (city: string, code: string) => ({ label: city, href: `/flights?from=LOS&to=${code}` });

export const routeRegions: RouteRegion[] = [
  {
    id: "domestic",
    label: "Domestic (Nigeria)",
    routes: [
      route("Lagos", "Abuja", "LOS", "ABV"),
      route("Abuja", "Lagos", "ABV", "LOS"),
      route("Lagos", "Port Harcourt", "LOS", "PHC"),
      route("Lagos", "Calabar", "LOS", "CBQ"),
    ],
  },
  { id: "african", label: "African", routes: [dest("Accra", "ACC"), dest("Nairobi", "NBO"), dest("Cape Town", "CPT"), dest("Johannesburg", "JNB")] },
  { id: "european", label: "European", routes: [dest("London", "LHR"), dest("Istanbul", "IST"), dest("Manchester", "MAN"), dest("Paris", "CDG")] },
  { id: "asian", label: "Asian", routes: [dest("Dubai", "DXB"), dest("Abu Dhabi", "AUH"), dest("Guangzhou", "CAN"), dest("New Delhi", "DEL")] },
  { id: "north-american", label: "North American", routes: [dest("Atlanta", "ATL"), dest("Toronto", "YYZ"), dest("Houston", "IAH"), dest("New York", "JFK")] },
];

export const airlineGroups = [
  {
    title: "Nigerian airlines",
    names: ["Air Peace", "Arik Air", "Ibom Air", "Aero Contractor", "Valuejet", "United Nigeria Airlines", "Green Africa", "Azman Air", "Dana Air", "Medview"],
  },
  {
    title: "International airlines",
    names: [
      "Asky Airlines", "Air Cote D'Ivoire", "South African Airways", "Egyptair", "Rwandair", "Royal Air Maroc", "Kenya Airways",
      "British Airways", "Emirates", "Qatar Airways", "Virgin Atlantic", "Lufthansa", "KLM", "Air France", "Turkish Airlines",
      "United Airlines", "Delta Airlines", "Ethiopian Airlines", "Saudi Arabian Airlines", "Hahn Air", "TAAG Angola Airlines", "Etihad Airways",
    ],
  },
];

export type GuideBlock = { h?: string; p?: string[]; list?: string[]; after?: string[] };

/** Expandable "About booking flights with TBILS" guide. */
export const bookingGuide: GuideBlock[] = [
  {
    p: [
      "If you are searching for Cheap Flights Booking in Nigeria or the best platform for Cheap International Flight Tickets in Nigeria, TBILS.com offers a fast, secure, and reliable booking experience designed to help travelers save both time and money.",
      "Our mission is to provide Nigerians with affordable air travel solutions while delivering exceptional customer service from the moment you search for a flight until you arrive at your destination.",
    ],
  },
  {
    h: "Cheap Flights Booking in Nigeria Made Easy",
    p: [
      "Finding affordable airfare can be challenging with changing airline prices and limited seat availability. TBILS.com simplifies the process by helping travelers compare multiple flight options in one place.",
      "Whether you are planning a last-minute business trip or booking your next vacation months ahead, our platform helps you secure the best available fares without unnecessary stress.",
      "Our Cheap Flights Booking in Nigeria service covers both domestic and international routes, allowing travelers to choose flights that match their budget, preferred airline, and travel schedule.",
    ],
  },
  {
    h: "Cheap International Flight Tickets in Nigeria",
    p: ["International travel requires careful planning, especially when searching for affordable fares. TBILS.com helps travelers access Cheap International Flight Tickets in Nigeria to major destinations across:"],
    list: ["Canada", "United Kingdom", "United States", "United Arab Emirates", "France", "Germany", "Italy", "Spain", "Netherlands", "South Africa", "Kenya", "Turkey", "Saudi Arabia", "Qatar", "India", "China", "And many more destinations worldwide"],
    after: ["Whether you are travelling for tourism, education, relocation, conferences, business meetings, or family visits, our travel experts help you find competitive international airfare that suits your travel plans."],
  },
  {
    h: "Flight Booking Online Nigeria",
    p: [
      "Modern travelers want convenience, speed, and security. TBILS.com provides an easy-to-use platform where customers can search, compare, and book flights without visiting a physical travel office.",
      "Our online booking system allows you to:",
    ],
    list: ["Search available flights within minutes", "Compare airline prices", "Choose your preferred departure times", "Book domestic and international flights", "Receive professional travel assistance whenever needed"],
    after: ["Whether you are booking from Lagos, Abuja, Port Harcourt, Kano, Ibadan, Enugu, Benin City, or anywhere in Nigeria, TBILS.com gives you access to reliable flight booking services anytime."],
  },
  {
    h: "Cheap Local Flights in Nigeria",
    p: ["Need to travel within Nigeria? TBILS.com helps customers book Cheap Local Flights in Nigeria for popular routes such as:"],
    list: ["Lagos to Abuja", "Abuja to Lagos", "Lagos to Port Harcourt", "Port Harcourt to Lagos", "Lagos to Kano", "Abuja to Owerri", "Lagos to Enugu", "Ibadan to Abuja", "Abuja to Uyo", "Lagos to Calabar"],
    after: ["We partner with leading domestic airlines to ensure customers have access to affordable fares, convenient schedules, and flexible travel options. Whether you are travelling for work, family events, government assignments, or weekend getaways, TBILS.com helps you find the best local flight deals."],
  },
  {
    h: "Why Choose TBILS.com for Flight Booking?",
    p: ["Choosing the right travel agency or booking platform can make a significant difference to your travel experience. Here's why thousands of travelers trust TBILS.com."],
  },
  {
    h: "Competitive Pricing & Instalment Payments",
    p: [
      "At TBILS.com, we understand that travel should be affordable. We work hard to secure competitive airfares from trusted airline partners, helping customers save on both domestic and international flights.",
      "For eligible bookings, we also provide flexible instalment payment options, allowing travelers to spread the cost of their trip and plan their finances more conveniently. This means you don't always have to pay the entire airfare at once before securing your travel plans.",
    ],
  },
  {
    h: "Wide Selection of Airlines & Destinations",
    p: [
      "TBILS.com gives travelers access to flights from leading domestic and international airlines. Whether you prefer direct flights, budget-friendly options, premium cabins, or flexible travel schedules, we provide numerous choices to suit your needs.",
      "Our extensive airline network connects travelers to hundreds of destinations across Africa, Europe, North America, the Middle East, Asia, and beyond. This wide selection makes it easier to compare fares and choose flights that offer the best value.",
    ],
  },
  {
    h: "Secured Booking Process",
    p: ["Security is a priority when booking flights online. TBILS.com uses a secure booking process designed to protect customer information throughout every transaction. From flight selection to payment confirmation, travelers can book with confidence knowing that their details are handled with care."],
  },
  {
    h: "Excellent Customer Support",
    p: ["Travelling sometimes comes with unexpected changes and having responsive support can make all the difference. Our experienced travel consultants are available to assist with:"],
    list: ["Flight reservations", "Travel advice", "Airline schedule enquiries", "Ticket changes (subject to airline policies)", "Booking assistance", "Fare enquiries", "General travel support"],
    after: ["Whether you have questions before booking or need assistance after purchasing your ticket, our dedicated customer support team is ready to help."],
  },
  {
    h: "More Than Just Flight Tickets",
    p: ["TBILS.com offers more than flight booking. We provide a complete range of travel services to make your journey easier, including:"],
    list: ["International and domestic flight bookings", "Visa assistance", "Hotel reservations", "Holiday and tour packages", "Travel consultation", "Travel insurance guidance", "Corporate travel management", "Group travel arrangements"],
    after: ["With multiple travel solutions available in one place, travelers can conveniently plan their entire trip through a trusted travel partner."],
  },
  {
    h: "Book Your Next Flight with Confidence",
    p: [
      "Whether you are searching for Cheap Flights Booking in Nigeria, Cheap International Flight Tickets in Nigeria, Flight Booking Online Nigeria, or Cheap Local Flights in Nigeria, TBILS.com is committed to helping you travel smarter and spend less.",
      "Enjoy competitive prices, flexible payment options, access to leading airlines, secure online booking, and dedicated customer support, all from one trusted platform.",
      "Book with confidence and let TBILS.com help you travel farther for less.",
    ],
  },
];
