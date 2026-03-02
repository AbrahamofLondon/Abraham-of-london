/* pages/api/admin/onboard-principal.ts — SSOT ALIGNED */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generatePrincipalKey } from "@/lib/auth/key-generator";
import { sendOnboardingWelcome } from "@/lib/intelligence/notification-delegate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Level 4 Authorization Check - using SSOT tiers
  const session = await getServerSession(req, res, authOptions);
  
  // Extract user tier from session (normalized)
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? 
    (session?.user as any)?.role ?? 
    "public"
  );
  
  // Only users with architect+ access can onboard principals
  if (!hasAccess(userTier, "architect")) {
    return res.status(403).json({ 
      error: "Unauthorized Command Elevation. Requires Architect clearance." 
    });
  }

  const { inquiryId, assignedTier = "client" } = req.body; // Default to client instead of inner-circle-elite

  // Normalize the assigned tier (handles legacy values)
  const normalizedTier = normalizeUserTier(assignedTier);

  try {
    // 2. Retrieve Vetted Inquiry
    const inquiry = await prisma.strategyInquiry.findUnique({ 
      where: { id: inquiryId } 
    });
    
    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    // 3. Atomic Transaction: Create Member & Generate Keys
    const result = await prisma.$transaction(async (tx) => {
      // Create the Inner Circle Member with normalized tier
      const member = await tx.innerCircleMember.create({
        data: {
          email: inquiry.email,
          name: inquiry.name,
          role: "MEMBER",
          tier: normalizedTier, // Store normalized tier
          status: "active",
          emailHash: inquiry.email, // In production, use a proper hashing utility
          metadata: {
            originalTier: assignedTier, // Keep original for audit
            onboardedBy: session.user.id,
            onboardedAt: new Date().toISOString(),
          },
        }
      });

      // Generate the 256-bit Institutional Key
      const keyData = await generatePrincipalKey(member.id, normalizedTier);

      // Update Inquiry Status
      await tx.strategyInquiry.update({
        where: { id: inquiryId },
        data: { 
          status: "ONBOARDED", 
          memberId: member.id 
        }
      });

      return { member, keyData };
    });

    // 4. Dispatch Secure Credentials via Delegate
    await sendOnboardingWelcome(result.member, result.keyData.rawKey);

    // 5. Log System Event
    await prisma.systemAuditLog.create({
      data: {
        action: "PRINCIPAL_ONBOARDED",
        severity: "high",
        actorId: session.user.id,
        resourceId: result.member.id,
        metadata: { 
          tier: normalizedTier,
          originalTier: assignedTier,
          tierLabel: getTierLabel(normalizedTier),
        }
      }
    });

    return res.status(200).json({ 
      ok: true, 
      memberId: result.member.id,
      tier: normalizedTier,
    });

  } catch (error) {
    console.error("[ONBOARDING_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Transaction failed." });
  }
}