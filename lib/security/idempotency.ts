/* lib/security/idempotency.ts */

const store: Map<string, number> = new Map();

export function isDuplicate(key: string, ttlMs = 5 * 60 * 1000): boolean {
  const now = Date.now();
  const existing = store.get(key);

  if (existing && now < existing) {
    return true;
  }

  store.set(key, now + ttlMs);
  return false;
}
