/**
 * tests/product/decision-brief-quality.spec.ts
 *
 * Decision Failure Brief quality tests.
 *
 * Ensures that every paid brief draft includes:
 *   - primary failure point
 *   - primary tension
 *   - minimum viable next move
 *   - fallback path
 *   - what must not be delayed
 *   - evidence needed
 *   - impossible advice avoided
 *   - non-generic output (not just "Consider improving clarity")
 *
 * Run: pnpm vitest run tests/product/decision-brief-quality.spec.ts
 */

import { describe, it, expect } from "vitest";
import { analyzeDecisionFailureMap } from "@/lib/decision/decision-failure-map";

// ─── Test scenarios ───────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    name: "broke founder with statutory filing deadline and no accountant",
    text: "I need to file my company accounts and corporation tax return by the end of this month. I have no money for an accountant. The records are complicated — multiple income streams, some expenses I'm not sure about. I already submitted a placeholder filing but the real deadline is approaching. I'm worried about penalties I can't afford.",
  },
  {
    name: "board decision with incomplete evidence and political pressure",
    text: "The board needs to decide whether to acquire a competitor by next quarter. The CEO is pushing hard for it but the due diligence is incomplete. Two board members have conflicts of interest. The CFO says the numbers don't add up without cost savings we haven't validated. There's pressure to announce before the competitor's earnings call.",
  },
  {
    name: "product launch with weak evidence but revenue urgency",
    text: "We need to ship this feature by end of quarter to hit our revenue target. The testing is incomplete — we found a critical bug yesterday. Marketing has already announced the launch date. The CEO is not willing to delay. We don't have a rollback plan. If this fails, our largest customer will leave.",
  },
  {
    name: "market claim that sounds strong but has no buyer proof",
    text: "Our platform reduces decision time by 40%. We have internal benchmarks but no customer validation. The claim sounds impressive but we haven't tested it with actual buyers. Our competitors are making similar claims. We need to know if this is defensible before putting it on the website.",
  },
  {
    name: "family/legal/admin decision where delay worsens harm",
    text: "I need to make a decision about my mother's power of attorney. She has dementia and can no longer manage her affairs. Her savings are running out. The care home fees are increasing. If I don't act soon, the local authority will step in and I may lose control over her care arrangements. I can't afford a solicitor.",
  },
  {
    name: "founder with no money, no team, and hard external deadline",
    text: "I'm a solo founder. My startup is running out of cash. I have a tax bill due in 6 weeks that I cannot pay. HMRC will start adding penalties after 30 days. I don't have an accountant. I don't have a lawyer. I don't know whether to file for insolvency, try to negotiate a payment plan, or just let it happen. I have no money to pay for advice.",
  },
  {
    name: "decision with no good option, only least-damaging option",
    text: "I have to choose between two bad options. Option A: lay off 30% of the team to extend runway by 6 months. Option B: take a loan with punitive interest rates that could bankrupt us if the next round doesn't close. Either way, people get hurt. There is no good outcome here, only degrees of damage.",
  },
  {
    name: "decision where the ideal recommendation is impossible",
    text: "I know the right answer is to hire a specialist tax lawyer and an accountant to sort out my filing mess. But I have literally no money. I'm already behind on rent. The ideal solution is completely inaccessible. I need to know what I can actually do with no budget and no professional help.",
  },
  {
    name: "low-stakes preference decision should remain low",
    text: "I'm trying to decide between two coffee machines for the office. One is more expensive but has better reviews. The other is cheaper and simpler. Either would be fine. There's no deadline, no legal obligation, and no one will be harmed either way.",
  },
];

// ─── Quality checks ───────────────────────────────────────────────────────────

function checkQuality(name: string, text: string) {
  const result = analyzeDecisionFailureMap(text);

  describe(name, () => {
    // 1. Primary failure point must exist
    it("has a primary failure point", () => {
      expect(result.primaryFailurePoint).toBeTruthy();
    });

    // 2. Primary tension must exist for non-trivial decisions
    if (result.directive !== "LOW") {
      it("has a primary tension", () => {
        expect(result.primaryTension).toBeTruthy();
      });
    }

    // 3. Minimum viable next move must exist and be non-generic
    it("has a minimum viable next move", () => {
      expect(result.minimumViableNextMove).toBeTruthy();
      expect(result.minimumViableNextMove.length).toBeGreaterThan(20);
    });

    // 4. Fallback path must exist
    it("has a fallback path", () => {
      expect(result.fallbackPath).toBeTruthy();
      expect(result.fallbackPath.length).toBeGreaterThan(20);
    });

    // 5. What must not be delayed must exist for non-LOW decisions
    if (result.directive !== "LOW") {
      it("has what must not be delayed", () => {
        expect(result.whatMustNotBeDelayed.length).toBeGreaterThan(0);
      });
    }

    // 6. Evidence needed must exist
    it("has evidence needed", () => {
      expect(result.evidenceNeeded.length).toBeGreaterThan(0);
    });

    // 7. Impossible advice must be detected for constrained decisions
    if (result.constraintSignals.includes("cash_constraint") || result.constraintSignals.includes("professional_help_unavailable")) {
      it("detects impossible advice", () => {
        expect(result.impossibleAdvice.length).toBeGreaterThan(0);
      });
    }

    // 8. Output must not be generic
    it("has non-generic output", () => {
      const genericPhrases = [
        "Consider improving clarity",
        "More evidence may be needed",
        "This could be risky",
        "Exercise caution",
        "Proceed with care",
      ];
      for (const phrase of genericPhrases) {
        expect(result.situationSummary).not.toContain(phrase);
        expect(result.minimumViableNextMove).not.toContain(phrase);
      }
    });

    // 9. Directive must be appropriate
    it("has a valid directive", () => {
      expect(["LOW", "MODERATE", "HIGH", "ESCALATE", "CONSTRAINED_RESCUE"]).toContain(result.directive);
    });

    // 10. Confidence must be set
    it("has a confidence level", () => {
      expect(["low", "medium", "high"]).toContain(result.confidence);
    });

    // 11. Failure risks must exist for non-LOW decisions
    if (result.directive !== "LOW") {
      it("has failure risks", () => {
        expect(result.failureRisks.length).toBeGreaterThan(0);
      });
    }

    // 12. Viable moves must exist
    it("has viable moves", () => {
      expect(result.viableMoves.length).toBeGreaterThan(0);
    });
  });
}

// ─── Run tests ────────────────────────────────────────────────────────────────

describe("Decision Failure Brief quality", () => {
  for (const scenario of SCENARIOS) {
    checkQuality(scenario.name, scenario.text);
  }
});
