import { createHash, randomUUID } from "node:crypto";

/**
 * Effectively-once side effects without backend support.
 *
 * The backend has no idempotency keys, so the route handlers make repeat requests safe themselves:
 * - `withLock(key, fn)` runs one `fn` per key at a time, across instances when a shared store is set.
 *   `fn` should re-read the backend's state first (check-then-act), so a caller that waited for the
 *   lock sees the finished work and skips it.
 * - `recall` / `remember` keep the result of a finished step (a reservation, a checkout link) so a
 *   retry gets the same answer instead of a second booking or transaction.
 *
 * Storage is in-process memory by default, which covers `next dev` and a single `next start` server.
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN to share it between instances (serverless or
 * several servers); without that, duplicates that land on different instances aren't caught.
 */

interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  /** Set only if absent (SET NX); true when this caller set it. */
  add(key: string, value: string, ttlSec: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

type Entry = { value: string; expires: number };
// Kept on globalThis so dev hot reloads don't drop locks and results mid-flow.
const g = globalThis as typeof globalThis & { __tiqwaIdem?: Map<string, Entry>; __tiqwaFlights?: Map<string, Promise<unknown>> };
const mem = (g.__tiqwaIdem ??= new Map());
const flights = (g.__tiqwaFlights ??= new Map());

const memoryStore: Store = {
  async get(key) {
    const e = mem.get(key);
    if (!e) return null;
    if (e.expires <= Date.now()) {
      mem.delete(key);
      return null;
    }
    return e.value;
  },
  async set(key, value, ttlSec) {
    mem.set(key, { value, expires: Date.now() + ttlSec * 1000 });
  },
  async add(key, value, ttlSec) {
    if ((await this.get(key)) !== null) return false;
    mem.set(key, { value, expires: Date.now() + ttlSec * 1000 });
    return true;
  },
  async del(key) {
    mem.delete(key);
  },
};

function upstashStore(url: string, token: string): Store {
  const cmd = async (...args: (string | number)[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`idempotency store ${res.status}`);
    return ((await res.json()) as { result: unknown }).result;
  };
  return {
    get: async (key) => ((await cmd("GET", key)) as string | null) ?? null,
    set: async (key, value, ttlSec) => void (await cmd("SET", key, value, "EX", ttlSec)),
    add: async (key, value, ttlSec) => (await cmd("SET", key, value, "NX", "EX", ttlSec)) === "OK",
    del: async (key) => void (await cmd("DEL", key)),
  };
}

const store: Store =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? upstashStore(process.env.UPSTASH_REDIS_REST_URL.replace(/\/+$/, ""), process.env.UPSTASH_REDIS_REST_TOKEN)
    : memoryStore;

const PREFIX = "tiqwa:";
export const DAY = 86_400;

/** Stable short hash of a request payload, so one key can't replay a different request. */
export const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

export async function recall<T>(key: string): Promise<T | null> {
  try {
    const raw = await store.get(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    // A store outage must not block bookings; the backend checks still apply.
    console.warn("[idempotency] recall failed", key, e instanceof Error ? e.message : e);
    return null;
  }
}

export async function remember<T>(key: string, value: T, ttlSec = DAY) {
  try {
    await store.set(PREFIX + key, JSON.stringify(value), ttlSec);
  } catch (e) {
    console.warn("[idempotency] remember failed", key, e instanceof Error ? e.message : e);
  }
}

/**
 * Counts attempts per key in a fixed window; true while under `max`. Used to slow down guessing on
 * public lookups. Best effort: the count isn't atomic across instances, which is fine for this.
 */
export async function underLimit(key: string, max: number, windowSec: number) {
  const now = Date.now();
  const cur = await recall<{ n: number; until: number }>(`limit:${key}`);
  const entry = cur && cur.until > now ? { n: cur.n + 1, until: cur.until } : { n: 1, until: now + windowSec * 1000 };
  await remember(`limit:${key}`, entry, Math.max(1, Math.ceil((entry.until - now) / 1000)));
  return entry.n <= max;
}

/** Identical calls already running in this process share one promise. */
export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const running = flights.get(key) as Promise<T> | undefined;
  if (running) return running;
  const p = fn().finally(() => flights.delete(key));
  flights.set(key, p);
  return p;
}

export class LockBusyError extends Error {
  constructor() {
    super("This is already being processed. Please wait a moment and try again.");
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` holding the lock for `key`. Callers in this process with the same `share` value (an
 * identical request) share one run; everyone else waits for the lock (up to `waitMs`), then runs
 * their own `fn`, which re-checks state. Throws LockBusyError if the lock can't be had in time.
 * A store outage runs `fn` unlocked.
 */
export function withLock<T>(key: string, fn: () => Promise<T>, { share = "", ttlSec = 90, waitMs = 60_000 } = {}): Promise<T> {
  return singleFlight(`lock:${key}|${share}`, async () => {
    const lockKey = `${PREFIX}lock:${key}`;
    const token = randomUUID();
    const deadline = Date.now() + waitMs;
    for (;;) {
      let acquired: boolean;
      try {
        acquired = await store.add(lockKey, token, ttlSec);
      } catch (e) {
        console.warn("[idempotency] lock unavailable, running unlocked", key, e instanceof Error ? e.message : e);
        return fn();
      }
      if (acquired) break;
      if (Date.now() > deadline) throw new LockBusyError();
      await sleep(400);
    }
    try {
      return await fn();
    } finally {
      try {
        // Only release our own lock; it may have expired and been taken by someone else.
        if ((await store.get(lockKey)) === token) await store.del(lockKey);
      } catch {}
    }
  });
}
