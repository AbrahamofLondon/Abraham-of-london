/**
 * lib/living-intelligence/living-domain-adapter-contract.ts
 *
 * Every product area provides an adapter, but all adapters emit the same
 * LivingStateObject. The adapter's only job is to translate raw domain records
 * into LivingStateObjects. It must NOT invent state logic — the common rules
 * (evidence / consent / artifact / publication / fulfilment / visibility /
 * automation) belong to living-state-engine.ts.
 *
 * Adapters MAY pre-populate evidence/consent/artifact/publication from what the
 * domain actually knows; the engine then applies the cross-cutting rules and
 * derives blockers, next actions, and safety flags.
 */

import type {
  LivingStateDomain,
  LivingStateObject,
} from "@/lib/living-intelligence/living-state-object-contract";

/**
 * Input handed to a domain adapter.
 *
 * `records` are raw, untyped domain rows (orders, cases, results, editions…).
 * `availableRoutes` is the set of routes known to exist in the app, used by the
 * engine to decide whether a repair/next-action route is real or missing.
 * `previousMemory` is the prior memory store (keyed by object id), used to
 * detect recurrence / regression / resolution.
 */
export type LivingDomainAdapterInput = {
  domain: LivingStateDomain;
  records: Record<string, unknown>[];
  availableRoutes: string[];
  previousMemory?: Record<string, unknown>;
};

export type LivingDomainAdapter = {
  domain: LivingStateDomain;
  label: string;
  /** Cheap heuristic: does this adapter recognise the given records? */
  detect(records: Record<string, unknown>[]): boolean;
  /** Translate raw records into (pre-engine) LivingStateObjects. */
  map(input: LivingDomainAdapterInput): LivingStateObject[];
};

// ─── Safe field readers (records are untyped) ────────────────────────────────

export function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function readBool(
  record: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

export function readNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function readStringArray(
  record: Record<string, unknown>,
  key: string,
): string[] {
  const value = record[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
