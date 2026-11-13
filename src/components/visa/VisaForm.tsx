"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CircleCheck, Send } from "lucide-react";
import { CountryPicker } from "@/components/ui/CountryPicker";
import { Field, inputCls, postJson, spinner, type Errors } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import { getCountry } from "@/data/countries";
import { useProfile } from "@/lib/account";
import { cn } from "@/lib/utils";

const MARITAL = ["Single", "Married", "Divorced", "Widowed"];
const empty = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  residentCountry: "NG",
  destinationCountry: "",
  dateOfBirth: "",
  maritalStatus: "",
  hasPassport: null as boolean | null,
  hasTravelHistory: null as boolean | null,
  message: "",
};

function YesNo({ label, value, onChange, error }: { label: string; value: boolean | null; onChange: (v: boolean) => void; error?: string }) {
  return (
    <Field label={label} error={error}>
      <div role="radiogroup" aria-label={label} className="flex gap-2">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            type="button"
            role="radio"
            aria-checked={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              "press h-[45px] flex-1 rounded-[10px] border text-[15px] font-semibold transition-colors",
              value === opt ? "border-blue bg-sky-50 text-blue" : "border-[#e4e8ee] bg-white text-ink-700 hover:border-blue",
              error && value === null && "border-error",
            )}
          >
            {opt ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </Field>
  );
}

/** Visa assistance enquiry → /api/enquiries/visa. Prefills name and email from the signed-in account. */
export function VisaForm() {
  const id = useId();
  const user = useProfile();
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is client-only (reading it during render breaks prerendering)
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const [v, setV] = useState(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const firstName = v.firstName || user.firstName;
  const lastName = v.lastName || user.surname;
  const email = v.email || user.email;
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { errors } = await postJson("/api/enquiries/visa", {
      ...v,
      firstName,
      lastName,
      email,
      residentCountry: getCountry(v.residentCountry)?.name ?? "",
      destinationCountry: getCountry(v.destinationCountry)?.name ?? "",
    });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-[20px] border border-[#e3ebf3] bg-white p-8 text-center shadow-[0_18px_44px_rgba(1,40,74,0.08)] animate-[rise-in_0.45s_cubic-bezier(0.16,1,0.3,1)]">
        <span className="glow-ring mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
          <CircleCheck className="size-8" />
        </span>
        <h2 className="font-display text-2xl font-extrabold text-ink-900">Enquiry received</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
          Thanks, {firstName || "there"}. Our visa team will contact you on {email} shortly.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setV(empty);
          }}
          className="link-underline mt-5 text-sm font-semibold text-blue"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[20px] border border-[#e3ebf3] bg-white p-6 shadow-[0_18px_44px_rgba(1,40,74,0.08)] sm:p-8">
      <h2 className="font-display text-2xl font-extrabold text-ink-900">Visa assistance enquiry</h2>
      <p className="mt-1 text-sm text-ink-500">A few details help our team advise you properly.</p>
      {errors.form && <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{errors.form}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor={`${id}-fn`} error={errors.firstName}>
          <input
            id={`${id}-fn`}
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => set({ firstName: e.target.value })}
            className={cn(inputCls, errors.firstName && "border-error")}
          />
        </Field>
        <Field label="Last name" htmlFor={`${id}-ln`} error={errors.lastName}>
          <input
            id={`${id}-ln`}
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => set({ lastName: e.target.value })}
            className={cn(inputCls, errors.lastName && "border-error")}
          />
        </Field>
        <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => set({ email: e.target.value })}
            className={cn(inputCls, errors.email && "border-error")}
          />
        </Field>
        <Field label="Phone" htmlFor={`${id}-phone`} error={errors.phone}>
          <input
            id={`${id}-phone`}
            type="tel"
            autoComplete="tel"
            value={v.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className={cn(inputCls, errors.phone && "border-error")}
          />
        </Field>
        <Field label="Country you live in" error={errors.residentCountry}>
          <CountryPicker
            label="Country you live in"
            value={v.residentCountry}
            onChange={(c) => set({ residentCountry: c })}
            invalid={!!errors.residentCountry}
          />
        </Field>
        <Field label="Country you want to visit" error={errors.destinationCountry}>
          <CountryPicker
            label="Country you want to visit"
            value={v.destinationCountry}
            onChange={(c) => set({ destinationCountry: c })}
            invalid={!!errors.destinationCountry}
          />
        </Field>
        <Field label="Date of birth" htmlFor={`${id}-dob`} error={errors.dateOfBirth}>
          <input
            id={`${id}-dob`}
            type="date"
            autoComplete="bday"
            max={today || undefined}
            value={v.dateOfBirth}
            onChange={(e) => set({ dateOfBirth: e.target.value })}
            className={cn(inputCls, errors.dateOfBirth && "border-error")}
          />
        </Field>
        <Field label="Marital status" error={errors.maritalStatus}>
          <Select
            label="Marital status"
            value={v.maritalStatus}
            placeholder="Choose one"
            options={MARITAL}
            onChange={(x) => set({ maritalStatus: x })}
            triggerClassName="h-[45px]"
          />
        </Field>
        <YesNo label="Do you have a passport?" value={v.hasPassport} onChange={(x) => set({ hasPassport: x })} error={errors.hasPassport} />
        <YesNo
          label="Have you travelled abroad before?"
          value={v.hasTravelHistory}
          onChange={(x) => set({ hasTravelHistory: x })}
          error={errors.hasTravelHistory}
        />
        <div className="sm:col-span-2">
          <Field label="Message" htmlFor={`${id}-msg`} error={errors.message}>
            <textarea
              id={`${id}-msg`}
              rows={4}
              value={v.message}
              onChange={(e) => set({ message: e.target.value })}
              placeholder="Purpose of travel, planned dates and anything else we should know."
              className={cn(inputCls, "h-auto py-3", errors.message && "border-error")}
            />
          </Field>
        </div>
      </div>
      <button
        type="submit"
        disabled={busy}
        className="press mt-6 flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#0290de,#014e78)] text-[15px] font-bold text-white disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {busy ? spinner : <Send className="size-4" />}
        {busy ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}
