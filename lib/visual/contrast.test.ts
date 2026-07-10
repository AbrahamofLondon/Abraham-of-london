/**
 * lib/visual/contrast.test.ts
 *
 * Known-answer control cases for the contrast/compositing algorithm.
 * Required by the Phase 0 closure review: the algorithm itself must be
 * proven correct before it's trusted as the source of Phase 0/2 baseline
 * numbers.
 */
import { describe, it, expect } from "vitest";
import { parseRgba, composite, relativeLuminance, contrastRatio, measureContrast } from "./contrast";

describe("parseRgba", () => {
  it("parses rgb() with default alpha 1", () => {
    expect(parseRgba("rgb(255, 255, 255)")).toEqual([255, 255, 255, 1]);
  });
  it("parses rgba() with explicit alpha", () => {
    expect(parseRgba("rgba(255, 255, 255, 0.3)")).toEqual([255, 255, 255, 0.3]);
  });
  it("handles no-space compact form", () => {
    expect(parseRgba("rgba(3,3,5,0.2)")).toEqual([3, 3, 5, 0.2]);
  });
});

describe("relativeLuminance — known WCAG reference values", () => {
  it("pure white has luminance 1", () => {
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 4);
  });
  it("pure black has luminance 0", () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 4);
  });
  it("mid-grey (128,128,128) has luminance ~0.2158 per WCAG formula", () => {
    // Independently verified reference value for sRGB 128,128,128.
    expect(relativeLuminance([128, 128, 128])).toBeCloseTo(0.21586, 3);
  });
});

describe("contrastRatio — known WCAG reference pairs", () => {
  it("black on white is exactly 21:1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 1);
  });
  it("white on black is exactly 21:1 (order-independent)", () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
  });
  it("identical colours are exactly 1:1", () => {
    expect(contrastRatio([100, 100, 100], [100, 100, 100])).toBeCloseTo(1, 4);
  });
  it("mid-grey on black is approximately 5.32:1 (independently known reference)", () => {
    expect(contrastRatio([128, 128, 128], [0, 0, 0])).toBeCloseTo(5.32, 1);
  });
});

describe("measureContrast — the alpha-compositing bug regression test", () => {
  // This is the exact case that was measured WRONG in the first Phase 0
  // pass: rgba(255,255,255,0.3) on rgb(3,3,5) was reported as ~20.6:1
  // (treating the foreground as opaque white) when the correct,
  // properly-composited answer is ~2.5:1. This test locks the fix in.
  it("rgba(255,255,255,0.3) on rgb(3,3,5) composites to ~2.5:1, NOT ~20.6:1", () => {
    const ratio = measureContrast("rgba(255, 255, 255, 0.3)", [3, 3, 5]);
    expect(ratio).toBeGreaterThan(2.3);
    expect(ratio).toBeLessThan(2.7);
    expect(ratio).not.toBeGreaterThan(10); // guards against the alpha-discarding regression
  });

  it("fully opaque white on near-black composites the same as plain contrastRatio", () => {
    const viaMeasure = measureContrast("rgb(255, 255, 255)", [3, 3, 5]);
    const viaDirect = contrastRatio([255, 255, 255], [3, 3, 5]);
    expect(viaMeasure).toBeCloseTo(viaDirect, 4);
  });

  it("fully transparent foreground (alpha 0) composites to exactly the background colour (ratio 1:1)", () => {
    const ratio = measureContrast("rgba(255, 255, 255, 0)", [3, 3, 5]);
    expect(ratio).toBeCloseTo(1, 4);
  });

  it("the measured placeholder case from the reference surface matches the recorded baseline", () => {
    // rgba(255,255,255,0.2) on rgb(3,3,5) — recorded in contrast-baseline.csv
    // as compositedRgb (53,53,55), ratio 1.69.
    const ratio = measureContrast("rgba(255, 255, 255, 0.2)", [3, 3, 5]);
    expect(ratio).toBeCloseTo(1.69, 1);
  });
});

describe("composite", () => {
  it("opaque foreground ignores background entirely", () => {
    expect(composite([10, 20, 30, 1], [200, 200, 200])).toEqual([10, 20, 30]);
  });
  it("50% alpha averages foreground and background", () => {
    const [r, g, b] = composite([100, 100, 100, 0.5], [0, 0, 0]);
    expect(r).toBeCloseTo(50, 4);
    expect(g).toBeCloseTo(50, 4);
    expect(b).toBeCloseTo(50, 4);
  });
});
