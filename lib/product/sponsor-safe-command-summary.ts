import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { loadOversightAccount } from "@/lib/product/oversight-account-loader";
import { loadInstitutionalMemoryArchive } from "@/lib/product/institutional-memory-loader";

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
      : brief.cadence?.status === "REVIEW_DUE" || brief.cadence?.status === "REVIEW_OVERDUE" || brief.cadence?.status === "DELIVERY_DUE" || brief.cadence?.status === "DELIVERY_OVERDUE" || brief.cadence?.status === "OVERDUE"
        ? {
            state: "REVIEW_DUE" as const,
            label: "Retained review due",
            explanation: "Review cadence requires operator confirmation. The next retained review should not be treated as complete.",
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
  ]);

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
  };

  return { summary, brief, account, warnings };
}
