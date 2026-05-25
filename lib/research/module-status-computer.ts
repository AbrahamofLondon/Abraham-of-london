/**
 * lib/research/module-status-computer.ts
 *
 * Computes the authoritative module status from real criteria.
 * A module CANNOT self-declare WIRED — this computer determines truth.
 *
 * Rules:
 *   WIRED    = route file exists on disk AND engine is PRODUCTION_CALLABLE
 *   PARTIAL  = route file exists but engine is NOT PRODUCTION_CALLABLE
 *   PLANNED  = no route file on disk AND engine is not callable
 *   ADAPTER_NEEDED = route exists but engine needs wrapping
 *   DEMO / DECOMMISSIONED / DEPRECATED = pass through (can't be overridden)
 */

import fs from "fs";
import path from "path";
import type { ModuleStatus } from "./foundry-contract";
import type { ModuleRegistryEntry } from "./module-registry";
import { ENGINE_REGISTRY } from "./engine-registry";

export type ModuleStatusReport = {
  moduleId: string;
  declaredStatus: ModuleStatus;
  computedStatus: ModuleStatus;
  routeExists: boolean;
  engineCallable: boolean;
  reason: string;
};

function routeExistsOnDisk(route: string): boolean {
  const appDir = path.join(process.cwd(), "app");
  const normalized = route.replace(/^\//, "");
  const candidates = [
    path.join(appDir, normalized, "page.tsx"),
    path.join(appDir, normalized, "page.ts"),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

function engineIsCallable(engineId: string | undefined): boolean {
  if (!engineId) return false;
  const engine = ENGINE_REGISTRY.find((e) => e.id === engineId);
  return engine?.status === "PRODUCTION_CALLABLE";
}

function engineNeedsWrap(engineId: string | undefined): boolean {
  if (!engineId) return false;
  const engine = ENGINE_REGISTRY.find((e) => e.id === engineId);
  return engine?.status === "PRODUCTION_NEEDS_WRAP";
}

export function computeModuleStatus(entry: ModuleRegistryEntry): ModuleStatusReport {
  const { id, status: declared, route, engineId } = entry;

  // Pass-through statuses: not overridable by real-logic computation.
  const passThrough: ModuleStatus[] = ["DEMO", "DECOMMISSIONED", "DEPRECATED"];
  if (passThrough.includes(declared)) {
    return {
      moduleId: id,
      declaredStatus: declared,
      computedStatus: declared,
      routeExists: false,
      engineCallable: false,
      reason: `${declared} is a fixed status — not subject to real-logic override`,
    };
  }

  const routeExists = routeExistsOnDisk(route);
  const callable = engineIsCallable(engineId);
  const needsWrap = engineNeedsWrap(engineId);

  let computedStatus: ModuleStatus;
  let reason: string;

  if (routeExists && callable) {
    computedStatus = "WIRED";
    reason = "Route file exists and engine is PRODUCTION_CALLABLE";
  } else if (routeExists && needsWrap) {
    computedStatus = "ADAPTER_NEEDED";
    reason = "Route file exists but engine requires a Foundry adapter (PRODUCTION_NEEDS_WRAP)";
  } else if (routeExists && !engineId) {
    computedStatus = "PARTIAL";
    reason = "Route file exists but no engine is registered for this module";
  } else if (routeExists && !callable && !needsWrap) {
    computedStatus = "PARTIAL";
    reason = "Route file exists but engine is not callable";
  } else {
    computedStatus = "PLANNED";
    reason = "No route file found on disk";
  }

  return {
    moduleId: id,
    declaredStatus: declared,
    computedStatus,
    routeExists,
    engineCallable: callable,
    reason,
  };
}

export function computeAllModuleStatuses(
  registry: ModuleRegistryEntry[],
): ModuleStatusReport[] {
  return registry.map(computeModuleStatus);
}
