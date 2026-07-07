/**
 * lib/intelligence/accountability/dii-cross-moat-bridge.ts
 *
 * §8 — DII → cross-moat integration.
 *
 * Feeds the Market Decision Integrity Index into the existing buildCrossMoatBrief
 * function in compounding-intelligence.ts. The GmiEditionView already has a
 * `dii: number | null` field — this bridge ensures the DII is populated from
 * the canonical methodology authority before the cross-moat brief is built.
 */
import { calculateEditionDii } from "./market-decision-integrity-index";
import { DII_METHODOLOGY } from "./dii-methodology-authority";
import type { GmiEditionView } from "../compounding/compounding-intelligence";

export interface DiicontextInput {
  editionId: string;
  marketDii: {
    methodologyVersion: string;
    scoreState: "INSUFFICIENT_COVERAGE" | "PRELIMINARY" | "PUBLISHABLE";
    headlineScore: number | null;
    coverage: { status: string; scoredCalls: number; totalCalls: number };
    componentScores: Array<{ measure: string; score: number; weight: number }>;
  };
  relevantCalls: number;
  falsificationEvents: number;
  calibrationTrend: string;
}

export function enrichEditionWithDii(edition: GmiEditionView): GmiEditionView {
  const editionDii = calculateEditionDii(edition.editionId);
  if (!editionDii || editionDii.diiScore === null) {
    return { ...edition, dii: null };
  }
  return { ...edition, dii: editionDii.diiScore };
}

export function buildDiicontextInput(editionId: string): DiicontextInput | null {
  const editionDii = calculateEditionDii(editionId);
  if (!editionDii) return null;
  return {
    editionId,
    marketDii: {
      methodologyVersion: DII_METHODOLOGY.methodologyVersion,
      scoreState: editionDii.publicationStatus as any,
      headlineScore: editionDii.diiScore,
      coverage: { status: editionDii.coverage.status, scoredCalls: editionDii.coverage.scoredCalls, totalCalls: editionDii.coverage.totalCalls },
      componentScores: editionDii.componentScores.map(c => ({ measure: c.measure, score: c.score, weight: c.weight })),
    },
    relevantCalls: editionDii.callCount,
    falsificationEvents: 0,
    calibrationTrend: "stable",
  };
}
