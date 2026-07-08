import { prisma } from "@/lib/prisma";
import { releaseSnapshotStateHash } from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { canonicalHash, getGmiReleaseSnapshots } from "@/lib/intelligence/gmi-data-service.server";

export const GMI_FIXTURE_EDITION_ID = "GMI-CLEAN-ROOM-FIXTURE-2026";
export const GMI_FIXTURE_SNAPSHOT_ID = "test-gmi-clean-room-fixture-published-snapshot";
export const GMI_FIXTURE_ARTIFACT_ID = "test-gmi-clean-room-fixture-board-pack-artifact";

const calls = Array.from({ length: 8 }, (_, index) => ({
  callId: `fixture-call-${index + 1}`,
  editionId: GMI_FIXTURE_EDITION_ID,
  claim: `Fixture market call ${index + 1}`,
  status: index < 2 ? "confirmed" : "pending_review",
}));

const sources = Array.from({ length: 13 }, (_, index) => ({
  sourceRowId: `fixture-source-${index + 1}`,
  editionId: GMI_FIXTURE_EDITION_ID,
  claim: `Fixture source signal ${index + 1}`,
  status: "qualified",
  confidence: index < 3 ? "high" : "medium",
  evidenceClass: index < 2 ? "SCENARIO_ASSUMPTION" : "PRIMARY_SOURCE",
  methodNote: "Clean-room fixture row for persisted snapshot read-mode tests.",
  observationWindow: "Fixture-only persisted evidence window.",
  adminJustification: "Fixture row used to verify DB-backed snapshot reproduction.",
}));

const falsificationRules = [
  {
    thesisId: "fixture-thesis",
    observableIndicator: "Fixture observable condition",
    thresholdValue: "Fixture threshold",
    nextReviewDue: "2026-07-31",
  },
];

const boardPulse = {
  operatorConsequenceIndex: [{ issue: "Fixture consequence", severity: "medium" }],
  decisionsToMakeIn30Days: [
    {
      decision: "Review fixture decision pressure",
      whyNow: "Fixture timing pressure",
      riskIfDelayed: "Fixture risk compounds if ignored.",
      suggestedOwner: "Board",
      route: "prepare",
    },
  ],
  decisionsToPrepareIn90Days: [],
  decisionsToDefer: [],
};

const performance = {
  totalCallsIssued: 8,
  totalCallsReviewed: 6,
  averageScore: 0.72,
  confirmedCount: 2,
  partialCount: 2,
  weakDisconfirmedCount: 0,
  pendingCarryForwardCount: 4,
  disconfirmedCalls: [],
  carriedForwardCalls: [],
  callsDueForReview: [],
};

const snapshot = {
  id: GMI_FIXTURE_SNAPSHOT_ID,
  editionId: GMI_FIXTURE_EDITION_ID,
  editionSlug: "gmi-clean-room-fixture-2026",
  releaseStatus: "PUBLISHED",
  primaryNextAction: "Fixture-only board-pack read-mode proof",
  methodologyVersion: "fixture-methodology-v1",
  rubricVersion: "fixture-rubric-v1",
  callLedgerHash: canonicalHash(calls),
  sourceAppendixHash: canonicalHash(sources),
  falsificationHash: canonicalHash(falsificationRules),
  boardPulseHash: canonicalHash(boardPulse),
  performanceMetricsJson: performance,
  blockersJson: [],
  warningsJson: [],
  blockerCategoriesJson: [],
  stateJson: {
    calls,
    sources,
    falsificationRules,
    boardPulse,
    performance,
    provenance: {
      source: "test-local-clean-room-fixture",
      publicReleaseAuthority: false,
    },
  },
};

export async function seedGmiCleanRoomBoardPackFixture() {
  const createdAt = new Date();
  const publishedAt = createdAt;

  await prisma.$executeRaw`
    INSERT INTO "gmi_release_snapshots" (
      "id",
      "edition_id",
      "edition_slug",
      "release_status",
      "primary_next_action",
      "methodology_version",
      "rubric_version",
      "call_ledger_hash",
      "source_appendix_hash",
      "falsification_hash",
      "board_pulse_hash",
      "performance_metrics_json",
      "blockers_json",
      "warnings_json",
      "blocker_categories_json",
      "state_json",
      "created_by",
      "published_by",
      "published_at",
      "created_at"
    )
    VALUES (
      ${snapshot.id},
      ${snapshot.editionId},
      ${snapshot.editionSlug},
      ${snapshot.releaseStatus},
      ${snapshot.primaryNextAction},
      ${snapshot.methodologyVersion},
      ${snapshot.rubricVersion},
      ${snapshot.callLedgerHash},
      ${snapshot.sourceAppendixHash},
      ${snapshot.falsificationHash},
      ${snapshot.boardPulseHash},
      CAST(${JSON.stringify(snapshot.performanceMetricsJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.blockersJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.warningsJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.blockerCategoriesJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.stateJson)} AS jsonb),
      ${"test-fixture"},
      ${"test-fixture"},
      ${publishedAt},
      ${createdAt}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "release_status" = EXCLUDED."release_status",
      "state_json" = EXCLUDED."state_json",
      "published_at" = EXCLUDED."published_at",
      "created_at" = EXCLUDED."created_at"
  `;

  const snapshots = await getGmiReleaseSnapshots(GMI_FIXTURE_EDITION_ID);
  const persistedSnapshot = snapshots.data.find((row) => row.id === GMI_FIXTURE_SNAPSHOT_ID);
  if (!persistedSnapshot) {
    throw new Error("GMI clean-room fixture snapshot did not persist.");
  }
  const snapshotStateHash = releaseSnapshotStateHash(persistedSnapshot);
  const fixtureContentHash = canonicalHash({
    fixture: "gmi-board-pack-artifact",
    editionId: GMI_FIXTURE_EDITION_ID,
    snapshotStateHash,
  });

  await prisma.$executeRaw`
    INSERT INTO "gmi_board_pack_artifacts" (
      "id",
      "edition_id",
      "snapshot_id",
      "artifact_type",
      "file_name",
      "storage_path",
      "public_url",
      "content_hash",
      "generated_from_state_hash",
      "generated_at",
      "generated_by",
      "status",
      "error_message",
      "updated_at"
    )
    VALUES (
      ${GMI_FIXTURE_ARTIFACT_ID},
      ${GMI_FIXTURE_EDITION_ID},
      ${GMI_FIXTURE_SNAPSHOT_ID},
      ${"board_pack_pdf"},
      ${"gmi-clean-room-fixture-2026-board-pack.pdf"},
      ${null},
      ${null},
      ${fixtureContentHash},
      ${snapshotStateHash},
      ${createdAt},
      ${"test-fixture"},
      ${"generated"},
      ${null},
      ${createdAt}
    )
    ON CONFLICT ("id") DO UPDATE SET
      "snapshot_id" = EXCLUDED."snapshot_id",
      "content_hash" = EXCLUDED."content_hash",
      "generated_from_state_hash" = EXCLUDED."generated_from_state_hash",
      "generated_at" = EXCLUDED."generated_at",
      "status" = EXCLUDED."status",
      "error_message" = EXCLUDED."error_message",
      "updated_at" = EXCLUDED."updated_at"
  `;
}
