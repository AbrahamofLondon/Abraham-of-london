// pages/api/constitution/assess.ts

import type { NextApiRequest, NextApiResponse } from "next";
import {
  runConstitutionalAssessment,
} from "@/lib/constitution/assessment-engine";
import type {
  AssessmentInput,
  ConstitutionalAssessment,
} from "@/lib/constitution/assessment-types";

type ApiSuccess = {
  ok: true;
  assessment: ConstitutionalAssessment;
};

type ApiFailure = {
  ok: false;
  error: string;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeInput(body: unknown): AssessmentInput {
  const raw = asRecord(body);
  const precomputedRaw = asRecord(raw.precomputed);

  return {
    source:
      (asString(raw.source) as AssessmentInput["source"]) || "diagnostic",
    fullName: asString(raw.fullName),
    name: asString(raw.name),
    email: asString(raw.email),
    role: asString(raw.role),
    authorityRole: asString(raw.authorityRole),
    authorityScope: asString(raw.authorityScope),
    organisation: asString(raw.organisation),
    organisationType: asString(raw.organisationType),
    jurisdiction: asString(raw.jurisdiction),
    sector: asString(raw.sector),
    revenueBand: asString(raw.revenueBand),
    annualRevenueBand: asString(raw.annualRevenueBand),
    urgencyWindow: asString(raw.urgencyWindow),
    boardInvolved: asString(raw.boardInvolved),
    problemStatement: asString(raw.problemStatement),
    mandateDescription: asString(raw.mandateDescription),
    statedProblem: asString(raw.statedProblem),
    symptoms: asString(raw.symptoms),
    desiredOutcome: asString(raw.desiredOutcome),
    currentConstraint: asString(raw.currentConstraint),
    marketExposure: asString(raw.marketExposure),
    precomputed: {
      authorityClarity:
        typeof precomputedRaw.authorityClarity === "number"
          ? precomputedRaw.authorityClarity
          : undefined,
      coherence:
        typeof precomputedRaw.coherence === "number"
          ? precomputedRaw.coherence
          : undefined,
      pressure:
        typeof precomputedRaw.pressure === "number"
          ? precomputedRaw.pressure
          : undefined,
      friction:
        typeof precomputedRaw.friction === "number"
          ? precomputedRaw.friction
          : undefined,
      trustCondition:
        typeof precomputedRaw.trustCondition === "number"
          ? precomputedRaw.trustCondition
          : undefined,
      governanceDiscipline:
        typeof precomputedRaw.governanceDiscipline === "number"
          ? precomputedRaw.governanceDiscipline
          : undefined,
    },
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiSuccess | ApiFailure>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "POST required.",
    });
  }

  try {
    const input = normalizeInput(req.body);
    const assessment = runConstitutionalAssessment(input);

    return res.status(200).json({
      ok: true,
      assessment,
    });
  } catch (error) {
    console.error("[CONSTITUTION_ASSESS_ERROR]", error);

    return res.status(500).json({
      ok: false,
      error: "Assessment engine failure.",
    });
  }
}