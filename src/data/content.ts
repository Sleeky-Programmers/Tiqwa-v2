export const services = [
  {
    title: "Flight Tickets and Reservation",
    body: "Fast, reliable flight reservations designed for convenient and flexible travel planning.",
    href: "/flights",
    image: "/images/services/flights.jpg",
    icon: "ticket",
    accent: "orange",
  },
  {
    title: "Study Abroad",
    body: "Expert advisory and application support to help you study with confidence in top international institutions.",
    href: "/contact?type=study",
    image: "/images/services/study.jpg",
    icon: "school",
    accent: "blue",
  },
  {
    title: "Proof of Funds",
    body: "TBIL Travels helps you secure Proof of Funds and statement of account at a cost-effective rate with no stress involved.",
    href: "/contact",
    image: "/images/services/pof.jpg",
    icon: "landmark",
    accent: "orange",
  },
  {
    title: "Properties",
    body: "Browse verified homes, list your property, and connect with trustworthy buyers or renters quickly.",
    href: "https://www.tbilprop.com/",
    image: "/images/services/properties.jpg",
    icon: "building",
    accent: "blue",
  },
] as const;

export const partners = [
  { name: "IATA", alt: "IATA | International Air Transport Association Accredited Agency", src: "/images/partners/iata.svg", w: 50, h: 50 },
  { name: "NANTA", alt: "NANTA | National Association of Nigeria Travel Agencies Member", src: "/images/partners/nanta.png", w: 97, h: 53 },
  { name: "Amadeus", alt: "Amadeus | TBILS Global Distribution System Partner", src: "/images/partners/amadeus.svg", w: 139, h: 40 },
  { name: "Sabre", alt: "Sabre | TBILS Travel Technology Partner", src: "/images/partners/sabre.jpg", w: 62, h: 42 },
];

export const whyTbils = [
  { title: "Best fares", body: "Compare prices and pick the flight that works for you.", icon: "tag" },
  { title: "Easy changes", body: "Need to change your trip? We'll guide you through it.", icon: "refresh" },
  { title: "Safe payments", body: "Book securely with a checkout you can trust.", icon: "shield" },
  { title: "Help 24/7", body: "We're here whenever you need us, before, during, and after your trip.", icon: "headset" },
] as const;

export const faqs = [
  {
    q: "Can I pay for my flight in installments?",
    a: "Yes. For eligible bookings, you can pay a deposit and spread the balance over an agreed period. Contact our team to set up a plan for your route.",
  },
  {
    q: "Are there hidden charges?",
    a: "No. We show the fare details clearly before you book. If a fare changes because of airline availability, our team will explain it before you pay.",
  },
  {
    q: "How do I reach a travel expert?",
    a: "Call, WhatsApp, or use the Contact Us page. Our Lagos travel team can help with flights, visas, payment plans, and booking changes.",
  },
];
