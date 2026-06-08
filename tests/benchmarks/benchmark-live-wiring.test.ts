/**
 * tests/benchmarks/benchmark-live-wiring.test.ts
 *
 * BRIEF 3 P10 — 15 new tests covering:
 *   BW.1–BW.4   Threshold governance (two-threshold architecture)
 *   BW.5–BW.8   Benchmark fact writer helpers
 *   BW.9–BW.12  Write path wiring verification (static source checks)
 *   BW.13–BW.15 Component import/render surface presence
 */

import { describe, it, expect } from "vitest";

// ─── BW.1–BW.4: Threshold governance ─────────────────────────────────────────

describe("BW.1 BENCHMARK_INTERNAL_COHORT_MIN_N is 5", () => {
  it("exports the correct internal cohort minimum", async () => {
    const { BENCHMARK_INTERNAL_COHORT_MIN_N } = await import("@/lib/claims/claim-governor");
    expect(BENCHMARK_INTERNAL_COHORT_MIN_N).toBe(5);
  });
});

describe("BW.2 BENCHMARK_PUBLIC_CLAIM_MIN_N is 50 (BENCHMARK_CAPABILITY.minimumPoolSize)", () => {
  it("exports the correct public claim minimum", async () => {
    const { BENCHMARK_CAPABILITY } = await import("@/lib/benchmarks/benchmark-context-authority");
    expect(BENCHMARK_CAPABILITY.minimumPoolSize).toBe(50);
  });
});

describe("BW.3 CLAIM_THRESHOLDS.benchmarkSampleSize equals BENCHMARK_INTERNAL_COHORT_MIN_N", () => {
  it("internal threshold constant is consistent between claim-governor and CLAIM_THRESHOLDS", async () => {
    const { CLAIM_THRESHOLDS, BENCHMARK_INTERNAL_COHORT_MIN_N } = await import("@/lib/claims/claim-governor");
    expect(CLAIM_THRESHOLDS.benchmarkSampleSize).toBe(BENCHMARK_INTERNAL_COHORT_MIN_N);
  });
});

describe("BW.4 public threshold is greater than internal threshold", () => {
  it("minimumPoolSize (50) > BENCHMARK_INTERNAL_COHORT_MIN_N (5)", async () => {
    const { BENCHMARK_CAPABILITY } = await import("@/lib/benchmarks/benchmark-context-authority");
    const { BENCHMARK_INTERNAL_COHORT_MIN_N } = await import("@/lib/claims/claim-governor");
    expect(BENCHMARK_CAPABILITY.minimumPoolSize).toBeGreaterThan(BENCHMARK_INTERNAL_COHORT_MIN_N);
  });
});

// ─── BW.5–BW.8: Benchmark fact writer helpers ─────────────────────────────────

describe("BW.5 writeDiagnosticSubmitFact is exported from benchmark-fact-writers", () => {
  it("module exports the function", async () => {
    const mod = await import("@/lib/benchmarks/benchmark-fact-writers");
    expect(typeof mod.writeDiagnosticSubmitFact).toBe("function");
  });
});

describe("BW.6 writeOutcomeContributionFact is exported from benchmark-fact-writers", () => {
  it("module exports the function", async () => {
    const mod = await import("@/lib/benchmarks/benchmark-fact-writers");
    expect(typeof mod.writeOutcomeContributionFact).toBe("function");
  });
});

describe("BW.7 writeExecutiveReportFact is exported from benchmark-fact-writers", () => {
  it("module exports the function", async () => {
    const mod = await import("@/lib/benchmarks/benchmark-fact-writers");
    expect(typeof mod.writeExecutiveReportFact).toBe("function");
  });
});

describe("BW.8 writeReturnBriefFact is exported from benchmark-fact-writers", () => {
  it("module exports the function", async () => {
    const mod = await import("@/lib/benchmarks/benchmark-fact-writers");
    expect(typeof mod.writeReturnBriefFact).toBe("function");
  });
});

// ─── BW.9–BW.12: Write path source checks (static import validation) ──────────

describe("BW.9 contribute-outcome.ts imports writeOutcomeContributionFact", () => {
  it("source text includes writeOutcomeContributionFact import", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/api/cases/contribute-outcome.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("writeOutcomeContributionFact");
    expect(src).toContain("benchmark-fact-writers");
  });
});

describe("BW.10 submit.ts imports writeDiagnosticSubmitFact", () => {
  it("source text includes writeDiagnosticSubmitFact import", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/api/diagnostics/submit.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("writeDiagnosticSubmitFact");
    expect(src).toContain("benchmark-fact-writers");
  });
});

describe("BW.11 executive-reporting.ts imports writeExecutiveReportFact", () => {
  it("source text includes writeExecutiveReportFact import", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/api/diagnostics/executive-reporting.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("writeExecutiveReportFact");
    expect(src).toContain("benchmark-fact-writers");
  });
});

describe("BW.12 return-brief.ts imports writeReturnBriefFact", () => {
  it("source text includes writeReturnBriefFact import", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/api/cases/return-brief.ts",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("writeReturnBriefFact");
    expect(src).toContain("benchmark-fact-writers");
  });
});

// ─── BW.13–BW.15: Component surface presence ──────────────────────────────────

describe("BW.13 BenchmarkTeamAlignmentPanel is imported in team-assessment.tsx", () => {
  it("team-assessment page source imports BenchmarkTeamAlignmentPanel", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/diagnostics/team-assessment.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("BenchmarkTeamAlignmentPanel");
  });
});

describe("BW.14 BenchmarkNarrativeBlock is imported in executive-reporting/run.tsx", () => {
  it("executive reporting run page source imports BenchmarkNarrativeBlock", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/diagnostics/executive-reporting/run.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("BenchmarkNarrativeBlock");
  });
});

describe("BW.15 BenchmarkMovementSignal and BenchmarkCaseBadge are wired in product pages", () => {
  it("return-brief/[caseId].tsx imports BenchmarkMovementSignal", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/return-brief/[caseId].tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("BenchmarkMovementSignal");
  });

  it("decision-centre/case/[caseId].tsx imports BenchmarkCaseBadge", async () => {
    const fs = await import("fs/promises");
    const src = await fs.readFile(
      new URL(
        "../../pages/decision-centre/case/[caseId].tsx",
        import.meta.url,
      ),
      "utf8",
    );
    expect(src).toContain("BenchmarkCaseBadge");
  });
});
