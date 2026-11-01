"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Award, KeyRound, Mail, MailCheck, Phone, UserRound } from "lucide-react";
import { OtpInput } from "@/components/auth/OtpInput";
import { DatePicker, formatDmy } from "@/components/home/search/DatePicker";
import { CountryPicker } from "@/components/ui/CountryPicker";
import { Field, PasswordInput, PasswordRules, PasswordStrength, dateField, inputCls, labelCls, passwordOk, postJson, type Errors } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { flag, getCountry } from "@/data/countries";
import type { UserProfile } from "@/data/dashboard/user";
import { fullName, initials, saveProfile, useProfile, useSession } from "@/lib/account";
import { cn } from "@/lib/utils";
import { useRewards } from "./useRewards";
import { cardCls, ghostBtn, primaryBtn, SectionCard } from "./ui";

/** Name and phone are stored by the backend; the full phone goes as +<dial><number>. */
const backendPhone = (u: Pick<UserProfile, "country" | "phone">) => (u.phone ? `${getCountry(u.country)?.dial ?? "+234"}${u.phone.replace(/\D/g, "").replace(/^0/, "")}` : "");

async function submit(action: string, body: Record<string, unknown>): Promise<Errors> {
  return (await postJson("/api/account", { action, ...body })).errors;
}

function FormActions({ dirty, saving, onCancel, label = "Save changes" }: { dirty: boolean; saving: boolean; onCancel: () => void; label?: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f5] pt-4">
      <button type="button" onClick={onCancel} disabled={!dirty || saving} className={cn(ghostBtn, "disabled:opacity-40")}>
        Cancel
      </button>
      <button type="submit" disabled={!dirty || saving} className={primaryBtn}>
        {saving && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

/** Generic "edit a slice of the profile" form state. */
function useSliceForm<K extends keyof UserProfile>(keys: K[]) {
  const user = useProfile();
  const pick = () => Object.fromEntries(keys.map((k) => [k, user[k]])) as Pick<UserProfile, K>;
  const [values, setValues] = useState(pick);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const source = JSON.stringify(pick());
  // Re-sync when the stored profile changes (first client read, or another form saved).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setValues(JSON.parse(source)), [source]);
  const dirty = JSON.stringify(values) !== source;
  const set = (patch: Partial<Pick<UserProfile, K>>) => {
    setValues((v) => ({ ...v, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };
  const reset = () => {
    setValues(JSON.parse(source));
    setErrors({});
  };
  return { values, set, errors, setErrors, saving, setSaving, dirty, reset };
}

function NameForm() {
  const user = useProfile();
  const f = useSliceForm(["title", "firstName", "middleName", "surname"]);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    f.setSaving(true);
    const errs = await submit("name", { ...f.values, phone: backendPhone(user) });
    f.setSaving(false);
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    saveProfile({ ...f.values, firstName: f.values.firstName.trim(), surname: f.values.surname.trim(), middleName: f.values.middleName.trim() });
    toast.success("Your name has been updated.");
  };
  return (
    <SectionCard title="Update name" description="Use your name exactly as it appears on your passport.">
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[140px_1fr_1fr_1fr]">
          <Field label="Title">
            <Select label="Title" value={f.values.title} options={["Mr.", "Mrs.", "Ms.", "Dr."]} onChange={(v) => f.set({ title: v })} triggerClassName="h-[45px]" />
          </Field>
          {(
            [
              ["firstName", "First name", "given-name"],
              ["middleName", "Middle name (optional)", "additional-name"],
              ["surname", "Surname", "family-name"],
            ] as const
          ).map(([k, label, ac]) => (
            <Field key={k} label={label} htmlFor={`name-${k}`} error={f.errors[k]}>
              <input
                id={`name-${k}`}
                value={f.values[k]}
                autoComplete={ac}
                onChange={(e) => f.set({ [k]: e.target.value })}
                aria-invalid={!!f.errors[k] || undefined}
                className={cn(inputCls, f.errors[k] && "border-error")}
              />
            </Field>
          ))}
        </div>
        {f.errors.form && <p className="mt-3 text-sm font-medium text-error">{f.errors.form}</p>}
        <FormActions dirty={f.dirty} saving={f.saving} onCancel={f.reset} />
      </form>
    </SectionCard>
  );
}

function DetailsForm({ today }: { today: string }) {
  const user = useProfile();
  const { live } = useSession();
  const f = useSliceForm(["email", "country", "phone", "dob", "gender", "nationality", "passportNumber", "passportIssued", "passportExpiry", "passportCountry"]);
  const dial = getCountry(f.values.country)?.dial ?? "+234";
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (f.values.passportNumber && !/^[A-Za-z0-9]{6,9}$/.test(f.values.passportNumber)) local.passportNumber = "Enter a valid passport number";
    if (f.values.passportIssued && f.values.passportIssued > today) local.passportIssued = "Issuing date can't be in the future";
    if (f.values.passportExpiry && f.values.passportExpiry <= today) local.passportExpiry = "Passport expiry must be a future date";
    if (Object.keys(local).length) return f.setErrors(local);
    f.setSaving(true);
    if (!live && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.values.email.trim())) return f.setErrors({ email: "Please enter a valid email" });
    const errs = await submit("details", { firstName: user.firstName, surname: user.surname, phone: backendPhone(f.values) });
    f.setSaving(false);
    f.setErrors(errs);
    if (Object.keys(errs).length) return;
    saveProfile({ ...f.values, email: f.values.email.trim(), passportNumber: f.values.passportNumber.toUpperCase() });
    toast.success("Contact and travel details saved.");
  };
  return (
    <SectionCard
      title="Contact & travel details"
      description={live ? "Your phone is saved to your account. Travel details are saved on this device to pre-fill bookings." : "We use these to pre-fill your bookings and send trip updates."}
    >
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Email address" htmlFor="det-email" error={f.errors.email} hint={live ? "This is your sign-in email and can't be changed here." : undefined}>
            <input
              id="det-email"
              type="email"
              autoComplete="email"
              value={f.values.email}
              readOnly={live}
              onChange={(e) => f.set({ email: e.target.value })}
              className={cn(inputCls, live && "cursor-not-allowed bg-tint-100 text-ink-500", f.errors.email && "border-error")}
            />
          </Field>
          <Field label="Phone country">
            <CountryPicker label="Phone country" variant="dial" value={f.values.country} onChange={(v) => f.set({ country: v })} />
          </Field>
          <Field label="Phone number" htmlFor="det-phone" error={f.errors.phone}>
            <div className={cn("flex h-[45px] overflow-hidden rounded-[10px] border border-[#e4e8ee] bg-white focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20", f.errors.phone && "border-error")}>
              <span className="flex items-center bg-[#f5f5f5] px-2.5 text-[15px] font-medium text-ink-900">{dial}</span>
              <input
                id="det-phone"
                inputMode="numeric"
                autoComplete="tel-national"
                value={f.values.phone}
                onChange={(e) => f.set({ phone: e.target.value.replace(/[^\d ]/g, "") })}
                className="min-w-0 flex-1 px-3 text-[15px] focus:outline-none"
              />
            </div>
          </Field>
          <DatePicker
            name="det-dob"
            title="Date of birth"
            value={f.values.dob}
            max={today || undefined}
            format="dmy"
            jump
            placeholder="DD / MMM / YYYY"
            onChange={(v) => f.set({ dob: v })}
            labelClassName={labelCls}
            fieldClassName={dateField}
          />
          <Field label="Gender">
            <Select label="Gender" value={f.values.gender} options={["Male", "Female"]} onChange={(v) => f.set({ gender: v })} triggerClassName="h-[45px]" />
          </Field>
          <Field label="Nationality">
            <CountryPicker label="Nationality" value={f.values.nationality} onChange={(v) => f.set({ nationality: v })} />
          </Field>
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold text-ink-900">Saved passport</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Passport number" htmlFor="det-pp" error={f.errors.passportNumber}>
            <input id="det-pp" value={f.values.passportNumber} onChange={(e) => f.set({ passportNumber: e.target.value })} placeholder="E.g. A1234567" className={cn(inputCls, "uppercase", f.errors.passportNumber && "border-error")} />
          </Field>
          <div>
            <DatePicker
              name="det-ppiss"
              title="Issuing date"
              value={f.values.passportIssued}
              max={today || undefined}
              format="dmy"
              jump
              placeholder="DD / MMM / YYYY"
              invalid={!!f.errors.passportIssued}
              onChange={(v) => f.set({ passportIssued: v })}
              labelClassName={labelCls}
              fieldClassName={dateField}
            />
            {f.errors.passportIssued && <p className="mt-1 text-xs font-medium text-error">{f.errors.passportIssued}</p>}
          </div>
          <div>
            <DatePicker
              name="det-ppexp"
              title="Expiry date"
              value={f.values.passportExpiry}
              min={today || undefined}
              format="dmy"
              jump
              placeholder="DD / MMM / YYYY"
              invalid={!!f.errors.passportExpiry}
              onChange={(v) => f.set({ passportExpiry: v })}
              labelClassName={labelCls}
              fieldClassName={dateField}
            />
            {f.errors.passportExpiry && <p className="mt-1 text-xs font-medium text-error">{f.errors.passportExpiry}</p>}
          </div>
          <Field label="Issuing country">
            <CountryPicker label="Issuing country" value={f.values.passportCountry} onChange={(v) => f.set({ passportCountry: v })} />
          </Field>
        </div>
        {f.errors.form && <p className="mt-3 text-sm font-medium text-error">{f.errors.form}</p>}
        <FormActions dirty={f.dirty} saving={f.saving} onCancel={f.reset} />
      </form>
    </SectionCard>
  );
}

function PasswordForm() {
  const id = useId();
  const user = useProfile();
  const [step, setStep] = useState<"start" | "code">("start");
  const [v, setV] = useState({ code: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };
  const reset = () => {
    setStep("start");
    setV({ code: "", next: "", confirm: "" });
    setErrors({});
  };

  const sendCode = async () => {
    setBusy(true);
    const { errors, status } = await postJson("/api/auth/forgot-password", { email: user.email });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors({ form: status === 429 ? "Too many requests. Please wait a minute and try again." : errors.form ?? errors.email });
    setStep("code");
    toast.success(`We sent a 6-digit code to ${user.email}.`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (v.code.length !== 6) local.code = "Enter the 6-digit code from your email";
    if (!passwordOk(v.next)) local.next = "Password doesn't meet the requirements";
    if (!v.confirm) local.confirm = "Confirm your new password";
    else if (v.confirm !== v.next) local.confirm = "Passwords don't match";
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    const { errors } = await postJson("/api/auth/reset-password", { email: user.email, code: v.code, password: v.next });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors({ ...errors, ...(errors.password ? { next: errors.password } : {}) });
    reset();
    toast.success("Password changed. Use your new password next time you sign in.");
  };

  return (
    <SectionCard title="Change password" description="For your security we confirm the change with a code sent to your email.">
      {step === "start" ? (
        <div className="flex flex-wrap items-center justify-between gap-4 animate-[fade-in_0.3s_ease]">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[rgba(2,144,222,0.1)] text-blue">
              <KeyRound className="size-5" />
            </span>
            <p className="max-w-[420px] text-sm text-ink-500">
              We&apos;ll email a 6-digit code to <strong className="text-ink-900">{user.email || "your email"}</strong>. Enter it with your new password to finish.
            </p>
          </div>
          <button type="button" onClick={sendCode} disabled={busy || !user.email} className={cn(primaryBtn, "press")}>
            {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy ? "Sending…" : "Send code"}
          </button>
          {errors.form && <p className="w-full text-sm font-medium text-error">{errors.form}</p>}
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="grid gap-6 animate-[acc-reveal_0.3s_ease] lg:grid-cols-[1fr_260px]">
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm text-ink-500">
              <MailCheck className="size-4 text-blue" /> Code sent to <strong className="text-ink-900">{user.email}</strong>
              <button type="button" onClick={sendCode} disabled={busy} className="link-underline ml-1 font-semibold text-blue">
                Resend
              </button>
            </p>
            <Field label="Verification code" error={errors.code}>
              <OtpInput value={v.code} invalid={!!errors.code} onChange={(c) => set({ code: c })} />
            </Field>
            <Field label="New password" htmlFor={`${id}-new`} error={errors.next}>
              <PasswordInput id={`${id}-new`} value={v.next} onChange={(x) => set({ next: x })} error={errors.next} autoComplete="new-password" />
            </Field>
            <PasswordStrength value={v.next} />
            <Field label="Confirm new password" htmlFor={`${id}-conf`} error={errors.confirm}>
              <PasswordInput id={`${id}-conf`} value={v.confirm} onChange={(x) => set({ confirm: x })} error={errors.confirm} autoComplete="new-password" />
            </Field>
            {errors.form && <p className="text-sm font-medium text-error">{errors.form}</p>}
          </div>
          <PasswordRules value={v.next} />
          <div className="lg:col-span-2">
            <FormActions dirty saving={busy} label="Update password" onCancel={reset} />
          </div>
        </form>
      )}
    </SectionCard>
  );
}

/** /dashboard/profile — account overview, update name, contact & travel details, change password. */
export function ProfilePage() {
  const user = useProfile();
  const rewards = useRewards();
  const [today, setToday] = useState("");
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is client-only
    setToday(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }, []);
  const nat = getCountry(user.nationality);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
      <aside className={cn(cardCls, "overflow-hidden xl:sticky xl:top-[88px] animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]")}>
        <div className="relative h-24 bg-[linear-gradient(140deg,#0a1628,#013557_45%,#0290de)]" />
        <div className="relative -mt-10 px-5 pb-5">
          <span className="relative z-10 grid size-20 place-items-center rounded-full border-4 border-white shadow-[0_6px_16px_rgba(1,40,74,0.18)] bg-[linear-gradient(140deg,#013557,#0290de)] font-display text-2xl font-extrabold text-white">{initials(user)}</span>
          <h2 className="mt-3 font-display text-xl font-extrabold text-ink-900">
            {user.title} {fullName(user)}
          </h2>
          {user.memberSince && (
            <p className="text-sm text-ink-500">Member since {new Date(user.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          )}
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[rgba(245,134,52,0.1)] p-3">
            <Award className="size-6 text-orange" />
            <div>
              <p className="text-sm font-bold text-ink-900">{rewards.data?.live ? "Referral rewards" : `${user.tier} member`}</p>
              <p className="text-xs text-ink-500">
                {rewards.data?.live ? `₦${rewards.data.total.toLocaleString("en-NG")} earned · code ${rewards.data.code || "—"}` : `${user.points.toLocaleString("en-NG")} TBiLS points`}
              </p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              [Mail, "Email", user.email],
              [Phone, "Phone", user.phone ? `${getCountry(user.country)?.dial ?? ""} ${user.phone}` : "Not added"],
              [UserRound, "Date of birth", user.dob ? formatDmy(user.dob) : "—"],
              [KeyRound, "Passport", user.passportNumber ? `${user.passportNumber} · exp. ${formatDmy(user.passportExpiry)}` : "Not saved"],
            ].map(([Icon, k, val]) => {
              const I = Icon as typeof Mail;
              return (
                <div key={k as string} className="flex gap-3">
                  <I className="mt-0.5 size-4 shrink-0 text-ink-400" />
                  <div className="min-w-0">
                    <dt className="text-xs text-ink-500">{k as string}</dt>
                    <dd className="truncate font-semibold text-ink-900">{val as string}</dd>
                  </div>
                </div>
              );
            })}
            {nat && (
              <div className="flex gap-3">
                <span className="mt-0.5 w-4 text-center leading-none">{flag(nat.iso2)}</span>
                <div>
                  <dt className="text-xs text-ink-500">Nationality</dt>
                  <dd className="font-semibold text-ink-900">{nat.name}</dd>
                </div>
              </div>
            )}
          </dl>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <NameForm />
        <DetailsForm today={today} />
        <PasswordForm />
      </div>
    </div>
  );
}
