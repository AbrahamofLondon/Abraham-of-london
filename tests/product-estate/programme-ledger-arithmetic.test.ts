/**
 * tests/product-estate/programme-ledger-arithmetic.test.ts
 *
 * §1 — machine validation of the opportunity ledger + closure arithmetic. Fails if
 * there are not exactly 25 unique opportunity IDs, any status-less entry, or the
 * status tally does not sum to 25. Prevents aggregated-prose counting errors.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ledger = JSON.parse(readFileSync("artifacts/validation/product-intelligence/development-opportunity-ledger.json", "utf8"));
const closure = JSON.parse(readFileSync("artifacts/validation/product-intelligence/programme-closure.json", "utf8"));

describe("programme ledger arithmetic (§1)", () => {
  it("ledger has exactly 25 unique opportunity IDs, all dispositioned", () => {
    const ids = ledger.opportunities.map((o: any) => o.opportunityId);
    expect(ids).toHaveLength(25);
    expect(new Set(ids).size).toBe(25);
    expect(ledger.opportunities.every((o: any) => Boolean(o.disposition) && Boolean(o.reason))).toBe(true);
    expect(ledger.unreviewed).toBe(0);
  });

  it("closure has exactly 25 unique IDs matching the ledger, each with a status", () => {
    const cids = closure.opportunities.map((o: any) => o.id).sort();
    const lids = ledger.opportunities.map((o: any) => o.opportunityId).sort();
    expect(cids).toHaveLength(25);
    expect(new Set(cids).size).toBe(25);
    expect(cids).toEqual(lids); // exact same 25 IDs, no missing/extra
    expect(closure.opportunities.every((o: any) => Boolean(o.status))).toBe(true);
  });

  it("closure status tally sums exactly to 25", () => {
    const tally: Record<string, number> = {};
    for (const o of closure.opportunities) tally[o.status] = (tally[o.status] ?? 0) + 1;
    const sum = Object.values(tally).reduce((a, b) => a + b, 0);
    expect(sum).toBe(25);
  });

  it("every non-built opportunity carries an explicit dependency or evidence", () => {
    const builtish = new Set(["BUILT_AND_PROVEN", "GUARD_IN_PLACE", "RETIRE_OBSOLETE", "REJECT_DUPLICATIVE"]);
    for (const o of closure.opportunities) {
      if (!builtish.has(o.status)) {
        expect(Boolean(o.dependency), `${o.id} (${o.status}) must name a dependency`).toBe(true);
      }
    }
  });
});
