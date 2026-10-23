/**
 * SINGLE SOURCE OF TRUTH for every contact detail shown anywhere in the app.
 * Edit the values in `raw` below — links and display formats are derived from them.
 * Never hard-code a phone, email, address, WhatsApp or social link elsewhere.
 *
 * ⚠️ All values are MOCK placeholders until real details are supplied.
 */

const raw = {
  /** Main call line. International format, digits only after "+". */
  phone: "+2340000000000",
  /** Number the floating chat pill opens. Can differ from the call line. */
  whatsapp: "+2340000000001",
  /** Pre-filled first message in the WhatsApp chat. */
  whatsappMessage: "Hello TBiLS, I'd like help booking a flight.",
  email: "hello@example.com",
  supportEmail: "support@example.com",
  address: {
    line1: "00 Placeholder Street",
    area: "Placeholder Area",
    city: "Lagos",
    country: "Nigeria",
  },
  hours: "24/7",
  socials: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
  },
} as const;

const digits = (n: string) => n.replace(/\D/g, "");

/** "+2340000000000" -> "+234 000 000 0000" (display only). */
const formatPhone = (n: string) => {
  const d = digits(n);
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`.trim();
};

export const contact = {
  phone: {
    display: formatPhone(raw.phone),
    href: `tel:+${digits(raw.phone)}`,
  },
  whatsapp: {
    display: formatPhone(raw.whatsapp),
    href: `https://wa.me/${digits(raw.whatsapp)}?text=${encodeURIComponent(raw.whatsappMessage)}`,
  },
  email: { display: raw.email, href: `mailto:${raw.email}` },
  supportEmail: { display: raw.supportEmail, href: `mailto:${raw.supportEmail}` },
  address: {
    ...raw.address,
    display: `${raw.address.line1}, ${raw.address.area}, ${raw.address.city}, ${raw.address.country}`,
    short: `${raw.address.area}, ${raw.address.city}, ${raw.address.country}`,
  },
  hours: raw.hours,
  socials: [
    { label: "Instagram", href: raw.socials.instagram, icon: "instagram" },
    { label: "TikTok", href: raw.socials.tiktok, icon: "tiktok" },
    { label: "Facebook", href: raw.socials.facebook, icon: "facebook" },
  ],
} as const;
