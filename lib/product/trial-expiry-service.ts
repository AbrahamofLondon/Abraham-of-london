/**
 * lib/product/trial-expiry-service.ts
 *
 * Post-trial downgrade handling for governed cases.
 *
 * Behaviour:
 * - Existing records remain readable.
 * - Free users may keep up to 3 counted active cases.
 * - On expiry, the system safely keeps the 3 most recently updated cases
 *   active by default and archives the remainder.
 * - The user may later choose a different active set from the eligible cases.
 */

import { prisma } from "@/lib/prisma.server";
import { FREE_TIER_MAX_ACTIVE_CASES } from "@/lib/product/free-tier-limits";
import {
  isCountedActiveCaseStatus,
  isSelectableAfterTrialExpiry,
  normaliseGovernedCaseStatus,
  toPersistedJourneyStatus,
  type GovernedCaseStatus,
} from "@/lib/product/case-status";
import { getTrialInfo } from "@/lib/product/professional-trial";

export type TrialExpiryCaseSummary = {
  caseId: string;
  title: string;
  status: GovernedCaseStatus;
  updatedAt: string;
  createdAt: string;
};

export type TrialExpiryResolutionState = {
  required: boolean;
  autoResolved: boolean;
  maxActiveCases: number;
  activeCaseIds: string[];
  cases: TrialExpiryCaseSummary[];
};

function fallbackTitle(caseId: string): string {
  return `Governed case ${caseId.slice(0, 12)}`;
}

async function loadEligibleCases(email: string): Promise<TrialExpiryCaseSummary[]> {
  const journeys = await prisma.diagnosticJourney.findMany({
    where: { email: email.toLowerCase() },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      journeyKey: true,
      status: true,
      updatedAt: true,
      createdAt: true,
      decisionObjects: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { decisionText: true },
      },
    },
  });

  return journeys
    .map((journey) => {
      const status = normaliseGovernedCaseStatus(journey.status);
      return {
        caseId: journey.journeyKey,
        title: journey.decisionObjects[0]?.decisionText?.trim() || fallbackTitle(journey.journeyKey),
        status,
        updatedAt: journey.updatedAt.toISOString(),
        createdAt: journey.createdAt.toISOString(),
      };
    })
    .filter((journey) => isSelectableAfterTrialExpiry(journey.status));
}

async function persistActiveSelection(input: {
  email: string;
  selectedCaseIds: string[];
  cases: TrialExpiryCaseSummary[];
}): Promise<string[]> {
  const eligibleIds = new Set(input.cases.map((item) => item.caseId));
  const selected = input.selectedCaseIds
    .filter((id) => eligibleIds.has(id))
    .slice(0, FREE_TIER_MAX_ACTIVE_CASES);

  const fallbackSelected = selected.length > 0
    ? selected
    : input.cases
        .filter((item) => isCountedActiveCaseStatus(item.status))
        .slice(0, FREE_TIER_MAX_ACTIVE_CASES)
        .map((item) => item.caseId);

  const activeIds = fallbackSelected.length > 0
    ? fallbackSelected
    : input.cases.slice(0, FREE_TIER_MAX_ACTIVE_CASES).map((item) => item.caseId);

  await prisma.$transaction(
    input.cases.map((item) =>
      prisma.diagnosticJourney.update({
        where: { journeyKey: item.caseId },
        data: {
          status: toPersistedJourneyStatus(
            activeIds.includes(item.caseId) ? "ACTIVE" : "ARCHIVED",
          ),
        },
      }),
    ),
  );

  return activeIds;
}

export async function getExpiredTrialResolutionState(email: string): Promise<TrialExpiryResolutionState | null> {
  const trial = await getTrialInfo(email);
  if (trial.status !== "EXPIRED") return null;

  const cases = await loadEligibleCases(email);
  const activeCaseIds = cases
    .filter((item) => isCountedActiveCaseStatus(item.status))
    .map((item) => item.caseId);

  if (activeCaseIds.length <= FREE_TIER_MAX_ACTIVE_CASES) {
    return {
      required: false,
      autoResolved: false,
      maxActiveCases: FREE_TIER_MAX_ACTIVE_CASES,
      activeCaseIds,
      cases,
    };
  }

  const selected = cases.slice(0, FREE_TIER_MAX_ACTIVE_CASES).map((item) => item.caseId);
  const resolvedIds = await persistActiveSelection({
    email,
    selectedCaseIds: selected,
    cases,
  });

  return {
    required: false,
    autoResolved: true,
    maxActiveCases: FREE_TIER_MAX_ACTIVE_CASES,
    activeCaseIds: resolvedIds,
    cases: cases.map((item) => ({
      ...item,
      status: resolvedIds.includes(item.caseId) ? "ACTIVE" : "ARCHIVED",
    })),
  };
}

export async function resolveExpiredTrialSelection(input: {
  email: string;
  selectedCaseIds: string[];
}): Promise<TrialExpiryResolutionState> {
  const cases = await loadEligibleCases(input.email);
  const activeCaseIds = await persistActiveSelection({
    email: input.email,
    selectedCaseIds: input.selectedCaseIds,
    cases,
  });

  return {
    required: false,
    autoResolved: false,
    maxActiveCases: FREE_TIER_MAX_ACTIVE_CASES,
    activeCaseIds,
    cases: cases.map((item) => ({
      ...item,
      status: activeCaseIds.includes(item.caseId) ? "ACTIVE" : "ARCHIVED",
    })),
  };
}
