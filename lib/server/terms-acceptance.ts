/**
 * lib/server/terms-acceptance.ts
 *
 * Versioned Terms and Privacy acceptance tracking.
 *
 * Records the version of Terms and Privacy Policy a user accepted and when.
 * Called on first authenticated use; re-called whenever the version bumps.
 *
 * docType: "TERMS" | "PRIVACY"
 * version: semantic string — e.g. "2025-01-01" or "v3"
 *
 * One row per (userId, docType). Upserted on each new version acceptance.
 * The prior acceptance is overwritten — audit trail lives in SystemAuditLog.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const CURRENT_TERMS_VERSION = "2025-05-01";
export const CURRENT_PRIVACY_VERSION = "2025-05-01";

export type DocType = "TERMS" | "PRIVACY";

export type TermsAcceptanceRecord = {
  userId: string;
  email: string;
  docType: DocType;
  version: string;
  acceptedAt: Date;
};

function hashIp(ip: string): string {
  const salt = process.env.ANONYMITY_SALT || process.env.SYSTEM_INTEGRITY_SALT || "dev-salt";
  return crypto.createHmac("sha256", salt).update(ip).digest("hex").slice(0, 32);
}

/**
 * Record or update a terms/privacy acceptance for a user.
 * Safe to call on every authenticated request — idempotent when version unchanged.
 */
export async function recordAcceptance(input: {
  userId: string;
  email: string;
  docType: DocType;
  version: string;
  ip?: string;
  userAgent?: string;
}): Promise<TermsAcceptanceRecord> {
  const now = new Date();
  const ipHash = input.ip ? hashIp(input.ip) : null;
  const ua = input.userAgent ? input.userAgent.slice(0, 250) : null;

  const row = await prisma.termsAcceptance.upsert({
    where: {
      terms_acceptance_user_doc: {
        userId: input.userId,
        docType: input.docType,
      },
    },
    create: {
      userId: input.userId,
      email: input.email,
      docType: input.docType,
      version: input.version,
      acceptedAt: now,
      ipHash,
      userAgent: ua,
    },
    update: {
      version: input.version,
      acceptedAt: now,
      ipHash,
      userAgent: ua,
      updatedAt: now,
    },
    select: {
      userId: true,
      email: true,
      docType: true,
      version: true,
      acceptedAt: true,
    },
  });

  return row as TermsAcceptanceRecord;
}

/**
 * Check whether a user has accepted the current version of a document.
 * Returns null if no record exists.
 */
export async function getAcceptance(
  userId: string,
  docType: DocType,
): Promise<TermsAcceptanceRecord | null> {
  const row = await prisma.termsAcceptance.findUnique({
    where: {
      terms_acceptance_user_doc: { userId, docType },
    },
    select: {
      userId: true,
      email: true,
      docType: true,
      version: true,
      acceptedAt: true,
    },
  });
  return row as TermsAcceptanceRecord | null;
}

/**
 * Returns true if the user needs to accept the latest terms or privacy version.
 */
export async function needsAcceptance(
  userId: string,
  docType: DocType,
): Promise<boolean> {
  const current =
    docType === "TERMS" ? CURRENT_TERMS_VERSION : CURRENT_PRIVACY_VERSION;
  const record = await getAcceptance(userId, docType);
  return !record || record.version !== current;
}
