/**
 * Contact details shown across the app.
 *
 * Live values come from the backend's site settings (`getContact()` in `src/lib/api/site.ts`) and are
 * layered over the local defaults below, so a missing field never leaves a blank. With no backend
 * configured the defaults are used as they are.
 *
 * ⚠️ The defaults are MOCK placeholders until the real details are supplied.
 */

export type ContactSource = {
  phone: string;
  /** Number the floating chat pill opens. `null` hides every WhatsApp link. */
  whatsapp: string | null;
  whatsappMessage: string;
  email: string;
  supportEmail: string;
  /** Full address on one line. */
  address: string;
  /** Shorter form for tight spaces such as the footer. */
  addressShort: string;
  city: string;
  hours: string;
  /** Only the networks that have a link are shown. */
  socials: Partial<Record<SocialNetwork, string>>;
};

export type SocialNetwork = "instagram" | "tiktok" | "facebook" | "x" | "linkedin";

export const defaultContact: ContactSource = {
  phone: "+2340000000000",
  whatsapp: "+2340000000001",
  whatsappMessage: "Hello TBiLS, I'd like help booking a flight.",
  email: "hello@example.com",
  supportEmail: "support@example.com",
  address: "00 Placeholder Street, Placeholder Area, Lagos, Nigeria",
  addressShort: "Placeholder Area, Lagos, Nigeria",
  city: "Lagos",
  hours: "24/7",
  socials: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    facebook: "https://facebook.com/",
  },
};

const SOCIAL_LABELS: Record<SocialNetwork, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
};
const SOCIAL_ORDER: SocialNetwork[] = ["instagram", "tiktok", "facebook", "x", "linkedin"];

const digits = (n: string) => n.replace(/\D/g, "");

/** Local Nigerian numbers (08031234567) become international (+2348031234567); other input is kept. */
const international = (n: string) => {
  const d = digits(n);
  if (n.trim().startsWith("+")) return `+${d}`;
  if (d.startsWith("0") && d.length === 11) return `+234${d.slice(1)}`;
  return `+${d}`;
};

/** "+2340000000000" -> "+234 000 000 0000"; numbers already written by hand are shown as given. */
const display = (n: string) => {
  if (!n.trim().startsWith("+")) return n.trim();
  const d = digits(n);
  return `+${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`.trim();
};

/** Turns plain source values into the links and display strings the UI uses. Plain data, safe to pass to client components. */
export function buildContact(s: ContactSource) {
  const wa = s.whatsapp ? international(s.whatsapp) : null;
  return {
    phone: { display: display(s.phone), href: `tel:${international(s.phone)}` },
    whatsapp: wa
      ? {
          display: display(s.whatsapp!),
          /** Opens a chat with the standard greeting. */
          href: `https://wa.me/${digits(wa)}?text=${encodeURIComponent(s.whatsappMessage)}`,
          /** Chat link without a message; add `?text=` for a custom first message. */
          base: `https://wa.me/${digits(wa)}`,
        }
      : null,
    email: { display: s.email, href: `mailto:${s.email}` },
    supportEmail: { display: s.supportEmail, href: `mailto:${s.supportEmail}` },
    address: { display: s.address, short: s.addressShort, city: s.city },
    hours: s.hours,
    socials: SOCIAL_ORDER.filter((k) => s.socials[k]).map((k) => ({ label: SOCIAL_LABELS[k], href: s.socials[k]!, icon: k })),
  };
}

export type Contact = ReturnType<typeof buildContact>;
