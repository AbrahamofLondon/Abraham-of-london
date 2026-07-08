/**
 * tests/database/migration-history.test.ts
 *
 * §9 — migration-history validator (permanent regression gate). Detects the class of
 * defect that caused P3018: a migration FK-references a table that no EARLIER migration
 * creates. It also pins the known untracked-baseline debt so it cannot grow while the
 * baseline reconciliation is pending (see database-migration-reconciliation.md).
 *
 * This is a static analysis over prisma/migrations — no database required.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = join(process.cwd(), "prisma", "migrations");

/** ordered migration directory names (timestamp-sorted). */
function migrations(): string[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function sql(name: string): string {
  try { return readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"); }
  catch { return ""; }
}

const CREATE_RE = /CREATE TABLE (?:IF NOT EXISTS )?"([A-Za-z0-9_]+)"/g;
const REF_RE = /REFERENCES "([A-Za-z0-9_]+)"/g;
function matches(re: RegExp, text: string): string[] {
  const out: string[] = []; let m: RegExpExecArray | null;
  const r = new RegExp(re.source, "g");
  while ((m = r.exec(text)) !== null) out.push(m[1]!);
  return out;
}

/** Tables FK-referenced by a migration before any migration (incl. itself) creates them. */
function referencedBeforeCreated(): string[] {
  const created = new Set<string>();
  const offenders = new Set<string>();
  for (const name of migrations()) {
    const text = sql(name);
    const createsHere = new Set(matches(CREATE_RE, text));
    for (const ref of matches(REF_RE, text)) {
      if (!created.has(ref) && !createsHere.has(ref)) offenders.add(ref);
    }
    for (const c of createsHere) created.add(c);
  }
  return [...offenders].sort();
}

// Known, documented offenders — pending the baseline migration reconciliation
// (database-migration-reconciliation.md). This gate must not let the set GROW.
//   • baseline gap (never created by any migration — db-push baseline):
const KNOWN_BASELINE_FK_GAP = ["DiagnosticJourney", "Organisation", "research_runs"];
//   • ordering defect (created by a migration, but FK-referenced by an EARLIER one):
const KNOWN_ORDERING_DEFECT = ["RetainedDecision"];
const KNOWN_OFFENDERS = [...KNOWN_BASELINE_FK_GAP, ...KNOWN_ORDERING_DEFECT].sort();

describe("§9 migration-history validator", () => {
  it("no NEW migration FK-references a table not created by an earlier migration", () => {
    const offenders = referencedBeforeCreated();
    const unexpected = offenders.filter((t) => !KNOWN_OFFENDERS.includes(t));
    expect(unexpected, `new referenced-before-created tables: ${unexpected.join(", ")}`).toEqual([]);
  });

  it("the known offender set has not changed (reconciliation still pending)", () => {
    // exact match — when the baseline/ordering migration fixes these, shrink these lists.
    expect(referencedBeforeCreated()).toEqual(KNOWN_OFFENDERS);
  });

  it("reordering the dependency would be caught (self-check on the detector)", () => {
    // synthetic: a table referenced with no creator anywhere is an offender.
    const created = new Set<string>();
    const text = 'FOREIGN KEY ("x") REFERENCES "NeverCreated"("id")';
    const createsHere = new Set(matches(CREATE_RE, text));
    const offenders = matches(REF_RE, text).filter((r) => !created.has(r) && !createsHere.has(r));
    expect(offenders).toContain("NeverCreated");
  });
});
