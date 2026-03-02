// lib/vault-engine.ts — VAULT SSOT (Prisma + optional Redis cache)
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { logError } from "@/lib/logger";

export interface VaultAsset {
  id: string;
  slug: string;
  title: string;
  type: string;
  tier: string; // keep string to avoid coupling; map to AccessTier elsewhere if needed
  metadata: Record<string, any>;
  updatedAt?: string;
  createdAt?: string;
}

const CACHE_PREFIX = "vault:asset:";
const CACHE_TTL_SECONDS = 60; // fast-moving registry; keep short
const CACHE_TTL_LIST_SECONDS = 45;

function safeJsonParse(input: unknown): any {
  if (input == null) return {};
  if (typeof input === "object") return input;
  if (typeof input !== "string") return {};
  const s = input.trim();
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

function asString(input: unknown, fallback = ""): string {
  if (typeof input === "string") return input;
  if (input == null) return fallback;
  return String(input);
}

function normalizeTier(raw: unknown): string {
  const s = asString(raw, "public").trim();
  return s || "public";
}

function mapDbAsset(asset: any): VaultAsset {
  return {
    id: asString(asset?.id),
    slug: asString(asset?.slug),
    title: asString(asset?.title, asString(asset?.slug, "Untitled")),
    type: asString(asset?.type, "unknown"),
    tier: normalizeTier(asset?.classification ?? asset?.tier ?? "public"),
    metadata: safeJsonParse(asset?.metadata),
    updatedAt: asset?.updatedAt ? new Date(asset.updatedAt).toISOString() : undefined,
    createdAt: asset?.createdAt ? new Date(asset.createdAt).toISOString() : undefined,
  };
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redis) return null;
    const val = await (redis as any).get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, value: any, ttlSeconds: number) {
  try {
    if (!redis) return;
    await (redis as any).set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache is best-effort
  }
}

async function cacheDel(key: string) {
  try {
    if (!redis) return;
    await (redis as any).del(key);
  } catch {
    // best-effort
  }
}

export async function getVaultAsset(slug: string): Promise<VaultAsset | null> {
  const cleanSlug = asString(slug).trim();
  if (!cleanSlug) return null;

  const cacheKey = `${CACHE_PREFIX}${cleanSlug}`;
  const cached = await cacheGet<VaultAsset>(cacheKey);
  if (cached) return cached;

  try {
    const asset = await prisma.contentMetadata.findUnique({
      where: { slug: cleanSlug },
    });

    if (!asset) return null;

    const mapped = mapDbAsset(asset);
    await cacheSet(cacheKey, mapped, CACHE_TTL_SECONDS);
    return mapped;
  } catch (error) {
    logError("Failed to fetch vault asset", { slug: cleanSlug, error });
    return null;
  }
}

export async function getVaultAssetsByTier(tier: string): Promise<VaultAsset[]> {
  const t = normalizeTier(tier);

  const cacheKey = `${CACHE_PREFIX}tier:${t}`;
  const cached = await cacheGet<VaultAsset[]>(cacheKey);
  if (cached) return cached;

  try {
    const assets = await prisma.contentMetadata.findMany({
      where: { classification: t },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = assets.map(mapDbAsset);
    await cacheSet(cacheKey, mapped, CACHE_TTL_LIST_SECONDS);
    return mapped;
  } catch (error) {
    logError("Failed to fetch vault assets by tier", { tier: t, error });
    return [];
  }
}

export async function syncVaultAsset(slug: string, data: Partial<VaultAsset>) {
  const cleanSlug = asString(slug).trim();
  if (!cleanSlug) throw new Error("VAULT_SYNC_SLUG_REQUIRED");

  const title = asString(data.title, cleanSlug);
  const type = asString(data.type, "unknown");
  const tier = normalizeTier(data.tier ?? "public");
  const metadataObj = data.metadata ?? {};

  try {
    const record = await prisma.contentMetadata.upsert({
      where: { slug: cleanSlug },
      update: {
        title,
        type,
        classification: tier,
        metadata: JSON.stringify(metadataObj ?? {}),
        updatedAt: new Date(),
      },
      create: {
        slug: cleanSlug,
        title,
        type,
        classification: tier,
        metadata: JSON.stringify(metadataObj ?? {}),
      },
    });

    // bust caches
    await cacheDel(`${CACHE_PREFIX}${cleanSlug}`);
    await cacheDel(`${CACHE_PREFIX}tier:${tier}`);

    return record;
  } catch (error) {
    logError("Failed to sync vault asset", { slug: cleanSlug, error });
    throw error;
  }
}

export async function deleteVaultAsset(slug: string) {
  const cleanSlug = asString(slug).trim();
  if (!cleanSlug) throw new Error("VAULT_DELETE_SLUG_REQUIRED");

  try {
    // get tier first for cache busting
    const existing = await prisma.contentMetadata.findUnique({ where: { slug: cleanSlug } });
    const tier = normalizeTier(existing?.classification ?? "public");

    const deleted = await prisma.contentMetadata.delete({
      where: { slug: cleanSlug },
    });

    await cacheDel(`${CACHE_PREFIX}${cleanSlug}`);
    await cacheDel(`${CACHE_PREFIX}tier:${tier}`);

    return deleted;
  } catch (error) {
    logError("Failed to delete vault asset", { slug: cleanSlug, error });
    throw error;
  }
}

export async function getVaultStats() {
  try {
    const total = await prisma.contentMetadata.count();

    const byTier = await prisma.contentMetadata.groupBy({
      by: ["classification"],
      _count: { _all: true },
    });

    const mapped = byTier.reduce<Record<string, number>>((acc, row: any) => {
      const k = normalizeTier(row.classification);
      const n = typeof row?._count?._all === "number" ? row._count._all : 0;
      acc[k] = n;
      return acc;
    }, {});

    return { total, byTier: mapped };
  } catch (error) {
    logError("Failed to get vault stats", { error });
    return { total: 0, byTier: {} as Record<string, number> };
  }
}

export async function searchVault(query: string) {
  const q = asString(query).trim();
  if (!q) return [];

  try {
    const results = await prisma.contentMetadata.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    return results.map(mapDbAsset);
  } catch (error) {
    logError("Failed to search vault", { query: q, error });
    return [];
  }
}