"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";
import { KeyRound, MailCheck } from "lucide-react";
import { Field, PasswordInput, PasswordRules, PasswordStrength, inputCls, passwordOk, postJson, spinner, type Errors } from "@/components/ui/form";
import { refreshSession } from "@/lib/account";
import { cn } from "@/lib/utils";
import { OtpInput } from "./OtpInput";
import { AuthHeading, Notice, safeRedirect, submitCls, textLink } from "./ui";

const clear = (e: Errors, keys: string[]) => Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k) && k !== "form"));

export function LoginForm() {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const [v, setV] = useState({ email: params.get("email") ?? "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => clear(e, Object.keys(patch)));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { errors, data } = await postJson<{ error?: { code?: string } }>("/api/auth/login", v);
    if (data?.error?.code === "EMAIL_UNVERIFIED") return router.push(`/verify-email?email=${encodeURIComponent(v.email.trim())}`);
    if (Object.keys(errors).length) {
      setBusy(false);
      return setErrors(errors);
    }
    await refreshSession();
    router.replace(safeRedirect(params.get("redirect")));
  };

  return (
    <>
      <AuthHeading title="Welcome back" sub="Sign in to manage your trips, payments and saved travellers." />
      {params.get("verified") && <Notice>Your email is verified. Sign in to continue.</Notice>}
      {params.get("reset") && <Notice>Your password has been updated. Sign in with your new password.</Notice>}
      {params.get("redirect") && !params.get("verified") && !params.get("reset") && <Notice tone="info">Please sign in to continue to your account.</Notice>}
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={v.email}
            onChange={(e) => set({ email: e.target.value })}
            placeholder="you@example.com"
            className={cn(inputCls, errors.email && "border-error")}
          />
        </Field>
        <Field
          label="Password"
          htmlFor={`${id}-pw`}
          error={errors.password}
          aside={
            <Link href={`/forgot-password${v.email ? `?email=${encodeURIComponent(v.email)}` : ""}`} className={cn(textLink, "text-[13px]")}>
              Forgot password?
            </Link>
          }
        >
          <PasswordInput id={`${id}-pw`} value={v.password} onChange={(x) => set({ password: x })} error={errors.password} autoComplete="current-password" />
        </Field>
        <button type="submit" disabled={busy} className={cn(submitCls, "mt-2")}>
          {busy && spinner}
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        New to TBiLS?{" "}
        <Link href="/signup" className={textLink}>
          Create an account
        </Link>
      </p>
    </>
  );
}

export function SignupForm() {
  const id = useId();
  const router = useRouter();
  const [v, setV] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => clear(e, Object.keys(patch)));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (!v.firstName.trim()) local.firstName = "Enter your first name";
    if (!v.lastName.trim()) local.lastName = "Enter your last name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) local.email = "Enter a valid email address";
    if (v.phone && !/^\d{7,12}$/.test(v.phone)) local.phone = "Enter a valid phone number";
    if (!passwordOk(v.password)) local.password = "Password doesn't meet the requirements";
    if (!terms) local.terms = "Please accept the terms to continue";
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    const { errors } = await postJson("/api/auth/signup", { ...v, phone: v.phone ? `+234${v.phone.replace(/^0/, "")}` : "" });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    router.push(`/verify-email?email=${encodeURIComponent(v.email.trim())}`);
  };

  return (
    <>
      <AuthHeading title="Create your account" sub="Save travellers, track bookings and pay in instalments." />
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["firstName", "First name", "given-name"],
              ["lastName", "Last name", "family-name"],
            ] as const
          ).map(([k, label, ac]) => (
            <Field key={k} label={label} htmlFor={`${id}-${k}`} error={errors[k]}>
              <input
                id={`${id}-${k}`}
                autoComplete={ac}
                value={v[k]}
                onChange={(e) => set({ [k]: e.target.value })}
                className={cn(inputCls, errors[k] && "border-error")}
              />
            </Field>
          ))}
        </div>
        <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={v.email}
            onChange={(e) => set({ email: e.target.value })}
            className={cn(inputCls, errors.email && "border-error")}
          />
        </Field>
        <Field label="Phone number (optional)" htmlFor={`${id}-phone`} error={errors.phone}>
          <div
            className={cn(
              "flex h-[45px] overflow-hidden rounded-[10px] border border-[#e4e8ee] bg-white focus-within:border-blue focus-within:ring-2 focus-within:ring-blue/20",
              errors.phone && "border-error",
            )}
          >
            <span className="flex items-center bg-[#f5f5f5] px-3 text-[15px] font-medium text-ink-900">+234</span>
            <input
              id={`${id}-phone`}
              inputMode="numeric"
              autoComplete="tel-national"
              value={v.phone}
              onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "") })}
              placeholder="8030000000"
              className="min-w-0 flex-1 px-3 text-[15px] focus:outline-none"
            />
          </div>
        </Field>
        <Field label="Password" htmlFor={`${id}-pw`} error={errors.password}>
          <PasswordInput id={`${id}-pw`} value={v.password} onChange={(x) => set({ password: x })} error={errors.password} autoComplete="new-password" />
        </Field>
        <PasswordStrength value={v.password} />
        {v.password && !passwordOk(v.password) && <PasswordRules value={v.password} className="animate-[acc-reveal_0.3s_ease]" />}
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-[#334155]">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => {
              setTerms(e.target.checked);
              setErrors((x) => clear(x, ["terms"]));
            }}
            className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-blue"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms-and-conditions" target="_blank" className={textLink}>
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" target="_blank" className={textLink}>
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && <p className="-mt-2 text-xs font-medium text-error">{errors.terms}</p>}
        <button type="submit" disabled={busy} className={submitCls}>
          {busy && spinner}
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className={textLink}>
          Sign in
        </Link>
      </p>
    </>
  );
}

export function VerifyEmailForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resend, setResend] = useState<{ wait: number; sending: boolean; note: string }>({ wait: 0, sending: false, note: "" });

  useEffect(() => {
    if (!resend.wait) return;
    const t = window.setTimeout(() => setResend((r) => ({ ...r, wait: r.wait - 1 })), 1000);
    return () => window.clearTimeout(t);
  }, [resend.wait]);

  const resendCode = async () => {
    setResend({ wait: 0, sending: true, note: "" });
    const { errors } = await postJson("/api/auth/resend-verification", { email });
    if (Object.keys(errors).length) return setResend({ wait: 0, sending: false, note: errors.email ?? errors.form ?? "We couldn't send a new code." });
    setCode("");
    setError("");
    setResend({ wait: 60, sending: false, note: "A new code is on its way." });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return setError("Enter the 6-digit code from your email");
    setBusy(true);
    const { errors } = await postJson("/api/auth/verify-email", { email, code });
    setBusy(false);
    if (Object.keys(errors).length) return setError(errors.code ?? errors.form ?? "That code didn't work");
    router.push(`/login?verified=1&email=${encodeURIComponent(email)}`);
  };

  return (
    <>
      <AuthHeading
        icon={<MailCheck className="size-7" />}
        title="Check your email"
        sub={
          <>
            We sent a 6-digit code to <strong className="text-ink-900">{email || "your email"}</strong>. Enter it below to verify your account.
          </>
        }
      />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <OtpInput
          value={code}
          invalid={!!error}
          onChange={(c) => {
            setCode(c);
            setError("");
          }}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-error">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={submitCls}>
          {busy && spinner}
          {busy ? "Verifying…" : "Verify email"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Didn&apos;t get it? Check your spam folder, or{" "}
        <button
          type="button"
          onClick={resendCode}
          disabled={!email || resend.sending || resend.wait > 0}
          className={cn(textLink, "disabled:cursor-not-allowed disabled:opacity-50")}
        >
          {resend.sending ? "sending a new code…" : resend.wait > 0 ? `send a new code in ${resend.wait}s` : "send a new code"}
        </button>
        .
      </p>
      {resend.note && (
        <p role="status" className="mt-2 text-center text-sm font-medium text-ink-500">
          {resend.note}
        </p>
      )}
    </>
  );
}

export function ForgotPasswordForm() {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { errors, status } = await postJson("/api/auth/forgot-password", { email });
    setBusy(false);
    if (status === 429) setWait(60);
    if (Object.keys(errors).length) return setErrors(errors);
    router.push(`/reset-password?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <>
      <AuthHeading icon={<KeyRound className="size-7" />} title="Forgot your password?" sub="Enter your email and we'll send you a code to reset it." />
      {params.get("expired") && <Notice tone="error">That reset code has expired or was already used. Request a new one below.</Notice>}
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors({});
            }}
            className={cn(inputCls, errors.email && "border-error")}
          />
        </Field>
        <button type="submit" disabled={busy || wait > 0} className={submitCls}>
          {busy && spinner}
          {wait > 0 ? `Try again in ${wait}s` : busy ? "Sending code…" : "Send reset code"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered it?{" "}
        <Link href="/login" className={textLink}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export function ResetPasswordForm() {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const [v, setV] = useState({ email: params.get("email") ?? "", code: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => clear(e, Object.keys(patch)));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) local.email = "Enter a valid email address";
    if (v.code.length !== 6) local.code = "Enter the 6-digit code from your email";
    if (!passwordOk(v.password)) local.password = "Password doesn't meet the requirements";
    if (v.confirm !== v.password) local.confirm = "Passwords don't match";
    if (Object.keys(local).length) return setErrors(local);
    setBusy(true);
    const { errors } = await postJson("/api/auth/reset-password", { email: v.email, code: v.code, password: v.password });
    setBusy(false);
    if (Object.keys(errors).length) return setErrors(errors);
    router.push(`/login?reset=1&email=${encodeURIComponent(v.email.trim())}`);
  };

  return (
    <>
      <AuthHeading
        title="Set a new password"
        sub={
          <>
            Enter the code we emailed
            {v.email ? (
              <>
                {" "}
                to <strong className="text-ink-900">{v.email}</strong>
              </>
            ) : null}{" "}
            and choose a new password.
          </>
        }
      />
      {errors.form && <Notice tone="error">{errors.form}</Notice>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {!params.get("email") && (
          <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
            <input
              id={`${id}-email`}
              type="email"
              autoComplete="email"
              value={v.email}
              onChange={(e) => set({ email: e.target.value })}
              className={cn(inputCls, errors.email && "border-error")}
            />
          </Field>
        )}
        <Field label="Reset code" error={errors.code}>
          <OtpInput value={v.code} invalid={!!errors.code} onChange={(c) => set({ code: c })} />
        </Field>
        {errors.code && /expired|used|invalid/i.test(errors.code) && (
          <p className="-mt-2 text-sm">
            <Link href={`/forgot-password?expired=1&email=${encodeURIComponent(v.email)}`} className={textLink}>
              Request a new code
            </Link>
          </p>
        )}
        <Field label="New password" htmlFor={`${id}-pw`} error={errors.password}>
          <PasswordInput id={`${id}-pw`} value={v.password} onChange={(x) => set({ password: x })} error={errors.password} autoComplete="new-password" />
        </Field>
        <PasswordStrength value={v.password} />
        <Field label="Confirm new password" htmlFor={`${id}-cf`} error={errors.confirm}>
          <PasswordInput id={`${id}-cf`} value={v.confirm} onChange={(x) => set({ confirm: x })} error={errors.confirm} autoComplete="new-password" />
        </Field>
        {v.password && !passwordOk(v.password) && <PasswordRules value={v.password} className="animate-[acc-reveal_0.3s_ease]" />}
        <button type="submit" disabled={busy} className={submitCls}>
          {busy && spinner}
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/login" className={textLink}>
          Back to sign in
        </Link>
      </p>
    </>
  );
}
