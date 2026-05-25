/**
 * lib/research/registry-sanity-check.ts
 *
 * Module registry sanity check for the Intelligence Foundry.
 * Verifies that all PRODUCTION_CALLABLE engines in the registry have
 * a corresponding adapter registered in the chaos/data-poisoning routes.
 *
 * Run at build time or as part of the admin health check.
 * Never throws — returns a structured report.
 */

import { ENGINE_REGISTRY } from "./engine-registry";

// ─── The canonical set of adapter IDs registered in chaos/data-poisoning ─────
// Keep this in sync with the ADAPTERS maps in:
//   app/api/admin/intelligence-foundry/chaos/run/route.ts
//   app/api/admin/intelligence-foundry/data-poisoning/run/route.ts

export const REGISTERED_ADAPTER_IDS = new Set([
  "fast-diagnostic",
  "pattern-recurrence",
  "constitutional-diagnostic",
  "strategy-room",
  "boardroom-dossier",
  "executive-reporting",
  "executive-report-boardroom-bridge",
  "cost-of-delay",
  "cohort-privacy",
  "editorial-style-checker",
  "enforcement-gates",
  "outbound-policy-gate",
  "report-lineage",
]);

// ─── Types ────────────────────────────────────────────────────────────────────

export type RegistrySanityResult = {
  ok: boolean;
  productionCallableCount: number;
  registeredAdapterCount: number;
  missingAdapters: string[];   // PRODUCTION_CALLABLE in registry, no adapter registered
  orphanAdapters: string[];    // Adapter registered but not in registry as PRODUCTION_CALLABLE
  summary: string;
};

// ─── Check ────────────────────────────────────────────────────────────────────

export function checkRegistrySanity(): RegistrySanityResult {
  const productionCallable = ENGINE_REGISTRY.filter(
    (e) => e.status === "PRODUCTION_CALLABLE",
  ).map((e) => e.id);

  const productionCallableSet = new Set(productionCallable);

  const missingAdapters = productionCallable.filter(
    (id) => !REGISTERED_ADAPTER_IDS.has(id),
  );

  const orphanAdapters = [...REGISTERED_ADAPTER_IDS].filter(
    (id) => !productionCallableSet.has(id),
  );

  const ok = missingAdapters.length === 0;

  const summary = ok
    ? `Registry sanity OK — ${REGISTERED_ADAPTER_IDS.size} adapters cover all ${productionCallable.length} PRODUCTION_CALLABLE engines.`
    : `Registry gap: ${missingAdapters.length} PRODUCTION_CALLABLE engine(s) have no chaos/data-poisoning adapter: ${missingAdapters.join(", ")}.`;

  return {
    ok,
    productionCallableCount: productionCallable.length,
    registeredAdapterCount: REGISTERED_ADAPTER_IDS.size,
    missingAdapters,
    orphanAdapters,
    summary,
  };
}
