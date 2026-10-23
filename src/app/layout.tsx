import type { Metadata } from "next";
import { Bricolage_Grotesque, Quicksand } from "next/font/google";
import { ChatPill } from "@/components/layout/ChatPill";
import { Footer } from "@/components/layout/Footer";
import { WelcomeOffer } from "@/components/layout/WelcomeOffer";
import { site } from "@/data/site";
import "./globals.css";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Cheap Flights Nigeria | Book Flights Online Nigeria | TBiLS",
    template: "%s | TBiLS",
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: "TBiLS",
    title: "Book Cheap Flights in Nigeria — Pay in Installments",
    description: site.description,
    locale: "en_NG",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${quicksand.variable} ${bricolage.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-[60] rounded bg-white px-4 py-2 font-bold text-blue focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <ChatPill />
        <WelcomeOffer />
      </body>
    </html>
  );
}
