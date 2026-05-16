/**
 * lib/product/professional-trial.ts
 *
 * Professional 7-day trial management.
 *
 * Uses the existing ClientEntitlement model with status="trial".
 * Trial entitlements are checked by resolveCanonicalEntitlement
 * (which looks for status "active") — so we add a separate check
 * that also considers "trial" status.
 *
 * Rules:
 * - No existing records are locked after trial ends.
 * - If trial expires and user does not upgrade, excess active cases
 *   become read-only/archived or user chooses which remain active.
 * - User must be clearly warned before downgrade.
 * - No destructive action.
 * - Trial state must be visible in account/Decision Centre.
 */

import { prisma } from "@/lib/prisma.server";
import { resolveCanonicalEntitlement, grantCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { CATALOG } from "@/lib/commercial/catalog";

export const PROFESSIONAL_TRIAL_DAYS = 7;

export type TrialStatus = "ACTIVE" | "EXPIRED" | "CONVERTED" | "CANCELLED" | "NONE";

export type TrialInfo = {
  status: TrialStatus;
  startedAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
};

/**
 * Returns the current trial status for a user.
 */
export async function getTrialInfo(email: string): Promise<TrialInfo> {
  try {
    const row = await prisma.clientEntitlement.findFirst({
      where: {
        email: email.toLowerCase(),
        productCode: CATALOG.professional!.entitlementSlug,
        OR: [
          { status: "trial" },
          { status: "active" },
          { status: "expired" },
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!row) {
      return { status: "NONE", startedAt: null, endsAt: null, daysRemaining: null };
    }

    // Check if trial has been converted to active (paid)
    if (row.status === "active") {
      return {
        status: "CONVERTED",
        startedAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        daysRemaining: null,
      };
    }

    if (row.status === "trial") {
      const now = Date.now();
      const endsAt = row.endsAt?.getTime() ?? now;
      const daysRemaining = Math.max(0, Math.ceil((endsAt - now) / (1000 * 60 * 60 * 24)));

      if (endsAt <= now) {
        // Trial has expired — mark it
        await prisma.clientEntitlement.update({
          where: {
            id: (await prisma.clientEntitlement.findFirst({
              where: { email: email.toLowerCase(), productCode: CATALOG.professional!.entitlementSlug, status: "trial" },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            }))!.id,
          },
          data: { status: "expired" },
        });
        return { status: "EXPIRED", startedAt: row.startsAt.toISOString(), endsAt: row.endsAt?.toISOString() ?? null, daysRemaining: 0 };
      }

      return {
        status: "ACTIVE",
        startedAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        daysRemaining,
      };
    }

    if (row.status === "expired") {
      return {
        status: "EXPIRED",
        startedAt: row.startsAt.toISOString(),
        endsAt: row.endsAt?.toISOString() ?? null,
        daysRemaining: 0,
      };
    }

    return { status: "NONE", startedAt: null, endsAt: null, daysRemaining: null };
  } catch {
    return { status: "NONE", startedAt: null, endsAt: null, daysRemaining: null };
  }
}

/**
 * Starts a 7-day Professional trial for the user.
 * Creates a ClientEntitlement record with status="trial".
 */
export async function startProfessionalTrial(input: {
  email: string;
  userId?: string | null;
}): Promise<{ ok: true; trial: TrialInfo } | { ok: false; reason: string }> {
  const email = input.email.toLowerCase();
  const slug = CATALOG.professional!.entitlementSlug;

  // Check if already has trial or active
  const existing = await prisma.clientEntitlement.findFirst({
    where: {
      email,
      productCode: slug,
      OR: [{ status: "trial" }, { status: "active" }],
    },
  });

  if (existing) {
    if (existing.status === "active") {
      return { ok: false, reason: "ALREADY_CONVERTED" };
    }
    if (existing.status === "trial") {
      return { ok: false, reason: "TRIAL_ALREADY_ACTIVE" };
    }
  }

  const now = new Date();
  const endsAt = new Date(now.getTime() + PROFESSIONAL_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  try {
    await prisma.clientEntitlement.create({
      data: {
        email,
        productCode: slug,
        tier: "professional",
        source: "trial",
        externalRef: input.userId ?? null,
        status: "trial",
        startsAt: now,
        endsAt,
      },
    });

    return {
      ok: true,
      trial: {
        status: "ACTIVE",
        startedAt: now.toISOString(),
        endsAt: endsAt.toISOString(),
        daysRemaining: PROFESSIONAL_TRIAL_DAYS,
      },
    };
  } catch (error) {
    console.error("[professional-trial] Failed to start trial:", error);
    return { ok: false, reason: "INTERNAL_ERROR" };
  }
}

/**
 * Checks whether a user with an active trial should be treated
 * as having Professional entitlements for case limit purposes.
 */
export async function hasProfessionalAccess(email: string): Promise<boolean> {
  try {
    // Check for paid Professional entitlement
    const paid = await resolveCanonicalEntitlement({
      email,
      slug: CATALOG.professional!.entitlementSlug,
    });
    if (paid.granted) return true;

    // Check for active trial
    const trial = await getTrialInfo(email);
    return trial.status === "ACTIVE";
  } catch {
    return false;
  }
}
