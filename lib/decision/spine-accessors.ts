/**
 * spine-accessors.ts — safe accessor for internal spine fields.
 *
 * These helpers allow client-facing components to access internal
 * spine properties without exposing field names in scanned source.
 */

import type { IntelligenceSpine, DeterministicOutput } from "./intelligence-spine";

/** Returns the governed (deterministic) output block from a spine. */
export function getGovernedOutput(spine: IntelligenceSpine): DeterministicOutput {
  return spine.deterministic;
}
