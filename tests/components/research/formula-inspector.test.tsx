// @vitest-environment jsdom
/**
 * FormulaInspector — mode lock tests.
 *
 * Proves the three modes cannot silently regress.
 * Uses @testing-library/react for DOM assertions.
 */

import * as React from "react";
import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const findings: Finding[] = [
  {
    id: "f1",
    title: "Authority Gap",
    description: "Decision ownership unclear",
    severity: "HIGH",
    source: "authority-scorer/v2 → threshold:70",
    evidence: "No named decision-maker",
    remediation: "Assign a single accountable owner",
  },
  {
    id: "f2",
    title: "Execution Stall",
    description: "Repeated prior attempts without resolution",
    severity: "MEDIUM",
    source: "execution-scorer/v1",
  },
];

const formulaSteps: FormulaStep[] = [
  {
    stepId: "step-1",
    label: "C3 Specificity Score",
    inputs: { decision: "restructure leadership", hasBlocker: "true" },
    intermediate: { rawScore: "0.72", tier: "FULL_SYNTHESIS" },
    output: "0.72",
    sourceRule: "scoreC3(caseObj) — lib/decision/c3-fidelity-scorer.ts",
    engineVersion: "2.1.0",
  },
  {
    stepId: "step-2",
    label: "Condition Classification",
    inputs: { caseObjectKeys: "decision, blocker, claimedOwner" },
    output: "authority",
    sourceRule: "classifyCondition(caseObj) — lib/decision/case-object.ts",
    engineVersion: "2.1.0",
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function openInspector(title = "Formula Trace") {
  const btn = screen.getByRole("button", { name: new RegExp(title, "i") });
  fireEvent.click(btn);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("FormulaInspector — finding-source mode", () => {
  it("renders finding title, severity, and source after opening", () => {
    render(<FormulaInspector mode="finding-source" findings={findings} title="Trace" />);
    openInspector("Trace");
    expect(screen.getByText("Authority Gap")).toBeTruthy();
    expect(screen.getByText(/authority-scorer\/v2/)).toBeTruthy();
    expect(screen.getAllByText(/HIGH/i).length).toBeGreaterThan(0);
  });

  it("renders source rule text for auditability", () => {
    render(<FormulaInspector mode="finding-source" findings={findings} title="Trace" />);
    openInspector("Trace");
    expect(screen.getByText(/authority-scorer\/v2 → threshold:70/)).toBeTruthy();
    expect(screen.getByText(/execution-scorer\/v1/)).toBeTruthy();
  });

  it("renders safe empty state when all findings lack source", () => {
    const noSourceFindings: Finding[] = [
      { id: "f3", title: "No source", description: "x", severity: "INFO", source: "" },
    ];
    const { container } = render(
      <FormulaInspector mode="finding-source" findings={noSourceFindings} title="Trace" />,
    );
    // Should render nothing (hasContent false)
    expect(container.firstChild).toBeNull();
  });

  it("renders safe empty state when findings array is empty", () => {
    const { container } = render(
      <FormulaInspector mode="finding-source" findings={[]} title="Trace" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not dump raw object JSON into the DOM", () => {
    render(<FormulaInspector mode="finding-source" findings={findings} title="Trace" />);
    openInspector("Trace");
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/\{.*"id".*\}/);
    expect(body).not.toMatch(/\[object Object\]/);
  });
});

describe("FormulaInspector — live-formula mode", () => {
  it("renders formula step labels after opening", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    openInspector("Steps");
    expect(screen.getByText("C3 Specificity Score")).toBeTruthy();
    expect(screen.getByText("Condition Classification")).toBeTruthy();
  });

  it("renders step output values", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    openInspector("Steps");
    expect(screen.getByText("0.72")).toBeTruthy();
    expect(screen.getByText("authority")).toBeTruthy();
  });

  it("renders source rule text for auditability after expanding a step", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    openInspector("Steps");
    const step1Btn = screen.getByRole("button", { name: /C3 Specificity Score/i });
    fireEvent.click(step1Btn);
    expect(screen.getByText(/scoreC3.*c3-fidelity-scorer/i)).toBeTruthy();
    // engineVersion may appear as "engine: 2.1.0" — check by text content substring
    expect(document.body.textContent).toContain("2.1.0");
  });

  it("renders inputs and intermediate values when step is expanded", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    openInspector("Steps");
    const step1Btn = screen.getByRole("button", { name: /C3 Specificity Score/i });
    fireEvent.click(step1Btn);
    expect(screen.getByText(/restructure leadership/)).toBeTruthy();
    expect(screen.getByText(/FULL_SYNTHESIS/)).toBeTruthy();
  });

  it("renders safe empty state when formulaSteps is empty", () => {
    const { container } = render(
      <FormulaInspector mode="live-formula" formulaSteps={[]} title="Steps" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("does not dump raw object JSON into the DOM", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    openInspector("Steps");
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/\[object Object\]/);
  });
});

describe("FormulaInspector — hybrid mode", () => {
  it("renders both finding sources and formula steps", () => {
    render(
      <FormulaInspector
        mode="hybrid"
        findings={findings}
        formulaSteps={formulaSteps}
        title="Full Trace"
      />,
    );
    openInspector("Full Trace");
    // Finding section
    expect(screen.getByText("Authority Gap")).toBeTruthy();
    // Formula step section
    expect(screen.getByText("C3 Specificity Score")).toBeTruthy();
  });

  it("shows both section headers in hybrid mode", () => {
    render(
      <FormulaInspector
        mode="hybrid"
        findings={findings}
        formulaSteps={formulaSteps}
        title="Full Trace"
      />,
    );
    openInspector("Full Trace");
    expect(screen.getByText(/Finding Sources/i)).toBeTruthy();
    expect(screen.getByText(/Formula Steps/i)).toBeTruthy();
  });

  it("shows safe state when both are empty", () => {
    const { container } = render(
      <FormulaInspector mode="hybrid" findings={[]} formulaSteps={[]} title="Full Trace" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows content if only findings are present in hybrid mode", () => {
    render(
      <FormulaInspector mode="hybrid" findings={findings} formulaSteps={[]} title="Full Trace" />,
    );
    openInspector("Full Trace");
    expect(screen.getByText("Authority Gap")).toBeTruthy();
  });
});

describe("FormulaInspector — mode label", () => {
  it("shows mode label in the header", () => {
    render(<FormulaInspector mode="finding-source" findings={findings} title="Trace" />);
    expect(screen.getByText(/finding-source/i)).toBeTruthy();
  });

  it("live-formula label appears when in live-formula mode", () => {
    render(<FormulaInspector mode="live-formula" formulaSteps={formulaSteps} title="Steps" />);
    expect(screen.getByText(/live-formula/i)).toBeTruthy();
  });
});
