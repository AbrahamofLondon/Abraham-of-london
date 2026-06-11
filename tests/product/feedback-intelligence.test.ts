import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  db,
  state,
} = vi.hoisted(() => {
  const state = {
    events: [] as any[],
    negativeCount: 1,
    retainerNegativeCount: 1,
  };

  const db = {
    feedbackEvent: {
      create: vi.fn(async ({ data }: any) => {
        const row = {
          id: "db-feedback-1",
          ...data,
          createdAt: new Date("2026-06-11T10:00:00.000Z"),
          updatedAt: new Date("2026-06-11T10:00:00.000Z"),
        };
        state.events.push(row);
        return row;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const current = state.events.find((event) => event.feedbackId === where.feedbackId) ?? state.events[0];
        const updated = { ...current, ...data, updatedAt: new Date("2026-06-11T10:01:00.000Z") };
        state.events[0] = updated;
        return updated;
      }),
      count: vi.fn(async ({ where }: any = {}) => {
        if (where?.linkedRetainerCycleId) return state.retainerNegativeCount;
        if (where?.surface && where?.rating === "negative") return state.negativeCount;
        if (where?.rating === "positive") return state.events.filter((event) => event.rating === "positive").length;
        if (where?.rating === "negative") return state.events.filter((event) => event.rating === "negative").length;
        if (where?.reviewRequired) return state.events.filter((event) => event.reviewRequired).length;
        return state.events.length;
      }),
      findMany: vi.fn(async () => state.events),
    },
    systemAuditLog: {
      create: vi.fn(async () => ({})),
      count: vi.fn(async () => 0),
      findMany: vi.fn(async () => []),
    },
    falsificationEntry: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => ({
        id: "falsification-1",
        ...data,
        threshold: null,
        reviewDate: null,
        strongestCounterargument: null,
        responseToCounterargument: null,
        status: "MONITORING",
        overturnedAt: null,
        confirmedAt: null,
        createdAt: new Date("2026-06-11T10:00:00.000Z"),
        updatedAt: new Date("2026-06-11T10:00:00.000Z"),
      })),
    },
    boardroomBriefOrder: {
      findUnique: vi.fn(async () => ({ id: "order-1", metadata: { existing: true } })),
      update: vi.fn(async () => ({})),
    },
    accessAuditLog: { create: vi.fn(async () => ({})) },
    patternObservation: {
      findFirst: vi.fn(async () => null),
      create: vi.fn(async ({ data }: any) => ({ id: "pattern-1", ...data })),
      update: vi.fn(async ({ data }: any) => ({ id: "pattern-1", ...data })),
      count: vi.fn(async () => 0),
    },
    caseStudyEvidence: {
      findFirst: vi.fn(async () => null),
      createMany: vi.fn(async () => ({ count: 1 })),
    },
    caseStudy: {
      create: vi.fn(async ({ data }: any) => ({
        id: "case-study-1",
        slug: null,
        title: data.title,
        status: data.status,
        publicationAllowed: data.publicationAllowed,
        anonymised: data.anonymised,
        verificationStatus: data.verificationStatus,
        consentStatus: data.consentStatus,
        narrative: data.narrative,
        publishedAt: null,
        createdAt: new Date("2026-06-11T10:00:00.000Z"),
        updatedAt: new Date("2026-06-11T10:00:00.000Z"),
        evidence: [],
      })),
      findUnique: vi.fn(async () => null),
    },
    outcomeHypothesis: {
      findUnique: vi.fn(async ({ where }: any) => ({ hypothesisId: where.hypothesisId })),
    },
    oversightReviewCycle: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: where.id })),
    },
    retainerReadinessEvaluation: {
      create: vi.fn(async ({ data }: any) => ({
        id: "retainer-eval-1",
        readinessClass: data.readinessClass,
      })),
    },
  };

  return { db, state };
});

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/prisma.server", () => ({ prisma: db }));

import { submitFeedback } from "@/lib/feedback/feedback-service";
import { normalizeFeedbackPayload } from "@/lib/feedback/feedback-service";
import { evaluateFeedbackRouting } from "@/lib/feedback/feedback-routing-engine";
import {
  calculateRetainerTriggerScore,
  createRetainerReadinessEvaluationFromFeedbackCluster,
} from "@/lib/feedback/retainer-trigger-score";
import { classifyCaseStudyCandidateFromFeedback } from "@/lib/feedback/case-study-classification";
import { correlateProvidedEvents } from "@/lib/feedback/feedback-conversion-correlation";
import { buildClientContinuitySummary } from "@/lib/feedback/client-continuity-summary";
import fs from "fs";
import path from "path";

describe("governed feedback intelligence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.events = [];
    state.negativeCount = 1;
    state.retainerNegativeCount = 1;
  });

  it("legacy feedback payload still creates a structured FeedbackEvent and audit mirror", async () => {
    const response = await submitFeedback({
      surface: "return-brief",
      subjectId: "case-1",
      rating: "positive",
      comment: "Useful",
    });

    expect(response.ok).toBe(true);
    expect(response.feedbackId).toMatch(/^fb_/);
    expect(db.feedbackEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        surface: "return-brief",
        subjectId: "case-1",
        subjectType: "return_brief",
        rating: "positive",
        category: "usefulness",
        confidence: 3,
      }),
    }));
    expect(db.systemAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: "FEEDBACK_SUBMITTED",
        category: "feedback",
      }),
    }));
  });

  it("enhanced payload stores category, confidence, followupRequested, and evidenceHash", async () => {
    await submitFeedback({
      surface: "boardroom_brief_sample",
      subjectType: "sample",
      subjectId: "sample-1",
      rating: "neutral",
      category: "trust",
      confidence: 5,
      followupRequested: true,
      evidenceHash: "hash-123",
    });

    expect(db.feedbackEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        category: "trust",
        confidence: 5,
        followupRequested: true,
        evidenceHash: "hash-123",
      }),
    }));
  });

  it("negative paid accuracy feedback creates a falsification review without exposing details publicly", async () => {
    const response = await submitFeedback({
      surface: "boardroom_brief_delivered",
      rating: "negative",
      category: "accuracy",
      orderId: "order-1",
      productCode: "boardroom_brief",
    });

    expect(db.falsificationEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        claimOrRecommendation: "User feedback raised a quality concern requiring human review.",
        confidenceLevel: "MONITORING",
        sourceEntityType: "FeedbackEvent",
      }),
    }));
    expect(response.reviewRequired).toBe(true);
    expect(response.publicMessage).toBe("Recorded for review. This type of feedback is used to check accuracy and evidence quality.");
    expect((response as any).linkedFalsificationEntryId).toBeUndefined();
  });

  it("positive high-confidence free feedback returns next-step CTAs", async () => {
    const response = await submitFeedback({
      surface: "pressure_signal_result",
      rating: "positive",
      category: "clarity",
      confidence: 5,
    });

    expect(response.nextActions?.map((action) => action.label)).toEqual(expect.arrayContaining([
      "Save this as a governed case",
      "Get a Boardroom Brief",
    ]));
    expect(response.routing?.actionKind).toBe("user_next_step_prompt");
  });

  it("positive diagnostic feedback can route to governed case creation", async () => {
    const response = await submitFeedback({
      surface: "fast_diagnostic_result",
      rating: "positive",
      category: "actionability",
      confidence: 4,
    });

    expect(response.nextActions?.some((action) => action.label === "Turn this into a governed case")).toBe(true);
  });

  it("negative Boardroom Brief delivery feedback flags quality review without mutating delivery status", async () => {
    const response = await submitFeedback({
      surface: "boardroom_brief_delivered",
      rating: "negative",
      category: "delivery_quality",
      orderId: "order-1",
      productCode: "boardroom_brief",
    });

    expect(db.boardroomBriefOrder.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "order-1" },
      data: expect.not.objectContaining({ deliveryStatus: expect.anything() }),
    }));
    expect(response.actionStatus).toBe("linked_to_quality_review");
    expect(response.reviewRequired).toBe(true);
  });

  it("positive paid-product feedback creates only a DRAFT case-study candidate", async () => {
    const response = await submitFeedback({
      surface: "boardroom_brief_delivered",
      rating: "positive",
      category: "usefulness",
      comment: "Raw client quote that must remain private",
      orderId: "order-1",
      artifactId: "artifact-1",
      productCode: "boardroom_brief",
    });

    const createArg = db.caseStudy.create.mock.calls[0][0];
    expect(db.caseStudy.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: "DRAFT",
        publicationAllowed: false,
        consentStatus: "PENDING",
      }),
    }));
    expect(JSON.stringify(createArg.data.narrative)).not.toContain("Raw client quote");
    expect(response.actionStatus).toBe("linked_to_case_study_candidate");
  });

  it("classifies paid feedback candidates without allowing public proof", async () => {
    await submitFeedback({
      surface: "boardroom_brief_delivered",
      rating: "positive",
      category: "trust",
      orderId: "order-1",
      artifactId: "artifact-1",
      outcomeHypothesisId: "hypothesis-1",
    });

    const classification = classifyCaseStudyCandidateFromFeedback(state.events[0]);
    expect(classification.classification).toBe("proof_candidate_pending_outcome");
    expect(classification.publicUseAllowed).toBe(false);
    expect(classification.rawCommentPrivate).toBe(true);
  });

  it("three negative events on one surface create a PatternObservation", async () => {
    state.negativeCount = 3;

    const response = await submitFeedback({
      surface: "fast_diagnostic_result",
      rating: "negative",
      category: "clarity",
    });

    expect(db.patternObservation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        patternType: "repeated_negative_surface",
        observationCount: 3,
        status: "ACTIVE",
      }),
    }));
    expect(response.reviewRequired).toBe(true);
  });

  it("retainer cycle and outcome feedback link to their governed records", async () => {
    await submitFeedback({
      surface: "retainer_review_cycle",
      rating: "negative",
      category: "trust",
      retainerCycleId: "cycle-1",
    });
    await submitFeedback({
      surface: "return_brief_outcome",
      rating: "positive",
      category: "outcome_relevance",
      outcomeHypothesisId: "hypothesis-1",
    });

    expect(db.oversightReviewCycle.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "cycle-1" },
    }));
    expect(db.outcomeHypothesis.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { hypothesisId: "hypothesis-1" },
    }));
  });

  it("retainer trigger score returns readiness classes and creates admin-gated evaluation from a feedback cluster", async () => {
    const notReady = calculateRetainerTriggerScore({ governedCaseCount: 1 });
    const reviewReady = calculateRetainerTriggerScore({
      governedCaseCount: 2,
      decisionCentreUsageCount: 2,
      paidArtifactFeedbackCount: 1,
      unresolvedOutcomeHypothesisCount: 1,
    });
    const recommended = calculateRetainerTriggerScore({
      governedCaseCount: 2,
      returnBriefCount: 1,
      unresolvedOutcomeHypothesisCount: 1,
      trustAccuracyOutcomeFeedbackCount: 2,
      decisionCentreUsageCount: 2,
      paidArtifactFeedbackCount: 1,
      highConfidenceOversightPositiveCount: 1,
    });

    expect(notReady.readiness).toBe("not_ready");
    expect(reviewReady.readiness).toBe("review_ready");
    expect(recommended.readiness).toBe("retainer_recommended");

    await submitFeedback({
      surface: "decision_centre_case",
      rating: "positive",
      category: "trust",
      confidence: 5,
      subjectId: "case-1",
      artifactId: "artifact-1",
    });
    const result = await createRetainerReadinessEvaluationFromFeedbackCluster({
      feedbackIds: [state.events[0].feedbackId],
      adminEmail: "admin@abrahamoflondon.org",
    });

    expect(db.retainerReadinessEvaluation.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        adminApprovalRequired: true,
        readinessClass: expect.stringMatching(/CANDIDATE|REVIEW_READY|NOT_READY/),
      }),
    }));
    expect(result.id).toBe("retainer-eval-1");
  });

  it("free feedback followed by checkout is correlated without causation language", async () => {
    await submitFeedback({
      surface: "pressure_signal_result",
      rating: "positive",
      confidence: 5,
    });
    const correlations = correlateProvidedEvents(state.events[0], [{
      eventType: "checkout",
      observedAt: new Date("2026-06-15T10:00:00.000Z"),
    }]);

    expect(correlations[0]).toEqual(expect.objectContaining({
      eventType: "checkout",
      language: "conversion_observed_after_feedback",
      observed: true,
    }));
  });

  it("client continuity summary excludes internal fields and raw comments", () => {
    const summary = buildClientContinuitySummary([{
      id: "db-feedback-1",
      feedbackId: "fb-1",
      surface: "decision_centre_case",
      subjectType: "decision_centre_case",
      subjectId: "case-1",
      rating: "negative",
      category: "trust",
      confidence: 5,
      comment: "Do not expose this raw comment",
      reviewRequired: true,
      triageStatus: "unreviewed",
      linkedOutcomeHypothesisId: "hypothesis-1",
      linkedCaseStudyId: null,
      linkedRetainerCycleId: null,
      linkedFalsificationEntryId: null,
      linkedArtifactId: null,
      linkedOrderId: null,
      actionStatus: "triage_required",
      severity: "high",
      followupRequested: false,
      evidenceHash: null,
      artifactVersion: null,
      productCode: null,
      userId: null,
      email: null,
      sessionId: null,
      sourceUrl: null,
      referrer: null,
      environment: "test",
      deployCommit: null,
      schemaVersion: 1,
      reviewedAt: null,
      reviewedBy: null,
      createdAt: new Date("2026-06-11T10:00:00.000Z"),
      updatedAt: new Date("2026-06-11T10:00:00.000Z"),
    }]);

    expect(summary.summary).toContain("case memory has been updated");
    expect(summary.summary).not.toContain("Do not expose");
    expect((summary as any).retainerTriggerScore).toBeUndefined();
  });

  it("normalises confidence labels for analytics weighting", () => {
    expect(normalizeFeedbackPayload({
      surface: "pressure_signal_result",
      rating: "positive",
      confidence: "high",
    }).confidence).toBe(5);
  });

  it("keeps FindingFeedback separate and preserves FeedbackWidget backward compatibility", () => {
    const widget = fs.readFileSync(path.join(process.cwd(), "components/feedback/FeedbackWidget.tsx"), "utf8");
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");

    expect(widget).toContain("subjectId?: string");
    expect(widget).toContain("surface: string");
    expect(fs.readFileSync(path.join(process.cwd(), "pages/admin/feedback.tsx"), "utf8")).toContain("requireAdminPage");
    expect(fs.readFileSync(path.join(process.cwd(), "pages/api/admin/feedback/retainer-readiness.ts"), "utf8")).toContain("requireAdminApi");
    expect(schema).toContain("model FindingFeedback");
    expect(schema).toContain("model FeedbackEvent");
  });

  it("confirms FeedbackEvent migration is additive and public proof remains separate", () => {
    const migration = fs.readFileSync(path.join(process.cwd(), "migrations/003_feedback_events.sql"), "utf8");
    const submitRoute = fs.readFileSync(path.join(process.cwd(), "pages/api/feedback/submit.ts"), "utf8");
    const bridge = fs.readFileSync(path.join(process.cwd(), "lib/feedback/foundry-bridge.ts"), "utf8");

    expect(migration).toContain("CREATE TABLE IF NOT EXISTS feedback_events");
    expect(migration).not.toMatch(/DROP TABLE|ALTER TABLE .* DROP/i);
    expect(submitRoute).toContain("submitFeedback(req.body, req)");
    expect(bridge).toContain("No public proof has been created.");
  });

  it("routing service marks follow-up as sales signal without auto-email", async () => {
    await submitFeedback({
      surface: "boardroom_brief_sample",
      rating: "positive",
      category: "trust",
      confidence: 5,
      followupRequested: true,
      email: "buyer@example.com",
    });

    const routing = await evaluateFeedbackRouting(state.events[0]);
    expect(routing.adminActions.some((action) => action.actionType === "sales_followup")).toBe(true);
    expect(JSON.stringify(db.systemAuditLog.create.mock.calls)).toContain("consentRequired");
    expect(JSON.stringify(db.systemAuditLog.create.mock.calls)).not.toContain("email_sent");
  });

  it("mounts enhanced feedback only on disciplined strategic surfaces", () => {
    const files = [
      "pages/return-brief/[caseId].tsx",
      "pages/decision-centre/case/[caseId].tsx",
      "pages/strategy-room/session/[id].tsx",
      "pages/pressure.tsx",
      "components/diagnostics/AssessmentResultSurface.tsx",
      "pages/case-studies/[slug].tsx",
      "pages/boardroom-brief.tsx",
      "app/boardroom/dossier/[dossierId]/BoardroomDossierClient.tsx",
      "pages/retainers/status/[token].tsx",
    ].map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"));

    const joined = files.join("\n");
    expect(joined).toContain('surface="return_brief_outcome"');
    expect(joined).toContain('surface="decision_centre_case"');
    expect(joined).toContain('surface="strategy_room_session"');
    expect(joined).toContain('surface="pressure_signal_result"');
    expect(joined).toContain('surface="fast_diagnostic_result"');
    expect(joined).toContain('surface="case_study_public"');
    expect(joined).toContain('surface="boardroom_brief_sample"');
    expect(joined).toContain('surface="boardroom_brief_delivered"');
    expect(joined).toContain('surface="retainer_review_cycle"');
  });
});
