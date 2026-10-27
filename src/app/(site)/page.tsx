import { DealsSection } from "@/components/home/DealsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { Hero } from "@/components/home/Hero";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { FlightExplorer } from "@/components/home/FlightExplorer";
import { WelcomeOffer } from "@/components/layout/WelcomeOffer";
import { PartnersStrip, PromoBanner, ServicesBand, WhyTbils } from "@/components/home/Sections";
import { faqs } from "@/data/content";
import { contact } from "@/data/contact";
import { site } from "@/data/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "TravelAgency",
      name: "TBiLS (TBIL Travels)",
      url: site.url,
      telephone: contact.phone.display,
      email: contact.email.display,
      address: { "@type": "PostalAddress", streetAddress: contact.address.line1, addressLocality: contact.address.city, addressCountry: "NG" },
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
};

export default function Home() {
  return (
    <>
      <Hero />
      <DealsSection />
      <PromoBanner />
      <ServicesBand />
      <PartnersStrip />
      <WhyTbils />
      <FaqSection />
      <NewsletterSection />
      <FlightExplorer />
      <WelcomeOffer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
