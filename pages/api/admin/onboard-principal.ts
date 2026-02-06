/* pages/api/admin/onboard-principal.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { generatePrincipalKey } from "@/lib/auth/key-generator";
import { sendOnboardingWelcome } from "@/lib/intelligence/notification-delegate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Level 4 Authorization Check
  const session = await getServerSession(req, res, authOptions);
  if (session?.user.role !== "PRINCIPAL" && session?.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized Command Elevation." });
  }

  const { inquiryId, assignedTier = "inner-circle-elite" } = req.body;

  try {
    // 2. Retrieve Vetted Inquiry
    const inquiry = await prisma.strategyInquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry) return res.status(404).json({ error: "Inquiry not found." });

    // 3. Atomic Transaction: Create Member & Generate Keys
    const result = await prisma.$transaction(async (tx) => {
      // Create the Inner Circle Member
      const member = await tx.innerCircleMember.create({
        data: {
          email: inquiry.email,
          name: inquiry.name,
          role: "MEMBER",
          tier: assignedTier,
          status: "active",
          emailHash: inquiry.email, // In production, use a proper hashing utility
        }
      });

      // Generate the 256-bit Institutional Key
      const keyData = await generatePrincipalKey(member.id, assignedTier);

      // Update Inquiry Status
      await tx.strategyInquiry.update({
        where: { id: inquiryId },
        data: { status: "ONBOARDED", memberId: member.id }
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
        metadata: { tier: assignedTier }
      }
    });

    return res.status(200).json({ ok: true, memberId: result.member.id });

  } catch (error) {
    console.error("[ONBOARDING_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Transaction failed." });
  }
}