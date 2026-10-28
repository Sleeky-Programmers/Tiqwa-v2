"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { ItineraryBand } from "@/components/flights/ItineraryBand";
import { AlertDialog, InlineLoader, ProcessingOverlay } from "@/components/ui/Feedback";
import { fullName, getProfile, initials, useProfile } from "@/lib/account";
import { recordBooking } from "@/lib/booking/history";
import { loadBooking, saveBooking, type BookingDraft, type Traveller } from "@/lib/booking/store";
import { bookingTotals } from "@/lib/booking/pricing";
import { bookingRoutes, travellerFromProfile, type BookingVariant } from "@/lib/booking/routes";
import { paxCount } from "@/lib/flights/format";
import { searchToParams } from "@/lib/flights/search-params";
import { cn } from "@/lib/utils";
import { AddonsStep } from "./AddonsStep";
import { BookingSummary } from "./BookingSummary";
import { PaymentStep, type PayMethod } from "./PaymentStep";
import { TravellerForm, emptyTraveller, typeInfo, validateTraveller, type TravellerErrors } from "./TravellerForm";
import { TravellerSwitcher, type TravellerStatus } from "./TravellerSwitcher";

type Section = "travellers" | "addons" | "payment";
const STEP_TITLE: Record<Section, string> = { travellers: "Traveler detail", addons: "Add ons", payment: "Payment" };

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function AccordionSection({
  step,
  title,
  open,
  done,
  locked,
  onOpen,
  innerRef,
  children,
}: {
  step: number;
  title: string;
  open: boolean;
  done: boolean;
  locked: boolean;
  onOpen: () => void;
  innerRef: (el: HTMLElement | null) => void;
  children: ReactNode;
}) {
  return (
    <section
      ref={innerRef}
      className="scroll-mt-[86px] overflow-hidden rounded-[14px] border border-[#eef1f5] bg-white shadow-[0_1px_2px_rgba(16,40,68,0.04),0_8px_24px_rgba(16,40,68,0.05)]"
    >
      <button
        type="button"
        aria-expanded={open}
        disabled={locked}
        onClick={onOpen}
        className={cn(
          "flex w-full items-center gap-3.5 rounded-t-[14px] bg-white px-5 py-[18px] text-left",
          open && "border-b border-[#eef1f5]",
          locked && "cursor-not-allowed opacity-65",
        )}
      >
        <span
          className={cn(
            "grid size-[30px] shrink-0 place-items-center rounded-full text-[15px] font-bold",
            done ? "bg-[#16a34a] text-white" : "bg-[rgba(2,144,222,0.1)] text-blue",
          )}
        >
          {done ? <Check className="size-4" /> : step}
        </span>
        <span className="flex-1 text-lg font-bold text-ink-900">{title}</span>
        <span aria-hidden className={cn("text-xs text-ink-500 transition-transform duration-300", open && "rotate-180")}>
          {locked ? "🔒" : "▼"}
        </span>
      </button>
      {open && <div className="animate-[acc-reveal_0.34s_cubic-bezier(0.16,1,0.3,1)] p-3 sm:p-5">{children}</div>}
    </section>
  );
}

/** `variant="dashboard"` runs the same flow inside the account shell, starting from the signed-in user's details. */
export function CheckoutFlow({ variant = "site" }: { variant?: BookingVariant }) {
  const dash = variant === "dashboard";
  const routes = bookingRoutes(variant);
  const router = useRouter();
  const [phase, setPhase] = useState<"validating" | "ready" | "missing">("validating");
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [open, setOpen] = useState<Section>("travellers");
  const [done, setDone] = useState<Record<Section, boolean>>({ travellers: false, addons: false, payment: false });
  const [travellers, setTravellers] = useState<Traveller[]>([]);
  const [errors, setErrors] = useState<TravellerErrors[]>([]);
  const [showPassport, setShowPassport] = useState<boolean[]>([]);
  const [activeTraveller, setActiveTraveller] = useState(0);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const sections = useRef<Partial<Record<Section, HTMLElement | null>>>({});
  const [today, setToday] = useState("");

  // Load the selected flight from the results page and "validate" it.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- first client read of the clock and sessionStorage */
    setToday(todayIso());
    const d = loadBooking();
    if (!d) {
      setPhase("missing");
      return;
    }
    const { adults, children, infants } = d.search.pax;
    const list = d.travellers
      ? d.travellers.map((t) => ({ ...emptyTraveller(t.type), ...t }))
      : [
          // Signed in: the account holder is the lead passenger until they switch it off.
          ...Array.from({ length: adults }, (_, i) =>
            dash && i === 0 ? { ...emptyTraveller("adult"), ...travellerFromProfile(getProfile()) } : emptyTraveller("adult"),
          ),
          ...Array.from({ length: children }, () => emptyTraveller("child")),
          // Each infant starts on its matching adult's lap (infants never outnumber adults).
          ...Array.from({ length: infants }, (_, i) => ({ ...emptyTraveller("infant"), guardian: String(i) })),
        ];
    setDraft(d);
    setTravellers(list);
    setErrors(list.map(() => ({})));
    setShowPassport(list.map((t) => !!t.passportNumber));
    /* eslint-enable react-hooks/set-state-in-effect */
    const t = window.setTimeout(() => setPhase("ready"), 1200);
    return () => window.clearTimeout(t);
  }, [dash]);

  const scrollTo = (s: Section) => window.setTimeout(() => sections.current[s]?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

  const persist = (patch: Partial<BookingDraft>) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      saveBooking(next);
      return next;
    });
  };

  if (phase === "missing") return <MissingBooking dash={dash} searchHref={routes.search} />;

  const search = draft?.search ?? null;
  const international = !!draft?.offer.journeys.some((j) => j.segments.some((s) => s.from.country !== "Nigeria" || s.to.country !== "Nigeria"));
  const counts = { adult: 0, child: 0, infant: 0 };
  const labels = travellers.map((t) => {
    counts[t.type] += 1;
    return `${typeInfo[t.type].label} ${counts[t.type]}`;
  });
  const travelDate = draft?.search.legs[0].date ?? "";
  const travelEnd = draft?.search.legs[draft.search.legs.length - 1].date ?? "";
  const adultOptions = travellers
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.type === "adult")
    .map(({ t, i }) => ({ value: String(i), label: [labels[i], [t.firstName, t.surname].filter(Boolean).join(" ")].filter(Boolean).join(" — ") }));

  /** Field checks plus the cross-traveller rule: one infant per adult lap. */
  const validateAll = (list: Traveller[]) =>
    list.map((t, i) => {
      const e = validateTraveller(t, { lead: i === 0, requiresPassport: international, travelDate, travelEnd, today });
      if (t.type === "infant" && t.guardian !== "" && list.some((o, j) => j !== i && o.type === "infant" && o.guardian === t.guardian))
        e.guardian = "Each adult can travel with only one infant";
      return e;
    });
  const live = validateAll(travellers);
  const touched = (t: Traveller) => !!(t.title || t.firstName || t.surname || t.gender || t.dob || t.phone || t.email || t.passportNumber);
  const statuses: TravellerStatus[] = travellers.map((t, i) =>
    Object.keys(errors[i] ?? {}).length ? "attention" : Object.keys(live[i]).length === 0 ? "complete" : touched(t) ? "progress" : "empty",
  );
  const errorCounts = errors.map((e) => Object.keys(e ?? {}).length);

  const showTraveller = (i: number) => {
    setActiveTraveller(i);
    window.setTimeout(() => sections.current.travellers?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  /** "Save & continue" on one traveller: check just that person, then move to the next. */
  const saveTraveller = () => {
    const errs = validateAll(travellers);
    setErrors((list) => list.map((x, j) => (j === activeTraveller ? errs[j] : x)));
    if (Object.keys(errs[activeTraveller]).length === 0) showTraveller(activeTraveller + 1);
  };

  const submitTravellers = () => {
    if (!draft) return;
    const errs = validateAll(travellers);
    setErrors(errs);
    const firstBad = errs.findIndex((e) => Object.keys(e).length > 0);
    if (firstBad >= 0) {
      showTraveller(firstBad);
      return;
    }
    persist({ travellers });
    setDone((d) => ({ ...d, travellers: true }));
    setOpen("addons");
    setAddonsLoading(true);
    window.setTimeout(() => setAddonsLoading(false), 800);
    scrollTo("addons");
  };

  const reserve = async () => {
    if (!draft) return;
    if (!terms) {
      setTermsError(true);
      return;
    }
    setBusy("Reserving your seat, please wait...");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve", offerId: draft.offer.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json?.error?.code === "FARE_UNAVAILABLE") {
          setAlert({
            title: "This fare is no longer available",
            message: json.error.message,
            actionLabel: "Search again",
            onAction: () => router.push(`${routes.results}?${searchToParams(draft.search)}`),
          });
        } else setAlert({ title: "Couldn't reserve this booking", message: json?.error?.message ?? "Please try again." });
        return;
      }
      persist({ reservation: json });
      setDone((d) => ({ ...d, addons: true }));
      setOpen("payment");
      scrollTo("payment");
    } catch {
      setAlert({ title: "Couldn't reserve this flight", message: "Check your connection and try again." });
    } finally {
      setBusy(null);
    }
  };

  const pay = async (method: PayMethod, reference?: string) => {
    if (!draft) return;
    setBusy(method === "paystack" ? "Verifying your payment, please wait..." : method === "hold" ? "Holding your seat, please wait..." : "Creating your booking, please wait...");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", method, reference }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message);
      const t = bookingTotals(draft);
      const final: BookingDraft = {
        ...draft,
        payment: {
          method,
          status: json.status,
          transactionRef: json.transactionRef,
          paidAt: json.paidAt,
          amount: method === "paystack" ? t.payable : t.total,
          fee: method === "paystack" ? t.gatewayFee : 0,
        },
        bookedAt: new Date().toISOString(),
      };
      saveBooking(final);
      recordBooking(final);
      router.push(`${routes.success}?payment_method=${method}${method === "hold" ? "&status=reserved" : ""}`);
    } catch (e) {
      setBusy(null);
      setAlert({ title: "Payment verification failed", message: e instanceof Error && e.message ? e.message : "Failed to verify payment. Please try again." });
    }
  };

  const changeSearch = () => search && router.push(`${routes.results}?${searchToParams(search)}`);

  const setLead = (patch: Partial<Traveller>) => {
    setTravellers((list) => list.map((x, j) => (j === 0 ? { ...x, ...patch } : x)));
    setErrors((list) => list.map((x, j) => (j === 0 ? {} : x)));
    setShowPassport((s) => s.map((v, j) => (j === 0 ? !!patch.passportNumber : v)));
  };

  return (
    <div className={cn("bg-[#f4f6f9]", !dash && "min-h-screen pb-12")}>
      <ItineraryBand
        embedded={dash}
        search={search}
        actionLabel="Change"
        onAction={changeSearch}
        // In the dashboard the top bar owns Back and the page title; the band keeps the trip summary + Change.
        before={
          !dash && (
            <div className="mb-[18px] flex items-center gap-4">
              <button
                type="button"
                onClick={changeSearch}
                className="flex items-center gap-2 rounded-full border border-white/[0.24] bg-white/[0.14] px-4 py-[9px] text-sm font-semibold text-white transition hover:bg-white/[0.22]"
              >
                <ArrowLeft className="size-4" /> Go Back
              </button>
              <span className="text-2xl font-bold tracking-[-0.01em] text-white" aria-live="polite">
                {STEP_TITLE[open]}
              </span>
            </div>
          )
        }
      />

      <div className={cn("mx-auto max-w-[1440px]", dash ? "pt-6" : "px-4 pt-[30px] sm:px-6")}>
        {phase === "validating" || !draft ? (
          <InlineLoader message="Validating flight details..." />
        ) : (
          <div className={cn("grid items-start gap-4", dash ? "xl:grid-cols-[1fr_360px]" : "lg:grid-cols-[1fr_384px]")}>
            <main className="min-w-0 space-y-4">
              <AccordionSection
                step={1}
                title="Traveller details"
                open={open === "travellers"}
                done={done.travellers}
                locked={!!draft.reservation}
                onOpen={() => setOpen("travellers")}
                innerRef={(el) => (sections.current.travellers = el)}
              >
                {travellers.length > 1 && (
                  <TravellerSwitcher
                    travellers={travellers}
                    labels={labels}
                    statuses={statuses}
                    errorCounts={errorCounts}
                    active={activeTraveller}
                    onSelect={setActiveTraveller}
                    panelId="traveller-panel"
                  />
                )}
                {dash && activeTraveller === 0 && travellers[0] && (
                  <AccountLead
                    lead={travellers[0]}
                    onUseMine={() => setLead(travellerFromProfile(getProfile()))}
                    onSomeoneElse={() => setLead({ ...emptyTraveller("adult"), type: "adult" })}
                  />
                )}
                {travellers[activeTraveller] && (
                  <div
                    key={activeTraveller}
                    id="traveller-panel"
                    role={travellers.length > 1 ? "tabpanel" : undefined}
                    aria-labelledby={travellers.length > 1 ? `traveller-tab-${activeTraveller}` : undefined}
                    className="animate-[acc-reveal_0.3s_ease]"
                  >
                    <TravellerForm
                      label={labels[activeTraveller]}
                      traveller={travellers[activeTraveller]}
                      errors={errors[activeTraveller] ?? {}}
                      lead={activeTraveller === 0}
                      today={today}
                      travelDate={travelDate}
                      travelEnd={travelEnd}
                      adults={adultOptions}
                      requiresPassport={international}
                      showPassport={showPassport[activeTraveller]}
                      onShowPassport={() => setShowPassport((s) => s.map((v, j) => (j === activeTraveller ? true : v)))}
                      onChange={(patch) => {
                        setTravellers((list) => list.map((x, j) => (j === activeTraveller ? { ...x, ...patch } : x)));
                        setErrors((list) =>
                          list.map((x, j) => (j === activeTraveller ? Object.fromEntries(Object.entries(x).filter(([k]) => !(k in patch))) : x)),
                        );
                      }}
                    />
                  </div>
                )}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  {activeTraveller > 0 ? (
                    <button
                      type="button"
                      onClick={() => showTraveller(activeTraveller - 1)}
                      className="flex items-center gap-2 rounded-xl px-4 py-[13px] text-[15px] font-semibold text-ink-500 transition hover:text-ink-900"
                    >
                      <ArrowLeft className="size-4" /> {labels[activeTraveller - 1]}
                    </button>
                  ) : (
                    <span />
                  )}
                  {activeTraveller < travellers.length - 1 ? (
                    <button
                      type="button"
                      onClick={saveTraveller}
                      className="flex items-center gap-2 rounded-xl bg-blue px-6 py-[13px] text-base font-bold text-white transition hover:bg-blue-600"
                    >
                      Save &amp; continue to {labels[activeTraveller + 1]} <ArrowRight className="size-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={submitTravellers} className="rounded-xl bg-blue px-10 py-[13px] text-base font-bold text-white transition hover:bg-blue-600">
                      Next
                    </button>
                  )}
                </div>
              </AccordionSection>

              <AccordionSection
                step={2}
                title="Add-ons"
                open={open === "addons"}
                done={done.addons}
                locked={!done.travellers || !!draft.reservation}
                onOpen={() => setOpen("addons")}
                innerRef={(el) => (sections.current.addons = el)}
              >
                {addonsLoading ? (
                  <InlineLoader message="Loading add-ons..." className="py-6" />
                ) : (
                  <>
                    <AddonsStep
                      selected={draft.addonIds ?? []}
                      paxCount={paxCount(draft.search.pax)}
                      onToggle={(id) => {
                        const ids = draft.addonIds ?? [];
                        persist({ addonIds: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });
                      }}
                    />
                    <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-[#334155]">
                      <input
                        type="checkbox"
                        checked={terms}
                        onChange={(e) => {
                          setTerms(e.target.checked);
                          setTermsError(false);
                        }}
                        className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-blue"
                      />
                      <span>
                        I have read and accept the{" "}
                        <Link href="/terms-and-conditions" target="_blank" className="font-semibold text-blue hover:underline">
                          Terms &amp; Conditions
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy-policy" target="_blank" className="font-semibold text-blue hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                    {termsError && <p className="mt-1.5 text-xs font-medium text-error">Please accept the terms and conditions to continue</p>}
                    <div className="mt-5 flex justify-end">
                      <button type="button" onClick={reserve} className="rounded-xl bg-blue px-10 py-[13px] text-base font-bold text-white transition hover:bg-blue-600">
                        Continue to Payment
                      </button>
                    </div>
                  </>
                )}
              </AccordionSection>

              <AccordionSection
                step={3}
                title="Payment"
                open={open === "payment"}
                done={false}
                locked={!draft.reservation}
                onOpen={() => setOpen("payment")}
                innerRef={(el) => (sections.current.payment = el)}
              >
                {draft.reservation ? (
                  <PaymentStep draft={draft} onPay={pay} />
                ) : (
                  <p className="text-sm text-ink-500">Complete traveller details and add-ons to unlock payment.</p>
                )}
              </AccordionSection>
            </main>

            <aside className={dash ? "xl:sticky xl:top-[80px]" : "lg:sticky lg:top-[86px]"}>
              <BookingSummary draft={draft} locked={!!draft.reservation} onPromo={(promo) => persist({ promo })} />
            </aside>
          </div>
        )}
      </div>

      <ProcessingOverlay open={!!busy} message={busy ?? ""} />
      <AlertDialog
        open={!!alert}
        title={alert?.title}
        message={alert?.message ?? ""}
        actionLabel={alert?.actionLabel}
        onClose={() => {
          const action = alert?.onAction;
          setAlert(null);
          action?.();
        }}
      />
    </div>
  );
}

/** Signed-in banner above the lead traveller: who is booking, and whether their own details are used. */
function AccountLead({ lead, onUseMine, onSomeoneElse }: { lead: Traveller; onUseMine: () => void; onSomeoneElse: () => void }) {
  const user = useProfile();
  const isMe = lead.firstName === user.firstName && lead.surname === user.surname && lead.email === user.email;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-[#d6ebfa] bg-[linear-gradient(90deg,rgba(2,144,222,0.08),rgba(2,144,222,0.02))] px-4 py-3 animate-[fade-in_0.3s_ease]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0290de,#013557)] text-sm font-bold text-white">
        {initials(user)}
      </span>
      <div className="min-w-[200px] flex-1">
        <p className="truncate text-sm font-bold text-ink-900">Booking as {fullName(user)}</p>
        <p className="text-xs text-ink-500">
          {isMe
            ? "We've filled in your profile details as the lead traveller. Check them before you continue."
            : `Enter the lead traveller's details. Your booking still appears in your account (${user.email}).`}
        </p>
      </div>
      <button
        type="button"
        onClick={isMe ? onSomeoneElse : onUseMine}
        className="press rounded-lg border border-blue bg-white px-3.5 py-2 text-[13px] max-sm:w-full font-bold text-blue transition hover:bg-sky-50"
      >
        {isMe ? "Booking for someone else?" : "Use my details"}
      </button>
    </div>
  );
}

function MissingBooking({ dash, searchHref }: { dash: boolean; searchHref: string }) {
  return (
    <div className={cn("bg-[#f4f6f9]", !dash && "min-h-screen pb-12")}>
      <ItineraryBand embedded={dash} search={null} actionLabel="" onAction={() => {}} />
      <div className="mx-auto max-w-[560px] px-4 py-16 text-center animate-[fade-up_0.35s_ease]">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Your booking session has expired</h1>
        <p className="mt-2 text-sm text-ink-500">Search again and pick a flight to continue to checkout.</p>
        <Link href={searchHref} className="mt-6 inline-block rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] px-7 py-3 text-sm font-bold text-white">
          Search flights
        </Link>
      </div>
    </div>
  );
}

