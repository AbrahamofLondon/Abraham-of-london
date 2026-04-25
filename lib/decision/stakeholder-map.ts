/**
 * Stakeholder Contradiction Map — who decides, who blocks, who thinks they decide.
 *
 * Derives stakeholder roles from case material and accumulated spine history.
 * Surfaces the gap between formal authority and actual influence.
 *
 * This is not an org chart. This is a contradiction map.
 */

import type { IntelligenceSpine, StakeholderMap } from "./intelligence-spine";
import type { CaseObject } from "./case-object";

// ─────────────────────────────────────────────────────────────────────────────
// MAP BUILDER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build stakeholder map from spine state.
 * Uses case material + accumulated history to identify stakeholder roles.
 */
export function buildStakeholderMap(spine: IntelligenceSpine): StakeholderMap {
  return buildStakeholderMapFromCase(spine.case, spine);
}

/**
 * Build stakeholder map from case object with optional spine context.
 */
export function buildStakeholderMapFromCase(
  caseObj: CaseObject,
  spine?: IntelligenceSpine,
): StakeholderMap {
  const formalOwner = extractFormalOwner(caseObj);
  const realOwner = inferRealOwner(caseObj);
  const blockers = extractBlockers(caseObj);
  const silentInfluencers = inferSilentInfluencers(caseObj, spine);
  const misalignedParties = inferMisalignedParties(caseObj, spine);

  return {
    formalOwner,
    realOwner,
    blockers,
    silentInfluencers,
    misalignedParties,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract formal owner from claimedOwner field.
 */
function extractFormalOwner(caseObj: CaseObject): string | null {
  if (!caseObj.claimedOwner || caseObj.claimedOwner.trim().length < 2) return null;
  return caseObj.claimedOwner.trim();
}

/**
 * Infer real owner — the person who actually decides, vs who is named.
 *
 * If the forced action names someone different from the claimed owner,
 * or if the blocker implies someone else holds the power, the real owner differs.
 */
function inferRealOwner(caseObj: CaseObject): string | null {
  // If actualOwnerCandidate was set by upstream logic, use it
  if (caseObj.actualOwnerCandidate) return caseObj.actualOwnerCandidate;

  // If no claimed owner, there's no basis to infer a different one
  if (!caseObj.claimedOwner) return null;

  // Check if forced action implies a different decision-maker
  if (caseObj.forcedAction) {
    const forcedLower = caseObj.forcedAction.toLowerCase();
    const ownerLower = caseObj.claimedOwner.toLowerCase();

    // If forced action says "I would" — the respondent is the real owner
    if (/\bi would\b|\bi('d| will)\b|\bmy decision\b/.test(forcedLower)) {
      if (!forcedLower.includes(ownerLower) && ownerLower !== "me" && ownerLower !== "i") {
        return "The respondent (you)";
      }
    }
  }

  // Check if blocker implies someone else holds power
  if (caseObj.blocker) {
    const blockerLower = caseObj.blocker.toLowerCase();
    // Phrases like "waiting for X" or "X won't approve" suggest X is the real gatekeeper
    const waitingFor = blockerLower.match(/waiting (?:for|on) (\w[\w\s]*?)(?:\s+to\b|$)/);
    if (waitingFor?.[1]) {
      const candidate = waitingFor[1].trim();
      if (candidate.length > 2 && candidate.toLowerCase() !== caseObj.claimedOwner.toLowerCase()) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Extract blocker entities from the blocker text.
 */
function extractBlockers(caseObj: CaseObject): string[] {
  if (!caseObj.blocker || caseObj.blocker.trim().length < 5) return [];

  const blockers: string[] = [];
  const text = caseObj.blocker;

  // Extract named roles and entities
  const rolePattern = /\b(CEO|CFO|COO|CTO|VP|board|director|manager|lead|head of|department|team|committee|legal|finance|HR|compliance)\b/gi;
  const roles = text.match(rolePattern);
  if (roles) {
    blockers.push(...[...new Set(roles.map((r) => r.trim()))]);
  }

  // Extract named people (capitalized multi-word)
  const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
  const names = text.match(namePattern);
  if (names) {
    blockers.push(...names.filter((n) => !blockers.includes(n)));
  }

  // If no named entities, extract the blocker concept
  if (blockers.length === 0 && text.length > 10) {
    blockers.push(text.slice(0, 80));
  }

  return blockers;
}

/**
 * Infer silent influencers — people who shape the decision without being named.
 *
 * Silent influencers are surfaced from:
 * - Gap between claimed owner and who the forced action references
 * - Prior attempt narrative (who derailed previous efforts)
 * - Spine history contradictions across stages
 */
function inferSilentInfluencers(caseObj: CaseObject, spine?: IntelligenceSpine): string[] {
  const influencers: string[] = [];

  // Check prior attempts for unnamed decision-shapers
  if (caseObj.priorAttempt) {
    const priorLower = caseObj.priorAttempt.toLowerCase();
    // Phrases like "pushed back", "resisted", "blocked by" without naming the blocker
    if (/\b(pushed back|resisted|overruled|vetoed|silently|behind the scenes|informally)\b/.test(priorLower)) {
      influencers.push("Unnamed resistance in prior attempts — someone derailed previous efforts without being formally identified");
    }
  }

  // Check if spine history reveals cross-stage contradictions about ownership
  if (spine && spine.history.length > 1) {
    const ownerMentions = new Set<string>();
    for (const event of spine.history) {
      const snap = event.snapshot;
      if (snap.claimedOwner && typeof snap.claimedOwner === "string") {
        ownerMentions.add(snap.claimedOwner);
      }
    }
    if (ownerMentions.size > 1) {
      influencers.push(`Ownership was attributed to different parties across stages: ${[...ownerMentions].join(", ")}. At least one is a silent influencer, not an owner.`);
    }
  }

  return influencers;
}

/**
 * Infer misaligned parties — stakeholders who are working against the decision
 * or have incentives to maintain the status quo.
 */
function inferMisalignedParties(caseObj: CaseObject, spine?: IntelligenceSpine): string[] {
  const misaligned: string[] = [];

  // If blocker and forced action suggest different interests
  if (caseObj.blocker && caseObj.forcedAction) {
    const blockerLower = caseObj.blocker.toLowerCase();
    const forcedLower = caseObj.forcedAction.toLowerCase();

    // If the forced action bypasses the blocker, someone benefits from the blocker existing
    if (blockerLower.length > 10 && forcedLower.length > 10) {
      const blockerEntities = extractBlockers(caseObj);
      if (blockerEntities.length > 0) {
        misaligned.push(`The entity behind your stated blocker (${blockerEntities[0]}) may have structural incentive to maintain the status quo — your forced action bypasses them entirely.`);
      }
    }
  }

  // Check spine history for pattern of same blocker across stages
  if (spine && spine.memory && spine.memory.recurrenceSignals.length > 0) {
    const ownershipConflicts = spine.memory.recurrenceSignals.filter(
      (s) => s.type === "ownership_conflict",
    );
    if (ownershipConflicts.length > 0) {
      misaligned.push("The same ownership structure has been named across multiple assessments without resolution. The named owner may be misaligned with the decision's requirements.");
    }
  }

  return misaligned;
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a stakeholder summary for display.
 */
export function stakeholderSummary(map: StakeholderMap): string[] {
  const lines: string[] = [];

  if (map.formalOwner) {
    lines.push(`Stated owner: ${map.formalOwner}`);
  } else {
    lines.push("No owner has been named for this decision.");
  }

  if (map.realOwner && map.realOwner !== map.formalOwner) {
    lines.push(`Inferred real decision-maker: ${map.realOwner}`);
  }

  if (map.blockers.length > 0) {
    lines.push(`Blocking entities: ${map.blockers.join(", ")}`);
  }

  if (map.silentInfluencers.length > 0) {
    lines.push(`Silent influencers: ${map.silentInfluencers[0]}`);
  }

  if (map.misalignedParties.length > 0) {
    lines.push(`Potential misalignment: ${map.misalignedParties[0]}`);
  }

  return lines;
}
