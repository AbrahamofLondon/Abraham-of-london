/**
 * lib/research/engine-adapter-contract.ts
 *
 * Contract that all engine adapters must satisfy.
 * An engine adapter wraps a production engine for use in the Foundry.
 */

import type { RunSeverity, Finding } from "./foundry-contract";

export type EngineStatus =
  | "PRODUCTION_CALLABLE"
  | "PRODUCTION_NEEDS_WRAP"
  | "DOCUMENTATION_ONLY"
  | "HUMAN_PROCESS"
  | "DECOMMISSIONED";

export type EngineRunInput = {
  payload: Record<string, unknown>;
  context?: Record<string, unknown>;
};

export type EngineRunOutput = {
  findings: Finding[];
  summary: string;
  severity: RunSeverity;
  engineVersion: string;
  durationMs: number;
  rawOutput?: Record<string, unknown>;
  /** What this adapter does NOT cover — must be explicit, never omitted. */
  limitations?: string[];
  /** What is required to promote this adapter to full coverage. */
  promotionRequirements?: string[];
};

export type EngineRegistryEntry = {
  id: string;
  name: string;
  status: EngineStatus;
  description: string;
  version: string;
  /** Why the engine is not production-callable, if applicable */
  limitationReason?: string;
  /** What adapter work is required to make it callable */
  adapterRequired?: string;
  /** ISO date when it was decommissioned */
  decommissionedAt?: string;
  /** Verify the engine is callable and returns a valid result. Only on PRODUCTION_CALLABLE engines. */
  selfTest?: () => Promise<{ ok: boolean; detail?: string }>;
  /** Return the runtime version and optional file hash of the engine. */
  getVersion?: () => Promise<{ version: string; fileHash?: string }>;
};

export type EngineAdapter = {
  engineId: string;
  run(input: EngineRunInput): Promise<EngineRunOutput>;
};
