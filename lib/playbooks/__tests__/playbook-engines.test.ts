/**
 * lib/playbooks/__tests__/playbook-engines.test.ts
 *
 * PROOF that each governed playbook /run engine is a genuine, product-specific
 * execution experience — not a cosmetic wrapper around a shared form.
 *
 * For each engine the directive requires:
 *   - materially different input fixtures → materially different outputs
 *   - contradictory-input case
 *   - insufficient-evidence case
 *   - failure case
 *   - product-specific execution assertions
 * Plus a cross-engine test proving the three do not collapse to one conclusion.
 */

import { describe, it, expect } from "vitest";
import { PlaybookInputError } from "../playbook-run-types";
import {
  runExecutionIntegrityProtocol,
  EXECUTION_INTEGRITY_PROTOCOL_CODE,
} from "../execution-integrity-protocol";
import {
  runAlignmentAuditPlaybook,
  ALIGNMENT_AUDIT_PLAYBOOK_CODE,
} from "../alignment-audit-playbook";
import {
  runDriftDetectionFramework,
  DRIFT_DETECTION_FRAMEWORK_CODE,
} from "../drift-detection-framework";

// ── Execution Integrity Protocol ──────────────────────────────────────────────

describe("execution_integrity_protocol engine", () => {
  it("insufficient-evidence when no commitments", () => {
    const r = runExecutionIntegrityProtocol({ commitments: [] });
    expect(r.posture).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.score).toBeNull();
    expect(r.evidenceGaps.length).toBeGreaterThan(0);
  });

  it("failure case: non-array commitments throws PlaybookInputError", () => {
    // @ts-expect-error deliberately invalid
    expect(() => runExecutionIntegrityProtocol({ commitments: null })).toThrow(PlaybookInputError);
  });

  it("materially different outputs for healthy vs failing commitment sets", () => {
    const healthy = runExecutionIntegrityProtocol({
      asOf: "2026-01-01",
      commitments: [
        { id: "c1", statement: "Ship node", owner: "COO", deadline: "2026-06-01", status: "on_track" },
        { id: "c2", statement: "Hedge FX", owner: "CFO", deadline: "2026-06-01", status: "on_track", dependencies: ["c1"] },
      ],
    });
    const failing = runExecutionIntegrityProtocol({
      asOf: "2026-01-01",
      commitments: [
        { id: "c1", statement: "Ship node", owner: null, deadline: "2026-01-03", status: "blocked", blockers: ["vendor"] },
        { id: "c2", statement: "Hedge FX", owner: "CFO", deadline: "2026-01-02", status: "at_risk", dependencies: ["cX"] },
      ],
    });
    expect(healthy.score).toBeGreaterThan(failing.score!);
    expect(healthy.findings.failurePoints).toHaveLength(0);
    expect(failing.findings.failurePoints).toContain("c1");
    expect(failing.findings.ownerlessCount).toBe(1);
    // dangling dependency cX is surfaced as an evidence gap
    expect(failing.evidenceGaps.join(" ")).toContain("cX");
  });

  it("contradictory-input: complete status but active blockers", () => {
    const r = runExecutionIntegrityProtocol({
      commitments: [{ id: "c1", statement: "x", owner: "A", status: "complete", blockers: ["legal hold"] }],
    });
    expect(r.posture).toBe("CONTRADICTORY_INPUT");
    expect(r.contradictions[0]?.ref).toBe("c1");
  });

  it("escalation threshold escalates when blocked and near deadline", () => {
    const r = runExecutionIntegrityProtocol({
      asOf: "2026-01-01",
      commitments: [{ id: "c1", statement: "x", owner: "A", deadline: "2026-01-04", status: "blocked", blockers: ["b"] }],
    });
    expect(r.findings.assessments[0]?.escalationThreshold).toBe("escalate_now");
  });
});

// ── Alignment Audit Playbook ──────────────────────────────────────────────────

describe("alignment_audit_playbook engine", () => {
  it("insufficient-evidence when no mandate and no incentives", () => {
    const r = runAlignmentAuditPlaybook({});
    expect(r.posture).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.score).toBeNull();
  });

  it("materially different outputs for aligned vs misaligned incentives", () => {
    const aligned = runAlignmentAuditPlaybook({
      statedMandate: "Prioritise long-term customer retention and durable margin",
      actualIncentives: [
        { actor: "Sales", rewardedFor: "customer retention renewals" },
        { actor: "Ops", rewardedFor: "durable margin protection" },
      ],
    });
    const misaligned = runAlignmentAuditPlaybook({
      statedMandate: "Prioritise long-term customer retention and durable margin",
      actualIncentives: [
        { actor: "Sales", rewardedFor: "new logo count only" },
        { actor: "Ops", rewardedFor: "short-term cost cutting" },
      ],
    });
    expect(aligned.score).toBeGreaterThan(misaligned.score!);
    expect(aligned.findings.misalignedActors).toHaveLength(0);
    expect(misaligned.findings.misalignedActors).toEqual(expect.arrayContaining(["Sales", "Ops"]));
  });

  it("detects hidden conflict when a misaligned actor holds high authority", () => {
    const r = runAlignmentAuditPlaybook({
      statedMandate: "customer retention and margin",
      actualIncentives: [{ actor: "Sales", rewardedFor: "new logo volume" }],
      authorityDistribution: [
        { actor: "Sales", authority: "high" },
        { actor: "Ops", authority: "low" },
        { actor: "Finance", authority: "low" },
      ],
    });
    expect(r.findings.hiddenConflicts.length).toBeGreaterThan(0);
  });

  it("contradictory-input: mandate contradicted by every incentive", () => {
    const r = runAlignmentAuditPlaybook({
      statedMandate: "retention and margin",
      actualIncentives: [
        { actor: "A", rewardedFor: "raw volume" },
        { actor: "B", rewardedFor: "speed shipping" },
      ],
    });
    expect(r.posture).toBe("CONTRADICTORY_INPUT");
    expect(r.contradictions[0]?.ref).toBe("mandate");
  });
});

// ── Drift Detection Framework ─────────────────────────────────────────────────

describe("drift_detection_framework engine", () => {
  it("insufficient-evidence when no signals", () => {
    const r = runDriftDetectionFramework({ signals: [] });
    expect(r.posture).toBe("INSUFFICIENT_EVIDENCE");
    expect(r.score).toBeNull();
  });

  it("failure case: non-array signals throws PlaybookInputError", () => {
    // @ts-expect-error deliberately invalid
    expect(() => runDriftDetectionFramework({ signals: 42 })).toThrow(PlaybookInputError);
  });

  it("materially different outputs for stable vs deteriorating signals", () => {
    const stable = runDriftDetectionFramework({
      signals: [{ id: "s1", kind: "metric", series: [10, 10, 10] }],
    });
    const deteriorating = runDriftDetectionFramework({
      signals: [{ id: "s1", kind: "metric", series: [10, 30, 60], warned: true, resolved: false }],
    });
    expect(stable.score!).toBeGreaterThan(deteriorating.score!);
    expect(deteriorating.findings.deteriorationAfterWarning).toContain("s1");
    expect(deteriorating.findings.assessments[0]?.classification).toBe("deterioration_after_warning");
  });

  it("classifies deterioration-after-warning as the top pattern", () => {
    const r = runDriftDetectionFramework({
      signals: [{ id: "s1", kind: "delay", series: [1, 5, 12], warned: true, resolved: false }],
    });
    expect(r.overallSeverity === "HIGH" || r.overallSeverity === "CRITICAL").toBe(true);
  });

  it("contradictory-input: resolved but still worsening", () => {
    const r = runDriftDetectionFramework({
      signals: [{ id: "s1", kind: "metric", series: [10, 20, 40], resolved: true }],
    });
    expect(r.posture).toBe("CONTRADICTORY_INPUT");
    expect(r.contradictions[0]?.ref).toBe("s1");
  });
});

// ── Cross-engine: the three are genuinely different products ───────────────────

describe("cross-engine distinctness (no cosmetic wrapper)", () => {
  it("each engine stamps its own product code", () => {
    expect(runExecutionIntegrityProtocol({ commitments: [{ id: "a", statement: "x", owner: "o" }] }).playbook).toBe(
      EXECUTION_INTEGRITY_PROTOCOL_CODE,
    );
    expect(runAlignmentAuditPlaybook({ statedMandate: "m", actualIncentives: [{ actor: "a", rewardedFor: "m" }] }).playbook).toBe(
      ALIGNMENT_AUDIT_PLAYBOOK_CODE,
    );
    expect(runDriftDetectionFramework({ signals: [{ id: "s", kind: "metric", series: [1, 1] }] }).playbook).toBe(
      DRIFT_DETECTION_FRAMEWORK_CODE,
    );
  });

  it("engines expose product-specific finding shapes, not a shared blob", () => {
    const eip = runExecutionIntegrityProtocol({ commitments: [{ id: "a", statement: "x", owner: "o" }] });
    const aap = runAlignmentAuditPlaybook({ statedMandate: "m", actualIncentives: [{ actor: "a", rewardedFor: "m" }] });
    const ddf = runDriftDetectionFramework({ signals: [{ id: "s", kind: "metric", series: [1, 1] }] });
    expect(eip.findings).toHaveProperty("failurePoints");
    expect(aap.findings).toHaveProperty("mandateIncentiveGap");
    expect(ddf.findings).toHaveProperty("deteriorationAfterWarning");
    // and they do not share each other's keys
    expect(eip.findings).not.toHaveProperty("mandateIncentiveGap");
    expect(aap.findings).not.toHaveProperty("deteriorationAfterWarning");
    expect(ddf.findings).not.toHaveProperty("failurePoints");
  });

  it("all three carry the not-advice claim boundary", () => {
    for (const r of [
      runExecutionIntegrityProtocol({ commitments: [{ id: "a", statement: "x", owner: "o" }] }),
      runAlignmentAuditPlaybook({ statedMandate: "m", actualIncentives: [{ actor: "a", rewardedFor: "m" }] }),
      runDriftDetectionFramework({ signals: [{ id: "s", kind: "metric", series: [1, 1] }] }),
    ]) {
      expect(r.claimBoundary.toLowerCase()).toContain("not legal");
    }
  });
});
