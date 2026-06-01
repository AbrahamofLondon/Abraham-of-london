/**
 * tests/product/stage-contribution-derivation.test.ts
 *
 * Tests for the stage contribution derivation helper.
 *
 * Covers:
 * - Returns null when no data exists
 * - Uses evidence node summary where available
 * - Uses governed memory only when audienceSafe is true
 * - Excludes suppressed or unsafe memory
 * - Uses contradiction summary where evidence node is missing
 * - Does not fabricate counts
 * - Produces Purpose Alignment contribution from primary pattern
 * - Produces Decision Centre contribution from governed memory/evidence nodes
 */

import { describe, it, expect } from "vitest";
import { deriveStageContribution, deriveStageContributions } from "@/lib/product/stage-contribution-derivation";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";

// ─── 1. Returns null when no data exists ─────────────────────────────────────

describe("deriveStageContribution", () => {
  it("returns null when no data exists for a stage", () => {
    const result = deriveStageContribution({
      stageKey: "unknown_stage",
    });
    expect(result).toBeNull();
  });

  it("returns generic contribution for known stage with no specific data", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
    });
    expect(result).toBe("Detected the pattern driving drift and identified the first correction required.");
  });
});

// ─── 2. Uses evidence node summary where available ───────────────────────────

describe("evidence node usage", () => {
  it("uses evidence node summary when available", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      evidenceNodes: [
        {
          sourceStage: "purpose_alignment",
          summary: "Pattern detected: Mandate drift with authority conflict",
          kind: "finding",
        },
      ],
    });
    expect(result).toBe("Pattern detected: Mandate drift with authority conflict");
  });

  it("prefers contradiction nodes over regular evidence nodes", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      evidenceNodes: [
        {
          sourceStage: "purpose_alignment",
          summary: "Regular finding",
          kind: "finding",
        },
        {
          sourceStage: "purpose_alignment",
          summary: "Contradiction between stated priority and actual behaviour",
          kind: "contradiction",
        },
      ],
    });
    expect(result).toContain("Contradiction between");
  });

  it("includes count when multiple contradiction nodes exist", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      evidenceNodes: [
        { sourceStage: "purpose_alignment", summary: "First contradiction", kind: "contradiction" },
        { sourceStage: "purpose_alignment", summary: "Second contradiction", kind: "contradiction" },
        { sourceStage: "purpose_alignment", summary: "Third contradiction", kind: "contradiction" },
      ],
    });
    expect(result).toContain("plus 2 other contradictions");
  });
});

// ─── 3. Uses governed memory only when audienceSafe is true ──────────────────

describe("governed memory filtering", () => {
  it("uses governed memory when audienceSafe is true", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      governedMemory: [
        {
          sourceSurface: "PURPOSE_ALIGNMENT",
          summary: "Coherence band: DRIFTING. Pattern: Mandate fracture.",
          audienceSafe: true,
        },
      ],
    });
    expect(result).toContain("Coherence band: DRIFTING");
  });

  it("excludes governed memory when audienceSafe is false", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      governedMemory: [
        {
          sourceSurface: "PURPOSE_ALIGNMENT",
          summary: "Sensitive internal finding",
          audienceSafe: false,
        },
      ],
    });
    // Should fall back to generic, not use unsafe memory
    expect(result).toBe("Detected the pattern driving drift and identified the first correction required.");
  });
});

// ─── 4. Uses contradiction summary where evidence node is missing ────────────

describe("contradiction fallback", () => {
  it("uses contradiction summary when evidence nodes are missing", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      contradictions: [
        { summary: "Mandate fracture: authority is unclear", severity: "high" },
      ],
    });
    expect(result).toContain("Mandate fracture");
  });
});

// ─── 5. Does not fabricate counts ────────────────────────────────────────────

describe("no fabricated counts", () => {
  it("does not add count suffix when only one node exists", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      evidenceNodes: [
        { sourceStage: "purpose_alignment", summary: "Single finding", kind: "finding" },
      ],
    });
    expect(result).toBe("Single finding");
    expect(result).not.toContain("(");
  });
});

// ─── 6. Produces Purpose Alignment contribution ──────────────────────────────

describe("Purpose Alignment contributions", () => {
  it("produces contribution from primary pattern data", () => {
    const result = deriveStageContribution({
      stageKey: "purpose_alignment",
      contradictions: [
        { summary: "Pattern detected: Mandate drift with 3 contradictions still unresolved", severity: "high" },
      ],
    });
    expect(result).toContain("Mandate drift");
  });
});

// ─── 7. Produces Decision Centre contribution ────────────────────────────────

describe("Decision Centre contributions", () => {
  it("produces contribution from governed memory", () => {
    const result = deriveStageContribution({
      stageKey: "enterprise",
      governedMemory: [
        {
          sourceSurface: "ENTERPRISE_ASSESSMENT",
          summary: "Organisational risk score: HIGH. Escalation readiness: WATCH.",
          audienceSafe: true,
        },
      ],
    });
    expect(result).toContain("Organisational risk score");
  });

  it("produces contribution from evidence nodes for strategy room", () => {
    const result = deriveStageContribution({
      stageKey: "strategy_room",
      evidenceNodes: [
        {
          sourceStage: "strategy_room",
          summary: "3 interventions executed. Consequence trend: ESCALATING.",
          kind: "finding",
        },
      ],
    });
    expect(result).toContain("3 interventions executed");
  });
});

// ─── 8. deriveStageContributions batch function ──────────────────────────────

describe("deriveStageContributions batch", () => {
  it("populates contribution on completed stages", () => {
    const stages: StageEntry[] = [
      { key: "purpose_alignment", label: "Purpose Alignment", status: "completed" },
      { key: "constitutional", label: "Constitutional Diagnostic", status: "not_started" },
    ];

    const result = deriveStageContributions(stages, {
      stageKey: "",
      contradictions: [
        { summary: "Pattern: Mandate drift", severity: "high" },
      ],
    });

    const completed = result.find(s => s.key === "purpose_alignment");
    expect(completed?.contribution).toContain("Mandate drift");
  });

  it("does not overwrite existing contributions", () => {
    const stages: StageEntry[] = [
      { key: "purpose_alignment", label: "Purpose Alignment", status: "completed", contribution: "Existing contribution" },
    ];

    const result = deriveStageContributions(stages, { stageKey: "" });
    expect(result[0]?.contribution).toBe("Existing contribution");
  });

  it("does not add contribution to non-completed stages", () => {
    const stages: StageEntry[] = [
      { key: "constitutional", label: "Constitutional Diagnostic", status: "not_started" },
    ];

    const result = deriveStageContributions(stages, { stageKey: "" });
    expect(result[0]?.contribution).toBeUndefined();
  });
});
