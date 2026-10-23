export const suiteLinks = [{ label: "Properties", href: "https://www.tbilprop.com/" }] as const;

export const mainNav = [
  { label: "Cheap Flights Nigeria", href: "/cheap-flight-deals", active: true },
  { label: "Study Abroad", href: "/contact?type=study" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;

export const footerColumns = [
  {
    title: "Services",
    links: [
      { label: "Domestic flights", href: "/flights" },
      { label: "International flights", href: "/flights" },
      { label: "Installment payment plan", href: "/flights" },
      { label: "Visa assistance", href: "/contact" },
      { label: "Proof of funds", href: "/contact" },
    ],
  },
  {
    title: "Popular routes",
    links: [
      { label: "Lagos to Abuja", href: "/flights?from=LOS&to=ABV" },
      { label: "Lagos to Port Harcourt", href: "/flights?from=LOS&to=PHC" },
      { label: "Flights to London", href: "/flights?to=LHR" },
      { label: "Flights to Dubai", href: "/flights?to=DXB" },
      { label: "Flights to New York", href: "/flights?to=JFK" },
      { label: "Flights to Toronto", href: "/flights?to=YYZ" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About TBILS", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "FAQs", href: "/faq" },
      { label: "Blog", href: "/blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & conditions", href: "/terms-and-conditions" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Refund policy", href: "/refund-policy" },
    ],
  },
] as const;

/** Mobile drawer items (as on tbils.com). */
export const mobileNav = [
  { label: "Cheap Flights", href: "/cheap-flight-deals" },
  { label: "Study Abroad", href: "/contact?type=study" },
  { label: "Visa & Travel", href: "/contact?type=visa" },
  { label: "Manage Booking", href: "/contact?type=booking" },
  { label: "About Us", href: "/about" },
  { label: "Properties", href: "https://www.tbilprop.com/" },
  { label: "Blog", href: "/blog" },
] as const;
