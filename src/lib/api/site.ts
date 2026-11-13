import { buildContact, defaultContact, type ContactSource, type SocialNetwork } from "@/data/contact";
import { publicData } from "./content";

// Site-wide content from the backend: contact details and social links (site settings), which
// sections are switched on (menus), partners, the About page and blog posts. Every call is cached for
// an hour (through publicData) and fall back to null or the local defaults when the backend is unreachable
// or has nothing. These wrappers are not cached themselves, so a failed fetch is only remembered for seconds.

type Settings = {
  physical_address?: string | null;
  phone_number?: string | null;
  support_phone?: string | null;
  email_address?: string | null;
  support_email?: string | null;
  whatsapp_chat_number?: string | null;
  facebook_link?: string | null;
  instagram_link?: string | null;
  twitter_link?: string | null;
  linkedin_link?: string | null;
  blog_url?: string | null;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Plain-data contact details: backend values over the local defaults. */
export async function getContact() {
  const s = await publicData<Settings>("/get/site-settings");
  const d = defaultContact;
  if (!s) return buildContact(d);

  const socials: Partial<Record<SocialNetwork, string>> = {};
  const links: [SocialNetwork, unknown][] = [
    ["instagram", s.instagram_link],
    ["facebook", s.facebook_link],
    ["x", s.twitter_link],
    ["linkedin", s.linkedin_link],
  ];
  for (const [k, v] of links) if (text(v)) socials[k] = text(v);

  const address = text(s.physical_address);
  const source: ContactSource = {
    phone: text(s.phone_number) ?? text(s.support_phone) ?? d.phone,
    whatsapp: text(s.whatsapp_chat_number) ?? null,
    whatsappMessage: d.whatsappMessage,
    email: text(s.email_address) ?? d.email,
    supportEmail: text(s.support_email) ?? text(s.email_address) ?? d.supportEmail,
    address: address ?? d.address,
    addressShort: address ?? d.addressShort,
    city: address ? "" : d.city,
    hours: d.hours,
    socials,
  };
  return buildContact(source);
}

/** The blog's own website, if the backend gives one. */
export async function getBlogUrl(): Promise<string | null> {
  return text((await publicData<Settings>("/get/site-settings"))?.blog_url) ?? null;
}

/** Slugs of the menu entries that are switched on, or null when the list isn't available (show everything). */
export async function getActiveMenus(): Promise<string[] | null> {
  const rows = await publicData<{ name_slug?: string; active?: number | boolean }[]>("/get/menus");
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows.filter((m) => m.active && m.name_slug).map((m) => m.name_slug!);
}

export type Partner = { name: string; src: string; href?: string };

export async function getPartners(): Promise<Partner[] | null> {
  const rows = await publicData<Record<string, unknown>[]>("/get/partners");
  if (!Array.isArray(rows) || !rows.length) return null;
  const out = rows.flatMap((r) => {
    const src = text(r.logo) ?? text(r.image) ?? text(r.thumbnail) ?? text(r.icon) ?? text(r.logo_url);
    return src ? [{ name: text(r.name) ?? text(r.title) ?? "Partner", src, href: text(r.link) ?? text(r.url) }] : [];
  });
  return out.length ? out : null;
}

export type AboutContent = { title: string; paragraphs: string[]; image?: string };

/** HTML from the CMS is reduced to plain paragraphs. */
const toParagraphs = (html: string) =>
  html
    .replace(/<\/(p|div|h[1-6]|li|br)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

export async function getAbout(): Promise<AboutContent | null> {
  const d = await publicData<Record<string, unknown> | string>("/get/about-us");
  if (!d) return null;
  if (typeof d === "string") return d.trim() ? { title: "About us", paragraphs: toParagraphs(d) } : null;
  const body = text(d.content) ?? text(d.description) ?? text(d.body) ?? text(d.about);
  if (!body) return null;
  return { title: text(d.title) ?? text(d.heading) ?? "About us", paragraphs: toParagraphs(body), image: text(d.image) ?? text(d.thumbnail) };
}

export type BlogPost = { id: string; title: string; excerpt: string; image?: string; date?: string; href?: string };

export async function getBlogs(): Promise<BlogPost[] | null> {
  const rows = await publicData<Record<string, unknown>[]>("/get/blogs");
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows.flatMap((r, i) => {
    const title = text(r.title);
    if (!title) return [];
    const body = text(r.excerpt) ?? text(r.summary) ?? text(r.description) ?? text(r.content) ?? "";
    return [
      {
        id: String(r.id ?? r.slug ?? i),
        title,
        excerpt: toParagraphs(body).join(" ").slice(0, 180),
        image: text(r.thumbnail) ?? text(r.image) ?? text(r.cover),
        date: text(r.created_at) ?? text(r.published_at),
        href: text(r.link) ?? text(r.url),
      },
    ];
  });
}
