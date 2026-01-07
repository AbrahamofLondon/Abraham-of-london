// lib/inner-circle/keys.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from "crypto";
import { getRedis } from "@/lib/redis";

export type KeyTier = "member" | "patron" | "founder";

export type StoredKey = {
  key: string;
  memberId: string;
  tier: KeyTier;
  createdAt: string; // ISO
  expiresAt?: string; // ISO
  revoked?: boolean;
  revokedAt?: string; // ISO
};

const mem = new Map<string, StoredKey>();
const PREFIX = "ic:key:";

export function generateAccessKey(): string {
  return `IC-${crypto.randomBytes(20).toString("hex").toUpperCase()}`;
}

export async function storeKey(record: StoredKey): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    mem.set(record.key, record);
    return;
  }
  await redis.set(`${PREFIX}${record.key}`, JSON.stringify(record));
}

export async function getKey(key: string): Promise<StoredKey | null> {
  const redis = getRedis();
  if (!redis) return mem.get(key) ?? null;

  const raw = await redis.get(`${PREFIX}${key}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

export async function revokeKey(key: string): Promise<boolean> {
  const existing = await getKey(key);
  if (!existing) return false;

  const updated: StoredKey = {
    ...existing,
    revoked: true,
    revokedAt: new Date().toISOString(),
  };

  await storeKey(updated);
  return true;
}

export function isExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}