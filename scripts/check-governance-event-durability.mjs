/**
 * scripts/check-governance-event-durability.mjs
 *
 * Governance Event Durability Audit
 *
 * Checks:
 *   1. Emitted event not registered — RED
 *      Any eventType emitted via routeGovernanceEvent/emitGovernanceEvent that
 *      is not in GOVERNANCE_EVENT_TYPES.
 *   2. Registered event never emitted (unless reserved: true) — AMBER
 *      Events in the registry with no governance-bus emitter, not marked reserved.
 *   3. Reserved events correctly documented — GREEN
 *      Events marked reserved: true with a reservedReason are acceptable.
 *   4. Simulation event labeled real — RED
 *      eventType emission inside a dryRun conditional that uses a real (non-simulation)
 *      event name. After Phase 2 fixes the scheduler uses status:"dry_run" so this
 *      catches regressions.
 *   5. Competing governance event registries — RED
 *      More than one file exports GOVERNANCE_EVENT_TYPES or similar canonical
 *      event registry.
 *
 * Durability note:
 *   All events emitted through routeGovernanceEvent → emitGovernanceEvent go through
 *   lib/platform/governance-event-bus.ts, which performs durable writes to
 *   prisma.governanceLog (lineage) and auditLogger (audit). Durability at the bus
 *   level is therefore structurally guaranteed for all wired emitters. This script
 *   focuses on registry alignment and simulation truth, not individual DB write
 *   verification (which the bus handles and tests cover).
 *
 * Exits 1 if any RED findings. AMBER findings are reported but do not fail.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, "reports");

// ─── File helpers ─────────────────────────────────────────────────────────────

function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), "utf8"); } catch { return ""; }
}

function walk(dirRel) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const rel = path.join(dirRel, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const SURFACE_ROOTS = ["app", "pages", "lib", "components", "scripts"];

function allFiles() {
  return Array.from(new Set(SURFACE_ROOTS.flatMap(walk))).sort();
}

// ─── Registry loader ──────────────────────────────────────────────────────────

const REGISTRY_FILE = "lib/platform/governance-event-types.ts";

/**
 * Parse the GOVERNANCE_EVENT_TYPES array from source.
 * Each entry is: { eventType, reserved?, reservedReason?, writesAudit, writesLineage }
 */
function loadRegistry() {
  const src = read(REGISTRY_FILE);
  const entries = [];

  for (const match of src.matchAll(/\{[^}]*eventType:\s*["']([A-Z_]+)["'][^}]*\}/g)) {
    const block = match[0];
    const eventType = block.match(/eventType:\s*["']([A-Z_]+)["']/)?.[1];
    if (!eventType) continue;
    const reserved = /reserved:\s*true/.test(block);
    const reservedReason = block.match(/reservedReason:\s*["']([^"']+)["']/)?.[1] ?? null;
    const writesAudit = /writesAudit:\s*true/.test(block);
    const writesLineage = /writesLineage:\s*true/.test(block);
    const adminDomain = block.match(/adminDomain:\s*["']([^"']+)["']/)?.[1] ?? "unknown";
    entries.push({ eventType, reserved, reservedReason, writesAudit, writesLineage, adminDomain });
  }

  return entries;
}

// ─── Infrastructure files excluded from "emitter" scan ───────────────────────

// These files define eventType fields for purposes other than live governance bus emission:
// the registry itself, the bus (exports functions, not emitters), the product contract
// (type definitions), and the lineage chain definitions (simulation reference data).
const INFRASTRUCTURE_FILES = new Set([
  "lib/platform/governance-event-types.ts",
  "lib/platform/governance-event-bus.ts",
  "lib/platform/product-event-contract.ts",
  "lib/research/lineage/lineage-chain-definitions.ts",
]);

// ─── Emitter scanner ──────────────────────────────────────────────────────────

/**
 * Find all governance event emissions across the codebase.
 * Only files that import routeGovernanceEvent or emitGovernanceEvent are
 * considered emitters. The eventType: field is the standard governance bus param.
 */
function findEmissions(files) {
  const emissions = [];

  for (const file of files) {
    if (INFRASTRUCTURE_FILES.has(file)) continue;
    if (/\.test\.|\.spec\.|__tests__|\/tests\//.test(file)) continue;

    const src = read(file);

    // Only process files that actually call the governance bus
    if (!/routeGovernanceEvent|emitGovernanceEvent/.test(src)) continue;

    for (const match of src.matchAll(/eventType:\s*["']([A-Z_]+)["']/g)) {
      const eventType = match[1];
      const idx = match.index;

      // Check if this emission is inside a dryRun conditional block.
      const before = src.slice(Math.max(0, idx - 400), idx);
      const inDryRunContext = /if\s*\([^)]*dryRun/.test(before);

      // Check if the event name itself signals simulation
      const isSimulationEvent = /SIMULATED|DRY_RUN|PREVIEW|SAMPLE|FIXTURE|TEST/.test(eventType);

      emissions.push({ file, eventType, inDryRunContext, isSimulationEvent });
    }
  }

  return emissions;
}

// ─── Registry authority check ─────────────────────────────────────────────────

function findCompetingRegistries(files) {
  const competing = [];
  for (const file of files) {
    if (file === REGISTRY_FILE) continue;
    // Exclude audit/check scripts — they reference the registry name in comments/strings
    if (/scripts\/check-/.test(file)) continue;
    const src = read(file);
    if (/export\s+const\s+GOVERNANCE_EVENT_TYPES|export.*GovernanceEventRegistry|export.*EVENT_REGISTRY/.test(src)) {
      competing.push(file);
    }
  }
  return competing;
}

// ─── Report builders ──────────────────────────────────────────────────────────

function buildEmitterInventory(emissions, registryMap) {
  return emissions.map((e) => {
    const reg = registryMap.get(e.eventType);
    const registered = Boolean(reg);
    const isReserved = reg?.reserved ?? false;

    let risk = "GREEN";
    let recommendedFix = null;

    if (!registered) {
      risk = "RED";
      recommendedFix = `Add "${e.eventType}" to GOVERNANCE_EVENT_TYPES in ${REGISTRY_FILE}`;
    } else if (e.inDryRunContext && !e.isSimulationEvent) {
      risk = "RED";
      recommendedFix = `Event "${e.eventType}" is emitted inside a dryRun block but is not a simulation event. Use a simulation-namespaced event or add !dryRun guard.`;
    }

    return {
      file: e.file,
      eventType: e.eventType,
      registered,
      reserved: isReserved,
      durableWriteDetected: registered ? (reg.writesAudit || reg.writesLineage ? "confirmed_via_bus" : "none") : "unknown",
      simulationContext: e.inDryRunContext,
      simulationEvent: e.isSimulationEvent,
      riskLevel: risk,
      recommendedFix,
    };
  });
}

function buildRegistryInventory(registryEntries, emittedSet) {
  return registryEntries.map((entry) => {
    const emittedCount = emittedSet.get(entry.eventType) ?? 0;
    const hasEmitter = emittedCount > 0;
    const missingEmitterRisk = !hasEmitter && !entry.reserved ? "AMBER" : "GREEN";

    return {
      eventType: entry.eventType,
      adminDomain: entry.adminDomain,
      reserved: entry.reserved,
      reservedReason: entry.reservedReason,
      emittedCount,
      hasLiveEmitter: hasEmitter,
      durabilityExpectation: entry.writesAudit || entry.writesLineage ? "durable_required" : "none",
      realityClassification: entry.reserved ? "reserved" : "real",
      missingEmitterRisk,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runGovernanceEventAudit({ fail = true } = {}) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const files = allFiles();
  const registryEntries = loadRegistry();
  const registryMap = new Map(registryEntries.map((e) => [e.eventType, e]));

  const emissions = findEmissions(files);
  const emittedSet = new Map();
  for (const e of emissions) {
    emittedSet.set(e.eventType, (emittedSet.get(e.eventType) ?? 0) + 1);
  }

  const competingRegistries = findCompetingRegistries(files);

  const findings = [];

  // ── 1: Emitted events not in registry ─────────────────────────────────
  const uniqueEmitted = new Set(emissions.map((e) => e.eventType));
  for (const eventType of uniqueEmitted) {
    if (!registryMap.has(eventType)) {
      findings.push({
        severity: "RED",
        code: "EMITTED_EVENT_NOT_REGISTERED",
        message: `"${eventType}" is emitted via governance bus but not registered in GOVERNANCE_EVENT_TYPES`,
        eventType,
        files: emissions.filter((e) => e.eventType === eventType).map((e) => e.file),
        recommendedFix: `Add "${eventType}" to GOVERNANCE_EVENT_TYPES in ${REGISTRY_FILE}`,
      });
    }
  }

  // ── 2: Simulation mislabeling ──────────────────────────────────────────
  for (const e of emissions) {
    if (e.inDryRunContext && !e.isSimulationEvent) {
      findings.push({
        severity: "RED",
        code: "REAL_EVENT_IN_DRY_RUN_CONTEXT",
        message: `"${e.eventType}" is a real-classified event emitted inside a dryRun conditional in ${e.file}`,
        eventType: e.eventType,
        file: e.file,
        recommendedFix: `Use a simulation-namespaced event type or gate the emission with if (!dryRun)`,
      });
    }
  }

  // ── 3: Registered not emitted (unless reserved) ────────────────────────
  for (const entry of registryEntries) {
    if (!emittedSet.has(entry.eventType) && !entry.reserved) {
      findings.push({
        severity: "AMBER",
        code: "REGISTERED_EVENT_NOT_EMITTED",
        message: `"${entry.eventType}" is registered but has no governance-bus emitter and is not marked reserved`,
        eventType: entry.eventType,
        adminDomain: entry.adminDomain,
        recommendedFix: `Either add a routeGovernanceEvent emitter, or mark as reserved: true with reservedReason in ${REGISTRY_FILE}`,
      });
    }
  }

  // ── 4: Competing registries ────────────────────────────────────────────
  for (const file of competingRegistries) {
    findings.push({
      severity: "RED",
      code: "COMPETING_GOVERNANCE_REGISTRY",
      message: `${file} exports a competing governance event registry alongside the canonical ${REGISTRY_FILE}`,
      file,
      recommendedFix: `Remove the competing registry and consolidate into ${REGISTRY_FILE}`,
    });
  }

  // ── Build reports ──────────────────────────────────────────────────────
  const emitterInventory = buildEmitterInventory(emissions, registryMap);
  const registryInventory = buildRegistryInventory(registryEntries, emittedSet);

  const red = findings.filter((f) => f.severity === "RED").length;
  const amber = findings.filter((f) => f.severity === "AMBER").length;
  const reservedCount = registryEntries.filter((e) => e.reserved).length;
  const activeCount = registryEntries.filter((e) => !e.reserved && emittedSet.has(e.eventType)).length;

  const summary = {
    registeredEvents: registryEntries.length,
    activeEmitters: uniqueEmitted.size,
    reservedEvents: reservedCount,
    activeRegisteredEvents: activeCount,
    red,
    amber,
    green: activeCount + reservedCount,
  };

  fs.writeFileSync(
    path.join(REPORTS_DIR, "governance-event-emitter-inventory.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, emitters: emitterInventory }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, "governance-event-registry-inventory.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, registry: registryInventory }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(REPORTS_DIR, "governance-event-durability.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, findings }, null, 2)}\n`,
  );

  console.log(`[governance-events] RED: ${red}`);
  console.log(`[governance-events] AMBER: ${amber}`);
  console.log(`[governance-events] GREEN: ${summary.green} (active: ${activeCount}, reserved: ${reservedCount})`);

  if (fail && red > 0) process.exitCode = 1;
  return { findings, summary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runGovernanceEventAudit();
}
