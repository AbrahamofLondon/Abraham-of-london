/**
 * lib/intelligence/accountability/dii-cross-moat-bridge.ts
 *
 * §8 — DII → cross-moat integration.
 *
 * Feeds the Market Decision Integrity Index into cross-moat briefs.
 * This is an INTERNAL module — it must NOT be used on public surfaces
 * without verified evidence.
 */
import { calculateEditionDii, type VerifiedMarketEvidence } from "./market-decision-integrity-index";
import { DII_METHODOLOGY } from "./dii-methodology-authority";

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

export function buildDiicontextInput(editionId: string, evidence?: VerifiedMarketEvidence): DiicontextInput | null {
  const editionDii = calculateEditionDii(editionId, evidence);
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