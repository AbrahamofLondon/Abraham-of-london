import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

import { composeReturnBriefV1 } from "./return-brief-composer";

describe("composeReturnBriefV1", () => {
  it("returns an honest insufficient-evidence state without faking a brief", () => {
    const brief = composeReturnBriefV1(null, "case_1");

    expect(brief.status).toBe("INSUFFICIENT_EVIDENCE");
    expect(brief.whatChanged).toEqual([]);
    expect(brief.whatDidNotChange[0]).toContain("does not yet contain enough return-cycle evidence");
  });

  it("keeps an active condition visible and surfaces the next required move", () => {
    const brief = composeReturnBriefV1({
      sessionKey: "case_2",
      trigger: "deteriorating_trajectory",
      trajectory: { state: "DETERIORATING", reason: "Execution has stalled." },
      contradiction: {
        decision: "Whether to restructure",
        constraint: "Authority remains contested",
        status: "The constraint remains active",
      },
      verification: [{ label: "Assign one accountable owner", status: "OVERDUE" }],
      challenge: "Name the owner and record the next binding move.",
    }, "case_2");

    expect(brief.status).toBe("ACTIVE");
    expect(brief.nowRequired).toEqual(["Name the owner and record the next binding move."]);
    expect(brief.escalationStatus).toBe("RECOMMENDED");
  });

  it("does not leak internal or suppression fields into the composed output", () => {
    const brief = composeReturnBriefV1({
      sessionKey: "case_3",
      trigger: "fragile_trajectory",
      trajectory: { state: "FRAGILE", reason: "The decision remains open." },
      contradiction: {
        decision: "Whether to proceed",
        constraint: "Owner remains unclear",
        status: "The constraint remains active",
      },
      challenge: "Assign one owner.",
      internalNotes: "must never leak",
      suppressedReason: "must never leak",
    } as never, "case_3");

    expect(JSON.stringify(brief)).not.toContain("must never leak");
    expect(Object.keys(brief)).not.toContain("internalNotes");
    expect(Object.keys(brief)).not.toContain("suppressedReason");
  });

  it("always links generated briefs back to Decision Centre", () => {
    const brief = composeReturnBriefV1({
      sessionKey: "case_4",
      trajectory: { state: "ASCENDING", reason: "Movement recorded." },
      verification: [{ label: "Assign one owner", status: "VERIFIED_EXECUTED" }],
      challenge: "Continue monitoring.",
    }, "case_4");

    expect(brief.decisionCentreHref).toBe("/decision-centre");
  });

  it("keeps the public explainer distinct from generated briefs", () => {
    const explainer = readFileSync(
      path.join(process.cwd(), "pages", "return-brief", "index.tsx"),
      "utf8",
    );

    expect(explainer).toContain("This page explains the mechanism.");
    expect(explainer).toContain("Generated Return Briefs are case-specific");
  });
});
