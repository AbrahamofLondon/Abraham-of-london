/**
 * GMI Alert Rule Service
 * Foundation for future alerting. Only dashboard_only delivery is active.
 * EMAIL_DELIVERY_ENABLED and WEBHOOK_DELIVERY_ENABLED are false.
 */

import { prisma } from "@/lib/prisma";

/** Email delivery is disabled. Set to true only when SMTP is configured and tested. */
export const EMAIL_DELIVERY_ENABLED = false as const;

/** Webhook delivery is disabled. Set to true only when endpoint verification is done. */
export const WEBHOOK_DELIVERY_ENABLED = false as const;

export type GmiAlertRuleInput = {
  editionId: string;
  linkedCallId?: string | null;
  linkedFalsificationRuleId?: string | null;
  alertType: string;
  triggerCondition: string;
  severity?: "low" | "medium" | "high" | "critical";
  status?: "draft" | "active" | "disabled";
  deliveryMode?: "dashboard_only" | "email_future" | "webhook_future";
};

/**
 * Creates a new alert rule. Defaults to dashboard_only delivery and draft status.
 */
export async function createAlertRule(data: GmiAlertRuleInput) {
  const deliveryMode = data.deliveryMode ?? "dashboard_only";

  // Guard: future delivery modes are not wired up
  if (deliveryMode === "email_future" && !EMAIL_DELIVERY_ENABLED) {
    console.warn(
      `[GMI AlertRule] email_future delivery mode created but EMAIL_DELIVERY_ENABLED=false. ` +
        `Rule will be stored but not delivered until enabled.`
    );
  }
  if (deliveryMode === "webhook_future" && !WEBHOOK_DELIVERY_ENABLED) {
    console.warn(
      `[GMI AlertRule] webhook_future delivery mode created but WEBHOOK_DELIVERY_ENABLED=false. ` +
        `Rule will be stored but not delivered until enabled.`
    );
  }

  return prisma.gmiAlertRule.create({
    data: {
      editionId: data.editionId,
      linkedCallId: data.linkedCallId ?? null,
      linkedFalsificationRuleId: data.linkedFalsificationRuleId ?? null,
      alertType: data.alertType,
      triggerCondition: data.triggerCondition,
      severity: data.severity ?? "medium",
      status: data.status ?? "draft",
      deliveryMode,
    },
  });
}

/**
 * Returns all alert rules for a given edition.
 */
export async function getAlertRulesByEdition(editionId: string) {
  return prisma.gmiAlertRule.findMany({
    where: { editionId },
    orderBy: { createdAt: "desc" },
  });
}
