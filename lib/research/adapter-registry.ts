/**
 * Canonical Foundry adapter registry.
 *
 * Engines are product logic. Modules are admin/Foundry surfaces. Adapters are
 * the callable bridge that lets resilience ranges exercise an engine safely.
 */

export type AdapterRegistryEntry = {
  id: string;
  engineId: string;
  selfTest: "registered";
};

export const ADAPTER_REGISTRY: AdapterRegistryEntry[] = [
  { id: "fast-diagnostic", engineId: "fast-diagnostic", selfTest: "registered" },
  { id: "pattern-recurrence", engineId: "pattern-recurrence", selfTest: "registered" },
  { id: "constitutional-diagnostic", engineId: "constitutional-diagnostic", selfTest: "registered" },
  { id: "strategy-room", engineId: "strategy-room", selfTest: "registered" },
  { id: "boardroom-dossier", engineId: "boardroom-dossier", selfTest: "registered" },
  { id: "executive-reporting", engineId: "executive-reporting", selfTest: "registered" },
  {
    id: "executive-report-boardroom-bridge",
    engineId: "executive-report-boardroom-bridge",
    selfTest: "registered",
  },
  { id: "cost-of-delay", engineId: "cost-of-delay", selfTest: "registered" },
  { id: "cohort-privacy", engineId: "cohort-privacy", selfTest: "registered" },
  { id: "editorial-style-checker", engineId: "editorial-style-checker", selfTest: "registered" },
  { id: "enforcement-gates", engineId: "enforcement-gates", selfTest: "registered" },
  { id: "outbound-policy-gate", engineId: "outbound-policy-gate", selfTest: "registered" },
  { id: "report-lineage", engineId: "report-lineage", selfTest: "registered" },
];

export const REGISTERED_ADAPTER_IDS = new Set(ADAPTER_REGISTRY.map((adapter) => adapter.id));

export function getAdapter(id: string): AdapterRegistryEntry | undefined {
  return ADAPTER_REGISTRY.find((adapter) => adapter.id === id);
}

export function getAdapterByEngine(engineId: string): AdapterRegistryEntry | undefined {
  return ADAPTER_REGISTRY.find((adapter) => adapter.engineId === engineId);
}
