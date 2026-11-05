"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { CircleCheck, Send } from "lucide-react";
import { Field, inputCls, postJson, spinner, type Errors } from "@/components/ui/form";
import { Select } from "@/components/ui/Select";
import { useProfile } from "@/lib/account";
import { cn } from "@/lib/utils";

const SUBJECTS = [
  "New flight booking",
  "Change or cancel a booking",
  "Pay small small",
  "Payment issue",
  "Holiday package",
  "Hotel booking",
  "Visa assistance",
  "Study abroad",
  "Proof of funds",
  "Something else",
];

/** `?type=` values used by menu, footer and search-tab links, and the subject each one pre-selects. */
const TYPE_SUBJECT: Record<string, string> = {
  flight: "New flight booking",
  booking: "Change or cancel a booking",
  flexi: "Pay small small",
  payment: "Payment issue",
  holiday: "Holiday package",
  hotel: "Hotel booking",
  visa: "Visa assistance",
  study: "Study abroad",
  funds: "Proof of funds",
};

/** A nudge in the message box for the chosen topic. */
const MESSAGE_HINT: Record<string, string> = {
  "Holiday package": "Where would you like to go, when, and how many travellers?",
  "Hotel booking": "City, check-in and check-out dates, number of guests and rooms.",
  "Visa assistance": "Which country, your travel dates and your nationality.",
  "Study abroad": "The country and course you're interested in, and when you'd like to start.",
  "Proof of funds": "Which embassy or school it's for and the amount required.",
  "Change or cancel a booking": "Your booking reference (it starts with TW-) and what you'd like to change.",
};

/**
 * Contact form → /api/contact (backend /send-message). Prefills from the signed-in account, and the
 * topic from ?subject= (free text, e.g. a holiday package name) or ?type= (one of TYPE_SUBJECT).
 */
export function ContactForm() {
  const id = useId();
  const user = useProfile();
  const params = useSearchParams();
  const preset = params.get("subject") ?? TYPE_SUBJECT[params.get("type") ?? ""] ?? "";
  const [v, setV] = useState({ name: "", email: "", phone: "", subject: preset || "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const name = v.name || [user.firstName, user.surname].filter(Boolean).join(" ");
  const email = v.email || user.email;
  const set = (patch: Partial<typeof v>) => {
    setV((x) => ({ ...x, ...patch }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch) && k !== "form")));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { errors } = await postJson("/api/contact", { ...v, name, email });
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
        <h2 className="font-display text-2xl font-extrabold text-ink-900">Message sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">Thanks, {name.split(" ")[0] || "there"}. Our team will reply to {email} shortly, usually within a few hours.</p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setV({ name: "", email: "", phone: "", subject: "", message: "" });
          }}
          className="link-underline mt-5 text-sm font-semibold text-blue"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[20px] border border-[#e3ebf3] bg-white p-6 shadow-[0_18px_44px_rgba(1,40,74,0.08)] sm:p-8">
      <h2 className="font-display text-2xl font-extrabold text-ink-900">Send us a message</h2>
      <p className="mt-1 text-sm text-ink-500">Tell us what you need and a travel expert will get back to you.</p>
      {errors.form && <p className="mt-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{errors.form}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor={`${id}-name`} error={errors.name}>
          <input id={`${id}-name`} autoComplete="name" value={name} onChange={(e) => set({ name: e.target.value })} className={cn(inputCls, errors.name && "border-error")} />
        </Field>
        <Field label="Email address" htmlFor={`${id}-email`} error={errors.email}>
          <input id={`${id}-email`} type="email" autoComplete="email" value={email} onChange={(e) => set({ email: e.target.value })} className={cn(inputCls, errors.email && "border-error")} />
        </Field>
        <Field label="Phone (optional)" htmlFor={`${id}-phone`}>
          <input id={`${id}-phone`} type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set({ phone: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Subject" error={errors.subject}>
          <Select label="Subject" value={v.subject} placeholder="Choose a topic" options={preset && !SUBJECTS.includes(preset) ? [preset, ...SUBJECTS] : SUBJECTS} onChange={(x) => set({ subject: x })} triggerClassName="h-[45px]" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Message" htmlFor={`${id}-msg`} error={errors.message}>
            <textarea
              id={`${id}-msg`}
              rows={5}
              value={v.message}
              onChange={(e) => set({ message: e.target.value })}
              placeholder={MESSAGE_HINT[v.subject] ?? "Your route, dates, number of travellers or booking reference…"}
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
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
