"use client";

import { useSyncExternalStore } from "react";
import { demoUser, type UserProfile } from "@/data/dashboard/user";

// MOCK account store: the demo user plus any profile edits saved in this browser.
const KEY = "tbils.account";
const listeners = new Set<() => void>();
let snapshot: UserProfile | null = null;

function load(): UserProfile {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...demoUser, ...JSON.parse(raw) } : demoUser;
  } catch {
    return demoUser;
  }
}

export function saveProfile(patch: Partial<UserProfile>) {
  const next = { ...getProfile(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  snapshot = next;
  listeners.forEach((l) => l());
}

export const getProfile = () => (snapshot ??= load());

/** Current profile; renders the demo user on the server and first paint, then the saved one. */
export function useProfile() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getProfile,
    () => demoUser,
  );
}

export const fullName = (u: Pick<UserProfile, "firstName" | "middleName" | "surname">) =>
  [u.firstName, u.middleName, u.surname].filter(Boolean).join(" ");
export const initials = (u: Pick<UserProfile, "firstName" | "surname">) => `${u.firstName[0] ?? ""}${u.surname[0] ?? ""}`.toUpperCase();
