/**
 * lib/intelligence/accountability/market-accountability-evidence.ts
 *
 * §9/§33 GOVERNANCE GATE — the evidence source authority for PUBLIC market
 * accountability surfaces (Market DII, Decision Learning Log, cross-edition review).
 *
 * WHY THIS EXISTS: the legacy `market-intelligence-call-ledger` is explicitly labelled
 * "NOT RUNTIME SOURCE OF TRUTH. DO NOT IMPORT IN PUBLIC/API/ADMIN GMI RUNTIME … seed
 * inputs and historical test fixtures only." Publishing a real-looking headline score
 * derived from those fixtures would be a fabricated public metric (§33 forbids exactly
 * this). This module is the single gate that decides whether the accountability
 * surfaces may present an AUTHORITATIVE published score or must present a clearly
 * labelled PREVIEW that never crosses the public publication threshold.
 *
 * AUTHORITATIVE requires a persisted, human-reviewed call ledger (gmi-data-service,
 * DB-backed) injected by the server route. Until that is wired and populated, the
 * surfaces run in PREVIEW mode: methodology + mechanics are shown, the headline is
 * withheld, and a professional message explains the state. When real resolved calls
 * meet the threshold, the published score activates automatically — no code change.
 */

import { MARKET_CALL_LEDGER, type MarketCallRecord } from "../market-intelligence-call-ledger";

export type EvidenceMode = "AUTHORITATIVE" | "PREVIEW_SEED";

export interface MarketAccountabilityEvidence {
  mode: EvidenceMode;
  calls: MarketCallRecord[];
  /** transparent, user-facing explanation of the current mode. */
  modeReason: string;
  /** true only when a public headline/score may be published. */
  publicPublishable: boolean;
}

export interface ResolveEvidenceOptions {
  /**
   * Authoritative, persisted, human-reviewed calls — injected by the SERVER route from
   * gmi-data-service (DB rows). Public/edge bundles must never import the server DB
   * module directly, so it is passed in. Null/empty ⇒ PREVIEW mode.
   */
  authoritativeCalls?: MarketCallRecord[] | null;
}

const PREVIEW_REASON =
  "No authoritative, human-reviewed market call ledger is available in this environment yet. " +
  "This page shows the methodology and how the index is computed, using seed fixtures for illustration only. " +
  "It is NOT a published accountability score. The published index activates automatically once real resolved calls are recorded.";

const AUTHORITATIVE_REASON =
  "Scored from the persisted, human-reviewed market call ledger.";

/**
 * Resolve the evidence a public accountability surface may use. Fail-safe toward
 * PREVIEW: only an explicitly-supplied non-empty authoritative set unlocks publication.
 */
export function resolveMarketAccountabilityEvidence(opts: ResolveEvidenceOptions = {}): MarketAccountabilityEvidence {
  const authoritative = opts.authoritativeCalls;
  if (authoritative && authoritative.length > 0) {
    return { mode: "AUTHORITATIVE", calls: authoritative, modeReason: AUTHORITATIVE_REASON, publicPublishable: true };
  }
  return { mode: "PREVIEW_SEED", calls: [...MARKET_CALL_LEDGER], modeReason: PREVIEW_REASON, publicPublishable: false };
}

export function isPublicPublishable(mode: EvidenceMode): boolean {
  return mode === "AUTHORITATIVE";
}

/** Professional interim copy for a surface running in PREVIEW mode. */
export const PREVIEW_NOTICE = {
  heading: "Accountability record is accruing",
  body:
    "Our published market judgement record activates once enough real calls have been made and independently resolved. " +
    "Until then, this page shows exactly how the score will be computed — the methodology, components, coverage rules and " +
    "sample thresholds — so the standard is visible before any number is published. No score is shown because none has yet " +
    "met the publication threshold on authoritative evidence.",
} as const;
