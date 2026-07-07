/**
 * lib/playbooks/__tests__/playbook-run-authority.test.ts
 *
 * Proves the /run surface is REAL, not self-asserted:
 *   - the route files physically exist (observed, not declared)
 *   - the authority dispatches each slug to the correct product-specific engine
 *   - unknown slug is rejected
 *   - anonymous runs are blocked; identified runs pass the structural gate
 *   - the failure case (invalid engine input) propagates from dispatch
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  PLAYBOOK_SLUGS,
  resolvePlaybookRun,
  executePlaybookRun,
  assertPlaybookRunAllowed,
  entitlementSlugForPlaybook,
  PlaybookRunAuthorityError,
} from "../playbook-run-authority";
import { PlaybookInputError } from "../playbook-run-types";

const ROOT = process.cwd();

describe("playbook run routes physically exist (not self-asserted)", () => {
  it("every playbook slug has a page /run route file", () => {
    // Dynamic route file covers all slugs; assert it exists on disk.
    expect(existsSync(join(ROOT, "pages/playbooks/[slug]/run.tsx"))).toBe(true);
  });
  it("every playbook slug has an API /run route file", () => {
    expect(existsSync(join(ROOT, "pages/api/playbooks/[slug]/run.ts"))).toBe(true);
  });
  it("registers exactly the three governed playbooks", () => {
    expect(PLAYBOOK_SLUGS.sort()).toEqual(
      ["execution-integrity-protocol", "the-alignment-audit-playbook", "the-drift-detection-framework"].sort(),
    );
  });
});

describe("authority dispatch maps slug → correct engine", () => {
  it("execution-integrity-protocol dispatches to its engine", () => {
    const r = executePlaybookRun("execution-integrity-protocol", { commitments: [{ id: "c", statement: "x", owner: "o" }] });
    expect(r.playbook).toBe("execution_integrity_protocol");
    expect(r.findings).toHaveProperty("failurePoints");
  });
  it("the-alignment-audit-playbook dispatches to its engine", () => {
    const r = executePlaybookRun("the-alignment-audit-playbook", { statedMandate: "m", actualIncentives: [{ actor: "a", rewardedFor: "m" }] });
    expect(r.playbook).toBe("alignment_audit_playbook");
    expect(r.findings).toHaveProperty("mandateIncentiveGap");
  });
  it("the-drift-detection-framework dispatches to its engine", () => {
    const r = executePlaybookRun("the-drift-detection-framework", { signals: [{ id: "s", kind: "metric", series: [1, 1] }] });
    expect(r.playbook).toBe("drift_detection_framework");
    expect(r.findings).toHaveProperty("deteriorationAfterWarning");
  });
  it("unknown slug throws PlaybookRunAuthorityError", () => {
    expect(() => executePlaybookRun("nope", {})).toThrow(PlaybookRunAuthorityError);
  });
  it("propagates engine failure case (invalid input)", () => {
    expect(() => executePlaybookRun("execution-integrity-protocol", { commitments: "bad" })).toThrow(PlaybookInputError);
  });
});

describe("structural authority gate", () => {
  it("blocks anonymous runs", () => {
    expect(() => assertPlaybookRunAllowed({ slug: "execution-integrity-protocol" })).toThrow(PlaybookRunAuthorityError);
  });
  it("allows identified runs on a known slug", () => {
    const c = assertPlaybookRunAllowed({ slug: "execution-integrity-protocol", email: "x@y.com" });
    expect(c.code).toBe("execution_integrity_protocol");
  });
  it("rejects unknown slug even with identity", () => {
    expect(() => assertPlaybookRunAllowed({ slug: "nope", email: "x@y.com" })).toThrow(PlaybookRunAuthorityError);
  });
  it("maps each slug to its catalog entitlement", () => {
    expect(entitlementSlugForPlaybook("execution-integrity-protocol")).toBe("playbook.execution-integrity-protocol.access");
    expect(entitlementSlugForPlaybook("the-alignment-audit-playbook")).toBe("playbook.alignment-audit.access");
    expect(entitlementSlugForPlaybook("the-drift-detection-framework")).toBe("playbook.drift-detection-framework.access");
    expect(resolvePlaybookRun("nope")).toBeNull();
  });
});
