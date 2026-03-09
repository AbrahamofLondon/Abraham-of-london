// lib/vault-engine.ts — VAULT SSOT (Prisma + optional Redis cache)
/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from "@/lib/prisma";
import { getRedis } from "@/lib/redis";
import { getAuditLogger } from "@/lib/audit/audit-logger";
import type { AccessTier as DbAccessTier } from "@prisma/client";
import {
  normalizeRequiredTier,
  type AccessTier as PolicyAccessTier,
} from "@/lib/access/tier-policy";

export interface VaultAsset {
  id: string;
  slug: string;
  title: string;
  type: string;
  tier: PolicyAccessTier;
  metadata: Record<string, any>;
  updatedAt?: string;
  createdAt?: string;
}

const CACHE_PREFIX = "vault:asset:";
const CACHE_TTL_SECONDS = 60;
const CACHE_TTL_LIST_SECONDS = 45;

async function auditVaultFailure(
  action: string,
  details: Record<string, unknown>
) {
  try {
    await getAuditLogger().log({
      action,
      severity: "warning",
      status: "failure",
      category: "system",
      resourceType: "VAULT_ASSET",
      metadata: details,
    });
  } catch {
    // fail-open
  }
}

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

function toDbTier(raw: unknown): DbAccessTier {
  const policyTier: PolicyAccessTier = normalizeRequiredTier(raw);

  switch (policyTier) {
    case "public":
      return "public";
    case "member":
      return "member";
    case "inner-circle":
      return "inner_circle";
    case "client":
      return "client";
    case "legacy":
      return "legacy";
    case "architect":
      return "architect";
    case "owner":
      return "owner";
    default:
      return "public";
  }
}

function fromDbTier(raw: unknown): PolicyAccessTier {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "inner_circle") return "inner-circle";
  return normalizeRequiredTier(s);
}

function mapDbAsset(asset: any): VaultAsset {
  return {
    id: asString(asset?.id),
    slug: asString(asset?.slug),
    title: asString(asset?.title, asString(asset?.slug, "Untitled")),
    type: asString(
      asset?.type ?? asset?.contentType ?? asset?.kind ?? asset?.category,
      "unknown"
    ),
    tier: fromDbTier(asset?.classification ?? asset?.tier ?? "public"),
    metadata: safeJsonParse(asset?.metadata),
    updatedAt: asset?.updatedAt
      ? new Date(asset.updatedAt).toISOString()
      : undefined,
    createdAt: asset?.createdAt
      ? new Date(asset.createdAt).toISOString()
      : undefined,
  };
}

async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch (error) {
    await auditVaultFailure("VAULT_CACHE_GET_FAILED", {
      cacheKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function cacheSet(key: string, value: any, ttlSeconds: number) {
  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    await auditVaultFailure("VAULT_CACHE_SET_FAILED", {
      cacheKey: key,
      ttlSeconds,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function cacheDel(key: string) {
  try {
    const redis = getRedis();
    await redis.del(key);
  } catch (error) {
    await auditVaultFailure("VAULT_CACHE_DELETE_FAILED", {
      cacheKey: key,
      error: error instanceof Error ? error.message : String(error),
    });
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
    await auditVaultFailure("VAULT_FETCH_ASSET_FAILED", {
      slug: cleanSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function getVaultAssetsByTier(
  tier: string
): Promise<VaultAsset[]> {
  const t = toDbTier(tier);

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
    await auditVaultFailure("VAULT_FETCH_BY_TIER_FAILED", {
      tier: t,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function syncVaultAsset(
  slug: string,
  data: Partial<VaultAsset>
) {
  const cleanSlug = asString(slug).trim();
  if (!cleanSlug) throw new Error("VAULT_SYNC_SLUG_REQUIRED");

  const title = asString(data.title, cleanSlug);
  const tier = toDbTier(data.tier ?? "public");
  const metadataObj = data.metadata ?? {};

  try {
    const record = await prisma.contentMetadata.upsert({
      where: { slug: cleanSlug },
      update: {
        title,
        classification: tier,
        metadata: JSON.stringify(metadataObj ?? {}),
        updatedAt: new Date(),
      },
      create: {
        slug: cleanSlug,
        title,
        classification: tier,
        metadata: JSON.stringify(metadataObj ?? {}),
      },
    });

    await cacheDel(`${CACHE_PREFIX}${cleanSlug}`);
    await cacheDel(`${CACHE_PREFIX}tier:${tier}`);

    return record;
  } catch (error) {
    await auditVaultFailure("VAULT_SYNC_ASSET_FAILED", {
      slug: cleanSlug,
      tier,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function deleteVaultAsset(slug: string) {
  const cleanSlug = asString(slug).trim();
  if (!cleanSlug) throw new Error("VAULT_DELETE_SLUG_REQUIRED");

  try {
    const existing = await prisma.contentMetadata.findUnique({
      where: { slug: cleanSlug },
    });
    const tier = toDbTier(existing?.classification ?? "public");

    const deleted = await prisma.contentMetadata.delete({
      where: { slug: cleanSlug },
    });

    await cacheDel(`${CACHE_PREFIX}${cleanSlug}`);
    await cacheDel(`${CACHE_PREFIX}tier:${tier}`);

    return deleted;
  } catch (error) {
    await auditVaultFailure("VAULT_DELETE_ASSET_FAILED", {
      slug: cleanSlug,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function getVaultStats(): Promise<{
  total: number;
  byTier: Record<PolicyAccessTier, number>;
}> {
  try {
    const total = await prisma.contentMetadata.count();

    const byTier = await prisma.contentMetadata.groupBy({
      by: ["classification"],
      _count: { _all: true },
    });

    const base: Record<PolicyAccessTier, number> = {
      public: 0,
      member: 0,
      "inner-circle": 0,
      client: 0,
      legacy: 0,
      architect: 0,
      owner: 0,
    };

    const mapped = byTier.reduce<Record<PolicyAccessTier, number>>(
      (acc, row: any) => {
        const k = fromDbTier(row.classification);
        const n = typeof row?._count?._all === "number" ? row._count._all : 0;
        acc[k] = n;
        return acc;
      },
      base
    );

    return { total, byTier: mapped };
  } catch (error) {
    await auditVaultFailure("VAULT_STATS_FAILED", {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      total: 0,
      byTier: {
        public: 0,
        member: 0,
        "inner-circle": 0,
        client: 0,
        legacy: 0,
        architect: 0,
        owner: 0,
      },
    };
  }
}

export async function searchVault(query: string): Promise<VaultAsset[]> {
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
    await auditVaultFailure("VAULT_SEARCH_FAILED", {
      query: q,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}