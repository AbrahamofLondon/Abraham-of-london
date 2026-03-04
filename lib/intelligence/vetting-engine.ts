/* lib/intelligence/vetting-engine.ts */
import "server-only";

import { prisma } from "@/lib/prisma.server";
import { notifyPrincipalOfPriority } from "./notification-delegate";
import { InquiryStatus } from "@prisma/client";

/**
 * INSTITUTIONAL VETTING HEURISTICS
 * Analyzes domain authority and intent keyword density.
 */
const HIGH_STATUS_DOMAINS = [
  ".gov",
  ".edu",
  ".org",
  "familyoffice.com",
  "capital.com",
  "wealth.com",
  "directorate.net",
  "sovereign.io",
] as const;

const PRIORITY_KEYWORDS = [
  "sovereign",
  "succession",
  "liquidity",
  "trust",
  "architecture",
  "legacy",
  "discreet",
  "alpha",
] as const;

type VettingResult = {
  priorityScore: number;
  recommendedStatus: InquiryStatus;
};

/**
 * Resolve enum members safely across schema changes.
 * If your enum uses different names, this still compiles and runs.
 */
function resolveStatus(preferred: Array<keyof typeof InquiryStatus>): InquiryStatus {
  for (const k of preferred) {
    if (k in InquiryStatus) return InquiryStatus[k];
  }
  // Ultimate fallback: pick the first enum value deterministically
  const first = Object.values(InquiryStatus)[0] as InquiryStatus | undefined;
  if (!first) throw new Error("InquiryStatus enum appears empty or unavailable.");
  return first;
}

const STATUS_PENDING = resolveStatus(["PENDING", "pending"] as any);
const STATUS_PRIORITY = resolveStatus(["PRIORITY", "priority"] as any);
const STATUS_ARCHIVED = resolveStatus(["ARCHIVED", "archived"] as any);

function computeVetting(emailRaw: string, intentRaw: string): VettingResult {
  const email = String(emailRaw || "").toLowerCase();
  const intent = String(intentRaw || "").toLowerCase();

  let priorityScore = 0;

  if (HIGH_STATUS_DOMAINS.some((domain) => email.endsWith(domain))) {
    priorityScore += 50;
  }

  for (const word of PRIORITY_KEYWORDS) {
    if (intent.includes(word)) priorityScore += 10;
  }

  let recommendedStatus: InquiryStatus = STATUS_PENDING;

  if (priorityScore >= 70) recommendedStatus = STATUS_PRIORITY;
  else if (priorityScore < 10) recommendedStatus = STATUS_ARCHIVED;

  return { priorityScore, recommendedStatus };
}

export async function vetStrategyInquiry(inquiryId: string) {
  const inquiry = await prisma.strategyInquiry.findUnique({
    where: { id: inquiryId },
  });

  if (!inquiry) return null;

  const { priorityScore, recommendedStatus } = computeVetting(inquiry.email, inquiry.intent);

  const existingMeta =
    inquiry.metadata && typeof inquiry.metadata === "object"
      ? (inquiry.metadata as Record<string, unknown>)
      : {};

  const updatedInquiry = await prisma.strategyInquiry.update({
    where: { id: inquiryId },
    data: {
      status: recommendedStatus,
      metadata: {
        ...existingMeta,
        priorityScore,
        vettedAt: new Date().toISOString(),
        analysisVersion: "V5-INTEGRATED",
      },
    },
  });

  if (recommendedStatus === STATUS_PRIORITY) {
    try {
      await notifyPrincipalOfPriority(updatedInquiry);
    } catch (err) {
      console.error("[VETTING_NOTIFY_ERROR]:", err);
    }
  }

  return updatedInquiry;
}