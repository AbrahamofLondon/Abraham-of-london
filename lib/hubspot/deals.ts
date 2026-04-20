/**
 * lib/hubspot/deals.ts — Deal creation via HubSpot v3 API
 *
 * Creates deals and associates them with contacts.
 * Pipeline stages match the diagnostic ladder:
 *   Signal Detected → Diagnostic Complete → Report Purchased → Strategy Room → Closed
 */

import { hubspotFetch } from "./client";

export type DealInput = {
  contactId: string;
  dealName: string;
  amount?: number;
  stage: "signal_detected" | "diagnostic_complete" | "report_purchased" | "strategy_room" | "closed_won";
  pipeline?: string;
  properties?: Record<string, string>;
};

type HubSpotDeal = {
  id: string;
  properties: Record<string, string | null>;
};

/**
 * Create a deal and associate it with a contact.
 */
export async function createDeal(input: DealInput): Promise<string | null> {
  const pipeline = input.pipeline || "default";

  const properties: Record<string, string> = {
    dealname: input.dealName,
    dealstage: input.stage,
    pipeline,
    ...(input.amount != null ? { amount: String(input.amount) } : {}),
    ...(input.properties || {}),
  };

  const result = await hubspotFetch<HubSpotDeal>("/crm/v3/objects/deals", {
    method: "POST",
    body: { properties },
  });

  if (!result.ok) return null;

  const dealId = result.data.id;

  // Associate deal with contact
  await hubspotFetch(
    `/crm/v3/objects/deals/${dealId}/associations/contacts/${input.contactId}/deal_to_contact`,
    { method: "PUT" },
  );

  return dealId;
}
