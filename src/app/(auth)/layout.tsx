import Image from "next/image";
import { BadgeCheck, CalendarClock, Headphones } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/** Sign-in / sign-up chrome: brand panel with floating trip cards on the left, form on the right. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="grid min-h-screen flex-1 bg-[#f4f6f9] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden bg-[linear-gradient(150deg,#0a1628,#013557_48%,#0290de)] p-10 text-white lg:flex lg:flex-col">
        <Image src="/images/destinations/london.jpg" alt="" fill priority sizes="50vw" className="object-cover opacity-[0.16] mix-blend-luminosity" />
        <div aria-hidden className="absolute -right-24 -top-24 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(2,144,222,0.45),transparent_65%)]" />
        <div className="relative">
          <Logo />
        </div>

        <div className="relative my-auto max-w-[460px] py-10">
          <h2 data-reveal className="font-display text-[40px] font-extrabold leading-[1.08] tracking-[-0.02em]">
            Fly now.
            <br />
            <span className="text-[#8fd0ff]">Pay small small.</span>
          </h2>
          <p data-reveal style={{ ["--reveal-delay" as string]: "80ms" }} className="mt-4 text-[17px] leading-[1.6] text-white/80">
            Book flights from Nigeria to anywhere and spread the cost over easy instalments. Your trips, tickets and payments in one place.
          </p>

          {/* Decorative boarding pass + instalment chip, floating out of step with each other. */}
          <div aria-hidden className="relative mt-10 h-[210px]">
            <div className="float-card absolute left-0 top-0 w-[330px] rounded-2xl bg-white p-5 text-ink-900 shadow-[0_24px_60px_rgba(3,12,24,0.35)]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
                <span>Boarding pass</span>
                <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] text-[#15803d]">Confirmed</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-display text-3xl font-extrabold">LOS</p>
                  <p className="text-xs text-ink-500">Lagos</p>
                </div>
                <div className="flex flex-1 items-center gap-2 px-4">
                  <span className="size-2 rounded-full bg-blue" />
                  <div className="route-bar" />
                  <span className="size-2 rounded-full bg-orange" />
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl font-extrabold">LHR</p>
                  <p className="text-xs text-ink-500">London</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-[#e5e7eb] pt-3 text-xs">
                {[
                  ["Date", "20 Nov"],
                  ["Seat", "14A"],
                  ["Gate", "E7"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-ink-400">{k}</p>
                    <p className="font-bold">{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="float-card float-delay absolute bottom-0 right-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-ink-900 shadow-[0_18px_40px_rgba(3,12,24,0.3)] backdrop-blur">
              <span className="grid size-10 place-items-center rounded-xl bg-[rgba(245,134,52,0.14)] text-orange">
                <CalendarClock className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold">Pay in 4 instalments</p>
                <p className="text-xs text-ink-500">₦160,000 today, rest monthly</p>
              </div>
            </div>
          </div>
        </div>

        <ul data-reveal-stagger className="relative grid grid-cols-2 gap-3 text-sm text-white/85">
          <li className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-[#8fd0ff]" /> Trusted by thousands of travellers
          </li>
          <li className="flex items-center gap-2">
            <Headphones className="size-4 text-[#8fd0ff]" /> Real people, 24/7 support
          </li>
        </ul>
      </aside>

      <section className="flex min-h-screen flex-col px-4 py-8 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Logo tone="dark" width={120} />
        </div>
        {/* The page transition (rise on every navigation) lives in (auth)/template.tsx. */}
        <div className="mx-auto my-auto w-full max-w-[440px]">{children}</div>
      </section>
    </main>
  );
}
