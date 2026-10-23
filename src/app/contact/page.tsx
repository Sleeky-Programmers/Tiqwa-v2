import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { contact } from "@/data/contact";

export const metadata: Metadata = { title: "Contact us" };

const rows = [
  { icon: Phone, label: "Call us", value: contact.phone.display, href: contact.phone.href },
  { icon: MessageCircle, label: "WhatsApp", value: contact.whatsapp.display, href: contact.whatsapp.href },
  { icon: Mail, label: "Email", value: contact.email.display, href: contact.email.href },
  { icon: MapPin, label: "Office", value: contact.address.display },
  { icon: Clock, label: "Support hours", value: contact.hours },
];

export default function Page() {
  return (
    <PageShell title="Contact us" intro="Flights, visas, payment plans and booking changes — we're here to help.">
      <ul className="grid max-w-3xl gap-4 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value, href }) => (
          <li key={label} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-blue">
              <Icon aria-hidden className="size-5" />
            </span>
            <span>
              <span className="block text-xs font-bold uppercase tracking-wider text-outline">{label}</span>
              {href ? (
                <a href={href} className="font-semibold text-ink-800 hover:text-blue">{value}</a>
              ) : (
                <span className="font-semibold text-ink-800">{value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
