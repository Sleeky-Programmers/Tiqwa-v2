"use client";

import { useId, type ReactNode } from "react";
import { DatePicker } from "@/components/home/search/DatePicker";
import { CountryPicker } from "@/components/ui/CountryPicker";
import { Select } from "@/components/ui/Select";
import { getCountry } from "@/data/countries";
import type { Traveller } from "@/lib/booking/store";
import { cn } from "@/lib/utils";

export type TravellerErrors = Partial<Record<keyof Traveller, string>>;

export const emptyTraveller = (type: Traveller["type"]): Traveller => ({
  type,
  title: "",
  firstName: "",
  middleName: "",
  surname: "",
  gender: "",
  dob: "",
  country: "NG",
  phone: "",
  email: "",
  passportNumber: "",
  passportIssued: "",
  passportExpiry: "",
  passportCountry: "NG",
  guardian: "",
});

/** What changes per traveller type: titles, age band and the hints shown with the inputs. */
export const typeInfo = {
  adult: { label: "Adult", age: "12+ years", dobHint: "12 years or older on the travel date", titles: ["Mr.", "Mrs.", "Ms."] },
  child: { label: "Child", age: "2–11 years", dobHint: "2–11 years old on the travel date", titles: ["Master", "Miss"] },
  infant: { label: "Infant", age: "Under 2 years", dobHint: "Under 2 years old on the travel date", titles: ["Master", "Miss"] },
} as const;
const genders = ["Male", "Female", "Other"];

const shift = (iso: string, years: number, days = 0) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y + years, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

/** Birth-date window for a traveller type, measured against the (first) travel date. */
export function dobRange(type: Traveller["type"], travelDate: string, today: string) {
  if (type === "adult") return { min: shift(travelDate, -100, 1), max: shift(travelDate, -12) };
  if (type === "child") return { min: shift(travelDate, -12, 1), max: shift(travelDate, -2) };
  return { min: shift(travelDate, -2, 1), max: today && today < travelDate ? today : travelDate };
}

const yearsBetween = (from: string, to: string) => {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return y2 - y1 - (m2 < m1 || (m2 === m1 && d2 < d1) ? 1 : 0);
};

/** Field rules mirror tbils.com's checkout messages. */
export function validateTraveller(
  t: Traveller,
  ctx: { lead: boolean; requiresPassport: boolean; travelDate: string; travelEnd: string; today: string },
): TravellerErrors {
  const e: TravellerErrors = {};
  const req = "This field is required";
  if (!t.title) e.title = req;
  if (!/^[A-Za-z][A-Za-z' -]{1,}$/.test(t.firstName.trim())) e.firstName = t.firstName.trim() ? "Use letters only, at least 2" : req;
  if (!/^[A-Za-z][A-Za-z' -]{1,}$/.test(t.surname.trim())) e.surname = t.surname.trim() ? "Use letters only, at least 2" : req;
  if (!t.gender) e.gender = req;
  if (!t.dob) e.dob = req;
  else {
    const age = yearsBetween(t.dob, ctx.travelDate);
    if (t.type === "adult" && age < 12) e.dob = "Adults must be 12 or older on the travel date";
    if (t.type === "child" && (age < 2 || age > 11)) e.dob = "Children must be 2–11 years on the travel date";
    if (t.type === "infant" && (age >= 2 || t.dob > ctx.today)) e.dob = "Infants must be under 2 on the travel date";
  }
  if (t.type === "infant" && t.guardian === "") e.guardian = "Choose the adult this infant travels with";
  if (ctx.lead) {
    if (!t.phone.trim()) e.phone = req;
    else if (!/^\d{7,12}$/.test(t.phone.replace(/\s/g, ""))) e.phone = "Please enter a valid phone number";
    if (!t.email.trim()) e.email = req;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email.trim())) e.email = "Please enter a valid email";
  }
  const passportStarted = !!(t.passportNumber || t.passportIssued || t.passportExpiry);
  if (ctx.requiresPassport || passportStarted) {
    if (!/^[A-Za-z0-9]{6,9}$/.test(t.passportNumber.trim())) e.passportNumber = t.passportNumber.trim() ? "Enter a valid passport number" : req;
    if (!t.passportIssued) e.passportIssued = req;
    else if (t.passportIssued >= ctx.today || (t.passportExpiry && t.passportIssued >= t.passportExpiry))
      e.passportIssued = "Issue date must be in the past and before expiry";
    if (!t.passportExpiry) e.passportExpiry = req;
    else if (t.passportExpiry <= ctx.today) e.passportExpiry = "Passport expiry must be a future date";
    else if (t.passportExpiry <= ctx.travelEnd) e.passportExpiry = "Passport must be valid beyond your trip";
    if (!t.passportCountry) e.passportCountry = req;
  }
  return e;
}

const labelCls = "mb-[5px] block text-sm text-[#1d1d1d]";
const inputCls =
  "h-[45px] w-full rounded-[10px] border border-[#e4e8ee] bg-white px-3.5 text-[15px] text-ink-900 placeholder:text-[#9ca3af] transition-colors hover:border-blue focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20";

function Field({ label, error, children, id }: { label: string; error?: string; children: ReactNode; id: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * One passenger's form (tbils.com checkout step 1). Inputs adapt to the traveller type:
 * titles, the birth-date window the calendar allows, contact fields (adults only) and,
 * for infants, which adult they travel with.
 */
export function TravellerForm({
  label,
  traveller,
  errors,
  lead,
  requiresPassport,
  showPassport,
  onShowPassport,
  onChange,
  today,
  travelDate,
  travelEnd,
  adults,
}: {
  label: string;
  traveller: Traveller;
  errors: TravellerErrors;
  lead: boolean;
  requiresPassport: boolean;
  showPassport: boolean;
  onShowPassport: () => void;
  onChange: (patch: Partial<Traveller>) => void;
  today: string;
  travelDate: string;
  travelEnd: string;
  /** Adults on the booking, for an infant's "travels with" choice. */
  adults: { value: string; label: string }[];
}) {
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const err = (k: keyof Traveller) => errors[k];
  const info = typeInfo[traveller.type];
  const dob = dobRange(traveller.type, travelDate, today);
  const text = (k: keyof Traveller, placeholder: string, extra?: { type?: string; autoComplete?: string }) => (
    <input
      id={id(k)}
      value={traveller[k]}
      onChange={(e) => onChange({ [k]: e.target.value })}
      placeholder={placeholder}
      aria-invalid={!!err(k) || undefined}
      aria-describedby={err(k) ? `${id(k)}-err` : undefined}
      className={cn(inputCls, err(k) && "border-error")}
      {...extra}
    />
  );
  const dial = getCountry(traveller.country)?.dial ?? "+234";
  const dateField = "h-[45px] rounded-[10px] border-[#e4e8ee]";
  const errorText = (k: keyof Traveller) =>
    err(k) && (
      <p id={`${id(k)}-err`} className="mt-1 text-xs font-medium text-error">
        {err(k)}
      </p>
    );

  return (
    <div data-traveller className="rounded-[14px] border border-[#eef1f5] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4">
        <h3 className="text-lg font-bold text-ink-900">{label}</h3>
        <span className="rounded-full bg-[rgba(2,144,222,0.08)] px-3 py-1 text-xs font-semibold text-blue">
          {info.label} · {info.age}
          {lead ? " · Lead passenger" : ""}
        </span>
      </div>
      <div className="border-b border-[#eef1f5] px-5 pb-3 pt-4">
        <h4 className="text-base font-semibold text-ink-900">1. Personal data</h4>
      </div>
      <div className="grid gap-x-3.5 gap-y-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.15fr_1fr]">
        <Field label="Title" id={id("title")} error={err("title")}>
          <Select
            label="Title"
            value={traveller.title}
            options={info.titles}
            onChange={(v) => onChange({ title: v })}
            triggerClassName={cn("h-[45px]", err("title") && "border-error")}
          />
        </Field>
        <Field label="First Name" id={id("firstName")} error={err("firstName")}>
          {text("firstName", "Enter name", { autoComplete: "given-name" })}
        </Field>
        <Field label="Surname" id={id("surname")} error={err("surname")}>
          {text("surname", "Enter name", { autoComplete: "family-name" })}
        </Field>
        <Field label="Middle Name (option)" id={id("middleName")}>
          {text("middleName", "Enter name", { autoComplete: "additional-name" })}
        </Field>
        <Field label="Gender" id={id("gender")} error={err("gender")}>
          <Select
            label="Gender"
            value={traveller.gender}
            options={genders}
            placeholder="Select gender"
            onChange={(v) => onChange({ gender: v })}
            triggerClassName={cn("h-[45px]", err("gender") && "border-error")}
          />
        </Field>
        <div className="min-w-0">
          <DatePicker
            key={traveller.type}
            name={id("dob")}
            title="Date of birth"
            value={traveller.dob}
            min={dob.min}
            max={dob.max}
            format="dmy"
            jump
            placeholder="DD / MMM / YYYY"
            invalid={!!err("dob")}
            describedBy={err("dob") ? `${id("dob")}-err` : `${id("dob")}-hint`}
            onChange={(v) => onChange({ dob: v })}
            labelClassName={labelCls}
            fieldClassName={dateField}
          />
          {err("dob") ? (
            errorText("dob")
          ) : (
            <p id={`${id("dob")}-hint`} className="mt-1 text-xs text-ink-500">
              {info.dobHint}
            </p>
          )}
        </div>

        {traveller.type === "adult" && (
          <>
            <Field label="Country" id={id("country")}>
              <CountryPicker label="Phone country" variant="dial" value={traveller.country} onChange={(v) => onChange({ country: v })} />
            </Field>
            <Field label={lead ? "Phone Number" : "Phone Number (optional)"} id={id("phone")} error={err("phone")}>
              <div
                className={cn(
                  "flex h-[45px] overflow-hidden rounded-[10px] border border-[#e4e8ee] bg-white focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20",
                  err("phone") && "border-error",
                )}
              >
                <span className="flex items-center bg-[#f5f5f5] px-2.5 text-[15px] font-medium text-ink-900">{dial}</span>
                <input
                  id={id("phone")}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={traveller.phone}
                  onChange={(e) => onChange({ phone: e.target.value.replace(/[^\d ]/g, "") })}
                  placeholder="1234567890"
                  aria-invalid={!!err("phone") || undefined}
                  className="min-w-0 flex-1 px-3 text-[15px] focus:outline-none"
                />
              </div>
            </Field>
            <Field label={lead ? "Email" : "Email (optional)"} id={id("email")} error={err("email")}>
              {text("email", "Enter email", { type: "email", autoComplete: "email" })}
            </Field>
          </>
        )}

        {traveller.type === "infant" && (
          <Field label="Travels on the lap of" id={id("guardian")} error={err("guardian")}>
            <Select
              label="Accompanying adult"
              value={traveller.guardian}
              options={adults}
              placeholder="Select adult"
              onChange={(v) => onChange({ guardian: v })}
              triggerClassName={cn("h-[45px]", err("guardian") && "border-error")}
            />
          </Field>
        )}

        {traveller.type !== "adult" && (
          <p className="self-end rounded-lg bg-tint-100 px-3 py-2.5 text-xs leading-[1.5] text-ink-500 sm:col-span-2 lg:col-span-1">
            {traveller.type === "child"
              ? "We'll use the lead passenger's phone and email for this child's booking updates."
              : "Infants don't get their own seat. We'll send updates to the lead passenger."}
          </p>
        )}
      </div>

      {showPassport || requiresPassport ? (
        <>
          <div className="flex flex-wrap items-center gap-2 border-y border-[#eef1f5] px-5 pb-3 pt-5">
            <h4 className="text-base font-semibold text-ink-900">Passport Details</h4>
            <span className="rounded-full bg-[rgba(252,201,167,0.33)] px-2.5 py-1 text-[10px] text-[#f60]">Enter details exactly as shown on passport</span>
          </div>
          <div className="grid gap-x-3.5 gap-y-4 px-5 py-4 sm:grid-cols-3">
            <Field label="Passport Number" id={id("passportNumber")} error={err("passportNumber")}>
              {text("passportNumber", "E.g. A1234567")}
            </Field>
            <div className="min-w-0">
              <DatePicker
                name={id("passportIssued")}
                title="Issuing Date"
                value={traveller.passportIssued}
                min={traveller.dob || undefined}
                max={today}
                format="dmy"
                jump
                placeholder="DD / MMM / YYYY"
                invalid={!!err("passportIssued")}
                onChange={(v) => onChange({ passportIssued: v })}
                labelClassName={labelCls}
                fieldClassName={dateField}
              />
              {errorText("passportIssued")}
            </div>
            <div className="min-w-0">
              <DatePicker
                name={id("passportExpiry")}
                title="Expiry Date"
                value={traveller.passportExpiry}
                min={travelEnd || today}
                format="dmy"
                jump
                placeholder="DD / MMM / YYYY"
                invalid={!!err("passportExpiry")}
                onChange={(v) => onChange({ passportExpiry: v })}
                labelClassName={labelCls}
                fieldClassName={dateField}
              />
              {errorText("passportExpiry")}
            </div>
            <Field label="Issuing Country" id={id("passportCountry")} error={err("passportCountry")}>
              <CountryPicker label="Issuing country" value={traveller.passportCountry} onChange={(v) => onChange({ passportCountry: v })} />
            </Field>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-3 border-t border-[#eef1f5] px-5 py-4">
          <button type="button" onClick={onShowPassport} className="text-sm font-bold text-blue hover:underline">
            + Add passport details
          </button>
          <span className="text-xs text-ink-500">Optional for this domestic flight</span>
        </div>
      )}
    </div>
  );
}
