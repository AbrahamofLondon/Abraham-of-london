import { canonicalUrl } from "@/config/site";
import { sendEmail } from "@/lib/email/core/sendEmail";
import { buildOversightBriefEmailTemplate } from "@/lib/email/templates/oversight-brief";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { createSignedActionToken } from "@/lib/security/signed-action-token-core";

export type OversightBriefDeliveryResult = {
  mode: "sent" | "preview" | "pending";
  subject: string;
  html: string;
  text: string;
  recipientEmail: string;
  briefUrl: string;
  approveUrl: string;
  challengeUrl: string;
  providerError?: string | null;
};

type Input = {
  recipientEmail: string;
  recipientName?: string | null;
  organisationId?: string | null;
  userId?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  preview?: boolean;
};

function makeDecisionToken(subject: string): string | null {
  try {
    return createSignedActionToken({
      purpose: "oversight_delivery",
      subject,
      ttlSeconds: 60 * 60 * 24 * 14,
    });
  } catch {
    return null;
  }
}

export async function deliverOversightBrief(input: Input): Promise<OversightBriefDeliveryResult> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const composed = await composeOversightBrief({
    userId: input.userId ?? undefined,
    email: recipientEmail,
    organisationId: input.organisationId ?? undefined,
    periodStart: input.periodStart ?? undefined,
    periodEnd: input.periodEnd ?? undefined,
  });

  if (!composed.account || composed.account.status !== "ACTIVE") {
    throw new Error("Oversight brief delivery is retainer-only and requires an active oversight account.");
  }
  if (!composed.brief || !composed.account.currentCycle) {
    throw new Error("Oversight brief could not be composed for delivery.");
  }

  const cycleId = composed.account.currentCycle.cycleId;
  const cycleLabel = `${new Date(composed.account.currentCycle.periodStart).toLocaleDateString("en-GB")} to ${new Date(composed.account.currentCycle.periodEnd).toLocaleDateString("en-GB")}`;
  const deliveryToken = makeDecisionToken(`${recipientEmail}|${cycleId}`);
  const briefUrl = canonicalUrl(`/oversight/brief/${encodeURIComponent(cycleId)}${deliveryToken ? `?deliveryToken=${encodeURIComponent(deliveryToken)}` : ""}`);
  const approveUrl = `${briefUrl}${briefUrl.includes("?") ? "&" : "?"}decision=approve`;
  const challengeUrl = `${briefUrl}${briefUrl.includes("?") ? "&" : "?"}decision=challenge`;

  const built = buildOversightBriefEmailTemplate({
    recipientName: input.recipientName,
    cycleLabel,
    whatRepeated: composed.brief.patternRecurrence?.explanation ?? "No recurrence summary is available yet.",
    whatWorsened: composed.brief.cycleConsequenceProjection?.summary ?? "No worsening dimension has been independently derived for this cycle.",
    whatBecameMoreExpensive: composed.brief.costOfInaction
      ? `Estimated cost exposure now stands at ${composed.brief.costOfInaction.totalEstimated}.`
      : "Cost exposure remains partially measured.",
    decisionRequired: composed.brief.requiredActions?.[0] ?? composed.account.nextRequiredAction ?? "Review the retained brief and decide whether escalation is required.",
    briefUrl,
    approveUrl,
    challengeUrl,
  });

  if (input.preview || !process.env.RESEND_API_KEY?.trim()) {
    return {
      mode: process.env.RESEND_API_KEY?.trim() ? "preview" : "pending",
      subject: built.subject,
      html: built.html,
      text: built.text,
      recipientEmail,
      briefUrl,
      approveUrl,
      challengeUrl,
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
      source: "oversight_brief_delivery",
    },
  });

  return {
    mode: sent.ok ? "sent" : "pending",
    subject: built.subject,
    html: built.html,
    text: built.text,
    recipientEmail,
    briefUrl,
    approveUrl,
    challengeUrl,
    providerError: sent.error ?? null,
  };
}
