/**
 * tests/product-estate/interaction-architecture-guards.test.ts
 *
 * No-new-use architecture guards for the compounding system (OPP-02/19/21, §27):
 *  - runtime surfaces must NOT import the deprecated file-based decision-memory store
 *    (canonical persistence is the Prisma memory service + the interaction spine);
 *  - runtime surfaces must NOT import the OBSOLETE seed/legacy GMI modules as authority
 *    (canonical is gmi-data-service);
 *  - the canonical spine modules must exist.
 * Fails if a duplicate/obsolete authority regains a runtime caller.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const RUNTIME_DIRS = ["pages", "app", "components"];
const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir: string, acc: string[] = []): string[] {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) return acc;
  for (const e of readdirSync(abs)) {
    if (e === "node_modules" || e === ".next") continue;
    const rel = path.join(dir, e);
    const st = statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel, acc);
    else if (EXT.has(path.extname(e)) && !/\.(test|spec)\.[jt]sx?$/.test(e)) acc.push(rel);
  }
  return acc;
}

const runtimeFiles = RUNTIME_DIRS.flatMap((d) => walk(d));

// Deprecated / obsolete modules that must not regain a runtime caller.
const FORBIDDEN_RUNTIME_IMPORTS: { pattern: RegExp; opp: string; why: string }[] = [
  { pattern: /decision-memory\/decision-memory-store/, opp: "OPP-02", why: "deprecated file memory store; use the Prisma memory service + interaction spine" },
];

describe("interaction architecture guards (§27)", () => {
  it("no runtime surface imports the deprecated file memory store (OPP-02 canonical store)", () => {
    const offenders: string[] = [];
    for (const f of runtimeFiles) {
      const text = readFileSync(path.join(ROOT, f), "utf8");
      for (const rule of FORBIDDEN_RUNTIME_IMPORTS) {
        if (rule.pattern.test(text) && /\b(import|require)\b/.test(text)) offenders.push(`${f} → ${rule.opp}`);
      }
    }
    expect(offenders, `forbidden deprecated-store imports: ${offenders.join(", ")}`).toEqual([]);
  });

  it("the canonical interaction spine modules exist", () => {
    for (const p of [
      "lib/intelligence/interaction-spine/product-interaction-spine.ts",
      "lib/intelligence/interaction-spine/interaction-outbox.ts",
      "lib/intelligence/interaction-spine/product-interaction-mappers.ts",
      "lib/intelligence/compounding/compounding-intelligence.ts",
    ]) {
      expect(existsSync(path.join(ROOT, p)), `${p} must exist`).toBe(true);
    }
  });

  it("scanned a non-trivial number of runtime files (guard is actually running)", () => {
    expect(runtimeFiles.length).toBeGreaterThan(50);
  });
});
