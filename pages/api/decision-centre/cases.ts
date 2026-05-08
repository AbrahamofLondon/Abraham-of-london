/**
 * pages/api/decision-centre/cases.ts — Decision Centre API
 *
 * Server-authoritative Living Case endpoint. Returns governed case state
 * for the authenticated user. Never trusts sessionStorage.
 *
 * Response: DecisionCentreResponse from lib/product/decision-centre-contract.ts
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import {
  deriveLivingCase,
  isAdmissibleFor,
  type LivingCase,
} from "@/lib/product/living-case-store";
import {
  deriveCognitiveState,
  type DecisionCentreCase,
  type DecisionCentreResponse,
  type SurfaceAdmissionStatus,
  type DecisionCreditSummary,
} from "@/lib/product/decision-centre-contract";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildStageChecklist(livingCase: LivingCase): StageEntry[] {
  const completed = new Set(livingCase.completedStages);
  const stages: StageEntry[] = [
    { key: "fast_diagnostic", label: "Fast Diagnostic", status: completed.has("purpose_alignment") || completed.has("constitutional") ? "completed" : "not_started" },
    { key: "purpose_alignment", label: "Purpose Alignment", status: completed.has("purpose_alignment") ? "completed" : "not_started" },
    { key: "constitutional", label: "Constitutional Diagnostic", status: completed.has("constitutional") ? "completed" : "not_started" },
    { key: "team", label: "Team Assessment", status: completed.has("team") ? "completed" : "not_started" },
    { key: "enterprise", label: "Enterprise Assessment", status: completed.has("enterprise") ? "completed" : "not_started" },
    { key: "executive_reporting", label: "Executive Reporting", status: completed.has("executive_reporting") ? "completed" : "not_started" },
    { key: "strategy_room", label: "Strategy Room", status: completed.has("strategy_room") ? "completed" : "not_started" },
    { key: "outcome_verification", label: "Outcome Verification", status: "not_started" },
  ];

  // Add bespoke contributions from evidence nodes
  for (const stage of stages) {
    if (stage.status !== "completed") continue;
    const stageKey = stage.key === "fast_diagnostic" ? "purpose_alignment" : stage.key;
    const nodes = livingCase.evidenceNodes.filter((n) => n.sourceStage === stageKey);
    const contradictions = nodes.filter((n) => n.kind === "contradiction");
    if (contradictions.length > 0 && contradictions[0]) {
      stage.contribution = contradictions[0].summary;
    } else if (nodes.length > 0 && nodes[0]) {
      stage.contribution = nodes[0].summary;
    }
  }

  return stages;
}

function buildAdmissionStatus(
  livingCase: LivingCase,
  surface: "executive_reporting" | "strategy_room",
): SurfaceAdmissionStatus {
  const result = isAdmissibleFor(livingCase, surface);
  const surfaceLabel = surface === "executive_reporting" ? "Executive Reporting" : "Strategy Room";

  if (result.admissible) {
    return {
      surface: surfaceLabel,
      status: "ADMITTED",
      reasons: [result.reason],
    };
  }

  return {
    surface: surfaceLabel,
    status: "RESTRICTED",
    reasons: [result.reason],
    repairActions: [result.reason],
    returnPath: "/diagnostics",
  };
}

function buildCaseTitle(livingCase: LivingCase): string {
  if (livingCase.primaryDecision?.decisionText) {
    const text = livingCase.primaryDecision.decisionText;
    return text.length > 80 ? text.slice(0, 77) + "..." : text;
  }
  return "Active case";
}

async function getOwnedProducts(email: string): Promise<string[]> {
  try {
    const entitlements = await prisma.clientEntitlement.findMany({
      where: { email, status: "active" },
      select: { productCode: true },
    });
    return entitlements.map((e) => e.productCode);
  } catch {
    return [];
  }
}

function deriveEligibleProducts(livingCase: LivingCase, owned: string[]): string[] {
  const eligible: string[] = [];
  const ownedSet = new Set(owned);

  if (!ownedSet.has("assessment.executive_reporting")) {
    const erAdmissible = isAdmissibleFor(livingCase, "executive_reporting");
    if (erAdmissible.admissible) eligible.push("executive_reporting");
  }

  if (!ownedSet.has("strategy-room.entry")) {
    const srAdmissible = isAdmissibleFor(livingCase, "strategy_room");
    if (srAdmissible.admissible) eligible.push("strategy_room");
  }

  return eligible;
}

function derivePaymentRequired(eligible: string[], owned: string[]): string[] {
  const ownedSet = new Set(owned);
  return eligible.filter((p) => {
    if (p === "executive_reporting") return !ownedSet.has("assessment.executive_reporting");
    if (p === "strategy_room") return !ownedSet.has("strategy-room.entry");
    return false;
  });
}

function deriveRestrictedProducts(livingCase: LivingCase, owned: string[]): string[] {
  const restricted: string[] = [];
  const ownedSet = new Set(owned);

  if (!ownedSet.has("assessment.executive_reporting")) {
    const er = isAdmissibleFor(livingCase, "executive_reporting");
    if (!er.admissible) restricted.push("executive_reporting");
  }

  if (!ownedSet.has("strategy-room.entry")) {
    const sr = isAdmissibleFor(livingCase, "strategy_room");
    if (!sr.admissible) restricted.push("strategy_room");
  }

  return restricted;
}

function deriveNextAction(livingCase: LivingCase): string | null {
  // Highest priority: unresolved contradictions
  if (livingCase.contradictions.length > 0) {
    const sorted = [...livingCase.contradictions].sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    );
    const highest = sorted[0];
    if (highest) return `Resolve contradiction: ${highest.summary}`;
  }

  // Missing stages
  if (!livingCase.completedStages.includes("constitutional")) {
    return "Complete the Constitutional Diagnostic to establish structural evidence.";
  }
  if (!livingCase.completedStages.includes("enterprise") && livingCase.completedStages.includes("team")) {
    return "Complete the Enterprise Assessment to map institutional pressure.";
  }

  // ER eligible but not purchased
  const erAdmissible = isAdmissibleFor(livingCase, "executive_reporting");
  if (erAdmissible.admissible) {
    return "Commission Executive Reporting — evidence supports a governed brief.";
  }

  return null;
}

function severityRank(severity: string): number {
  switch (severity) {
    case "critical": return 4;
    case "high": return 3;
    case "medium": return 2;
    case "low": return 1;
    default: return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const identity = await resolveIdentity(req);

    if (!identity.authenticated || !identity.email) {
      return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
    }

    const email = identity.email;

    // ── Derive Living Case (server-authoritative) ──
    const livingCase = await deriveLivingCase({ email });

    if (!livingCase) {
      return res.status(200).json({
        ok: true,
        cases: [],
        commercial: { ownedProducts: [], eligibleProducts: [], restrictedProducts: [] },
        credit: null,
      } satisfies DecisionCentreResponse);
    }

    // ── Build case card ──
    const owned = await getOwnedProducts(email);
    const eligible = deriveEligibleProducts(livingCase, owned);
    const paymentRequired = derivePaymentRequired(eligible, owned);
    const restricted = deriveRestrictedProducts(livingCase, owned);

    const caseCard: DecisionCentreCase = {
      caseId: livingCase.caseId,
      title: buildCaseTitle(livingCase),
      decisionText: livingCase.primaryDecision?.decisionText || null,
      cognitiveState: deriveCognitiveState(livingCase),
      evidenceTier: livingCase.evidenceTier,
      completedStages: buildStageChecklist(livingCase),
      admission: {
        executiveReporting: buildAdmissionStatus(livingCase, "executive_reporting"),
        strategyRoom: buildAdmissionStatus(livingCase, "strategy_room"),
      },
      continuity: livingCase.contradictions.length > 0
        ? {
            status: livingCase.contradictions.length >= 3 ? "VERIFIED_PATTERN" : "REPEATED",
            priorOccurrences: livingCase.contradictions.length,
            trend: "stable",
            summary: livingCase.contradictions[0]?.summary || undefined,
          }
        : livingCase.stageCount > 0
          ? { status: "NEW", summary: "Case under initial evidence gathering." }
          : null,
      commercial: {
        ownedProducts: owned,
        eligibleProducts: eligible,
        paymentRequiredFor: paymentRequired,
        restrictedProducts: restricted,
      },
      nextRequiredAction: deriveNextAction(livingCase),
      unresolvedContradictions: livingCase.contradictions.length,
      latestDirective: livingCase.latestDirective,
      outcomeStatus: null,
      returnBriefs: [],
      updatedAt: livingCase.createdAt || new Date().toISOString(),
    };

    // ── Decision Credit (best-effort) ──
    let credit: DecisionCreditSummary | null = null;
    try {
      const { getCreditProfile } = await import("@/lib/decision-ledger/ledger-service");
      const profile = await getCreditProfile(email);
      if (profile) {
        credit = {
          score: profile.score,
          trend: profile.trend as "improving" | "stable" | "declining",
          fulfilled: profile.fulfilled,
          breached: profile.breached,
          disputed: profile.disputed,
        };
      }
    } catch {
      // Decision credit is best-effort — not critical
    }

    res.setHeader("Cache-Control", "private, no-cache");
    return res.status(200).json({
      ok: true,
      cases: [caseCard],
      commercial: {
        ownedProducts: owned,
        eligibleProducts: eligible,
        restrictedProducts: restricted,
      },
      credit,
    } satisfies DecisionCentreResponse);
  } catch (error) {
    console.error("[decision-centre/cases]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}
