/* pages/api/admin/security/resolve-appeal.ts — Institutional Tier Escalation */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { AccessTier } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

/**
 * Runtime narrower: confirms a string is a member of the current Prisma
 * AccessTier enum. Used to honestly gate tier writes to InnerCircleMember
 * without casts. The set this validates against expands when
 * SCHEMA-PR-CHAIN-CHECKLIST-01 PR 1 lands.
 */
function isDbAccessTier(value: string): value is AccessTier {
  return (Object.values(AccessTier) as string[]).includes(value);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  
  // 1. Verify Directorate Clearance
  const adminTier = (session as any)?.aol?.tier;
  if (adminTier !== "admin" && adminTier !== "root") {
    return res.status(403).json({ error: "Insufficient clearance to modify tiers." });
  }

  const { eventId, approved } = req.body;

  try {
    // 2. Fetch the original request data
    const originalEvent = await prisma.systemAuditLog.findUnique({
      where: { id: eventId },
    });

    if (!originalEvent || !originalEvent.actorId) {
      return res.status(404).json({ error: "Original request not found." });
    }

    const _parsedMeta = (() => { try { return JSON.parse(originalEvent.metadata as string ?? "{}"); } catch { return {}; } })();
    const requestedTier = _parsedMeta?.requiredTier;
    const targetUserId = originalEvent.actorId;

    // 3. Atomic Transaction: Update InnerCircleMember tier + close Audit Log
    await prisma.$transaction(async (tx) => {
      if (approved && requestedTier) {
        // Persisted identity is InnerCircleMember. The original code wrote
        // the requested value into a "role" field on a non-existent User
        // model; every other signal in this handler (action name
        // MEMBER_TIER_MODIFIED, variable name requestedTier, response copy
        // "elevated to", audit log previousTier/newTier) indicates the
        // intended target is the tier column, not role. Correcting to tier
        // with runtime narrowing against the current Prisma AccessTier enum.
        const normalized = String(requestedTier).toLowerCase();
        if (isDbAccessTier(normalized)) {
          await tx.innerCircleMember.update({
            where: { id: targetUserId },
            data: { tier: normalized },
          });
        }
      }

      // Update the Audit Log to reflect the decision
      await tx.systemAuditLog.update({
        where: { id: eventId },
        data: {
          status: approved ? "resolved_approved" : "resolved_denied",
          metadata: JSON.stringify({
            ..._parsedMeta,
            resolvedBy: session?.user?.email,
            resolvedAt: new Date().toISOString(),
            finalDecision: approved ? "TIER_ESCALATED" : "REQUEST_REJECTED",
          }),
        },
      });

      // Optional: Log a separate event for the specific Tier Change
      await tx.systemAuditLog.create({
        data: {
          action: "MEMBER_TIER_MODIFIED",
          category: "MEMBERSHIP",
          severity: "info",
          actorId: session?.user?.id,
          actorType: "admin",
          resourceId: targetUserId,
          status: "success",
          metadata: JSON.stringify({
            previousTier: _parsedMeta?.userTier,
            newTier: approved ? requestedTier : "NO_CHANGE",
            reason: "Manual review of appeal " + eventId,
          })
        }
      });
    });

    return res.status(200).json({ 
      ok: true, 
      message: approved ? `User elevated to ${requestedTier}.` : "Appeal rejected." 
    });
  } catch (error) {
    console.error("[TIER_ESCALATION_FAILURE]", error);
    return res.status(500).json({ ok: false, error: "Internal State Error" });
  }
}