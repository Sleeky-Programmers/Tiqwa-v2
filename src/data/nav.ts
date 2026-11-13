/** Menu entries the backend can switch off (GET /get/menus), keyed by their slug. */
export type NavItem = { label: string; href: string; menu?: string };

/** Hides entries whose menu the backend has switched off; `null` (list unavailable) shows everything. */
export function menuOn(items: readonly NavItem[], active: string[] | null): NavItem[] {
  return items.filter((i) => !i.menu || !active || active.includes(i.menu));
}

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
      { label: "Holiday packages", href: "/holiday-packages", menu: "vacation_packages" },
      { label: "Visa assistance", href: "/visa", menu: "visa_assistance" },
      { label: "Proof of funds", href: "/contact?type=funds" },
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
      { label: "Manage booking", href: "/manage-booking", menu: "manage_booking" },
      { label: "Contact us", href: "/contact", menu: "support" },
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
  { label: "Holiday Packages", href: "/holiday-packages", menu: "vacation_packages" },
  { label: "Study Abroad", href: "/contact?type=study" },
  { label: "Visa & Travel", href: "/visa", menu: "visa_assistance" },
  { label: "Manage Booking", href: "/manage-booking", menu: "manage_booking" },
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;
