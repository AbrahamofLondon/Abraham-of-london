/**
 * tests/product-estate/customer-falsification-watchdog.test.ts
 *
 * §14 — Falsification Watchdog tests: state progression, evidence evaluation, alert generation.
 */
import { describe, it, expect } from "vitest";
import { createTrigger, evaluateTrigger, buildAlertMessage } from "../../lib/intelligence/accountability/customer-falsification-watchdog";

describe("Customer Falsification Watchdog", () => {
  const baseInput = {
    caseId: "case-001",
    tenantId: "tenant-001",
    commitment: "Review market exposure quarterly",
    statedTrigger: "If volatility exceeds threshold for two consecutive quarters",
    evidenceSource: "customer_evidence" as const,
    sourceReference: "commitment_log_001",
  };

  it("creates a trigger in MONITORING state", () => {
    const trigger = createTrigger(baseInput);
    expect(trigger.state).toBe("MONITORING");
    expect(trigger.triggerId).toBeTruthy();
    expect(trigger.caseId).toBe("case-001");
    expect(trigger.tenantId).toBe("tenant-001");
  });

  it("strong evidence moves MONITORING → TRIGGER_APPROACHING", () => {
    const trigger = createTrigger(baseInput);
    const result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("TRIGGER_APPROACHING");
    expect(result.evidenceMatched).toBe(true);
    expect(result.alertRequired).toBe(false);
  });

  it("moderate evidence moves MONITORING → EVIDENCE_INSUFFICIENT", () => {
    const trigger = createTrigger(baseInput);
    const result = evaluateTrigger(trigger, "moderate");
    expect(result.newState).toBe("EVIDENCE_INSUFFICIENT");
    expect(result.evidenceMatched).toBe(false);
  });

  it("weak evidence keeps MONITORING in MONITORING", () => {
    const trigger = createTrigger(baseInput);
    const result = evaluateTrigger(trigger, "weak");
    expect(result.newState).toBe("MONITORING");
  });

  it("full progression MONITORING → TRIGGER_APPROACHING → TRIGGER_REACHED → REVIEW_REQUIRED → REVISED → CLOSED", () => {
    let trigger = createTrigger(baseInput);

    // Step 1: MONITORING + strong → TRIGGER_APPROACHING
    let result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("TRIGGER_APPROACHING");
    trigger = { ...trigger, state: result.newState as any, lastEvaluatedAt: new Date().toISOString(), evaluationCount: 1 };

    // Step 2: TRIGGER_APPROACHING + strong → TRIGGER_REACHED
    result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("TRIGGER_REACHED");
    expect(result.alertRequired).toBe(true);
    trigger = { ...trigger, state: result.newState as any, lastEvaluatedAt: new Date().toISOString(), evaluationCount: 2 };

    // Step 3: TRIGGER_REACHED → REVIEW_REQUIRED
    result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("REVIEW_REQUIRED");
    expect(result.alertRequired).toBe(true);
    trigger = { ...trigger, state: result.newState as any, lastEvaluatedAt: new Date().toISOString(), evaluationCount: 3 };

    // Step 4: REVIEW_REQUIRED → REVISED
    result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("REVISED");
    trigger = { ...trigger, state: result.newState as any, lastEvaluatedAt: new Date().toISOString(), evaluationCount: 4 };

    // Step 5: REVISED → CLOSED
    result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("CLOSED");
  });

  it("buildAlertMessage includes the stated trigger", () => {
    const trigger = createTrigger(baseInput);
    const msg = buildAlertMessage(trigger);
    expect(msg).toContain(baseInput.statedTrigger);
    expect(msg).toContain("Review is required");
  });

  it("CLOSED state does not change", () => {
    const trigger = { ...createTrigger(baseInput), state: "CLOSED" as const };
    const result = evaluateTrigger(trigger, "strong");
    expect(result.newState).toBe("CLOSED");
  });

  it("TRIGGER_APPROACHING + no evidence → MONITORING", () => {
    const trigger = { ...createTrigger(baseInput), state: "TRIGGER_APPROACHING" as const };
    const result = evaluateTrigger(trigger, "none");
    expect(result.newState).toBe("MONITORING");
  });
});
