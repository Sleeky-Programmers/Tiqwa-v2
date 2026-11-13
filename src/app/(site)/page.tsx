import { DealsSection } from "@/components/home/DealsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { FlightExplorer } from "@/components/home/FlightExplorer";
import { HolidayPackages } from "@/components/home/HolidayPackages";
import { PartnersStrip, PromoBanner, ServicesBand, WhyTbils } from "@/components/home/Sections";
import { faqs } from "@/data/content";
import { getContact, getPartners } from "@/lib/api/site";
import { site } from "@/data/site";

const jsonLd = (contact: Awaited<ReturnType<typeof getContact>>) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      name: "TBiLS (TBIL Travels)",
      url: site.url,
      telephone: contact.phone.display,
      email: contact.email.display,
      address: { "@type": "PostalAddress", streetAddress: contact.address.display, addressCountry: "NG" },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
});

export default async function Home() {
  const [contact, partners] = await Promise.all([getContact(), getPartners()]);
  return (
    <>
      <Hero />
      <DealsSection />
      <PromoBanner />
      <HolidayPackages />
      <ServicesBand />
      <PartnersStrip partners={partners} />
      <WhyTbils />
      <FaqSection />
      <FlightExplorer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(contact)) }} />
    </>
  );
}
