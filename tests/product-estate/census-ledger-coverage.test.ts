/**
 * tests/product-estate/census-ledger-coverage.test.ts
 *
 * §3 completeness guard: every ACTIONABLE capability-census finding must map to
 * at least one ledger opportunity with a disposition. Fails if any actionable
 * finding is unmapped, or a mapped opportunityId does not exist, or an OBSOLETE
 * finding is not routed to a RETIRE disposition. This is the mechanical guarantee
 * that no development opportunity is silently dropped.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const census = JSON.parse(readFileSync("artifacts/validation/product-intelligence/capability-census.json", "utf8"));
const ledger = JSON.parse(readFileSync("artifacts/validation/product-intelligence/development-opportunity-ledger.json", "utf8"));

const ACTIONABLE = new Set([
  "BUILT_BUT_UNWIRED", "PARTIALLY_WIRED", "MISSING_CONNECTIVE_ADAPTER", "MISSING_READ_MODEL",
  "MISSING_OUTCOME_LOOP", "COMMERCIALISATION_OPPORTUNITY", "GOVERNANCE_GAP",
  "PERFORMANCE_OR_SCALE_RISK", "DUPLICATED_CAPABILITY", "OBSOLETE_OR_SUPERSEDED",
]);

// Directory-prefix → covering ledger opportunityIds. Most specific first. No blind
// catch-all: an actionable module outside these prefixes MUST fail the guard.
const COVER: { prefix: string; opps: string[] }[] = [
  { prefix: "lib/intelligence/decision-intelligence-orchestrator", opps: ["OPP-19"] },
  { prefix: "lib/intelligence/decision-intelligence-kernel", opps: ["OPP-19"] },
  { prefix: "lib/intelligence/decision-intelligence-delta", opps: ["OPP-19"] },
  { prefix: "lib/intelligence/market-intelligence-call-ledger", opps: ["OPP-21"] },
  { prefix: "lib/intelligence/gmi-control-plane", opps: ["OPP-21"] },
  { prefix: "lib/intelligence/", opps: ["OPP-11", "OPP-19"] },
  { prefix: "lib/product-moat/governed-product-memory", opps: ["OPP-01", "OPP-02", "OPP-03"] },
  { prefix: "lib/product-moat/governed-strategic-twin", opps: ["OPP-01", "OPP-03"] },
  { prefix: "lib/product-moat/governed-intervention-calibration", opps: ["OPP-13"] },
  { prefix: "lib/product-moat/", opps: ["OPP-01", "OPP-13"] },
  { prefix: "lib/strategic-twin/strategic-twin-simulation", opps: ["OPP-18"] },
  { prefix: "lib/strategic-twin/product-twin-adapter", opps: ["OPP-22"] },
  { prefix: "lib/strategic-twin/", opps: ["OPP-01"] },
  { prefix: "lib/server/decision-memory", opps: ["OPP-02"] },
  { prefix: "lib/decision-memory/", opps: ["OPP-01", "OPP-02"] },
  { prefix: "lib/product/product-knowledge-graph", opps: ["OPP-13", "OPP-23"] },
  { prefix: "lib/product/paid-corridor-contract", opps: ["OPP-13"] },
  { prefix: "lib/product/decision-centre", opps: ["OPP-14", "OPP-22"] },
  { prefix: "lib/product/living-intelligence-spine", opps: ["OPP-20"] },
  { prefix: "lib/product/instrument-signal-authority", opps: ["OPP-06"] },
  { prefix: "lib/product/signal-authority", opps: ["OPP-06"] },
  { prefix: "lib/product/", opps: ["OPP-13", "OPP-14"] },
  { prefix: "lib/living-intelligence/", opps: ["OPP-14", "OPP-20", "OPP-22"] },
  { prefix: "lib/intervention/", opps: ["OPP-13"] },
  { prefix: "lib/fulfilment/reporting/", opps: ["OPP-09", "OPP-10"] },
  { prefix: "lib/fulfilment/", opps: ["OPP-15"] },
];

function cover(path: string): string[] | null {
  for (const c of COVER) if (path.startsWith(c.prefix)) return c.opps;
  return null;
}

const oppIds = new Set<string>(ledger.opportunities.map((o: any) => o.opportunityId));
const oppById = new Map<string, any>(ledger.opportunities.map((o: any) => [o.opportunityId, o]));
const actionable = (census.modules as any[]).filter((m) => ACTIONABLE.has(m.classification));

describe("census → ledger coverage guard (§3)", () => {
  it("every actionable census finding maps to at least one ledger opportunity", () => {
    const unmapped = actionable.filter((m) => cover(m.path) === null).map((m) => `${m.classification}::${m.path}`);
    expect(unmapped, `unmapped actionable findings: ${unmapped.join(", ")}`).toEqual([]);
  });

  it("every mapped opportunityId exists in the ledger", () => {
    const missing: string[] = [];
    for (const m of actionable) for (const id of cover(m.path) ?? []) if (!oppIds.has(id)) missing.push(`${m.path}->${id}`);
    expect(missing).toEqual([]);
  });

  it("OBSOLETE_OR_SUPERSEDED findings route to a RETIRE_OBSOLETE disposition", () => {
    for (const m of actionable.filter((x) => x.classification === "OBSOLETE_OR_SUPERSEDED")) {
      const opps = (cover(m.path) ?? []).map((id) => oppById.get(id));
      expect(opps.some((o) => o?.disposition === "RETIRE_OBSOLETE"), `${m.path} must map to a RETIRE_OBSOLETE opp`).toBe(true);
    }
  });

  it("DUPLICATED_CAPABILITY findings route to a converge/reject/retire disposition (canonical chosen)", () => {
    const RESOLVING = new Set(["REJECT_DUPLICATIVE", "RETIRE_OBSOLETE", "BUILD_NOW", "BUILD_AFTER_FOUNDATION"]);
    for (const m of actionable.filter((x) => x.classification === "DUPLICATED_CAPABILITY")) {
      const opps = (cover(m.path) ?? []).map((id) => oppById.get(id));
      expect(opps.some((o) => RESOLVING.has(o?.disposition)), `${m.path} duplication must be dispositioned`).toBe(true);
    }
  });

  it("ledger itself declares unreviewed = 0", () => {
    expect(ledger.unreviewed).toBe(0);
    const reviewed = ledger.opportunities.every((o: any) => Boolean(o.disposition) && Boolean(o.reason));
    expect(reviewed).toBe(true);
  });
});
