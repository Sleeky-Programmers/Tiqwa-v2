import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Section";
import { airlineLogo, deals, type Deal } from "@/data/deals";
import { formatNaira } from "@/lib/utils";

const glassPill = "rounded-full border-[0.83px] border-[rgba(143,208,255,0.5)] bg-[rgba(2,144,222,0.35)] text-[#eaf6ff]";

function DealCard({ deal }: { deal: Deal }) {
  const oneWay = deal.trip === "One way";
  const href = `/flights?from=${deal.fromCode}&to=${deal.toCode}&trip=${oneWay ? "oneway" : "round"}`;
  return (
    <Link
      href={href}
      className="group relative block h-[294px] w-[235px] shrink-0 snap-start overflow-hidden rounded-[18px] bg-[#0a1626] shadow-card transition duration-200 hover:-translate-y-1"
    >
      <Image
        src={deal.image}
        alt={`Cheap flights ${deal.from} → ${deal.to}`}
        fill
        sizes="235px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(4,14,28,0.55)_0px,rgba(4,14,28,0.15)_32%,rgba(4,14,28,0.35)_58%,rgba(3,12,24,0.92))]" />

      <span className={`absolute left-[14px] top-[14px] px-[10px] py-[5px] text-[10px] font-bold uppercase leading-[15px] tracking-[0.08em] ${glassPill}`}>
        {oneWay ? "Oneway" : "Round Trip"}
      </span>
      <span className="absolute right-[13px] top-[14px] flex size-10 items-center justify-center rounded-full bg-white p-[5px] shadow-[0_2px_10px_rgba(0,0,0,0.35)]">
        <Image src={airlineLogo(deal.airline.code)} alt={deal.airline.name} width={30} height={30} />
      </span>

      <div className="absolute inset-x-0 top-[92px] flex flex-col items-center text-center">
        <h3 className="font-display text-[23px] font-extrabold leading-[24px] text-white">{deal.from} To</h3>
        <span className="mt-1 text-[15px] font-medium leading-[16.5px] text-white/[0.92]">{deal.to}</span>
      </div>

      <div className="absolute inset-x-0 bottom-4 flex flex-col items-center text-center">
        <span className="text-[13px] font-medium leading-[13px] text-[rgba(234,246,255,0.85)]">Fare starting from</span>
        <span className="mt-1 font-display text-[21px] font-black leading-[22px] tracking-[-0.01em] text-white">{formatNaira(deal.fare)}</span>
        <span
          className={`mt-[10px] inline-flex items-center gap-1.5 px-[11px] py-[5px] text-[11px] font-bold leading-[11px] ${glassPill} border-[rgba(143,208,255,0.45)] bg-[rgba(2,144,222,0.28)]`}
        >
          <Image src="/images/pay-small-icon.png" alt="" width={30} height={19} />
          Pay Small Small from {formatNaira(deal.installment)}
        </span>
      </div>
    </Link>
  );
}

export function DealsSection() {
  return (
    <section aria-labelledby="deals-title" className="pb-4 pt-[45px]">
      <Container>
        <div data-reveal className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full border-[0.83px] border-[rgba(2,144,222,0.28)] bg-[rgba(2,144,222,0.1)] px-[14px] py-[6px] text-xs font-bold uppercase leading-[18px] tracking-[0.08em] text-blue">
              ✦ Handpicked this week
            </span>
            <h2
              id="deals-title"
              className="mt-[11px] max-w-[640px] font-display text-[28px] font-black leading-[1.05] tracking-[-0.01em] text-ink-900 md:text-[34px]"
            >
              Cheap Flight Deals from Nigeria This Week
            </h2>
            <p className="mt-[13px] text-sm font-medium leading-[21px] text-ink-500">
              Real fares our team spotted this week. Pay in full or spread it out. Prices refresh often.
            </p>
          </div>
          <Link href="/cheap-flight-deals" className="text-sm leading-[21px] text-[#333] underline">
            View all cheap flights
          </Link>
        </div>
        <div data-reveal-stagger className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-[14px] overflow-x-auto px-4 pb-6 pt-1">
          {deals.map((d) => (
            <DealCard key={d.id} deal={d} />
          ))}
        </div>
      </Container>
    </section>
  );
}
