"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { CircleCheck, Minus, Plus } from "lucide-react";
import { Field, inputCls, postJson, spinner, type Errors } from "@/components/ui/form";
import { useProfile } from "@/lib/account";
import { cn, formatNaira } from "@/lib/utils";

function Counter({
  label,
  value,
  min,
  max,
  onChange,
  error,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  error?: string;
}) {
  const btn =
    "grid size-[45px] shrink-0 place-items-center rounded-[10px] border border-[#e4e8ee] text-ink-700 transition-colors hover:border-blue hover:text-blue disabled:opacity-40 disabled:hover:border-[#e4e8ee] disabled:hover:text-ink-700";
  return (
    <Field label={label} error={error}>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
          <Minus className="size-4" />
        </button>
        <span aria-live="polite" className="min-w-8 flex-1 text-center text-[15px] font-semibold text-ink-900">
          {value}
        </span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>
          <Plus className="size-4" />
        </button>
      </div>
    </Field>
  );
}

/** Holiday package reservation request → /api/packages/reserve. The team confirms the final price after. */
export function PackageReserve({ packageId, title }: { packageId: string; title: string }) {
  const id = useId();
  const user = useProfile();
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is client-only (reading it during render breaks prerendering)
    setToday(new Date().toISOString().slice(0, 10));
  }, []);
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", phone: "", departureDate: "", returnDate: "", adults: 2, children: 0 });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ total: number } | null>(null);
  const firstName = v.firstName || user.firstName;
  const lastName = v.lastName || user.surname;
  const email = v.email || user.email;
  const phone = v.phone || user.phone;
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { errors, data } = await postJson<{ total: number }>("/api/packages/reserve", { ...v, firstName, lastName, email, phone, packageId });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    setDone({ total: data?.total ?? 0 });
  };

  if (done) {
    return (
      <div className="mt-5 rounded-2xl bg-[#f0fdf4] p-5 text-center animate-[rise-in_0.4s_cubic-bezier(0.16,1,0.3,1)]">
        <span className="glow-ring mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#dcfce7] text-[#16a34a]">
          <CircleCheck className="size-6" />
        </span>
        <p className="font-display text-lg font-extrabold text-ink-900">Reservation request sent</p>
        <p className="mt-1 text-sm text-ink-500">
          We&apos;ve received your request for {title}
          {done.total > 0 && <> ({formatNaira(done.total)} estimated)</>}. Our team will contact you on {email} to confirm the details.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 grid gap-3.5 border-t border-[#eef1f5] pt-5">
      <p className="font-display text-base font-extrabold text-ink-900">Reserve this package</p>
      {errors.form && <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{errors.form}</p>}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
      </div>
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
          value={phone}
          onChange={(e) => set({ phone: e.target.value })}
          className={cn(inputCls, errors.phone && "border-error")}
        />
      </Field>
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Field label="Departure" htmlFor={`${id}-dep`} error={errors.departureDate}>
          <input
            id={`${id}-dep`}
            type="date"
            min={today || undefined}
            value={v.departureDate}
            onChange={(e) => set({ departureDate: e.target.value })}
            className={cn(inputCls, errors.departureDate && "border-error")}
          />
        </Field>
        <Field label="Return" htmlFor={`${id}-ret`} error={errors.returnDate}>
          <input
            id={`${id}-ret`}
            type="date"
            min={v.departureDate || today || undefined}
            value={v.returnDate}
            onChange={(e) => set({ returnDate: e.target.value })}
            className={cn(inputCls, errors.returnDate && "border-error")}
          />
        </Field>
        <Counter label="Adults" value={v.adults} min={1} max={9} onChange={(n) => set({ adults: n })} error={errors.adults} />
        <Counter label="Children" value={v.children} min={0} max={9} onChange={(n) => set({ children: n })} error={errors.children} />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="press flex h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-orange text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(245,134,52,0.3)] hover:bg-orange-600 disabled:opacity-60"
      >
        {busy && spinner}
        {busy ? "Sending…" : "Reserve this package"}
      </button>
      <p className="text-center text-xs text-ink-500">No payment now. We confirm availability and the final price first.</p>
    </form>
  );
}
