import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const dir = path.join(root, "artifacts", "validation", "assessment-estate");

function read<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")) as T;
}

type Inventory = { unclassified: number; surfaces: Array<{ route: string; currentStatus: string; sourceExists: boolean; apiExists: boolean }> };
type Blockade = { staleReadinessBlock: number; missingHandler: number; missingRoute: number; deadCta: number; falseDisable: number };
type Sensitivity = { counts: Record<string, number>; surfaces: Array<{ classification: string }> };

describe("assessment estate audit artifacts", () => {
  it("classifies every assessment surface and resolves missing route/handler defects", () => {
    const inventory = read<Inventory>("assessment-surface-inventory.json");
    expect(inventory.unclassified).toBe(0);
    expect(inventory.surfaces.length).toBeGreaterThanOrEqual(30);
    expect(inventory.surfaces.filter((s) => !s.sourceExists)).toEqual([]);
    expect(inventory.surfaces.filter((s) => !s.apiExists)).toEqual([]);
    expect(inventory.surfaces.filter((s) => !s.currentStatus)).toEqual([]);
  });

  it("keeps stale and false disabled-interaction classes at zero", () => {
    const blockade = read<Blockade>("interaction-blockade-audit.json");
    expect(blockade.staleReadinessBlock).toBe(0);
    expect(blockade.missingHandler).toBe(0);
    expect(blockade.missingRoute).toBe(0);
    expect(blockade.deadCta).toBe(0);
    expect(blockade.falseDisable).toBe(0);
  });

  it("does not leave interactive assessment engines unproven or static", () => {
    const sensitivity = read<Sensitivity>("input-sensitivity-audit.json");
    expect(sensitivity.counts.IGNORED_INPUT ?? 0).toBe(0);
    expect(sensitivity.counts.STATIC_RESULT ?? 0).toBe(0);
    expect(sensitivity.counts.UNPROVEN ?? 0).toBe(0);
  });
});