import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Section";
import { SearchConsole } from "./search/SearchConsole";

export function Hero() {
  return (
    <div className="relative px-[6px] pt-[6px]">
      <div className="relative h-[600px] overflow-hidden rounded-[9px] bg-navy-950 max-md:h-[560px]">
        <Image src="/images/hero-tbils.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-[rgba(6,18,38,0.6)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(2,144,222,0.15)_0px,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.03)_0px,transparent_40%)]" />
        <div className="absolute right-0 top-0 h-[380px] w-[480px] max-w-full bg-[radial-gradient(circle_at_80%_20%,rgba(2,144,222,0.28)_0px,transparent_60%)]" />
      </div>

      <Header />

      <Container className="absolute inset-x-0 top-[187px] z-10 max-md:top-[108px]">
        <h1 className="max-w-[850px] text-[32px] font-bold leading-[1.1] text-white md:text-[46px] md:leading-[46px]">
          Book Cheap Flights in Nigeria — Pay in Installments
        </h1>
      </Container>

      <section aria-label="Search flights" className="relative z-20 -mt-[230px] max-md:-mt-[295px]">
        <Container>
          <SearchConsole />
        </Container>
      </section>
    </div>
  );
}
