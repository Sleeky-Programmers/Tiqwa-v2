import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { Container } from "@/components/ui/Section";
import { contact } from "@/data/contact";
import { footerColumns } from "@/data/nav";
import { site } from "@/data/site";

const socialIcons: Record<string, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </>
  ),
  tiktok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.6 2.2 4.4 5 4.6" />,
  facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5a.5.5 0 0 1 .5-.5Z" />,
};

export function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <section aria-label="Easy access" className="bg-navy-800 pb-[30px] pt-[34px]">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-display text-xl font-bold tracking-[-0.015em]">Easy Access</h2>
            <div className="flex items-center gap-[21px]">
              <span className="font-display text-xl font-bold leading-[30px] tracking-[-0.015em]">Connect with Us</span>
              <ul className="flex items-center gap-3">
                {contact.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`TBILS on ${s.label}`}
                      className="flex size-[31px] items-center justify-center rounded-full border-[0.83px] border-white/15 transition hover:bg-white/10"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden className="size-[15px] fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {socialIcons[s.icon]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-[22px] h-px bg-white/[0.12]" />
          <p className="mt-[26px] text-[17px] font-extrabold leading-[25.5px]">
            Have Questions?{" "}
            <a href={contact.phone.href} className="hover:underline">
              Call us at {contact.phone.display}
            </a>
          </p>
        </Container>
      </section>

      <Container className="grid grid-cols-1 gap-10 pb-[37px] pt-[62px] sm:grid-cols-2 lg:grid-cols-[318px_repeat(4,193px)] lg:gap-[36px]">
        <div>
          <Logo width={126} />
          <p className="mt-[17px] max-w-[280px] text-[13px] leading-[1.65] text-[#9fb2c8]">
            Nigeria&apos;s trusted flight booking agency. Compare fares, pay in installments, and travel with confidence.
          </p>
          <ul className="mt-[17px] space-y-[5px] text-[13px] leading-[1.4]">
            <li>
              <a href={contact.phone.href} className="text-[#dbe8f3] hover:text-white">
                {contact.phone.display}
              </a>
            </li>
            <li>
              <a href={contact.email.href} className="text-[#dbe8f3] hover:text-white">
                {contact.email.display}
              </a>
            </li>
            <li className="text-[#9fb2c8]">{contact.address.short}</li>
          </ul>
        </div>
        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="pt-[5px]">
            <h3 className="font-display text-[13px] font-bold uppercase tracking-[0.05em]">{col.title}</h3>
            <ul className="mt-[19px] space-y-[14px]">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] leading-[1.4] text-[#9fb2c8] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <div className="border-t-[0.83px] border-white/[0.09] py-[18px]">
        <Container>
          <p className="text-xs text-[#8296ac]">
            © {site.year} TBILS ({site.legalName}). All rights reserved.
          </p>
        </Container>
      </div>
    </footer>
  );
}
