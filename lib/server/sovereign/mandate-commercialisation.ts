// server-only guard removed — Pages Router incompatible

import { grantEntitlement } from "@/lib/server/billing/entitlements";
import type { ProductCode } from "@/lib/server/billing/entitlements";
import { updateExecutionMemory } from "@/lib/constitution/memory-store";

export type CommercialiseMandateInput = {
  caseKey: string;
  clientEmail: string;
  mandateId: string;
  productCode: string;
  tier: string;
  source?: string;
  endsAt?: Date | null;
};

export async function commercialiseMandate(
  input: CommercialiseMandateInput,
) {
  const entitlement = await grantEntitlement({
    email: input.clientEmail,
    productCode: input.productCode as ProductCode,
    tier: input.tier,
    source: input.source || "mandate_acceptance",
    externalRef: input.mandateId,
    endsAt: input.endsAt ?? null,
  });

  updateExecutionMemory(input.caseKey, {
    lastMandateId: input.mandateId,
    executionStatus: "ACTIVE",
    monetised: true,
    metadata: {
      lastEntitlementId: entitlement.id,
      lastEntitlementProductCode: input.productCode,
      lastEntitlementTier: input.tier,
    },
  });

  return entitlement;
}
