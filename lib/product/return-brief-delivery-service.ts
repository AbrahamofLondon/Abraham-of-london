import { canonicalUrl } from "@/config/site";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { buildReturnBriefEmailTemplate } from "@/lib/email/templates/return-brief";
import { createOutcomeVerificationToken } from "@/lib/product/outcome-verification-service";
import { generateReturnBrief } from "@/lib/server/strategy-room/return-brief.server";

export type ReturnBriefDeliveryResult = {
  mode: "sent" | "preview" | "pending";
  subject: string;
  html: string;
  text: string;
  recipientEmail: string;
  returnBriefUrl: string;
  responseUrl: string;
  providerError?: string | null;
};

type Input = {
  sessionId: string;
  recipientEmail: string;
  recipientName?: string | null;
  preview?: boolean;
};

function buildHeadline(brief: Awaited<ReturnType<typeof generateReturnBrief>>) {
  if (!brief) return "The system has reopened this case because the underlying condition is still active.";
  return brief.opening || "The system has reopened this case because the underlying condition is still active.";
}

function buildUnresolvedCondition(brief: Awaited<ReturnType<typeof generateReturnBrief>>) {
  if (!brief?.contradiction) return "The original execution condition has not yet been resolved.";
  return `${brief.contradiction.decision}. ${brief.contradiction.constraint}`.trim();
}

function buildCostHeadline(brief: Awaited<ReturnType<typeof generateReturnBrief>>) {
  const cost = brief?.costOfInaction;
  if (!cost || cost.basis === "UNAVAILABLE") {
    return "The cost of delay is still accumulating, even where it is not yet externally measured.";
  }
  if (cost.accumulatedCost > 0) {
    return `Estimated cost of delay now stands at ${cost.accumulatedCost} and continues to accumulate.`;
  }
  return "Delay continues to increase exposure.";
}

export async function deliverReturnBrief(input: Input): Promise<ReturnBriefDeliveryResult> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const brief = await generateReturnBrief(input.sessionId);
  if (!brief) {
    throw new Error("Return brief could not be generated for delivery.");
  }

  const outcomeToken = createOutcomeVerificationToken({
    email: recipientEmail,
    checkpointId: brief.checkpointReference?.checkpointId ?? null,
    caseId: brief.sessionKey ?? null,
    journeyId: null,
    strategyRoomSessionId: brief.checkpointReference?.strategyRoomSessionId ?? brief.sessionId,
    executiveRunId: null,
  });

  const returnBriefUrl = canonicalUrl(`/briefing/return/${encodeURIComponent(brief.sessionId)}`);
  const responseUrl = outcomeToken
    ? canonicalUrl(`/api/outcomes/verify?token=${encodeURIComponent(outcomeToken)}`)
    : `${returnBriefUrl}?intent=respond`;

  const built = buildReturnBriefEmailTemplate({
    recipientName: input.recipientName,
    dominantFinding: buildHeadline(brief),
    unresolvedCondition: buildUnresolvedCondition(brief),
    costOfInactionHeadline: buildCostHeadline(brief),
    returnBriefUrl,
    responseUrl,
  });

  if (input.preview || !process.env.RESEND_API_KEY?.trim()) {
    return {
      mode: process.env.RESEND_API_KEY?.trim() ? "preview" : "pending",
      subject: built.subject,
      html: built.html,
      text: built.text,
      recipientEmail,
      returnBriefUrl,
      responseUrl,
      providerError: process.env.RESEND_API_KEY?.trim() ? null : "RESEND_API_KEY_MISSING",
    };
  }

  const sent = await sendEmail({
    type: "TRANSACTIONAL",
    to: recipientEmail,
    subject: built.subject,
    html: built.html,
    text: built.text,
    meta: {
      source: "return_brief_delivery",
    },
  });

  return {
    mode: sent.ok ? "sent" : "pending",
    subject: built.subject,
    html: built.html,
    text: built.text,
    recipientEmail,
    returnBriefUrl,
    responseUrl,
    providerError: sent.error ?? null,
  };
}
