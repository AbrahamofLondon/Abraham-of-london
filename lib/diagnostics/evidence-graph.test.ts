import { describe, expect, it } from "vitest";

import {
  buildGenericAuthorityPacket,
  extractCanonicalDecisionObject,
} from "./evidence-graph";

describe("diagnostic evidence graph substrate", () => {
  it("extracts materially different decision objects from the same scored condition", () => {
    const first = extractCanonicalDecisionObject({
      sourceStage: "purpose_alignment",
      decisionText: "Remove the senior operator blocking execution",
      costOfDelayText: "Two escalation meetings were postponed",
    });
    const second = extractCanonicalDecisionObject({
      sourceStage: "purpose_alignment",
      decisionText: "Stop the underpriced product line",
      costOfDelayText: "Margin compression continues every week",
    });

    expect(first?.decisionKey).toBeTruthy();
    expect(second?.decisionKey).toBeTruthy();
    expect(first?.decisionKey).not.toBe(second?.decisionKey);
    expect(first?.decisionText).not.toBe(second?.decisionText);
  });

  it("changes consequence and first move when the constraint changes under the same condition", () => {
    const authorityConflict = buildGenericAuthorityPacket({
      stage: "executive_reporting",
      condition: "MISALIGNED executive position",
      contradiction: "The user framed delay as execution, but evidence shows authority conflict.",
      decisionText: "Approve the market exit",
      constraintText: "No single sponsor owns the decision",
      costOfDelayText: "Credit tightening increases exposure",
      firstMove: "Name one accountable decision owner before the next board meeting.",
      skippedConsequence: "The decision remains ownerless while exposure compounds.",
      escalationCondition: "Strategy Room opens only after ownership is assigned.",
      riskScore: 76,
      formula: "severity + exposure",
      reasoning: ["same severity", "authority constraint"],
    });
    const resourceConstraint = buildGenericAuthorityPacket({
      stage: "executive_reporting",
      condition: "MISALIGNED executive position",
      contradiction: "The user framed delay as execution, but evidence shows capacity constraint.",
      decisionText: "Approve the market exit",
      constraintText: "Finance cannot release the runway without cutting two programmes",
      costOfDelayText: "Credit tightening increases exposure",
      firstMove: "Price the two programme cuts and choose the one that preserves runway.",
      skippedConsequence: "The decision remains financially unsequenced while exposure compounds.",
      escalationCondition: "Strategy Room opens only after the resource tradeoff is explicit.",
      riskScore: 76,
      formula: "severity + exposure",
      reasoning: ["same severity", "resource constraint"],
    });

    expect(authorityConflict.action.firstMove).not.toBe(resourceConstraint.action.firstMove);
    expect(authorityConflict.decisionObject?.constraintText).not.toBe(resourceConstraint.decisionObject?.constraintText);
    expect(authorityConflict.nodes.map((node) => node.summary).join(" ")).toContain("authority conflict");
    expect(resourceConstraint.nodes.map((node) => node.summary).join(" ")).toContain("capacity constraint");
  });

  it("makes the consequence math auditable", () => {
    const packet = buildGenericAuthorityPacket({
      stage: "enterprise",
      condition: "Execution drift under rising pressure",
      contradiction: "Execution and risk are both below threshold.",
      decisionText: "Stabilise the operating unit",
      firstMove: "Create a 48-hour operational reality map.",
      skippedConsequence: "The drag remains abstract.",
      escalationCondition: "Escalate if two domains repeat the same failure.",
      riskScore: 68,
      formula: "(100 - enterprise percent) + structural risk x 0.35",
      reasoning: ["Enterprise score: 54%", "Decision structural risk: 40%"],
    });

    expect(packet.consequence.value).toBe(68);
    expect(packet.consequence.formula).toContain("enterprise percent");
    expect(packet.nodes.find((node) => node.kind === "consequence")?.evidenceText).toContain("Enterprise score");
  });

  it("keeps the required anti-collapse matrix distinct across decision authority fields", () => {
    const cases = [
      {
        name: "same scores different avoided decision",
        condition: "Pressure override",
        contradiction: "Same score, different decision avoidance.",
        decisionText: "Fire the blocker",
        constraintText: "Personal loyalty",
        firstMove: "Write the termination decision and owner.",
        riskScore: 61,
      },
      {
        name: "same scores different delay consequence",
        condition: "Pressure override",
        contradiction: "Same score, different cost of delay.",
        decisionText: "Freeze the product line",
        costOfDelayText: "Margin falls below 8% in 30 days",
        firstMove: "Calculate the 30-day margin floor.",
        riskScore: 61,
      },
      {
        name: "same constitutional posture different failed attempts",
        condition: "DIAGNOSTIC constitutional condition",
        contradiction: "Route same, failed attempts differ.",
        decisionText: "Reset decision rights",
        priorAttemptText: "Two operating model resets failed",
        firstMove: "Audit why the last reset failed before designing another.",
        riskScore: 70,
      },
      {
        name: "same team variance different confidence",
        condition: "Trust no longer load-bearing",
        contradiction: "Same variance, high leadership confidence raises contradiction severity.",
        decisionText: "Correct trust signal",
        constraintText: "Leader is highly confident despite gap",
        firstMove: "Run anonymous individual signal interviews.",
        riskScore: 76,
      },
      {
        name: "same enterprise risk expensive failure",
        condition: "Execution drift under rising pressure",
        contradiction: "Same risk, expensive failure note changes consequence.",
        decisionText: "Stabilise fulfilment",
        costOfDelayText: "One failed shipment costs the account",
        firstMove: "Map the account-loss cascade before adding demand.",
        riskScore: 82,
      },
      {
        name: "same flagship severity different constraint",
        condition: "MISALIGNED executive position",
        contradiction: "Same severity, constraint changes route work.",
        decisionText: "Approve market exit",
        constraintText: "Board split",
        firstMove: "Force board position before sequencing intervention.",
        riskScore: 78,
      },
      {
        name: "same condition stakeholder pressure",
        condition: "Governance no longer carrying order",
        contradiction: "Same governance condition, board pressure changes escalation.",
        decisionText: "Reassign approval rights",
        stakeholderText: "Board and regulator",
        firstMove: "Separate board approval from operating authority.",
        riskScore: 80,
      },
      {
        name: "repeat pattern across stages",
        condition: "Authority conflict repeated across ladder",
        contradiction: "Authority contradiction repeats from purpose to enterprise.",
        decisionText: "Name the actual authority holder",
        constraintText: "Shadow authority persisted across stages",
        firstMove: "Stop escalation until formal and actual authority match.",
        riskScore: 88,
      },
      {
        name: "high confidence high contradiction",
        condition: "False alignment",
        contradiction: "High confidence is contradicted by evidence.",
        decisionText: "Admit the current plan is not real",
        constraintText: "User expresses certainty while evidence disagrees",
        firstMove: "List the evidence that disproves the stated confidence.",
        riskScore: 74,
      },
      {
        name: "structurally similar different decision object",
        condition: "Authority conflict repeated across ladder",
        contradiction: "Similar structure, different decision object.",
        decisionText: "Replace the sponsor",
        constraintText: "Sponsor lacks mandate",
        firstMove: "Nominate a mandate-bearing sponsor before intervention.",
        riskScore: 88,
      },
    ];

    const packets = cases.map((item) =>
      buildGenericAuthorityPacket({
        stage: "executive_reporting",
        condition: item.condition,
        contradiction: item.contradiction,
        decisionText: item.decisionText,
        constraintText: item.constraintText,
        priorAttemptText: item.priorAttemptText,
        costOfDelayText: item.costOfDelayText,
        stakeholderText: item.stakeholderText,
        firstMove: item.firstMove,
        skippedConsequence: `${item.name} remains unresolved.`,
        escalationCondition: `${item.name} escalation condition.`,
        riskScore: item.riskScore,
        formula: "matrix risk input",
        reasoning: [item.name, item.contradiction],
      }),
    );

    expect(new Set(packets.map((packet) => packet.condition)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(packets.map((packet) => packet.contradiction)).size).toBe(10);
    expect(new Set(packets.map((packet) => packet.consequence.value)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(packets.map((packet) => packet.action.firstMove)).size).toBe(10);
    expect(new Set(packets.map((packet) => packet.action.escalationCondition)).size).toBe(10);
    expect(new Set(packets.map((packet) => packet.decisionObject?.decisionKey)).size).toBe(10);
  });
});
