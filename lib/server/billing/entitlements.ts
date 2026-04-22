// server-only guard removed — Pages Router incompatible
import { prisma } from "@/lib/prisma.server";
import {
  grantCanonicalEntitlement,
  resolveCanonicalEntitlement,
} from "@/lib/commercial/entitlement-authority";

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
  STRATEGY_ROOM_ENTRY:                  "strategy-room.entry",
  DECISION_EXPOSURE_INSTRUMENT:         "decision-exposure-instrument",
  MANDATE_CLARITY_FRAMEWORK:            "mandate-clarity-framework",
  INTERVENTION_PATH_SELECTOR:           "intervention-path-selector",
  GLOBAL_MARKET_INTELLIGENCE_Q1_2026:   "global-market-intelligence-report-q1-2026",
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
  return grantCanonicalEntitlement({
    email,
    slug: input.productCode,
    source: input.source === "manual" ? "manual" : "purchase",
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
  const entitlement = await resolveCanonicalEntitlement({
    email: email.trim().toLowerCase(),
    slug: productCode,
  });
  return entitlement.granted;
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
