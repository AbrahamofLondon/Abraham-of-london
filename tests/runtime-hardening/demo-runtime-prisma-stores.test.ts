import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  bindSignalCase,
  captureSignalConsent,
  establishSignalIdentity,
  getSignalContinuation,
  hasDurableSignalHistory,
  recordSignalInteraction,
  requestSignalContinuation,
  updateSignalTwin,
} from "@/lib/demo/signal-consent-transition-store.prisma";
import {
  getRecommendationContext,
  listRecommendationContextsForSession,
  saveRecommendationContext,
} from "@/lib/intelligence/corridor/recommendation-context-store.prisma";
import { recordFunnelEvent, summarizeFunnel } from "@/lib/demo/funnel-event-store.prisma";

const run = `rt_${Date.now().toString(36)}`;
const session = (name: string) => `${run}_${name}`;

const recommendationBase = {
  recommendationId: `rec_${run}_corridor`,
  sessionId: session("corridor"),
  sessionVersion: 1,
  pressureBand: "HIGH",
  targetProductCode: "operator_pilot",
  targetLabel: "Operator Pilot",
  targetRoute: "/engagements/operator-pilot",
  accessMode: "controlled" as const,
  whyAdmissible: "The signal produced material contradiction and timing pressure.",
  evidenceBasis: ["Signal pressure: HIGH", "Contradiction present"],
  established: ["Material decision", "Named accountable owner"],
  unresolved: {
    contradiction: "Confidence conflicts with evidence quality.",
    evidenceGap: "No falsification condition yet.",
    ownershipGap: "Reviewer not assigned.",
    timingPressure: "Deadline within 30 days.",
    unresolvedCommitment: "Checkpoint not agreed.",
  },
  notYetAppropriate: "Retainer is premature before the first governed review.",
  carryForward: ["contradiction", "evidence gap"],
};

async function cleanup() {
  await prisma.signalConsentContinuation.deleteMany({ where: { sessionId: { startsWith: run } } });
  await prisma.corridorRecommendationContext.deleteMany({ where: { sessionId: { startsWith: run } } });
  await prisma.funnelJourneyEvent.deleteMany({ where: { sessionId: { startsWith: run } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("production Prisma runtime stores", () => {
  it("persists Signal continuation through consent, case binding, interaction, and twin update", async () => {
    const requested = await requestSignalContinuation(
      { recommendationId: `rec_${run}_signal`, sessionId: session("signal"), mode: "LIVE" },
      "2026-07-08T10:00:00.000Z",
    );

    expect(requested.token).toMatch(/^sigc_[a-f0-9]{48}$/);
    expect(await hasDurableSignalHistory(requested.token)).toBe(false);

    await establishSignalIdentity({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a" }, "2026-07-08T10:01:00.000Z");
    await captureSignalConsent({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a", consent: true }, "2026-07-08T10:02:00.000Z");
    const bound = await bindSignalCase({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a", caseId: "case-a" }, "2026-07-08T10:03:00.000Z");
    expect(bound.state).toBe("CASE_BOUND");
    expect(await hasDurableSignalHistory(requested.token)).toBe(true);

    const interaction = await recordSignalInteraction({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a" }, "2026-07-08T10:04:00.000Z");
    expect(interaction.interactionId).toMatch(/^int_/);
    const twin = await updateSignalTwin({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a" }, "2026-07-08T10:05:00.000Z");
    expect(twin.twinVersion).toBe(1);
    expect((await getSignalContinuation(requested.token))?.state).toBe("TWIN_UPDATED");
  });

  it("keeps example Signal readings and wrong tenants out of durable history", async () => {
    await expect(requestSignalContinuation({ recommendationId: `rec_${run}_example`, sessionId: session("example"), mode: "EXAMPLE" })).rejects.toThrow(/Example readings/);

    const requested = await requestSignalContinuation({ recommendationId: `rec_${run}_tenant`, sessionId: session("tenant"), mode: "LIVE" });
    await establishSignalIdentity({ token: requested.token, tenantId: "tenant-a", subjectId: "user-a" });
    await expect(captureSignalConsent({ token: requested.token, tenantId: "tenant-b", subjectId: "user-a", consent: true })).rejects.toThrow(/Wrong identity or tenant/);
  });

  it("persists Corridor recommendation context by stable recommendation identity", async () => {
    const saved = await saveRecommendationContext(recommendationBase, "2026-07-08T11:00:00.000Z");
    expect(saved.contextId).toMatch(/^ctx_/);
    expect(saved.stateHash).toHaveLength(64);

    const updated = await saveRecommendationContext({ ...recommendationBase, pressureBand: "CRITICAL" }, "2026-07-08T11:05:00.000Z");
    expect(updated.contextId).toBe(saved.contextId);
    expect((await getRecommendationContext(recommendationBase.recommendationId))?.pressureBand).toBe("CRITICAL");
    expect(await listRecommendationContextsForSession(recommendationBase.sessionId)).toHaveLength(1);
  });

  it("persists and aggregates funnel events without confidential payload fields", async () => {
    await recordFunnelEvent({ eventType: "SIGNAL_LANDING_VIEWED", sessionId: session("funnel-a"), sourceRoute: "/decision-instruments/signal" });
    await recordFunnelEvent({ eventType: "SIGNAL_STARTED", sessionId: session("funnel-a"), sourceRoute: "/decision-instruments/signal" });
    await recordFunnelEvent({ eventType: "SIGNAL_COMPLETED", sessionId: session("funnel-a"), sourceRoute: "/decision-instruments/signal", recommendationId: recommendationBase.recommendationId, decisionStatement: "confidential board matter" } as never);
    await recordFunnelEvent({ eventType: "PILOT_SUBMITTED", sessionId: session("funnel-b"), sourceRoute: "/engagements/operator-pilot", tenantId: "tenant-a" });

    const summary = await summarizeFunnel({ journeyVersion: "flagship-1" });
    expect(summary.counts.SIGNAL_COMPLETED).toBeGreaterThanOrEqual(1);
    expect(summary.counts.PILOT_SUBMITTED).toBeGreaterThanOrEqual(1);

    const raw = await prisma.funnelJourneyEvent.findMany({ where: { sessionId: { startsWith: run } } });
    expect(JSON.stringify(raw)).not.toContain("confidential board matter");
  });
});