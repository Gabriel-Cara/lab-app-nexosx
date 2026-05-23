// Simple in-memory rate limiter.
// Note: In serverless environments, memory can reset; this still helps prevent bursts.

type Entry = {count: number; resetAt: number};

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX = 5;

const store = new Map<string, Entry>();

export function rateLimit(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, {count: 1, resetAt: now + WINDOW_MS});
    return {ok: true as const, remaining: MAX - 1, resetAt: now + WINDOW_MS};
  }

  if (entry.count >= MAX) {
    return {ok: false as const, remaining: 0, resetAt: entry.resetAt};
  }

  entry.count += 1;
  store.set(key, entry);
  return {ok: true as const, remaining: MAX - entry.count, resetAt: entry.resetAt};
}
