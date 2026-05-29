/**
 * scripts/check-governance-event-durability.mjs
 *
 * Governance Event Durability Audit
 *
 * Uses the 5-stage event maturity model:
 *   RESERVED_CONCEPT → SIMULATION_ONLY → PILOT_READY → LIVE_GOVERNED → RETIRED
 *
 * Checks:
 *   1. Emitted event not registered — RED
 *      Any eventType emitted via routeGovernanceEvent/emitGovernanceEvent that
 *      is not in GOVERNANCE_EVENT_TYPES.
 *   2. Registered event never emitted (unless RESERVED_CONCEPT or SIMULATION_ONLY) — AMBER
 *      Events in the registry with no governance-bus emitter, not in pipeline stages
 *      where that's expected.
 *   3. LIVE_GOVERNED event without emitter — RED
 *      Events claiming LIVE_GOVERNED maturity must have a governance-bus emitter.
 *   4. Simulation event labeled real — RED
 *      eventType emission inside a dryRun conditional that uses a real (non-simulation)
 *      event name.
 *   5. Competing governance event registries — RED
 *      More than one file exports GOVERNANCE_EVENT_TYPES or similar canonical
 *      event registry.
 *   6. RETIRED events still emitting — AMBER
 *      Events marked RETIRED should not have active emitters.
 *
 * Rules:
 *   - Only LIVE_GOVERNED counts as GREEN for Product Health.
 *   - RESERVED_CONCEPT, SIMULATION_ONLY, and PILOT_READY must never make
 *     dashboards green — they are governance vocabulary waiting for proof.
 *   - RETIRED should be rare and requires justification.
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

// ─── Maturity helpers ─────────────────────────────────────────────────────────

const MATURITY_ORDER = {
  RESERVED_CONCEPT: 0,
  SIMULATION_ONLY: 1,
  PILOT_READY: 2,
  LIVE_GOVERNED: 3,
  RETIRED: 4,
};

/**
 * Parse maturity from a registry entry block.
 * Falls back to RESERVED_CONCEPT if reserved: true is set (backward compat).
 */
function parseMaturity(block) {
  const m = block.match(/maturity:\s*["']([A-Z_]+)["']/);
  if (m) return m[1];
  if (/reserved:\s*true/.test(block)) return "RESERVED_CONCEPT";
  return "LIVE_GOVERNED"; // default for legacy entries without maturity
}

function parseCurrentReality(block) {
  const r = block.match(/currentReality:\s*["']([a-z_]+)["']/);
  if (r) return r[1];
  const maturity = parseMaturity(block);
  if (maturity === "LIVE_GOVERNED") return "real";
  if (maturity === "SIMULATION_ONLY") return "simulation";
  if (maturity === "PILOT_READY") return "dry_run";
  return "reserved";
}

function parseAffectsProductHealth(block) {
  const m = block.match(/affectsProductHealth:\s*(true|false)/);
  if (m) return m[1] === "true";
  return parseMaturity(block) === "LIVE_GOVERNED";
}

function parseAppearsInDashboards(block) {
  const m = block.match(/appearsInDashboards:\s*(true|false)/);
  if (m) return m[1] === "true";
  const maturity = parseMaturity(block);
  return maturity !== "RESERVED_CONCEPT" && maturity !== "RETIRED";
}

// ─── Registry loader ──────────────────────────────────────────────────────────

const REGISTRY_FILE = "lib/platform/governance-event-types.ts";

/**
 * Parse the GOVERNANCE_EVENT_TYPES array from source.
 * Each entry now includes maturity, currentReality, affectsProductHealth, etc.
 */
function loadRegistry() {
  const src = read(REGISTRY_FILE);
  const entries = [];

  for (const match of src.matchAll(/\{[^}]*eventType:\s*["']([A-Z_]+)["'][^}]*\}/g)) {
    const block = match[0];
    const eventType = block.match(/eventType:\s*["']([A-Z_]+)["']/)?.[1];
    if (!eventType) continue;

    const maturity = parseMaturity(block);
    const currentReality = parseCurrentReality(block);
    const affectsProductHealth = parseAffectsProductHealth(block);
    const appearsInDashboards = parseAppearsInDashboards(block);
    const reserved = /reserved:\s*true/.test(block);
    const reservedReason = block.match(/reservedReason:\s*["']([^"']+)["']/)?.[1] ?? null;
    const writesAudit = /writesAudit:\s*true/.test(block);
    const writesLineage = /writesLineage:\s*true/.test(block);
    const adminDomain = block.match(/adminDomain:\s*["']([^"']+)["']/)?.[1] ?? "unknown";
    const targetMaturity = block.match(/targetMaturity:\s*["']([A-Z_]+)["']/)?.[1] ?? null;
    // Extract promotionCriteria and blockingGaps arrays
    const pcMatch = block.match(/promotionCriteria:\s*\[([^\]]*)\]/);
    const promotionCriteria = pcMatch ? [...pcMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) : [];
    const bgMatch = block.match(/blockingGaps:\s*\[([^\]]*)\]/);
    const blockingGaps = bgMatch ? [...bgMatch[1].matchAll(/["']([^"']+)["']/g)].map((m) => m[1]) : [];

    entries.push({
      eventType,
      maturity,
      currentReality,
      affectsProductHealth,
      appearsInDashboards,
      reserved,
      reservedReason,
      writesAudit,
      writesLineage,
      adminDomain,
      targetMaturity,
      promotionCriteria,
      blockingGaps,
    });
  }

  return entries;
}

// ─── Infrastructure files excluded from "emitter" scan ───────────────────────

const INFRASTRUCTURE_FILES = new Set([
  "lib/platform/governance-event-types.ts",
  "lib/platform/governance-event-bus.ts",
  "lib/platform/product-event-contract.ts",
  "lib/research/lineage/lineage-chain-definitions.ts",
]);

// ─── Emitter scanner ──────────────────────────────────────────────────────────

function findEmissions(files) {
  const emissions = [];

  for (const file of files) {
    if (INFRASTRUCTURE_FILES.has(file)) continue;
    if (/\.test\.|\.spec\.|__tests__|\/tests\//.test(file)) continue;

    const src = read(file);

    if (!/routeGovernanceEvent|emitGovernanceEvent/.test(src)) continue;

    for (const match of src.matchAll(/eventType:\s*["']([A-Z_]+)["']/g)) {
      const eventType = match[1];
      const idx = match.index;
      const before = src.slice(Math.max(0, idx - 400), idx);
      const inDryRunContext = /if\s*\([^)]*dryRun/.test(before);
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
    const maturity = reg?.maturity ?? "unknown";
    const isReserved = reg?.reserved ?? false;

    let risk = "GREEN";
    let recommendedFix = null;

    if (!registered) {
      risk = "RED";
      recommendedFix = `Add "${e.eventType}" to GOVERNANCE_EVENT_TYPES in ${REGISTRY_FILE}`;
    } else if (e.inDryRunContext && !e.isSimulationEvent) {
      risk = "RED";
      recommendedFix = `Event "${e.eventType}" is emitted inside a dryRun block but is not a simulation event. Use a simulation-namespaced event or add !dryRun guard.`;
    } else if (reg && maturity === "RETIRED") {
      risk = "AMBER";
      recommendedFix = `Event "${e.eventType}" is RETIRED but still has active emitters. Remove emitter or update maturity.`;
    }

    return {
      file: e.file,
      eventType: e.eventType,
      registered,
      maturity,
      reserved: isReserved,
      affectsProductHealth: reg?.affectsProductHealth ?? false,
      appearsInDashboards: reg?.appearsInDashboards ?? true,
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

    // Determine risk based on maturity model
    let missingEmitterRisk;
    if (hasEmitter) {
      missingEmitterRisk = "GREEN";
    } else if (entry.maturity === "RESERVED_CONCEPT" || entry.maturity === "SIMULATION_ONLY") {
      // Expected: these stages don't require live emitters
      missingEmitterRisk = "RESERVED";
    } else if (entry.maturity === "LIVE_GOVERNED") {
      // RED: LIVE_GOVERNED must have an emitter
      missingEmitterRisk = "RED";
    } else if (entry.maturity === "RETIRED") {
      // RETIRED without emitter is fine
      missingEmitterRisk = "RETIRED";
    } else {
      // PILOT_READY without emitter is AMBER (should be working toward it)
      missingEmitterRisk = "AMBER";
    }

    return {
      eventType: entry.eventType,
      adminDomain: entry.adminDomain,
      maturity: entry.maturity,
      currentReality: entry.currentReality,
      targetMaturity: entry.targetMaturity,
      affectsProductHealth: entry.affectsProductHealth,
      appearsInDashboards: entry.appearsInDashboards,
      promotionCriteria: entry.promotionCriteria,
      blockingGaps: entry.blockingGaps,
      reserved: entry.reserved,
      emittedCount,
      hasLiveEmitter: hasEmitter,
      durabilityExpectation: entry.writesAudit || entry.writesLineage ? "durable_required" : "none",
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

  // ── 3: LIVE_GOVERNED without emitter ───────────────────────────────────
  for (const entry of registryEntries) {
    if (entry.maturity === "LIVE_GOVERNED" && !emittedSet.has(entry.eventType)) {
      findings.push({
        severity: "RED",
        code: "LIVE_GOVERNED_NO_EMITTER",
        message: `"${entry.eventType}" is LIVE_GOVERNED but has no governance-bus emitter`,
        eventType: entry.eventType,
        adminDomain: entry.adminDomain,
        recommendedFix: `Add a routeGovernanceEvent emitter for "${entry.eventType}" or downgrade maturity to PILOT_READY/RESERVED_CONCEPT`,
      });
    }
  }

  // ── 4: PILOT_READY without emitter ─────────────────────────────────────
  for (const entry of registryEntries) {
    if (entry.maturity === "PILOT_READY" && !emittedSet.has(entry.eventType)) {
      findings.push({
        severity: "AMBER",
        code: "PILOT_READY_NO_EMITTER",
        message: `"${entry.eventType}" is PILOT_READY but has no governance-bus emitter yet`,
        eventType: entry.eventType,
        adminDomain: entry.adminDomain,
        promotionCriteria: entry.promotionCriteria,
        blockingGaps: entry.blockingGaps,
        recommendedFix: `Add a routeGovernanceEvent emitter or downgrade maturity to RESERVED_CONCEPT`,
      });
    }
  }

  // ── 5: RETIRED events still emitting ───────────────────────────────────
  for (const entry of registryEntries) {
    if (entry.maturity === "RETIRED" && emittedSet.has(entry.eventType)) {
      findings.push({
        severity: "AMBER",
        code: "RETIRED_STILL_EMITTING",
        message: `"${entry.eventType}" is RETIRED but still has active emitters`,
        eventType: entry.eventType,
        adminDomain: entry.adminDomain,
        recommendedFix: `Remove emitters for "${entry.eventType}" or update maturity if still needed`,
      });
    }
  }

  // ── 6: Competing registries ────────────────────────────────────────────
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

  // Count by maturity stage
  const reservedConceptCount = registryEntries.filter((e) => e.maturity === "RESERVED_CONCEPT").length;
  const simulationOnlyCount = registryEntries.filter((e) => e.maturity === "SIMULATION_ONLY").length;
  const pilotReadyCount = registryEntries.filter((e) => e.maturity === "PILOT_READY").length;
  const liveGovernedCount = registryEntries.filter((e) => e.maturity === "LIVE_GOVERNED").length;
  const retiredCount = registryEntries.filter((e) => e.maturity === "RETIRED").length;

  // Only LIVE_GOVERNED counts as GREEN
  const greenCount = liveGovernedCount;

  const summary = {
    registeredEvents: registryEntries.length,
    activeEmitters: uniqueEmitted.size,
    maturityBreakdown: {
      RESERVED_CONCEPT: reservedConceptCount,
      SIMULATION_ONLY: simulationOnlyCount,
      PILOT_READY: pilotReadyCount,
      LIVE_GOVERNED: liveGovernedCount,
      RETIRED: retiredCount,
    },
    red,
    amber,
    green: greenCount,
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
  console.log(`[governance-events] GREEN (LIVE_GOVERNED): ${liveGovernedCount}`);
  console.log(`[governance-events] Pipeline: RESERVED_CONCEPT=${reservedConceptCount} SIMULATION_ONLY=${simulationOnlyCount} PILOT_READY=${pilotReadyCount} RETIRED=${retiredCount}`);

  if (fail && red > 0) process.exitCode = 1;
  return { findings, summary };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runGovernanceEventAudit();
}