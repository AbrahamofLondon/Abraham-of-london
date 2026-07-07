/**
 * lib/fulfilment/gmi/__tests__/gmi-quarterly-handler.test.ts
 *
 * Proves gmi_quarterly plugs into the PR F authority and that delivery is
 * hard-gated: a draft/unauthorised edition is denied through executeFulfilmentOperation,
 * an actually-released authorised synthetic edition delivers a bound proof.
 */

import { describe, it, expect } from "vitest";
import {
  registerHandler,
  executeFulfilmentOperation,
  type DeliveryResult,
} from "@/lib/fulfilment/fulfilment-execution-authority";
import type { MarketIntelligenceLifecycleRecord } from "@/lib/intelligence/market-intelligence-lifecycle";
import { createGmiQuarterlyHandler } from "../gmi-quarterly-handler";
import type { GmiDeliveryProof, GmiReleaseContext } from "../gmi-quarterly-fulfilment";

const OWNER = { authorisedBy: "owner@x.com", authorityRef: "REL-1", authorisedAt: "2099-01-08T00:00:00Z" };
const HASH = "c".repeat(64);

function rec(state: MarketIntelligenceLifecycleRecord["lifecycleState"]): MarketIntelligenceLifecycleRecord {
  return { id: "GMI-SYNTH-2099", title: "s", canonicalLine: "GLOBAL_MARKET_INTELLIGENCE", quarter: "Q1", year: 2099, coveragePeriod: "Q1 2099", decisionWindow: "Q2 2099", version: "9.9.9", lifecycleState: state, supersededBy: null, replaces: "GMI-SYNTH-PRIOR", purchasable: false, publicVisible: false, archiveVisible: false, freshnessNote: "s" };
}
const authorised: GmiReleaseContext = { dataLockComplete: true, sourceBlockersClear: true, priorCallReviewComplete: true, humanReviewComplete: true, ownerReleaseAuthority: OWNER, approvedArtifactHash: HASH };
const draftCtx: GmiReleaseContext = { dataLockComplete: false, sourceBlockersClear: true, priorCallReviewComplete: true, humanReviewComplete: false, ownerReleaseAuthority: null, approvedArtifactHash: null };

describe("gmi_quarterly handler ↔ PR F authority", () => {
  it("denies delivery of a draft/unauthorised edition through PR F", async () => {
    const delivered: GmiDeliveryProof[] = [];
    registerHandler(createGmiQuarterlyHandler({
      resolveRecord: () => rec("DRAFT"),
      resolveContext: () => draftCtx,
      deliverer: async (p) => { delivered.push(p); },
    }));
    const res = (await executeFulfilmentOperation({ productCode: "gmi_quarterly", operation: "deliver", sourceId: "GMI-SYNTH-2099", email: "c@x.com" })) as DeliveryResult;
    expect(res.delivered).toBe(false);
    expect(delivered).toHaveLength(0);
  });

  it("delivers an actually-released authorised edition with a bound proof", async () => {
    const delivered: GmiDeliveryProof[] = [];
    registerHandler(createGmiQuarterlyHandler({
      resolveRecord: () => rec("ACTIVE"),
      resolveContext: () => authorised,
      deliverer: async (p) => { delivered.push(p); },
      resolveRecipient: () => "client@x.com",
    }));
    const res = (await executeFulfilmentOperation({ productCode: "gmi_quarterly", operation: "deliver", sourceId: "GMI-SYNTH-2099" })) as DeliveryResult;
    expect(res.delivered).toBe(true);
    expect(delivered).toHaveLength(1);
    expect(delivered[0]!.artifactHash).toBe(HASH);
    expect(delivered[0]!.publicationAuthorityRef).toBe("REL-1");
  });
});
