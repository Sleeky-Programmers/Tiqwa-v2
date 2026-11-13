"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Award, Mail, MailCheck, Phone } from "lucide-react";
import { OtpInput } from "@/components/auth/OtpInput";
import { CountryPicker } from "@/components/ui/CountryPicker";
import { Field, PasswordInput, PasswordRules, PasswordStrength, inputCls, passwordOk, postJson, type Errors } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import { toast } from "@/components/ui/Toast";
import { getCountry } from "@/data/countries";
import type { UserProfile } from "@/data/dashboard/user";
import { fullName, initials, refreshSession, saveProfile, useProfile, useSession } from "@/lib/account";
import { cn } from "@/lib/utils";
import { useRewards } from "./useRewards";
import { cardCls, ghostBtn, primaryBtn, SectionCard } from "./ui";

/** Name and phone are stored by the backend; the full phone goes as +<dial><number>. */
const backendPhone = (u: Pick<UserProfile, "country" | "phone">) =>
  u.phone ? `${getCountry(u.country)?.dial ?? "+234"}${u.phone.replace(/\D/g, "").replace(/^0/, "")}` : "";

async function submit(action: string, body: Record<string, unknown>) {
  return postJson("/api/account", { action, ...body });
}

const spin = <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;

function FormActions({ dirty, saving, onCancel, label = "Save changes" }: { dirty: boolean; saving: boolean; onCancel: () => void; label?: string }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#eef1f5] pt-4">
      <button type="button" onClick={onCancel} disabled={!dirty || saving} className={cn(ghostBtn, "disabled:opacity-40")}>
        Cancel
      </button>
      <button type="submit" disabled={!dirty || saving} className={primaryBtn}>
        {saving && spin}
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
  const f = useSliceForm(["title", "firstName", "middleName", "surname", "country", "phone"]);
  const dial = getCountry(f.values.country)?.dial ?? "+234";
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    f.setSaving(true);
    const { errors } = await submit("name", { ...f.values, phone: backendPhone(f.values) });
    f.setSaving(false);
    f.setErrors(errors);
    if (Object.keys(errors).length) return;
    saveProfile({ ...f.values, firstName: f.values.firstName.trim(), surname: f.values.surname.trim(), middleName: f.values.middleName.trim() });
    toast.success("Your details have been updated.");
  };
  return (
    <SectionCard title="Personal details" description="Use your name exactly as it appears on your passport.">
      <form onSubmit={onSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[140px_1fr_1fr_1fr]">
          <Field label="Title">
            <Select
              label="Title"
              value={f.values.title}
              options={["Mr.", "Mrs.", "Ms.", "Dr."]}
              onChange={(v) => f.set({ title: v })}
              triggerClassName="h-[45px]"
            />
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Phone country">
            <CountryPicker label="Phone country" variant="dial" value={f.values.country} onChange={(v) => f.set({ country: v })} />
          </Field>
          <Field label="Phone number" htmlFor="det-phone" error={f.errors.phone}>
            <div
              className={cn(
                "flex h-[45px] overflow-hidden rounded-[10px] border border-[#e4e8ee] bg-white focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20",
                f.errors.phone && "border-error",
              )}
            >
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
        </div>
        {f.errors.form && <p className="mt-3 text-sm font-medium text-error">{f.errors.form}</p>}
        <FormActions dirty={f.dirty} saving={f.saving} onCancel={f.reset} />
      </form>
    </SectionCard>
  );
}

/** Two steps: enter the new address, then confirm the 6-digit code sent to it. */
function EmailForm() {
  const id = useId();
  const user = useProfile();
  const { live } = useSession();
  const [step, setStep] = useState<"view" | "enter" | "code">("view");
  const [email, setEmail] = useState("");
  const [current, setCurrent] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const reset = () => {
    setStep("view");
    setCurrent("");
    setEmail("");
    setCode("");
    setErrors({});
  };

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    if (email.trim().toLowerCase() === user.email.toLowerCase()) return setErrors({ email: "That's already your email address" });
    setBusy(true);
    const { errors } = await submit("email-start", { email, currentPassword: current });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    setErrors({});
    setStep("code");
    toast.success(`We sent a 6-digit code to ${email.trim()}.`);
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setErrors({ code: "Enter the 6-digit code from your email" });
    setBusy(true);
    const { errors } = await submit("email-confirm", { email, code });
    if (Object.keys(errors).length) {
      setBusy(false);
      return setErrors(errors);
    }
    // Live: the backend owns the address, so reload it. Demo: keep it on this device.
    if (live) await refreshSession();
    else saveProfile({ email: email.trim() });
    setBusy(false);
    reset();
    toast.success("Your email address has been updated.");
  };

  return (
    <SectionCard title="Email address" description="This is the email you sign in with and where we send your trip updates.">
      {step === "view" ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-[rgba(2,144,222,0.1)] text-blue">
              <Mail className="size-5" />
            </span>
            <p className="font-semibold text-ink-900">{user.email || "—"}</p>
          </div>
          <button type="button" onClick={() => setStep("enter")} disabled={!user.email} className={cn(ghostBtn, "border border-[#e4e8ee]")}>
            Change email
          </button>
        </div>
      ) : step === "enter" ? (
        <form onSubmit={sendCode} noValidate className="animate-[fade-in_0.3s_ease]">
          <Field label="New email address" htmlFor={`${id}-email`} error={errors.email ?? errors.form}>
            <input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors({});
              }}
              className={cn(inputCls, (errors.email || errors.form) && "border-error")}
            />
          </Field>
          <div className="mt-4">
            <Field label="Current password" htmlFor={`${id}-cur`} error={errors.currentPassword}>
              <PasswordInput
                id={`${id}-cur`}
                value={current}
                onChange={(x) => {
                  setCurrent(x);
                  setErrors({});
                }}
                error={errors.currentPassword}
                autoComplete="current-password"
              />
            </Field>
          </div>
          <FormActions dirty={!!email.trim() && !!current} saving={busy} label="Send code" onCancel={reset} />
        </form>
      ) : (
        <form onSubmit={confirm} noValidate className="animate-[acc-reveal_0.3s_ease]">
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-ink-500">
            <MailCheck className="size-4 text-blue" /> Code sent to <strong className="text-ink-900">{email.trim()}</strong>
            <button type="button" onClick={() => sendCode()} disabled={busy} className="link-underline ml-1 font-semibold text-blue">
              Resend
            </button>
          </p>
          <Field label="Verification code" error={errors.code ?? errors.form}>
            <OtpInput
              value={code}
              invalid={!!errors.code}
              onChange={(c) => {
                setCode(c);
                setErrors({});
              }}
            />
          </Field>
          <FormActions dirty saving={busy} label="Confirm email" onCancel={reset} />
        </form>
      )}
    </SectionCard>
  );
}

function PasswordForm() {
  const id = useId();
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };
  const reset = () => {
    setV({ current: "", next: "", confirm: "" });
    setErrors({});
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (!v.current) local.current = "Enter your current password";
    if (!passwordOk(v.next)) local.next = "Password doesn't meet the requirements";
    if (!v.confirm) local.confirm = "Confirm your new password";
    else if (v.confirm !== v.next) local.confirm = "Passwords don't match";
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    const { errors } = await submit("password", { currentPassword: v.current, password: v.next });
    setBusy(false);
    if (Object.keys(errors).length)
      return setErrors({
        ...(errors.currentPassword ? { current: errors.currentPassword } : {}),
        ...(errors.password ? { next: errors.password } : {}),
        ...(errors.form ? { form: errors.form } : {}),
      });
    reset();
    toast.success("Password changed. Use your new password next time you sign in.");
  };

  return (
    <SectionCard title="Change password" description="Enter your current password, then choose a new one.">
      <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Field label="Current password" htmlFor={`${id}-cur`} error={errors.current}>
            <PasswordInput id={`${id}-cur`} value={v.current} onChange={(x) => set({ current: x })} error={errors.current} autoComplete="current-password" />
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
          <FormActions dirty={!!(v.current || v.next || v.confirm)} saving={busy} label="Update password" onCancel={reset} />
        </div>
      </form>
    </SectionCard>
  );
}

/** /dashboard/profile: account overview, personal details, email and password. */
export function ProfilePage() {
  const user = useProfile();
  const rewards = useRewards();

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[320px_1fr]">
      <aside className={cn(cardCls, "overflow-hidden xl:sticky xl:top-[88px] animate-[fade-up_0.4s_cubic-bezier(0.16,1,0.3,1)_both]")}>
        <div className="relative h-24 bg-[linear-gradient(140deg,#0a1628,#013557_45%,#0290de)]" />
        <div className="relative -mt-10 px-5 pb-5">
          <span className="relative z-10 grid size-20 place-items-center rounded-full border-4 border-white shadow-[0_6px_16px_rgba(1,40,74,0.18)] bg-[linear-gradient(140deg,#013557,#0290de)] font-display text-2xl font-extrabold text-white">
            {initials(user)}
          </span>
          <h2 className="mt-3 font-display text-xl font-extrabold text-ink-900">
            {user.title} {fullName(user)}
          </h2>
          {user.memberSince && (
            <p className="text-sm text-ink-500">Member since {new Date(user.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          )}
          {rewards.data?.live && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[rgba(245,134,52,0.1)] p-3">
              <Award className="size-6 text-orange" />
              <div>
                <p className="text-sm font-bold text-ink-900">Referral rewards</p>
                <p className="text-xs text-ink-500">{`₦${rewards.data.total.toLocaleString("en-NG")} earned · code ${rewards.data.code || "—"}`}</p>
              </div>
            </div>
          )}
          <dl className="mt-4 space-y-3 text-sm">
            {[
              [Mail, "Email", user.email],
              [Phone, "Phone", user.phone ? `${getCountry(user.country)?.dial ?? ""} ${user.phone}` : "Not added"],
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
          </dl>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">
        <NameForm />
        <EmailForm />
        <PasswordForm />
      </div>
    </div>
  );
}
