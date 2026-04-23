/**
 * lib/hubspot/sync.ts — Single integration bridge
 *
 * Every capture point in the application calls hubspotSync().
 * This function never throws. HubSpot failures must never break the product.
 */

import { isHubSpotConfigured } from "./client";
import { upsertContact } from "./contacts";
import { createDeal } from "./deals";
import { logActivity } from "./activities";
import { getProductAmountGbp, getProductDisplayPrice } from "@/lib/commercial/catalog";
import { resolveProductIdentity } from "@/lib/commercial/product-identity";

export type HubSpotEvent =
  | "deal_flow_qualified"
  | "diagnostic_submitted"
  | "diagnostic_completed"
  | "executive_reporting_checkout"
  | "strategy_room_checkout"
  | "payment_confirmed"
  | "inner_circle_registered"
  | "contact_form_submitted"
  | "newsletter_subscribed";

export type HubSpotSyncInput = {
  event: HubSpotEvent;
  email: string;
  data?: {
    fullName?: string;
    organisation?: string;
    role?: string;
    sector?: string;
    route?: string;
    score?: number;
    severity?: string;
    tier?: string;
    trajectory?: string;
    diagnosticType?: string;
    verdict?: string;
    amount?: number;
    message?: string;
    revenue?: string;
    problem?: string;
    urgency?: string;
    productCode?: string;
  };
};

/**
 * Sync a product event to HubSpot.
 * Fire-and-forget. Never throws. Never blocks the caller.
 */
export async function hubspotSync(input: HubSpotSyncInput): Promise<void> {
  if (!isHubSpotConfigured()) return;

  const { event, email, data = {} } = input;
  if (!email?.trim()) return;

  try {
    // 1. Always upsert the contact
    const contactId = await upsertContact({
      email,
      fullName: data.fullName,
      company: data.organisation,
      jobtitle: data.role,
      aol_organisation: data.organisation,
      aol_route: data.route,
      aol_diagnostic_score: data.score,
      aol_severity: data.severity,
      aol_tier: data.tier,
      aol_trajectory: data.trajectory,
      aol_has_paid: event === "payment_confirmed" || event === "executive_reporting_checkout" || event === "strategy_room_checkout" ? true : undefined,
      aol_last_diagnostic: event === "diagnostic_completed" || event === "diagnostic_submitted" ? new Date().toISOString() : undefined,
      lifecyclestage: deriveLifecycleStage(event),
    });

    if (!contactId) return;

    // 2. Create deals for revenue events
    if (event === "deal_flow_qualified" && data.route === "STRATEGY") {
      await createDeal({
        contactId,
        dealName: `${data.organisation || email} — Strategy qualification`,
        amount: parseRevenueEstimate(data.revenue),
        stage: "signal_detected",
      });
    }

    if (event === "executive_reporting_checkout") {
      const amount = resolveHubSpotProductAmount(data.productCode);
      if (amount == null) return;
      await createDeal({
        contactId,
        dealName: `${data.organisation || email} — Executive Reporting`,
        amount,
        stage: "report_purchased",
      });
    }

    if (event === "strategy_room_checkout") {
      const amount = resolveHubSpotProductAmount(data.productCode);
      if (amount == null) return;
      await createDeal({
        contactId,
        dealName: `${data.organisation || email} — Strategy Room`,
        amount,
        stage: "strategy_room",
      });
    }

    // 3. Log activities for significant events
    const activityBody = buildActivityBody(event, data);
    if (activityBody) {
      await logActivity({ contactId, body: activityBody });
    }
  } catch (err) {
    // Never throw. Log and move on.
    console.warn("[HUBSPOT_SYNC]", event, email, err instanceof Error ? err.message : err);
  }
}

function deriveLifecycleStage(event: HubSpotEvent): string | undefined {
  switch (event) {
    case "newsletter_subscribed":
    case "contact_form_submitted":
      return "subscriber";
    case "deal_flow_qualified":
    case "diagnostic_submitted":
    case "diagnostic_completed":
    case "inner_circle_registered":
      return "lead";
    case "executive_reporting_checkout":
    case "strategy_room_checkout":
    case "payment_confirmed":
      return "customer";
    default:
      return undefined;
  }
}

function parseRevenueEstimate(revenue?: string): number | undefined {
  if (!revenue) return undefined;
  const clean = revenue.replace(/[^0-9]/g, "");
  const num = parseInt(clean, 10);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function resolveHubSpotProductAmount(identifier?: string): number | undefined {
  if (!identifier) return undefined;
  const identity = resolveProductIdentity(identifier);
  if (!identity) return undefined;
  return getProductAmountGbp(identity.productCode);
}

function resolveHubSpotProductPrice(identifier?: string): string | undefined {
  if (!identifier) return undefined;
  const identity = resolveProductIdentity(identifier);
  if (!identity) return undefined;
  return getProductDisplayPrice(identity.productCode);
}

function buildActivityBody(
  event: HubSpotEvent,
  data: HubSpotSyncInput["data"],
): string | null {
  const d = data || {};
  switch (event) {
    case "deal_flow_qualified":
      return `Deal flow qualification: route=${d.route || "—"}, score=${d.score ?? "—"}, urgency=${d.urgency || "—"}`;
    case "diagnostic_submitted":
      return `Diagnostic submitted: type=${d.diagnosticType || "—"}, score=${d.score ?? "—"}, severity=${d.severity || "—"}`;
    case "diagnostic_completed":
      return `Diagnostic completed: type=${d.diagnosticType || "—"}, verdict=${d.verdict || "—"}, trajectory=${d.trajectory || "—"}`;
    case "executive_reporting_checkout":
      return `Executive Reporting checkout initiated (${resolveHubSpotProductPrice(d.productCode) || "catalog price unavailable"}). Organisation: ${d.organisation || "—"}`;
    case "strategy_room_checkout":
      return `Strategy Room checkout initiated (${resolveHubSpotProductPrice(d.productCode) || "catalog price unavailable"}). Organisation: ${d.organisation || "—"}`;
    case "payment_confirmed":
      return `Payment confirmed: £${d.amount ?? "—"}`;
    case "inner_circle_registered":
      return `Inner Circle registration: tier=${d.tier || "member"}`;
    case "contact_form_submitted":
      return `Contact form: ${d.message?.slice(0, 200) || "—"}`;
    case "newsletter_subscribed":
      return null; // No activity note for newsletter — too noisy
    default:
      return null;
  }
}
