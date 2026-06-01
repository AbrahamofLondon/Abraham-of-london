"use client";

import type { DualAxisAnswer } from "@/lib/alignment/types";

export type AssessmentCurrentStep = "context-0" | "context-1" | "context-2" | "signal";

type VersionedSnapshot<T> = {
  version: string;
  timestamp: string;
  data: T;
};

export type PurposeAssessmentSnapshot = {
  contextAnswers: {
    avoidedDecision: string;
    competingObligation: string;
    consequence: string;
    toleratedDysfunction: string;
    justifyingEvidence: string;
  };
  dualAxisResponses: Record<string, DualAxisAnswer>;
  currentStep: AssessmentCurrentStep;
  timestamp: string;
};

const STORAGE_KEY = "aol-purpose-assessment-state";
const PURPOSE_VERSION = "2026-04-standardized";

export function loadVersionedAssessmentState<T>(
  storageKey: string,
  version: string,
): (T & { timestamp: string }) | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VersionedSnapshot<T>> | (T & { timestamp?: string });

    if (
      parsed &&
      typeof parsed === "object" &&
      "version" in parsed &&
      parsed.version === version &&
      parsed.data &&
      typeof parsed.timestamp === "string"
    ) {
      return {
        ...(parsed.data as T),
        timestamp: parsed.timestamp,
      };
    }

    if (parsed && typeof parsed === "object" && typeof parsed.timestamp === "string") {
      return parsed as T & { timestamp: string };
    }

    return null;
  } catch {
    return null;
  }
}

export function saveVersionedAssessmentState<T extends { timestamp?: string }>(
  storageKey: string,
  version: string,
  snapshot: T,
) {
  try {
    const timestamp = snapshot.timestamp ?? new Date().toISOString();
    const payload: VersionedSnapshot<Omit<T, "timestamp">> = {
      version,
      timestamp,
      data: {
        ...snapshot,
        timestamp: undefined,
      } as Omit<T, "timestamp">,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {}
}

export function clearVersionedAssessmentState(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey);
  } catch {}
}

export function loadAssessmentState(): PurposeAssessmentSnapshot | null {
  return loadVersionedAssessmentState<PurposeAssessmentSnapshot>(
    STORAGE_KEY,
    PURPOSE_VERSION,
  );
}

export function saveAssessmentState(snapshot: PurposeAssessmentSnapshot) {
  saveVersionedAssessmentState(STORAGE_KEY, PURPOSE_VERSION, snapshot);
}

export function clearAssessmentState() {
  clearVersionedAssessmentState(STORAGE_KEY);
}
