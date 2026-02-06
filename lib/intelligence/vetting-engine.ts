/* lib/intelligence/vetting-engine.ts */
import { prisma } from "@/lib/prisma";
import { notifyPrincipalOfPriority } from "./notification-delegate";

/**
 * INSTITUTIONAL VETTING HEURISTICS
 * Analyzes domain authority and intent keyword density.
 */
const HIGH_STATUS_DOMAINS = [
  '.gov', '.edu', '.org', 
  'familyoffice.com', 'capital.com', 'wealth.com',
  'directorate.net', 'sovereign.io'
];

const PRIORITY_KEYWORDS = [
  'sovereign', 'succession', 'liquidity', 'trust', 
  'architecture', 'legacy', 'discreet', 'alpha'
];

export async function vetStrategyInquiry(inquiryId: string) {
  const inquiry = await prisma.strategyInquiry.findUnique({
    where: { id: inquiryId }
  });

  if (!inquiry) return null;

  const email = inquiry.email.toLowerCase();
  const intent = inquiry.intent.toLowerCase();

  let priorityScore = 0;
  let recommendedStatus = "PENDING";

  // 1. Domain Authority Validation (+50 Points)
  if (HIGH_STATUS_DOMAINS.some(domain => email.endsWith(domain))) {
    priorityScore += 50;
  }

  // 2. Strategic Intent Density (+10 Points per Keyword)
  PRIORITY_KEYWORDS.forEach(word => {
    if (intent.includes(word)) priorityScore += 10;
  });

  // 3. Status Promotion Logic
  if (priorityScore >= 70) {
    recommendedStatus = "PRIORITY";
  } else if (priorityScore < 10) {
    recommendedStatus = "ARCHIVED"; 
  }

  // 4. Persistence & Metadata Enrichment
  const updatedInquiry = await prisma.strategyInquiry.update({
    where: { id: inquiryId },
    data: {
      status: recommendedStatus,
      metadata: {
        ...(inquiry.metadata as object),
        priorityScore,
        vettedAt: new Date().toISOString(),
        analysisVersion: "V5-INTEGRATED"
      }
    }
  });

  // 5. Trigger Notification Delegate if Priority
  if (recommendedStatus === "PRIORITY") {
    try {
      await notifyPrincipalOfPriority(updatedInquiry);
    } catch (err) {
      console.error("[VETTING_NOTIFY_ERROR]:", err);
      // Optional: Log failure to SystemAuditLog
    }
  }

  return updatedInquiry;
}