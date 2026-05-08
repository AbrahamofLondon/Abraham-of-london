/**
 * lib/product/evidence-memory-safety.ts
 *
 * Central safety guards for client-facing evidence memory.
 * Every client-visible evidence field must pass through these guards.
 *
 * No raw respondent text.
 * No counsel recommendation text on client surfaces.
 * No unlabelled evidence.
 * No "confirmed/verified" for self-reported or inferred evidence.
 */

import {
  isUnsafeAssessmentEvidenceText,
  summarizeAssessmentEvidenceText,
} from "@/lib/product/evidence-capture-contract";
import type { EvidencePosture } from "@/lib/product/evidence-memory-lifecycle-contract";

const COUNSEL_FIELDS = [
  "recommendation",
  "contradictionAssessment",
  "riskIfIgnored",
  "requiredClientAction",
  "counselRecommendation",
  "counselConclusion",
];

const RESPONDENT_FIELDS = [
  "respondentText",
  "rawResponse",
  "individualAnswer",
  "respondentName",
  "respondentEmail",
];

const OVERCLAIM_PATTERNS = [
  /\bverified\b/i,
  /\bconfirmed\b/i,
  /\bproven\b/i,
  /\binstitutional proof\b/i,
  /\binstitutional truth\b/i,
  /\bteam reality\b/i,
  /\benterprise truth\b/i,
  /\bbinding truth\b/i,
];

export type SafetyCheckResult = {
  safe: boolean;
  reason?: string;
};

export function assertClientSafeEvidenceMemory(input: {
  text: string | null | undefined;
  fieldKey: string;
  evidencePosture: EvidencePosture;
  maxLength?: number;
}): SafetyCheckResult {
  if (!input.text?.trim()) return { safe: true };

  if (isUnsafeAssessmentEvidenceText(input.text)) {
    return { safe: false, reason: `Field "${input.fieldKey}" contains unsafe text patterns.` };
  }

  if (COUNSEL_FIELDS.includes(input.fieldKey)) {
    return { safe: false, reason: `Field "${input.fieldKey}" is a counsel field and must not appear on client surfaces.` };
  }

  if (RESPONDENT_FIELDS.includes(input.fieldKey)) {
    return { safe: false, reason: `Field "${input.fieldKey}" is a respondent field and must not appear on client surfaces.` };
  }

  return { safe: true };
}

export function suppressUnsafeEvidenceText(
  text: string | null | undefined,
  maxLength = 200,
): string | null {
  if (!text?.trim()) return null;
  if (isUnsafeAssessmentEvidenceText(text)) return null;
  return summarizeAssessmentEvidenceText(text, maxLength) || null;
}

export function classifyEvidencePosture(input: {
  sourceIsSelfReported?: boolean;
  sourceIsAggregated?: boolean;
  sourceIsOperatorReviewed?: boolean;
  sourceIsCounselReviewed?: boolean;
  sourceIsOutcomeVerified?: boolean;
}): EvidencePosture {
  if (input.sourceIsOutcomeVerified) return "OUTCOME_VERIFIED";
  if (input.sourceIsCounselReviewed) return "COUNSEL_REVIEWED";
  if (input.sourceIsOperatorReviewed) return "OPERATOR_REVIEWED";
  if (input.sourceIsAggregated) return "AGGREGATED";
  if (input.sourceIsSelfReported) return "USER_REPORTED";
  return "SYSTEM_INFERRED";
}

export function requireSourceLabel(label: string | null | undefined): string {
  if (!label?.trim()) return "Source: Unknown";
  return label;
}

export function requireCapturedAtOrReason(
  capturedAt: string | null | undefined,
): string {
  if (capturedAt) {
    try {
      return new Date(capturedAt).toISOString();
    } catch {
      return "Capture date unavailable";
    }
  }
  return "Capture date unavailable";
}

export function detectOverclaimLanguage(text: string): string[] {
  const violations: string[] = [];
  for (const pattern of OVERCLAIM_PATTERNS) {
    if (pattern.test(text)) {
      violations.push(`Overclaim detected: "${text.match(pattern)?.[0]}" — use "reported" or "captured" instead.`);
    }
  }
  return violations;
}

export function preventCounselLeakage(fieldKey: string): boolean {
  return COUNSEL_FIELDS.includes(fieldKey);
}

export function preventRawRespondentLeakage(fieldKey: string): boolean {
  return RESPONDENT_FIELDS.includes(fieldKey);
}
