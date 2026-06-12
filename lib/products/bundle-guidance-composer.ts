export interface BundleGuidanceInput {
  bundleCode: string;
  childProductCodes: string[];
}

export interface BundleGuidanceOutput {
  bundleCode: string;
  guidedUsageSequence: string[];
  firstProductToUse: string;
  componentOutcomeMap: Record<string, string>;
  combinedValueLogic: string;
  childEntitlementVerification: string[];
}

export function composeBundleGuidance(input: BundleGuidanceInput): BundleGuidanceOutput {
  const firstProductToUse = input.childProductCodes[0] ?? "blocked_until_child_entitlements_exist";
  return {
    bundleCode: input.bundleCode,
    guidedUsageSequence: input.childProductCodes,
    firstProductToUse,
    componentOutcomeMap: Object.fromEntries(input.childProductCodes.map((code) => [
      code,
      "Must state the customer outcome this component supports before bundle release.",
    ])),
    combinedValueLogic: "The bundle is gold-standard only if the combined sequence creates more value than separate entitlements.",
    childEntitlementVerification: input.childProductCodes.map((code) => `${code}: entitlement must resolve before access.`),
  };
}
