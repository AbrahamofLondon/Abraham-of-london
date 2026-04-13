/* pages/api/admin/onboard-principal.ts — COMPILE-SAFE, SSOT + DB SCHEMA ALIGNED */
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { InquiryStatus } from "@prisma/client";
import { generatePrincipalKey } from "@/lib/auth/key-generator";
import { sendOnboardingWelcome } from "@/lib/intelligence/notification-delegate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

import {
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

type DbAccessTier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner";

type ApiResponse =
  | {
      ok: true;
      memberId: string;
      tier: string;
    }
  | {
      ok?: false;
      error: string;
    };

function toDbTier(input: unknown): DbAccessTier {
  const normalized = normalizeUserTier(input);

  switch (normalized) {
    case "inner-circle":
      return "inner_circle";
    case "public":
    case "member":
    case "client":
    case "legacy":
    case "architect":
    case "owner":
      return normalized;
    default:
      return "public";
  }
}

function getSessionActor(session: unknown): {
  id: string;
  email: string | null;
  tier: string;
} {
  const user = (session as { user?: Record<string, unknown> } | null)?.user || {};

  const id =
    typeof user.id === "string" && user.id.trim() ? user.id.trim() : "system";

  const email =
    typeof user.email === "string" && user.email.trim()
      ? user.email.trim()
      : null;

  const tier = normalizeUserTier(user.tier ?? user.role ?? "public");

  return { id, email, tier };
}

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createMemberId(): string {
  return randomUUID();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  const session = await getServerSession(req, res, authOptions);
  const actor = getSessionActor(session);

  if (!hasAccess(actor.tier, "architect")) {
    return res.status(403).json({
      error: "Unauthorized Command Elevation. Requires Architect clearance.",
    });
  }

  const inquiryId = pickString(req.body?.inquiryId);
  if (!inquiryId) {
    return res.status(400).json({
      error: "inquiryId is required.",
    });
  }

  const assignedTier = req.body?.assignedTier ?? "client";
  const normalizedTier = normalizeUserTier(assignedTier);
  const dbTier = toDbTier(assignedTier);

  try {
    const inquiry = await prisma.strategyInquiry.findUnique({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      return res.status(404).json({ error: "Inquiry not found." });
    }

    const result = await prisma.$transaction(async (tx) => {
      const memberId = createMemberId();

      const member = await tx.innerCircleMember.create({
        data: {
          id: memberId,
          email: inquiry.email,
          name: inquiry.name,
          role: "MEMBER",
          tier: dbTier,
          status: "active",
          emailHash: inquiry.email,
        },
      });

      const keyData = await generatePrincipalKey(member.id);

      // ✅ This now works because ONBOARDED exists in the schema
      await tx.strategyInquiry.update({
        where: { id: inquiryId },
        data: {
          status: InquiryStatus.ONBOARDED,
          memberId: member.id,
        },
      });

      await tx.systemAuditLog.create({
        data: {
          action: "PRINCIPAL_ONBOARDED",
          severity: "error",
          actorId: actor.id,
          actorEmail: actor.email,
          resourceId: member.id,
          resourceType: "INNER_CIRCLE_MEMBER",
          resourceName: inquiry.email,
          status: "success",
          category: "admin",
          subCategory: "onboarding",
          metadata: JSON.stringify({
            inquiryId,
            originalTier: String(assignedTier),
            normalizedTier,
            dbTier,
            tierLabel: getTierLabel(normalizedTier),
            onboardedBy: actor.id,
            onboardedAt: new Date().toISOString(),
          }),
        },
      });

      return { member, keyData };
    });

    await sendOnboardingWelcome(result.member, result.keyData.rawKey);

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