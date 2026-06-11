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
    systemAuditLog: { create: vi.fn(async () => ({})) },
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
  };

  return { db, state };
});

vi.mock("@/lib/prisma", () => ({ prisma: db }));
vi.mock("@/lib/prisma.server", () => ({ prisma: db }));

import { submitFeedback } from "@/lib/feedback/feedback-service";
import { normalizeFeedbackPayload } from "@/lib/feedback/feedback-service";
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
    expect(response.publicMessage).toBe("Feedback received. Thank you.");
    expect((response as any).linkedFalsificationEntryId).toBeUndefined();
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
    expect(schema).toContain("model FindingFeedback");
    expect(schema).toContain("model FeedbackEvent");
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
