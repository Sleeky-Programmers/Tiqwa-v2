import { cookies } from "next/headers";
import { connection } from "next/server";

/**
 * Server-side client for the Tiqwa / Premium Whitelabel API (`/api/v2`).
 *
 * The browser never talks to the backend directly: it calls this app's `/api/*` route handlers,
 * which call `upstream()` with the session token from an httpOnly cookie. When `TIQWA_API_URL`
 * is not set the route handlers fall back to the mock data, so the app always works.
 */

export const SESSION_COOKIE = "tiqwa_session";
const API_URL = process.env.TIQWA_API_URL?.replace(/\/+$/, "");

/** True when a backend is configured; route handlers use mocks otherwise. */
export const isLive = () => !!API_URL;

export type ApiError = { code: string; message: string; status: number; fields?: Record<string, string> };
export type Result<T> = { ok: true; data: T; message?: string } | { ok: false; error: ApiError };

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  /** Send the signed-in user's token when there is one (default true). */
  auth?: boolean;
  /** Supplier calls (flight search) can take 40s+; everything else should be quick. */
  timeoutMs?: number;
  /** Friendly copy used when the backend's message is missing or too technical. */
  fallback?: string;
};

// Backend failures often surface as a bare status code or a terse technical phrase. Only show a
// raw message when it reads like a sentence meant for people (ported from travel-agency).
const GENERIC = [
  /^\d{3}$/,
  /^(bad request|internal server error|server error|unknown error|an error occurred|something went wrong|request failed|api request failed|failed to fetch|load failed|network ?error|fetch failed|service unavailable|unauthorized|unauthenticated\.?|forbidden|not found)$/i,
];
export function friendly(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const t = raw.trim();
  return !t || GENERIC.some((p) => p.test(t)) ? fallback : t;
}

const codeFor = (status: number) =>
  status === 401
    ? "UNAUTHORIZED"
    : status === 403
      ? "FORBIDDEN"
      : status === 404
        ? "NOT_FOUND"
        : status === 422
          ? "VALIDATION"
          : status === 429
            ? "RATE_LIMITED"
            : "UPSTREAM_ERROR";

/** `{ field: ["msg"] }` → `{ field: "msg" }` */
function firstErrors(errors: unknown): Record<string, string> | undefined {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
    const msg = Array.isArray(v) ? v[0] : v;
    if (typeof msg === "string") out[k] = msg;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function sessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function upstream<T>(path: string, opts: Options = {}): Promise<Result<T>> {
  const {
    method = "GET",
    query,
    body,
    auth = true,
    timeoutMs = 20_000,
    fallback = "We couldn't reach our booking service. Please try again in a moment.",
  } = opts;
  if (!API_URL) return { ok: false, error: { code: "NOT_CONFIGURED", message: fallback, status: 503 } };
  await connection();

  const qs = query
    ? new URLSearchParams(
        Object.entries(query)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : "";
  const headers: Record<string, string> = {
    Accept: "application/json",
    // The whitelabel tenant (and the payment gateway's return URL) is derived from Origin.
    Origin: process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4545",
    "User-Agent": "Mozilla/5.0 (compatible; TbilsWeb/1.0)",
  };
  // FormData (file uploads) sets its own multipart boundary header.
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = auth ? await sessionToken() : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ""}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return {
      ok: false,
      error: timeout
        ? { code: "TIMEOUT", status: 504, message: "This is taking longer than expected. Please check your connection and try again." }
        : { code: "UNAVAILABLE", status: 503, message: fallback },
    };
  }

  const json = (await res.json().catch(() => null)) as { success?: boolean; data?: T; message?: string; errors?: unknown } | null;
  if (!res.ok || !json || json.success === false) {
    const status = res.ok ? 422 : res.status;
    return { ok: false, error: { code: codeFor(status), status, message: friendly(json?.message, fallback), fields: firstErrors(json?.errors) } };
  }
  return { ok: true, data: json.data as T, message: json.message };
}

/** JSON error response in the one shape every client reads: `{ error: { code, message, fields? } }`. */
export const fail = (e: Pick<ApiError, "code" | "message" | "status"> & { fields?: Record<string, string> }) =>
  Response.json({ error: { code: e.code, message: e.message, ...(e.fields ? { fields: e.fields } : {}) } }, { status: e.status });

export const ok = <T>(data: T, init?: ResponseInit) => Response.json(data, init);

/** Simulated latency for mock responses, so loaders are visible in demo mode. */
export const mockDelay = (ms: number) => new Promise((r) => setTimeout(r, ms));
