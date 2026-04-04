/* lib/resilience/lock.ts */

import crypto from "crypto";
import { kvGet, kvSet, kvDelete } from "@/lib/resilience/kv-store";

export type LockHandle = {
  key: string;
  owner: string;
};

export async function acquireLock(key: string, ttlMs = 60_000): Promise<LockHandle | null> {
  const owner = crypto.randomUUID();
  const existing = await kvGet(key);

  if (existing) return null;

  await kvSet(key, owner, ttlMs);

  const confirm = await kvGet(key);
  if (confirm !== owner) return null;

  return { key, owner };
}

export async function releaseLock(handle: LockHandle): Promise<void> {
  const current = await kvGet(handle.key);
  if (current !== handle.owner) return;
  await kvDelete(handle.key);
}