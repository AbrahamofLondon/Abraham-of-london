/**
 * lib/research/adapter-base-contract.ts
 *
 * Base contract for all Foundry engine adapters.
 * Every adapter must satisfy this interface.
 * Provides factory function to create standard adapters with minimal boilerplate.
 */

import type { EngineRunInput, EngineRunOutput } from "./engine-adapter-contract";
import type { Finding, FormulaStep } from "./foundry-contract";

// ─── Base Adapter Interface ──────────────────────────────────────────────────

export interface FoundryAdapter {
  id: string;
  version: string;

  selfTest(): Promise<{ passed: boolean; message: string }>;
  getVersion(): string;
  run(input: EngineRunInput): Promise<EngineRunOutput>;

  limitations: string[];
  promotionRequirements: string[];
  productionFunctionsCalled: string[];
  pipelineStagesNotCalled: string[];
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type AdapterFactoryConfig = {
  id: string;
  version: string;
  runFn: (payload: Record<string, unknown>) => Promise<EngineRunOutput>;
  selfTestFn?: () => Promise<{ passed: boolean; message: string }>;
  limitations?: string[];
  promotionRequirements?: string[];
  productionFunctionsCalled?: string[];
  pipelineStagesNotCalled?: string[];
};

/**
 * Create a standard adapter from a run function and metadata.
 * Provides default selfTest that runs the adapter with empty payload.
 */
export function createAdapter(config: AdapterFactoryConfig): FoundryAdapter {
  const defaultSelfTest = async () => {
    try {
      const result = await config.runFn({});
      return {
        passed: true,
        message: `selfTest passed — ${result.findings.length} findings, severity: ${result.severity}`,
      };
    } catch (err) {
      return {
        passed: false,
        message: `selfTest threw: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };

  return {
    id: config.id,
    version: config.version,

    async selfTest() {
      return (config.selfTestFn ?? defaultSelfTest)();
    },

    getVersion(): string {
      return config.version;
    },

    async run(input: EngineRunInput): Promise<EngineRunOutput> {
      return config.runFn(input.payload ?? {});
    },

    limitations: config.limitations ?? [],
    promotionRequirements: config.promotionRequirements ?? [],
    productionFunctionsCalled: config.productionFunctionsCalled ?? [],
    pipelineStagesNotCalled: config.pipelineStagesNotCalled ?? [],
  };
}
