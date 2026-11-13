import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarClock, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { PackageCard } from "@/components/home/HolidayPackages";
import { PackageReserve } from "@/components/home/PackageReserve";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Section";
import { getContact } from "@/lib/api/site";
import { getHolidayPackage } from "@/lib/api/content";
import { formatNaira } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/holiday-packages/[slug]">): Promise<Metadata> {
  const data = await getHolidayPackage((await params).slug);
  return data ? { title: `${data.pkg.title} holiday package`, description: data.pkg.subtitle || data.pkg.description } : { title: "Holiday package" };
}

async function PackageDetails({ params }: { params: PageProps<"/holiday-packages/[slug]">["params"] }) {
  const data = await getHolidayPackage((await params).slug);
  if (!data) notFound();
  const { pkg, related } = data;
  const { whatsapp: chat } = await getContact();
  const whatsapp = chat ? `${chat.base}?text=${encodeURIComponent(`Hello TBiLS, I'm interested in the ${pkg.title} holiday package.`)}` : null;

  return (
    <>
      <section className="relative overflow-hidden bg-[#0a1626] pb-14 pt-[120px] text-white">
        <Image src={pkg.image} alt="" fill priority sizes="100vw" className="object-cover opacity-55" />
        <div className="hero-overlay absolute inset-0" />
        <Header />
        <Container className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] backdrop-blur animate-[fade-up_0.5s_ease_both]">
            <MapPin className="size-3.5" /> {pkg.location}
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-[36px] font-black leading-[1.05] tracking-[-0.01em] sm:text-[48px] animate-[fade-up_0.55s_0.05s_ease_both]">
            {pkg.title}
          </h1>
          {pkg.subtitle && <p className="mt-3 max-w-2xl text-lg text-white/85 animate-[fade-up_0.6s_0.1s_ease_both]">{pkg.subtitle}</p>}
        </Container>
      </section>

      <Container className="grid items-start gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <article data-reveal className="min-w-0">
          <h2 className="font-display text-2xl font-extrabold text-ink-900">About this package</h2>
          <div className="mt-4 whitespace-pre-line text-[15px] leading-[1.75] text-[#374151]">
            {pkg.details || pkg.description || "Ask our team for the full itinerary."}
          </div>
          <ul data-reveal-stagger className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              [ShieldCheck, "Trusted partners", "Hand-checked stays and transfers"],
              [CalendarClock, "Pay small small", "Spread the cost before you travel"],
              [MessageCircle, "Real support", "A travel expert on WhatsApp 24/7"],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <li key={t as string} className="group rounded-2xl border border-[#e3ebf3] bg-white p-4">
                  <span className="grid size-10 place-items-center rounded-xl bg-[rgba(2,144,222,0.1)] text-blue transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                    <I className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink-900">{t as string}</p>
                  <p className="text-[13px] text-ink-500">{d as string}</p>
                </li>
              );
            })}
          </ul>
        </article>

        <aside data-reveal="right" className="lg:sticky lg:top-[100px]">
          <div className="float-card rounded-[20px] border border-[#e3ebf3] bg-white p-6 shadow-[0_18px_44px_rgba(1,40,74,0.1)]">
            <p className="text-sm text-ink-500">Packages from</p>
            <p className="font-display text-[32px] font-black text-ink-900">{formatNaira(pkg.price)}</p>
            <p className="mt-1 text-xs text-ink-500">Per person. Final price depends on dates and room choice.</p>
            <PackageReserve packageId={pkg.id} title={pkg.title} />
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-blue py-3 text-[15px] font-bold text-blue hover:bg-sky-50"
              >
                <MessageCircle className="size-4" /> Ask on WhatsApp
              </a>
            )}
          </div>
        </aside>
      </Container>

      {related.length > 0 && (
        <section className="bg-[#f4f6f9] py-12">
          <Container>
            <h2 data-reveal className="mb-6 font-display text-2xl font-extrabold text-ink-900">
              You might also like
            </h2>
            <div data-reveal-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.slice(0, 3).map((p) => (
                <PackageCard key={p.id} p={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

export default function HolidayPackagePage({ params }: PageProps<"/holiday-packages/[slug]">) {
  return (
    <Suspense fallback={<div className="h-[70vh] animate-pulse bg-[#0a1626]" />}>
      <PackageDetails params={params} />
    </Suspense>
  );
}
