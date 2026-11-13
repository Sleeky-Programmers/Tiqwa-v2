"use client";

import { useSyncExternalStore } from "react";
import type { UserProfile } from "@/data/dashboard/user";

/**
 * Signed-in account on the client. `/api/auth/me` says who is signed in (the backend user, or the
 * demo account when no backend is configured). Profile fields the backend doesn't store (title,
 * DOB, passport…) are kept on this device per account and merged on top.
 */

export type Session = { status: "loading" | "signedIn" | "signedOut"; live: boolean };

const EMPTY: UserProfile = {
  title: "",
  firstName: "",
  middleName: "",
  surname: "",
  email: "",
  country: "NG",
  phone: "",
  dob: "",
  gender: "",
  nationality: "NG",
  passportNumber: "",
  passportIssued: "",
  passportExpiry: "",
  passportCountry: "NG",
  memberSince: "",
};
/** Owned by the backend in live mode, so a stale local copy never overrides them. */
const SERVER_KEYS = ["firstName", "surname", "email", "memberSince"] as const;

const listeners = new Set<() => void>();
let base: UserProfile = EMPTY;
let profile: UserProfile = EMPTY;
let session: Session = { status: "loading", live: false };
let pending: Promise<void> | null = null;

const emit = () => listeners.forEach((l) => l());
const extrasKey = () => (session.live ? `tbils.account.${base.email.toLowerCase()}` : "tbils.account");

function readExtras(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem(extrasKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function compose() {
  const extras = readExtras();
  const merged = { ...base, ...extras };
  if (session.live) for (const k of SERVER_KEYS) (merged as Record<string, unknown>)[k] = base[k];
  // The backend's phone wins unless only the device has one.
  if (session.live && base.phone) merged.phone = base.phone;
  profile = merged;
}

/** Ask the server who is signed in. Called on first use and after sign-in / sign-out. */
export function refreshSession(): Promise<void> {
  pending = (async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = await res.json().catch(() => null);
      const live = !!json?.live;
      if (json?.user) {
        base = { ...EMPTY, ...json.user };
        session = { status: "signedIn", live };
      } else {
        base = EMPTY;
        // A server error is not a sign-out; keep the last known state rather than bouncing the user.
        session = res.ok ? { status: "signedOut", live } : { ...session, status: session.status === "loading" ? "signedOut" : session.status, live };
      }
    } catch {
      session = { ...session, status: session.status === "loading" ? "signedOut" : session.status };
    }
    compose();
    emit();
  })();
  return pending;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!pending) void refreshSession();
  return () => listeners.delete(cb);
}

/** Current profile (empty until the session has loaded). */
export function useProfile() {
  return useSyncExternalStore(
    subscribe,
    () => profile,
    () => EMPTY,
  );
}

const LOADING: Session = { status: "loading", live: false };
export function useSession() {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => LOADING,
  );
}

export const getProfile = () => profile;

/** Profile once the session has loaded (for one-off reads such as checkout prefill). */
export async function loadProfile() {
  await (pending ?? refreshSession());
  return profile;
}

/** Store profile changes: device-only fields locally; callers send backend-owned ones to /api/account first. */
export function saveProfile(patch: Partial<UserProfile>) {
  try {
    localStorage.setItem(extrasKey(), JSON.stringify({ ...readExtras(), ...patch }));
  } catch {}
  if (session.live) {
    // Backend accepted these; reflect them without waiting for another /me round trip.
    for (const k of [...SERVER_KEYS, "phone"] as const) if (k in patch) (base as Record<string, unknown>)[k] = patch[k];
  }
  compose();
  emit();
}

export async function signOut(to = "/") {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  base = EMPTY;
  session = { status: "signedOut", live: session.live };
  compose();
  emit();
  window.location.assign(to);
}

export const fullName = (u: Pick<UserProfile, "firstName" | "middleName" | "surname">) => [u.firstName, u.middleName, u.surname].filter(Boolean).join(" ");
export const initials = (u: Pick<UserProfile, "firstName" | "surname">) => `${u.firstName[0] ?? ""}${u.surname[0] ?? ""}`.toUpperCase();
