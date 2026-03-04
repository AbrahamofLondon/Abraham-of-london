/* lib/inner-circle/exports.server.ts */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import * as Core from "./keys.server";
import { generatePDF } from "@/lib/pdf-generator";
import type { AccessTier } from "@prisma/client";

// Bridge existing core functions
export const {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  getPrivacySafeStats,
  recordInnerCircleUnlock,
  cleanupExpiredData,
  normalizeTier,
} = Core;

/**
 * Administrative Data Exports
 * Required by: /pages/api/admin/inner-circle/export.ts
 *
 * Prisma SSOT:
 * model InnerCircleKey {
 *   memberId  String
 *   member    InnerCircleMember @relation(...)
 *   status    KeyStatus @default(active)
 *   expiresAt DateTime
 * }
 *
 * Tier is on InnerCircleMember (AccessTier), NOT on InnerCircleKey.
 */

function parseAccessTier(input: string): AccessTier {
  const t = String(input || "").trim().toLowerCase();

  // allow common legacy aliases without polluting DB logic
  if (t === "free") return "public";
  if (t === "inner-circle") return "inner_circle";

  // strict mapping
  switch (t) {
    case "public":
    case "member":
    case "inner_circle":
    case "client":
    case "legacy":
    case "architect":
    case "owner":
      return t;
    default:
      // conservative default; prevents leaking all keys if tier param is junk
      return "public";
  }
}

export async function getActiveKeys() {
  return await prisma.innerCircleKey.findMany({
    where: {
      status: "active",
      expiresAt: { gt: new Date() },
    },
    include: { member: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKeysByTier(tier: string) {
  const parsedTier = parseAccessTier(tier);

  return await prisma.innerCircleKey.findMany({
    where: {
      member: { tier: parsedTier },
    },
    include: { member: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getKeysByMember(memberId: string) {
  return await prisma.innerCircleKey.findMany({
    where: { memberId },
    include: { member: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Expiry Utility
 */
export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

/**
 * ON-DEMAND GENERATION CALL
 */
export async function generateBriefPDF(id: string) {
  return await generatePDF(id);
}

export type { KeyTier, StoredKey } from "./keys.client";