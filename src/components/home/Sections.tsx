import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { partners, services, whyTbils } from "@/data/content";

export function PromoBanner() {
  return (
    <section className="pb-[56px]">
      <Container>
        <Link href="/contact?type=holiday" className="block overflow-hidden rounded-[18px]">
          <Image
            src="/images/promo/qatar.png"
            alt="Discover Qatar with TBILS Tourism"
            width={2048}
            height={768}
            sizes="(min-width: 1232px) 1232px, 100vw"
            className="h-auto w-full"
          />
        </Link>
      </Container>
    </section>
  );
}

export function ServicesBand() {
  return (
    <section aria-labelledby="services-title" className="bg-navy-900 py-16 text-white">
      <Container>
        <p className="text-xs font-bold uppercase leading-[18px] tracking-[0.08em] text-[#70c4ff]">Beyond your booking</p>
        <h2
          id="services-title"
          className="mt-2 max-w-[690px] font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] md:text-[36px]"
        >
          Flight booking, visa &amp; travel services for Nigerians
        </h2>
        <p className="mt-[10px] max-w-[540px] text-sm leading-[1.55] text-[#b9c6d8]">
          Practical support for every stage of your journey and your next big move.
        </p>
        <div className="mt-[30px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const external = s.href.startsWith("http");
            return (
              <Link
                key={s.title}
                href={s.href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="group relative flex h-[270px] flex-col justify-end overflow-hidden rounded-2xl border-[0.83px] border-white/15 shadow-[0_14px_30px_rgba(0,0,0,0.2)]"
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(8,18,35,0.02)_18%,rgba(8,18,35,0.7)_58%,rgba(8,18,35,0.96))]" />
                <div className="relative p-[21px]">
                  <p className="text-[11px] font-bold leading-[16.5px] tracking-[0.12em] text-[#d9efff]">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-[18px] text-[19px] font-bold leading-[1.2] text-white">{s.title}</h3>
                  <p className="mt-2 text-sm leading-[1.45] text-[#e2eaf3]">{s.body}</p>
                  <span className="mt-[13px] block text-sm font-bold leading-[21px] text-[#8bd1ff] group-hover:underline">Explore service</span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function PartnersStrip() {
  const row = [...partners, ...partners, ...partners];
  return (
    <section aria-labelledby="partners-title" className="overflow-hidden bg-white pb-[52px] pt-12">
      <Container className="text-center">
        <p className="text-xs font-bold uppercase leading-[18px] tracking-[0.1em] text-[#087dcc]">Our travel network</p>
        <h2 id="partners-title" className="mt-[9px] text-[24px] font-bold leading-[1.2] tracking-[-0.025em] text-[#12233d] md:text-[28px]">
          Trusted by the names you fly with
        </h2>
      </Container>
      <div className="relative mt-[29px] [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <ul className="flex w-max animate-[marquee_30s_linear_infinite] items-center gap-16 hover:[animation-play-state:paused]">
          {[...row, ...row].map((p, i) => (
            <li key={i} aria-hidden={i >= partners.length || undefined}>
              <Image src={p.src} alt={i < partners.length ? p.alt : ""} width={p.w} height={p.h} className="h-auto w-auto object-contain" style={{ height: p.h, width: "auto" }} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const whyIcons: Record<string, React.ReactNode> = {
  tag: (
    <>
      <path d="M4 5.5h7l8.5 8.5-6 6L5 11.5v-6Z" />
      <circle cx="8.5" cy="8.5" r="1" />
      <path d="M12.5 13.5h4M14.5 11.5v4" />
    </>
  ),
  refresh: (
    <>
      <path d="M7 7.5h8.5l-2.5-2.5M17 16.5H8.5L11 19" />
      <path d="M18 9.5a5.5 5.5 0 0 0-9.5-2M6 14.5a5.5 5.5 0 0 0 9.5 2" />
      <path d="m11 11 2 1-2 1 .5-1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 18.5 6v4.5c0 4.2-2.6 7.6-6.5 9.5-3.9-1.9-6.5-5.3-6.5-9.5V6L12 3Z" />
      <path d="M8.5 10h7v4.5h-7zM8.5 11.5h7M10 13h.01" />
    </>
  ),
  headset: (
    <>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13v3a2 2 0 0 0 2 2h1v-5H4Zm16 0v3a2 2 0 0 1-2 2h-1v-5h3Z" />
      <path d="M17 18c0 2-1.8 3-5 3h-1" />
      <circle cx="18.5" cy="5.5" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
};

export function WhyTbils() {
  return (
    <section aria-labelledby="why-title" className="bg-tint-100 py-16">
      <Container>
        <div className="max-w-[610px]">
          <p className="text-[13px] font-bold uppercase leading-[19.5px] tracking-[0.08em] text-[#087dcc]">Travel with confidence</p>
          <h2 id="why-title" className="mt-[11px] font-display text-[28px] font-extrabold leading-[1.08] tracking-[-0.035em] text-[#12233d] md:text-[34px]">
            Why book cheap flights with TBILS?
          </h2>
          <p className="mt-[10px] text-sm leading-[1.55] text-[#617087]">Everything you need for a smoother journey, from search to take-off.</p>
        </div>
        <div className="mt-[25px] grid grid-cols-1 gap-y-5 rounded-[20px] border-[0.83px] border-[#e1e8f1] bg-white px-[19px] py-[22px] shadow-[0_16px_38px_rgba(21,51,87,0.06)] sm:grid-cols-2 lg:grid-cols-4">
          {whyTbils.map((w) => (
            <div key={w.title} className="flex items-start gap-3 lg:pr-[37px]">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-[#087dcc]">
                <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-none stroke-current" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  {whyIcons[w.icon]}
                </svg>
              </span>
              <div className="pt-[2px]">
                <h3 className="text-base font-bold leading-[1.3] text-[#152744]">{w.title}</h3>
                <p className="mt-2 text-sm leading-[1.55] text-[#66758a]">{w.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
