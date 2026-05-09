import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { loadOversightAccount } from "@/lib/product/oversight-account-loader";
import { loadInstitutionalMemoryArchive } from "@/lib/product/institutional-memory-loader";
import { buildBuyerVisibleCadencePosture, loadLatestRetainedReviewCycleForAccount } from "@/lib/product/retained-cadence-service";
import { buildRetainedOutcomeSummary } from "@/lib/product/retained-outcome-summary";
import { recordSuppression } from "@/lib/product/suppression-ledger";

type SummarySection = {
  title: string;
  summary: string;
  sourceLabel: string;
  evidencePosture: string;
  asOf?: string | null;
  thinState?: boolean;
  empty: boolean;
};

export type SponsorSafeCommandSummary = {
  generatedAt: string;
  subjectLabel: string;
  visibility: "SPONSOR_SAFE";
  evidencePosture: "SOURCE_LABELLED" | "SYSTEM_INFERRED" | "MIXED";
  oversightStatus: {
    state: "NO_ACCOUNT" | "INTAKE_REQUIRED" | "ACTIVE" | "REVIEW_DUE" | "ATTENTION_REQUIRED";
    label: string;
    explanation: string;
  };
  retainedMemory: {
    firstCapturedAt?: string | null;
    lastUpdatedAt?: string | null;
    activeCases: number;
    completedStages: number;
    oversightCycles: number;
    counselCases: number;
    boardroomDossiers: number;
    checkpointResponses: number;
  };
  attention: Array<{
    label: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    source: string;
    evidencePosture: string;
    explanation: string;
  }>;
  suppression: Array<{
    reason: string;
    scope: string;
  }>;
  cancellationLoss: {
    visible: boolean;
    summary: string;
    retainedAssets: string[];
  };
  retainedCadencePosture: SummarySection & {
    state: string;
    scheduledFor?: string | null;
    lastCompletedAt?: string | null;
    cadenceSource: string;
    cadenceType?: string | null;
  };
  activeAttentionQueueSummary: SummarySection & {
    count: number;
  };
  latestOversightBriefStatus: SummarySection & {
    status: string;
  };
  counselMemorySummary: SummarySection & {
    totalEvents: number;
    openCount: number;
  };
  boardroomArchiveSummary: SummarySection & {
    totalDossiers: number;
    unresolvedCount: number;
  };
  outcomeVerificationSummary: SummarySection & {
    confirmedOutcomes: number;
    blockedOutcomes: number;
    abandonedOutcomes: number;
    disputedFindings: number;
  };
  cancellationLossSummary: SummarySection & {
    retainedAssetCount: number;
  };
};

function dedupe(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function deriveEvidencePosture(brief: Awaited<ReturnType<typeof composeOversightBrief>>["brief"]) {
  const postures = new Set((brief?.oversightSignals ?? []).map((item) => String(item.evidencePosture || "").toUpperCase()).filter(Boolean));
  if (postures.size === 0) return "SYSTEM_INFERRED" as const;
  const hasSource = [...postures].some((item) => item.includes("REPORTED") || item.includes("SOURCE") || item.includes("AGGREGATED"));
  const hasSystem = [...postures].some((item) => item.includes("INFERRED"));
  if (hasSource && hasSystem) return "MIXED" as const;
  return hasSource ? "SOURCE_LABELLED" as const : "SYSTEM_INFERRED" as const;
}

function latestBriefStatus(brief: Awaited<ReturnType<typeof composeOversightBrief>>["brief"] | null) {
  if (!brief) {
    return {
      status: "UNAVAILABLE",
      summary: "No oversight brief is available for this account.",
      empty: true,
      asOf: null,
    };
  }

  const status = brief.cadence?.status ?? "AVAILABLE";
  return {
    status,
    summary: brief.executiveSummary || "Oversight brief is available.",
    empty: false,
    asOf: brief.periodEnd ?? null,
  };
}

export async function buildSponsorSafeCommandSummary(input: {
  userId?: string | null;
  email?: string | null;
  organisationId?: string | null;
}) {
  const oversight = await loadOversightAccount({
    userId: input.userId ?? undefined,
    email: input.email ?? undefined,
    organisationId: input.organisationId ?? undefined,
  });
  const composed = await composeOversightBrief({
    userId: input.userId ?? undefined,
    email: input.email ?? undefined,
    organisationId: input.organisationId ?? undefined,
  });
  const brief = composed.brief ?? null;
  const account = composed.account ?? oversight.account;
  const warnings = [...oversight.warnings, ...composed.warnings];
  const archive = account?.accountId ? await loadInstitutionalMemoryArchive(account.accountId).catch(() => null) : null;
  const retainedCycle = account
    ? await loadLatestRetainedReviewCycleForAccount({
        accountId: account.accountId,
        organisationId: input.organisationId ?? account.organisationId,
        sponsorUserId: input.userId ?? account.ownerUserId,
        sponsorEmail: input.email ?? undefined,
      }).catch(() => null)
    : null;
  const retainedCadence = buildBuyerVisibleCadencePosture(retainedCycle);
  const outcomeSummary = await buildRetainedOutcomeSummary({
    email: input.email ?? null,
    userId: input.userId ?? null,
    organisationId: input.organisationId ?? null,
  }).catch(() => null);

  const completedStages = oversight.cases.reduce((sum, item) => (
    sum + Object.values(item.evidenceCapture ?? {}).filter(Boolean).length
  ), 0);
  const checkpointResponses = oversight.cases.reduce((sum, item) => (
    sum + (item.verification?.filter((entry) => entry.status === "VERIFIED_EXECUTED" || entry.status === "VERIFIED_BLOCKED").length ?? 0)
  ), 0);

  const status = !account
    ? {
        state: "NO_ACCOUNT" as const,
        label: "No retained oversight account",
        explanation: "No retained oversight account could be derived from the current evidence and access scope.",
      }
    : !brief?.retainerIntake
      ? {
          state: "INTAKE_REQUIRED" as const,
          label: "Oversight intake required",
          explanation: "Retained oversight should not be treated as active continuity until mandate and review posture are captured.",
        }
      : retainedCadence.state === "OVERDUE" || retainedCadence.state === "DUE_SOON"
        ? {
            state: "REVIEW_DUE" as const,
            label: "Retained review due",
            explanation: retainedCadence.label,
          }
        : (brief?.verification.unresolvedBreaches ?? 0) > 0 || (brief?.counsel.requiredNow ?? 0) > 0
          ? {
              state: "ATTENTION_REQUIRED" as const,
              label: "Attention required",
              explanation: "Retained oversight is active, but unresolved commitments or escalation pressure require sponsor attention.",
            }
          : {
              state: "ACTIVE" as const,
              label: "Retained oversight active",
              explanation: "A sponsor-safe retained oversight summary can be produced from the current record.",
            };

  const attention = (brief?.structuredActions ?? []).slice(0, 6).map((item) => ({
    label: item.action,
    severity: item.severity === "CRITICAL" ? "HIGH" : item.severity,
    source: item.continuitySourceLabel || "Oversight brief",
    evidencePosture: item.continuityConfidenceLabel || "CAPTURED",
    explanation: item.consequenceIfIgnored || item.evidenceBasis,
  }));

  if (attention.length === 0 && warnings.length > 0) {
    attention.push({
      label: "Visibility gap requires review",
      severity: "MEDIUM",
      source: "Oversight loading",
      evidencePosture: "PARTIAL",
      explanation: warnings[0] || "Oversight loading emitted a visibility warning.",
    });
  }

  const retainedAssets = dedupe([
    archive?.cycleCount ? `${archive.cycleCount} oversight cycle record${archive.cycleCount === 1 ? "" : "s"}` : "",
    checkpointResponses ? `${checkpointResponses} checkpoint response${checkpointResponses === 1 ? "" : "s"}` : "",
    (brief?.counselHistory?.totalEvents ?? 0) > 0 ? `${brief?.counselHistory?.totalEvents} counsel event${brief?.counselHistory?.totalEvents === 1 ? "" : "s"}` : "",
    (brief?.boardroomArchive?.totalDossiers ?? 0) > 0 ? `${brief?.boardroomArchive?.totalDossiers} boardroom dossier record${brief?.boardroomArchive?.totalDossiers === 1 ? "" : "s"}` : "",
    (brief?.verification.commitmentsVerified ?? 0) > 0 ? `${brief?.verification.commitmentsVerified} verified commitment marker${brief?.verification.commitmentsVerified === 1 ? "" : "s"}` : "",
    outcomeSummary?.confirmedOutcomes ? `${outcomeSummary.confirmedOutcomes} confirmed outcome${outcomeSummary.confirmedOutcomes === 1 ? "" : "s"}` : "",
  ]);

  const briefStatus = latestBriefStatus(brief);
  const summary: SponsorSafeCommandSummary = {
    generatedAt: new Date().toISOString(),
    subjectLabel: input.organisationId ? "Organisation retained oversight" : "Account retained oversight",
    visibility: "SPONSOR_SAFE",
    evidencePosture: deriveEvidencePosture(brief ?? undefined),
    oversightStatus: status,
    retainedMemory: {
      firstCapturedAt: archive?.cycleSnapshots[0]?.periodStart ?? oversight.cases[oversight.cases.length - 1]?.updatedAt ?? null,
      lastUpdatedAt: archive?.cycleSnapshots[archive.cycleSnapshots.length - 1]?.periodEnd ?? oversight.cases[0]?.updatedAt ?? null,
      activeCases: brief?.activeCases.length ?? oversight.cases.length,
      completedStages,
      oversightCycles: archive?.cycleCount ?? 0,
      counselCases: brief?.counselHistory?.totalEvents ?? 0,
      boardroomDossiers: brief?.boardroomArchive?.totalDossiers ?? 0,
      checkpointResponses,
    },
    attention,
    suppression: [
      { reason: "Raw respondent text is not shown here.", scope: "Respondent evidence" },
      { reason: "Operator and counsel notes remain withheld.", scope: "Operator-only analysis" },
      { reason: "Unsafe aggregate detail is suppressed rather than over-exposed.", scope: "Small-sample and privacy-risk evidence" },
    ],
    cancellationLoss: {
      visible: retainedAssets.length > 0 || Boolean(brief?.cancellationLoss),
      summary: brief?.cancellationLoss?.summary || "Ending retained oversight does not delete your records, but it ends active continuity, review cadence, and sponsor-safe command visibility.",
      retainedAssets,
    },
    retainedCadencePosture: {
      title: "Retained cadence posture",
      state: retainedCadence.state,
      summary: retainedCadence.label,
      sourceLabel: retainedCadence.sourceLabel,
      evidencePosture: retainedCadence.evidencePosture,
      asOf: retainedCycle?.updatedAt ?? null,
      empty: retainedCadence.state === "NOT_CONFIGURED",
      thinState: retainedCadence.state === "NOT_CONFIGURED",
      scheduledFor: retainedCadence.scheduledFor ?? null,
      lastCompletedAt: retainedCadence.lastCompletedAt ?? null,
      cadenceSource: retainedCadence.cadenceSource,
      cadenceType: retainedCadence.cadenceType ?? null,
    },
    activeAttentionQueueSummary: {
      title: "Active attention queue summary",
      count: attention.length,
      summary: attention.length > 0
        ? `${attention.length} sponsor-safe attention item${attention.length === 1 ? "" : "s"} currently require review.`
        : "No sponsor-safe attention queue is currently published.",
      sourceLabel: "Sponsor-safe command summary",
      evidencePosture: deriveEvidencePosture(brief ?? undefined),
      asOf: new Date().toISOString(),
      empty: attention.length === 0,
    },
    latestOversightBriefStatus: {
      title: "Latest oversight brief status",
      status: briefStatus.status,
      summary: briefStatus.summary,
      sourceLabel: "Governed oversight brief",
      evidencePosture: deriveEvidencePosture(brief ?? undefined),
      asOf: briefStatus.asOf,
      empty: briefStatus.empty,
    },
    counselMemorySummary: {
      title: "Counsel memory summary",
      totalEvents: brief?.counselHistory?.totalEvents ?? 0,
      openCount: brief?.counselHistory?.openCount ?? 0,
      summary: brief?.counselHistory?.summary ?? "No governed counsel history is available yet.",
      sourceLabel: "Governed counsel history",
      evidencePosture: brief?.counselHistory?.totalEvents ? "OPERATOR_RECORDED" : "INSUFFICIENT_EVIDENCE",
      asOf: summaryTime(brief?.periodEnd, archive?.cycleSnapshots[archive.cycleSnapshots.length - 1]?.periodEnd ?? null),
      empty: !(brief?.counselHistory?.totalEvents),
    },
    boardroomArchiveSummary: {
      title: "Boardroom archive summary",
      totalDossiers: brief?.boardroomArchive?.totalDossiers ?? 0,
      unresolvedCount: brief?.boardroomArchive?.unresolvedBoardLevelIssues ?? 0,
      summary: brief?.boardroomArchive?.summary ?? "No boardroom archive memory is available yet.",
      sourceLabel: "Boardroom archive",
      evidencePosture: brief?.boardroomArchive?.totalDossiers ? "OPERATOR_RECORDED" : "INSUFFICIENT_EVIDENCE",
      asOf: summaryTime(brief?.periodEnd, archive?.cycleSnapshots[archive.cycleSnapshots.length - 1]?.periodEnd ?? null),
      empty: !(brief?.boardroomArchive?.totalDossiers),
    },
    outcomeVerificationSummary: {
      title: "Outcome verification summary",
      confirmedOutcomes: outcomeSummary?.confirmedOutcomes ?? 0,
      blockedOutcomes: outcomeSummary?.blockedOutcomes ?? 0,
      abandonedOutcomes: outcomeSummary?.abandonedOutcomes ?? 0,
      disputedFindings: outcomeSummary?.disputedFindings ?? 0,
      summary: !outcomeSummary
        ? "Outcome history is unavailable."
        : outcomeSummary.thinState
          ? "Outcome history is thin."
          : `${outcomeSummary.confirmedOutcomes} confirmed, ${outcomeSummary.blockedOutcomes} blocked, ${outcomeSummary.abandonedOutcomes} abandoned, ${outcomeSummary.disputedFindings} disputed.`,
      sourceLabel: outcomeSummary?.sourceLabel ?? "Retained Outcome History",
      evidencePosture: outcomeSummary?.evidencePosture ?? "INSUFFICIENT_EVIDENCE",
      asOf: outcomeSummary?.latestOutcomeDate ?? null,
      thinState: outcomeSummary?.thinState ?? true,
      empty: !outcomeSummary || (
        outcomeSummary.confirmedOutcomes
        + outcomeSummary.blockedOutcomes
        + outcomeSummary.abandonedOutcomes
        + outcomeSummary.disputedFindings
      ) === 0,
    },
    cancellationLossSummary: {
      title: "Cancellation-loss / continuity-loss summary",
      retainedAssetCount: retainedAssets.length,
      summary: brief?.cancellationLoss?.summary || "Cancellation-loss visibility is still thin.",
      sourceLabel: "Retained continuity summary",
      evidencePosture: retainedAssets.length > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      asOf: brief?.periodEnd ?? null,
      empty: !brief?.cancellationLoss && retainedAssets.length === 0,
      thinState: retainedAssets.length < 2,
    },
  };

  // Record each static suppression rule to the suppression audit ledger
  const scopeId = input.organisationId ?? input.email ?? input.userId ?? "unknown";
  const suppressionRules = [
    {
      fieldName: "respondentText",
      suppressionReason: "Raw respondent text is not shown here.",
      suppressionRule: "RESPONDENT_TEXT_WITHHELD",
      evidenceSource: "Respondent evidence",
    },
    {
      fieldName: "operatorNotes",
      suppressionReason: "Operator and counsel notes remain withheld.",
      suppressionRule: "OPERATOR_NOTES_WITHHELD",
      evidenceSource: "Operator-only analysis",
    },
    {
      fieldName: "unsafeAggregates",
      suppressionReason: "Unsafe aggregate detail is suppressed rather than over-exposed.",
      suppressionRule: "UNSAFE_AGGREGATE_SUPPRESSED",
      evidenceSource: "Small-sample and privacy-risk evidence",
    },
  ];
  for (const rule of suppressionRules) {
    recordSuppression({
      scopeId,
      surface: "SPONSOR_SAFE_COMMAND_SUMMARY",
      fieldName: rule.fieldName,
      evidenceSource: rule.evidenceSource,
      originalPosture: summary.evidencePosture,
      suppressionReason: rule.suppressionReason,
      suppressionRule: rule.suppressionRule,
      suppressedAt: summary.generatedAt,
      suppressedBySystem: true,
      reviewedByOperator: null,
      reviewedAt: null,
      overrideStatus: "NONE",
      overrideReason: null,
    }).catch(() => {});
  }

  return { summary, brief, account, warnings, retainedCadence, outcomeSummary };
}

function summaryTime(primary?: string | null, fallback?: string | null) {
  return primary ?? fallback ?? null;
}
