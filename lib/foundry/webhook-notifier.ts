/**
 * lib/foundry/webhook-notifier.ts
 *
 * Foundry release-blocker and governance event webhook notifier.
 *
 * Dispatches POST payloads to operator-configured webhook endpoints when
 * any of five governed events occur:
 *
 *   RELEASE_BLOCKED          — a CI gate call returned blocked:true
 *   PROMOTION_APPROVED       — a maturity stage promotion was recorded
 *   PROMOTION_ROLLED_BACK    — a promotion was rolled back
 *   CRITICAL_FINDING_CREATED — a CRITICAL-severity finding was written
 *   PRODUCT_HEALTH_RED       — overall product health moved to RED
 *
 * Configuration:
 *   FOUNDRY_WEBHOOK_URL   — primary webhook endpoint (Slack, Teams, or custom)
 *   FOUNDRY_WEBHOOK_SECRET — HMAC-SHA256 signing secret (optional but recommended)
 *
 * Security:
 *   When FOUNDRY_WEBHOOK_SECRET is set, the payload is signed with
 *   HMAC-SHA256 and the signature is sent in X-Foundry-Signature-256.
 *   Recipients should verify this header before processing.
 *
 * Guarantees:
 *   - Fire-and-forget: dispatch errors are logged but never thrown to the caller.
 *   - No retry: this is a best-effort notification layer, not a durable queue.
 *   - No auth data: webhook payloads never include API keys, tokens, or PII.
 */

import { createHmac } from "crypto";

// ─── Event types ─────────────────────────────────────────────────────────────

export type FoundryWebhookEvent =
  | "RELEASE_BLOCKED"
  | "PROMOTION_APPROVED"
  | "PROMOTION_ROLLED_BACK"
  | "CRITICAL_FINDING_CREATED"
  | "PRODUCT_HEALTH_RED";

// ─── Payload types ────────────────────────────────────────────────────────────

export interface FoundryWebhookPayload {
  /** ISO 8601 UTC timestamp of the event */
  timestamp: string;
  /** Canonical event name */
  event: FoundryWebhookEvent;
  /** Human-readable one-line summary */
  summary: string;
  /** Event-specific data (never contains secrets or PII) */
  data: Record<string, unknown>;
  /** Source system identifier */
  source: "intelligence-foundry";
}

export interface ReleaseBlockedData {
  releaseId: string;
  branch?: string;
  criticalFindingCount: number;
  highFindingCount: number;
  /** First critical finding label (for quick triage in notification) */
  leadFinding?: string;
  adminUrl?: string;
}

export interface PromotionApprovedData {
  eventType: string;
  fromStage: string;
  toStage: string;
  approvedBy: string;
  researchRunId?: string | null;
  adminUrl?: string;
}

export interface PromotionRolledBackData {
  eventType: string;
  fromStage: string;
  toStage: string;
  rolledBackBy: string;
  rollbackReason: string;
  adminUrl?: string;
}

export interface CriticalFindingCreatedData {
  findingId: string;
  label: string;
  detail: string;
  engineId?: string;
  runId?: string;
  adminUrl?: string;
}

export interface ProductHealthRedData {
  surfaceId: string;
  surfaceLabel: string;
  reason: string;
  blockerCount: number;
  adminUrl?: string;
}

// ─── Notifier ─────────────────────────────────────────────────────────────────

/** Build and sign a payload, then POST it to the configured webhook URL. */
export async function dispatchFoundryWebhook(
  event: FoundryWebhookEvent,
  summary: string,
  data: Record<string, unknown>,
): Promise<void> {
  const webhookUrl = process.env.FOUNDRY_WEBHOOK_URL;
  if (!webhookUrl) {
    // No webhook configured — silent no-op. Not an error.
    return;
  }

  const payload: FoundryWebhookPayload = {
    timestamp: new Date().toISOString(),
    event,
    summary,
    data,
    source: "intelligence-foundry",
  };

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "FoundryWebhookNotifier/1.0",
    "X-Foundry-Event": event,
  };

  // Optional HMAC-SHA256 signature
  const secret = process.env.FOUNDRY_WEBHOOK_SECRET;
  if (secret) {
    const sig = createHmac("sha256", secret).update(body).digest("hex");
    headers["X-Foundry-Signature-256"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body,
      // 5-second timeout — fire and forget, don't hold up the caller
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(
        `[FoundryWebhook] POST to ${webhookUrl} returned ${res.status} for event ${event}`,
      );
    }
  } catch (err) {
    // Never throw — this is a best-effort notification layer
    console.error(`[FoundryWebhook] Dispatch error for event ${event}:`, err);
  }
}

// ─── Typed convenience helpers ────────────────────────────────────────────────

export async function notifyReleaseBlocked(data: ReleaseBlockedData): Promise<void> {
  const critLine = data.criticalFindingCount === 1
    ? "1 CRITICAL finding"
    : `${data.criticalFindingCount} CRITICAL findings`;
  const branchLine = data.branch ? ` (branch: ${data.branch})` : "";

  await dispatchFoundryWebhook(
    "RELEASE_BLOCKED",
    `Release blocked — ${data.releaseId}${branchLine}: ${critLine} unresolved.`,
    {
      releaseId: data.releaseId,
      branch: data.branch ?? null,
      criticalFindingCount: data.criticalFindingCount,
      highFindingCount: data.highFindingCount,
      leadFinding: data.leadFinding ?? null,
      adminUrl: data.adminUrl ?? null,
    },
  );
}

export async function notifyPromotionApproved(data: PromotionApprovedData): Promise<void> {
  await dispatchFoundryWebhook(
    "PROMOTION_APPROVED",
    `${data.eventType} promoted ${data.fromStage} → ${data.toStage} by ${data.approvedBy}.`,
    {
      eventType: data.eventType,
      fromStage: data.fromStage,
      toStage: data.toStage,
      approvedBy: data.approvedBy,
      researchRunId: data.researchRunId ?? null,
      adminUrl: data.adminUrl ?? null,
    },
  );
}

export async function notifyPromotionRolledBack(data: PromotionRolledBackData): Promise<void> {
  await dispatchFoundryWebhook(
    "PROMOTION_ROLLED_BACK",
    `Promotion rolled back — ${data.eventType} reverted from ${data.toStage} to ${data.fromStage} by ${data.rolledBackBy}.`,
    {
      eventType: data.eventType,
      fromStage: data.fromStage,
      toStage: data.toStage,
      rolledBackBy: data.rolledBackBy,
      rollbackReason: data.rollbackReason,
      adminUrl: data.adminUrl ?? null,
    },
  );
}

export async function notifyCriticalFindingCreated(data: CriticalFindingCreatedData): Promise<void> {
  await dispatchFoundryWebhook(
    "CRITICAL_FINDING_CREATED",
    `CRITICAL finding: ${data.label}${data.engineId ? ` [${data.engineId}]` : ""}.`,
    {
      findingId: data.findingId,
      label: data.label,
      detail: data.detail,
      engineId: data.engineId ?? null,
      runId: data.runId ?? null,
      adminUrl: data.adminUrl ?? null,
    },
  );
}

export async function notifyProductHealthRed(data: ProductHealthRedData): Promise<void> {
  await dispatchFoundryWebhook(
    "PRODUCT_HEALTH_RED",
    `Product health moved to RED — ${data.surfaceLabel}: ${data.reason}`,
    {
      surfaceId: data.surfaceId,
      surfaceLabel: data.surfaceLabel,
      reason: data.reason,
      blockerCount: data.blockerCount,
      adminUrl: data.adminUrl ?? null,
    },
  );
}
