// server-only guard removed — Pages Router incompatible
import { prisma } from "@/lib/prisma.server";

export const PRODUCT_CODES = {
  // Original catalog
  EXECUTIVE_REPORT_SAMPLE:              "executive-report-sample",
  EXECUTIVE_REPORT_FULL:                "executive-report-full",
  BOARDROOM_PDF:                        "boardroom-pdf",
  INTERVENTION_EXPORTS:                 "intervention-exports",
  STRATEGY_ROOM_PRIVATE_ARTEFACTS:      "strategy-room-private-artefacts",
  // Assessment ladder — canonical product surface (C8 expansion)
  ASSESSMENT_CONSTITUTIONAL:            "assessment.constitutional",
  ASSESSMENT_TEAM:                      "assessment.team",
  ASSESSMENT_ENTERPRISE:                "assessment.enterprise",
  ASSESSMENT_EXECUTIVE_REPORTING:       "assessment.executive_reporting",
  EXECUTIVE_REPORT_SAMPLE_DOWNLOAD:     "executive-report.sample-download",
  EXECUTIVE_REPORT_FULL_V2:             "executive-report.full",
  EXECUTIVE_REPORT_BOARDROOM_PDF:       "executive-report.boardroom-pdf",
  EXECUTIVE_REPORT_INTERVENTION:        "executive-report.intervention-export",
  STRATEGY_ROOM_ARTEFACTS_V2:           "strategy-room.private-artefacts",
} as const;

export type ProductCode = (typeof PRODUCT_CODES)[keyof typeof PRODUCT_CODES];

export async function grantEntitlement(input: {
  email: string;
  productCode: ProductCode;
  tier: string;
  source?: string;
  externalRef?: string | null;
  endsAt?: Date | null;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.clientEntitlement.findFirst({
    where: {
      email,
      productCode: input.productCode,
      status: "active",
    },
  });

  if (existing) {
    return prisma.clientEntitlement.update({
      where: { id: existing.id },
      data: {
        tier: input.tier,
        source: input.source || existing.source,
        externalRef: input.externalRef || existing.externalRef,
        endsAt: input.endsAt ?? existing.endsAt,
        status: "active",
      },
    });
  }

  return prisma.clientEntitlement.create({
    data: {
      email,
      productCode: input.productCode,
      tier: input.tier,
      source: input.source || "manual",
      externalRef: input.externalRef || null,
      endsAt: input.endsAt || null,
      status: "active",
    },
  });
}

export async function revokeEntitlement(
  email: string,
  productCode: ProductCode
) {
  return prisma.clientEntitlement.updateMany({
    where: {
      email: email.trim().toLowerCase(),
      productCode,
      status: "active",
    },
    data: { status: "revoked" },
  });
}

export async function hasEntitlement(
  email: string,
  productCode: ProductCode
) {
  const now = new Date();
  const match = await prisma.clientEntitlement.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      productCode,
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
  });
  return !!match;
}

export async function getEntitlements(email: string) {
  const now = new Date();
  return prisma.clientEntitlement.findMany({
    where: {
      email: email.trim().toLowerCase(),
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
}
