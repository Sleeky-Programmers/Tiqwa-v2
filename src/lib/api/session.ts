import { cookies } from "next/headers";
import { demoUser, type UserProfile } from "@/data/dashboard/user";
import type { WlUser } from "./types";
import { SESSION_COOKIE } from "./upstream";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function setSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** "+2348030000000" / "08030000000" → ["NG", "8030000000"]; anything else is kept as typed. */
function splitPhone(raw?: string | null): [string, string] {
  const digits = (raw ?? "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+234")) return ["NG", digits.slice(4)];
  if (digits.startsWith("234") && digits.length > 11) return ["NG", digits.slice(3)];
  if (digits.startsWith("0")) return ["NG", digits.slice(1)];
  return ["NG", digits.replace(/^\+/, "")];
}

/**
 * Backend user → the profile shape the UI uses. The backend only knows name, email and phone;
 * the rest (title, DOB, passport…) is kept on the device and merged in on the client.
 */
export function toProfile(u: WlUser): UserProfile {
  const [first, ...rest] = (u.name ?? "").trim().split(/\s+/);
  const [country, phone] = splitPhone(u.phone);
  return {
    title: "",
    firstName: u.first_name || first || "",
    middleName: "",
    surname: u.last_name || rest.join(" "),
    email: u.email,
    country,
    phone,
    dob: "",
    gender: "",
    nationality: "NG",
    passportNumber: "",
    passportIssued: "",
    passportExpiry: "",
    passportCountry: "NG",
    memberSince: u.created_at ?? "",
  };
}

/** The demo account shown when no backend is configured. */
export const mockProfile = (): UserProfile => demoUser;
