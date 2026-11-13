"use client";

import { useState, type ReactNode } from "react";
import { Check, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { refreshSession } from "@/lib/account";
import { cn } from "@/lib/utils";

// Shared form styling for account screens (profile, sign-in, sign-up, password reset).

export const labelCls = "mb-[5px] block text-sm text-[#1d1d1d]";
export const inputCls =
  "h-[45px] w-full rounded-[10px] border border-[#e4e8ee] bg-white px-3.5 text-[15px] text-ink-900 placeholder:text-[#9ca3af] transition-colors hover:border-blue focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20 disabled:bg-tint-100";
export const dateField = "h-[45px] rounded-[10px] border-[#e4e8ee]";

export type Errors = Record<string, string>;

export function Field({
  label,
  error,
  children,
  htmlFor,
  hint,
  aside,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className={labelCls}>
          {label}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-error animate-[fade-in_0.2s_ease]">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  error,
  autoComplete,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error || undefined}
        className={cn(inputCls, "pr-11", error && "border-error")}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:text-ink-900"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /\d/.test(p), label: "One number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "One symbol (recommended)", optional: true },
];
export const passwordOk = (p: string) => passwordRules.every((r) => r.optional || r.test(p));

/** Three-step strength bar shown under a new-password field. */
export function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const passed = passwordRules.filter((r) => r.test(value)).length;
  const strength = passed <= 2 ? 1 : passed <= 4 ? 2 : 3;
  const ui = [
    { label: "Weak", cls: "bg-error" },
    { label: "Good", cls: "bg-orange" },
    { label: "Strong", cls: "bg-[#16a34a]" },
  ][strength - 1];
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className={cn("h-1.5 rounded-full transition-colors duration-300", strength >= n ? ui.cls : "bg-[#e5e7eb]")} />
        ))}
      </div>
      <span className="w-12 text-xs font-semibold text-ink-500">{ui.label}</span>
    </div>
  );
}

/** Checklist of password rules that tick as they're met. */
export function PasswordRules({ value, className }: { value: string; className?: string }) {
  return (
    <div className={cn("rounded-xl bg-tint-100 p-4", className)}>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-900">
        <ShieldCheck className="size-4 text-blue" /> Password must have
      </p>
      <ul className="space-y-2">
        {passwordRules.map((r) => {
          const ok = r.test(value);
          return (
            <li key={r.label} className={cn("flex items-center gap-2 text-[13px] transition-colors", ok ? "text-[#15803d]" : "text-ink-500")}>
              <span className={cn("grid size-4 place-items-center rounded-full transition-colors", ok ? "bg-[#16a34a] text-white" : "border border-[#cbd5e1]")}>
                {ok && <Check className="size-3" />}
              </span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export const spinner = <span aria-hidden className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />;

/** POST JSON to one of this app's API routes; resolves to field errors (empty on success) plus the body. */
export async function postJson<T = unknown>(url: string, body: unknown, method = "POST"): Promise<{ errors: Errors; data: T | null; status: number }> {
  try {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => null);
    // A 401 means the sign-in has expired: re-check the session so the dashboard sends the user to log in.
    if (res.status === 401) void refreshSession();
    if (res.ok) return { errors: {}, data: json as T, status: res.status };
    const e = json?.error;
    const fields: Errors = typeof e === "object" && e?.fields ? { ...e.fields } : {};
    if (typeof e === "object" && e?.field) fields[e.field] = e.message;
    if (!Object.keys(fields).length) fields.form = (typeof e === "string" ? e : e?.message) ?? "Something went wrong. Please try again.";
    return { errors: fields, data: json as T, status: res.status };
  } catch {
    return { errors: { form: "Couldn't reach the server. Check your connection and try again." }, data: null, status: 0 };
  }
}
