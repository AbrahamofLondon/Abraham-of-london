/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/server/inner-circle-store.ts — PRISMA SSOT STORE (Server-only)
 * - Uses Prisma models (no table-name drift)
 * - Tier is AccessTier (SSOT)
 */
import "server-only";

import { prisma } from "@/lib/prisma";
import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

export type InnerCircleMember = {
  id: string;
  emailHash: string;
  email?: string | null;
  name?: string | null;
  tier: AccessTier;
  status: "active" | "paused" | "disabled";
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
  viewCount: number;
  metadata?: Record<string, any>;
};

function parseFlags(flags: any): string[] {
  if (!flags) return [];
  if (Array.isArray(flags)) return flags.map(String);
  if (typeof flags === "string") {
    try {
      const parsed = JSON.parse(flags);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return flags.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

function mapMember(m: any): InnerCircleMember {
  return {
    id: m.id,
    emailHash: m.emailHash,
    email: m.email ?? null,
    name: m.name ?? null,
    tier: normalizeUserTier(m.tier),
    status: m.status,
    flags: parseFlags(m.flags),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    lastSeenAt: m.lastSeenAt,
    viewCount: m.viewCount ?? 0,
    metadata: (m.metadata ?? {}) as Record<string, any>,
  };
}

export async function getMemberById(id: string): Promise<InnerCircleMember | null> {
  const m = await prisma.innerCircleMember.findUnique({
    where: { id },
  });
  return m ? mapMember(m) : null;
}

export async function getMemberByEmail(email: string): Promise<InnerCircleMember | null> {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return null;
  const m = await prisma.innerCircleMember.findUnique({
    where: { email: e },
  });
  return m ? mapMember(m) : null;
}

export async function getMembersByTier(tier: AccessTier | string, opts?: { status?: string; take?: number; skip?: number }) {
  const t = normalizeUserTier(tier);
  const take = Math.min(500, Math.max(1, opts?.take ?? 50));
  const skip = Math.max(0, opts?.skip ?? 0);

  const rows = await prisma.innerCircleMember.findMany({
    where: {
      tier: t,
      ...(opts?.status ? { status: opts.status as any } : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });

  return rows.map(mapMember);
}

export async function memberHasAccess(memberId: string, requiredTier: AccessTier | string): Promise<boolean> {
  const member = await getMemberById(memberId);
  if (!member || member.status !== "active") return false;
  return hasAccess(member.tier, requiredTier);
}

export async function updateMemberTier(params: { id: string; newTier: AccessTier | string; reason?: string }) {
  const tier = normalizeUserTier(params.newTier);

  const existing = await prisma.innerCircleMember.findUnique({
    where: { id: params.id },
    select: { id: true, tier: true, metadata: true },
  });
  if (!existing) return null;

  const meta = (existing.metadata ?? {}) as any;
  const history = Array.isArray(meta.tierHistory) ? meta.tierHistory : [];

  history.push({
    from: existing.tier,
    to: tier,
    changedAt: new Date().toISOString(),
    reason: params.reason || "manual_update",
  });

  const updated = await prisma.innerCircleMember.update({
    where: { id: params.id },
    data: {
      tier,
      metadata: { ...meta, tierHistory: history },
    },
  });

  return mapMember(updated);
}

export default {
  getMemberById,
  getMemberByEmail,
  getMembersByTier,
  memberHasAccess,
  updateMemberTier,
};ss