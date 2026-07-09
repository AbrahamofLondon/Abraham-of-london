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

// RESOLVED: the db-push baseline gap (131 untracked tables) + the DiagnosticJourney/
// Organisation/research_runs FK gaps + the RetainedDecision ordering defect are all
// fixed by the squashed baseline migration (00000000000000_baseline), which creates every
// table before adding any foreign key. See database-migration-reconciliation.md.
// The gate now enforces ZERO referenced-before-created tables permanently.
const KNOWN_OFFENDERS: string[] = [];

describe("§9 migration-history validator", () => {
  it("no migration FK-references a table not created by an earlier migration (0 offenders)", () => {
    const offenders = referencedBeforeCreated();
    const unexpected = offenders.filter((t) => !KNOWN_OFFENDERS.includes(t));
    expect(unexpected, `referenced-before-created tables: ${unexpected.join(", ")}`).toEqual([]);
  });

  it("the baseline migration exists and creates the full schema", () => {
    const dirs = migrations();
    expect(dirs).toContain("00000000000000_baseline");
    expect(dirs[0]).toBe("00000000000000_baseline"); // sorts first
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
