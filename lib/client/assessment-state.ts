"use client";

import type { DualAxisAnswer } from "@/lib/alignment/types";

export type AssessmentCurrentStep = "context-0" | "context-1" | "context-2" | "signal";

export type PurposeAssessmentSnapshot = {
  contextAnswers: {
    avoidedDecision: string;
    competingObligation: string;
    consequence: string;
  };
  dualAxisResponses: Record<string, DualAxisAnswer>;
  currentStep: AssessmentCurrentStep;
  timestamp: string;
};

const STORAGE_KEY = "aol-purpose-assessment-state";

export function loadAssessmentState(): PurposeAssessmentSnapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PurposeAssessmentSnapshot;
  } catch {
    return null;
  }
}

export function saveAssessmentState(snapshot: PurposeAssessmentSnapshot) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {}
}

export function clearAssessmentState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
