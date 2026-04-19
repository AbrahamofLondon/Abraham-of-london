import type { NextApiRequest, NextApiResponse } from "next";
import { createProofEvidence } from "@/lib/proof/evidence";

type ResponseBody =
  | { ok: true; id: string }
  | { ok: false; error: string };

const VALID_ACCURACY = new Set(["precise", "partial", "no"]);
const VALID_USEFULNESS = new Set(["yes", "somewhat", "no"]);
const VALID_ACTION = new Set([
  "take_no_action",
  "rerun_better_inputs",
  "share_with_colleague",
  "use_executive_reporting",
  "use_strategy_room",
  "act_internally",
]);
const VALID_OUTCOME = new Set([
  "clarified_problem",
  "changed_decision_making",
  "improved_team_alignment",
  "reduced_confusion",
  "triggered_intervention",
  "prevented_bad_decision",
  "no_meaningful_change_yet",
]);

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function b(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function nullableEnum(value: unknown, valid: Set<string>): string | null {
  const next = s(value);
  return next && valid.has(next) ? next : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  if (!isObject(req.body)) {
    return res.status(400).json({ ok: false, error: "INVALID_PAYLOAD" });
  }

  const sourceStage = s(req.body.sourceStage);
  const proofType = s(req.body.proofType, "immediate_accuracy");

  if (!sourceStage) {
    return res.status(400).json({ ok: false, error: "SOURCE_STAGE_REQUIRED" });
  }

  try {
    const record = await createProofEvidence({
      sourceStage,
      proofType,
      routeResultType: s(req.body.routeResultType) || null,
      accuracyScore: nullableEnum(req.body.accuracyScore, VALID_ACCURACY),
      usefulnessScore: nullableEnum(req.body.usefulnessScore, VALID_USEFULNESS),
      nextStepChanged: b(req.body.nextStepChanged),
      actionIntent: nullableEnum(req.body.actionIntent, VALID_ACTION),
      outcomeCategory: nullableEnum(req.body.outcomeCategory, VALID_OUTCOME),
      mostAccuratePart: s(req.body.mostAccuratePart) || null,
      paidSpecificity: nullableEnum(req.body.paidSpecificity, VALID_USEFULNESS),
      consequenceClear: b(req.body.consequenceClear),
      justifiedAction: b(req.body.justifiedAction),
      decisionClarity: nullableEnum(req.body.decisionClarity, VALID_USEFULNESS),
      nextMoveClear: b(req.body.nextMoveClear),
      freeTextRaw: s(req.body.freeTextRaw).slice(0, 1000) || null,
      displayLabel: s(req.body.displayLabel).slice(0, 120) || null,
      userType: s(req.body.userType).slice(0, 80) || null,
      organisationType: s(req.body.organisationType).slice(0, 120) || null,
      sourceOrigin: s(req.body.sourceOrigin).slice(0, 120) || null,
      isPaidStage: Boolean(req.body.isPaidStage),
      sourceKind: "SELF_REPORTED",
      metadata: isObject(req.body.metadata) ? req.body.metadata : null,
    });

    return res.status(200).json({ ok: true, id: record.id });
  } catch (error) {
    console.error("[proof.evidence]", error);
    return res.status(500).json({ ok: false, error: "PERSISTENCE_FAILED" });
  }
}
