"use client";

import React from "react";
import type { PurposeProfileResult } from "@/lib/alignment/types";
import IntelligenceGainPanel from "@/components/living/IntelligenceGainPanel";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import NextLayerUnlockedPanel from "@/components/living/NextLayerUnlockedPanel";
import DecisionAdvantageSummary from "@/components/living/DecisionAdvantageSummary";
import GovernedActionPanel from "@/components/living/GovernedActionPanel";
import HumanReviewPrompt from "@/components/living/HumanReviewPrompt";
import GovernanceDisclosure from "@/components/trust/GovernanceDisclosure";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";

type AnchorNarrative = {
  opening: string;
  condition: string;
  whyItExists: string;
  pattern: string;
  costOfInaction: { thirtyDays: string; sixtyDays: string; ninetyDays: string };
  requiredMove: string;
};

type Props = {
  result: PurposeProfileResult;
  contextAnswers: {
    avoidedDecision: string;
    competingObligation: string;
    consequence: string;
  };
  anchorNarrative: AnchorNarrative | null;
  socialProof: string;
  captureEmail: string;
  onCaptureEmailChange: (v: string) => void;
  onCaptureWithEmail: () => void;
  onCaptureAnonymous: () => void;
  captureBusy: boolean;
  captureMessage: string;
  analysisError: string;
  retryAnalysis: () => void;
};

const PAID_ADDITIONS = [
  "Full mandate clarity reading",
  "Obligation conflict map",
  "Alignment drift warning",
  "Execution integrity implication",
  "Personal decision constitution",
  "Decision Centre memory write",
  "PDF dossier",
  "Corridor bridge where justified",
];

export default function PurposeAlignmentFreeResultSurface({
  result,
  contextAnswers,
  anchorNarrative,
  socialProof,
  captureEmail,
  onCaptureEmailChange,
  onCaptureWithEmail,
  onCaptureAnonymous,
  captureBusy,
  captureMessage,
  analysisError,
  retryAnalysis,
}: Props) {
  const [copied, setCopied] = React.useState(false);

  function buildShareText() {
    const band = result.coherenceBand ?? "—";
    const pattern = result.primaryPattern?.label ?? "pattern identified";
    const lines = [
      `Personal Decision Audit — ${pattern} (${band})`,
      "",
      result.primaryPattern?.consequence ?? "",
      "",
      "Assessed at Abraham of London · abrahamoflondon.com/diagnostics/purpose-alignment",
      "Self-reported inputs only — not guaranteed outcomes",
    ];
    return lines.filter(Boolean).join("\n");
  }

  async function handleShare() {
    const text = buildShareText();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, title: "Personal Decision Audit", url: "https://abrahamoflondon.com/diagnostics/purpose-alignment" });
        return;
      } catch { /* fall through to clipboard */ }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const contradictionEvidence =
    result.contradictions?.slice(0, 3).map((c) => c.evidence) ?? [];
  const triggerInputs = [...(result.rawResponses ?? [])]
    .sort((a, b) => Math.abs(b.resonance - b.certainty) - Math.abs(a.resonance - a.certainty))
    .slice(0, 3);

  return (
    <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-[680px]">

        {/* Header with alignment band badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Personal decision audit · Free reading
          </div>
          <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            {result.coherenceBand ?? "—"}
          </span>
        </div>

        <h2 className="mt-4 font-serif text-4xl leading-tight text-neutral-950">
          {result.contradictions?.[0]
            ? `Your strongest contradiction is between ${result.contradictions[0].domains.join(" and ")}.`
            : `Your pattern: ${result.primaryPattern?.label ?? result.coherenceBand}`}
        </h2>
        <p className="mt-4 text-lg leading-8 text-neutral-800">
          This is not a personality result. It is a structural reading of the gap between what you say matters and what your behaviour actually serves.
        </p>
        {socialProof && (
          <p className="mt-4 border-l-2 border-[#8a6a2f] pl-4 text-sm leading-7 text-neutral-700">
            {socialProof}
          </p>
        )}

        <div className="mt-8">
          <ResultEmailCapture source="purpose_alignment" resultRef={result.createdAt} />
        </div>

        {/* Trust signals */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {["No account required", "Self-reported inputs — source labelled", "Not guaranteed outcomes"].map((signal) => (
            <span key={signal} className="text-[9px] uppercase tracking-[0.20em] text-neutral-400">
              {signal}
            </span>
          ))}
        </div>

        {/* Narrative */}
        {anchorNarrative ? (
          <>
            <p className="mt-8 text-base leading-8 text-neutral-800">{anchorNarrative.opening}</p>
            <div className="mt-8 grid gap-6">
              <section>
                <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Condition</div>
                <p className="mt-2 text-base leading-8 text-neutral-800">{anchorNarrative.condition}</p>
              </section>
              <section>
                <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Why this was selected</div>
                <p className="mt-2 text-base leading-8 text-neutral-800">{anchorNarrative.whyItExists}</p>
              </section>
              <section>
                <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Pattern</div>
                <p className="mt-2 text-base leading-8 text-neutral-800">{anchorNarrative.pattern}</p>
              </section>
            </div>
          </>
        ) : (
          <>
            <p className="mt-8 text-base leading-8 text-neutral-800">
              {result.reportNarrative?.classificationExplanation ?? result.narrative}
            </p>
            <p className="mt-4 text-base leading-8 text-neutral-800">
              {result.reportNarrative?.contradictionExplanation ??
                `The active tension is between "${contextAnswers.avoidedDecision}" and "${contextAnswers.competingObligation}".`}
            </p>
          </>
        )}

        {/* Cost of inaction */}
        <section className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Cost of inaction</div>
          <div className="mt-4 grid gap-4">
            <p className="text-base leading-8 text-neutral-900">
              <span className="font-semibold">30 days</span> →{" "}
              {anchorNarrative?.costOfInaction.thirtyDays ?? "Friction compounds and the avoided decision begins governing your calendar."}
            </p>
            <p className="text-base leading-8 text-neutral-900">
              <span className="font-semibold">60 days</span> →{" "}
              {anchorNarrative?.costOfInaction.sixtyDays ?? "Identity drift appears because pressure keeps teaching the wrong operating rule."}
            </p>
            <p className="text-base leading-8 text-neutral-900">
              <span className="font-semibold">90 days</span> →{" "}
              {anchorNarrative?.costOfInaction.ninetyDays ?? "Structural damage settles in and the pattern becomes how decisions are made."}
            </p>
          </div>
        </section>

        {/* Obligation conflict signal */}
        {contextAnswers.competingObligation && (
          <section className="mt-10">
            <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Obligation conflict signal</div>
            <p className="mt-2 text-base leading-8 text-neutral-800">
              You named this as the force pulling against your decision: &ldquo;{contextAnswers.competingObligation}&rdquo;
            </p>
            <p className="mt-2 text-sm leading-7 text-neutral-600">
              The system reads this as the likely reason your stated priority is not converting into action. Until this is renegotiated, removed, or directly confronted, the pattern will recur.
            </p>
          </section>
        )}

        {/* Execution risk implication — brief signal, not full analysis */}
        {result.primaryPattern?.consequence && (
          <section className="mt-8 rounded-[16px] border border-amber-200/40 bg-amber-50/30 p-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-amber-800/60">Execution risk implication</div>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              {result.primaryPattern.consequence}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
              Full execution integrity analysis included in the paid assessment
            </p>
          </section>
        )}

        {/* One correction move */}
        <section className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#8a6a2f]">One correction move</div>
          <p className="mt-2 text-base leading-8 text-neutral-900">
            {anchorNarrative?.requiredMove ?? result.firstAction ?? result.corrections[0]}
          </p>
        </section>

        {/* Analysis error */}
        {analysisError && (
          <div className="mt-10 rounded-[24px] border border-amber-300 bg-amber-50 p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-amber-800">
              Analysis interrupted
            </div>
            <p className="mt-2 text-sm leading-7 text-neutral-800">
              We could not complete analysis. Your responses are saved. Retry?
            </p>
            <p className="mt-2 text-sm leading-7 text-neutral-700">{analysisError}</p>
            <button
              type="button"
              onClick={retryAnalysis}
              className="mt-4 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
            >
              Retry analysis
            </button>
          </div>
        )}

        {/* Evidence transparency */}
        <details className="mt-10 rounded-[24px] border border-neutral-200 bg-[#fbfaf7] p-5">
          <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
            How this was determined
          </summary>
          <div className="mt-5 grid gap-5 text-sm leading-7 text-neutral-700">
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">You indicated</div>
              <ul className="mt-2 grid gap-2">
                <li>{contextAnswers.avoidedDecision}</li>
                <li>{contextAnswers.competingObligation}</li>
                <li>{contextAnswers.consequence}</li>
                {triggerInputs.map((item) => (
                  <li key={item.questionId}>
                    {item.statement} → resonance {item.resonance}/10, certainty {item.certainty}/10
                  </li>
                ))}
              </ul>
            </div>
            {contradictionEvidence.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Contradiction mapping</div>
                <ul className="mt-2 grid gap-2">
                  {contradictionEvidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">Pattern trigger explanation</div>
              <p className="mt-2">
                This combination typically produces {result.primaryPattern?.label ?? "the current pattern"} because{" "}
                {result.primaryPattern?.reasons.slice(0, 2).join(" ") ?? "the weakest domain and contradiction evidence align."}
              </p>
            </div>
          </div>
        </details>

        {/* Save result section */}
        <section className="mt-10 rounded-[24px] border border-neutral-200 bg-[#fbfaf7] p-5">
          <div className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Save your result and track this pattern
          </div>
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            Re-evaluate in 14 days after the first structural correction.
          </p>
          <div className="mt-4 grid gap-3">
            <input
              type="email"
              value={captureEmail}
              onChange={(e) => onCaptureEmailChange(e.target.value)}
              placeholder="Email for reassessment link"
              className="w-full rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={captureBusy || captureEmail.trim().length === 0}
                onClick={onCaptureWithEmail}
                className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Save with email
              </button>
              <button
                type="button"
                disabled={captureBusy}
                onClick={onCaptureAnonymous}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
              >
                Continue anonymously
              </button>
            </div>
            {captureMessage && (
              <p className="text-sm leading-7 text-neutral-700">{captureMessage}</p>
            )}
          </div>
        </section>

        {/* Share result */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-[10px] uppercase tracking-[0.20em] text-neutral-500 transition hover:border-neutral-300 hover:text-neutral-800"
          >
            {copied ? "Copied" : "Copy result summary"}
          </button>
          <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-400">
            Self-reported · No outcome guaranteed
          </span>
        </div>

        {/* Recommended next instrument */}
        <section className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#8a6a2f]">Recommended next instrument</div>
          {(() => {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { recommendNextInstrument } = require("@/lib/commercial/recommendation-engine");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { ProductRecommendationCard } = require("@/components/commercial/ProductRecommendationCard");
            const weakest = result.weakestDomains?.[0] ?? null;
            const rec = recommendNextInstrument({
              sourceSurface: "personal_decision_audit" as const,
              weakestDomain: weakest,
              primaryPattern: result.primaryPattern?.id ?? null,
              competingObligationDominant: Boolean(contextAnswers.competingObligation && contextAnswers.competingObligation.length > 10),
              authorityGap: weakest === "identity" || weakest === "decision",
              interventionUnclear: weakest === "behaviour" || weakest === "environment",
              consequenceHigh: result.severity === "high" || result.severity === "critical",
              institutionalStakes: Boolean(contextAnswers.consequence && /(organisation|company|team|board|institution|staff|revenue)/i.test(contextAnswers.consequence)),
              evidenceInsufficient: result.percent < 30,
            });
            return rec ? (
              <div className="mt-3">
                <ProductRecommendationCard recommendation={rec} variant="compact" />
              </div>
            ) : (
              <p className="mt-2 text-sm leading-7 text-neutral-700">
                The next step is to test this pattern against your wider operating system.
              </p>
            );
          })()}
        </section>

        {/* Paid continuation panel — the governed assessment CTA */}
        <section className="mt-8 rounded-[24px] border border-[#C9A96E]/30 bg-[#C9A96E]/5 p-6">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8a6a2f]/70">
            Governed assessment · £49 · One-time payment · Lifetime access
          </div>
          <h3 className="mt-3 font-serif text-2xl leading-tight text-neutral-950">
            This free reading identifies the visible pattern.
          </h3>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            The paid assessment tests the mandate structure behind it.
          </p>
          <div className="mt-5">
            <div className="mb-3 text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              What the governed assessment adds
            </div>
            <div className="grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
              {PAID_ADDITIONS.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 font-medium text-[#8a6a2f]">—</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-[11px] leading-6 italic text-neutral-500">
            This free reading is intentionally limited. It identifies the visible pattern. The paid assessment tests the mandate structure behind it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/checkout/personal-decision-audit"
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
            >
              Continue to the governed assessment
            </a>
            <a
              href={`/.netlify/functions/purpose-alignment-report?ts=${encodeURIComponent(result.createdAt)}`}
              className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700"
            >
              Download free report
            </a>
          </div>
          <p className="mt-3 text-[10px] leading-5 text-neutral-400">
            No recurring charge. Price includes PDF dossier, Decision Centre memory record, and corridor bridge where the evidence justifies it.
          </p>
        </section>

        {/* Living intelligence panels */}
        <div className="mt-8 space-y-4">
          <IntelligenceGainPanel
            stage="Purpose Alignment"
            findings={[
              { label: "Pattern", value: result.primaryPattern?.label ?? "Pattern identified" },
              { label: "Coherence", value: result.coherenceBand ?? "—" },
              ...(result.firstAction ? [{ label: "First action", value: result.firstAction }] : []),
              ...(result.corrections?.length ? [{ label: "Corrections", value: `${result.corrections.length} identified` }] : []),
              ...(contextAnswers.avoidedDecision ? [{ label: "Avoided", value: contextAnswers.avoidedDecision }] : []),
            ]}
          />
          <EvidenceStrengthMeter
            level="single_source"
            stagesCompleted={2}
            whatWouldStrengthen="Continue to Constitutional Diagnostic to reveal whether this internal conflict has structural consequences."
          />
          {result.firstAction && (
            <GovernedActionPanel
              requiredAction={result.firstAction}
              whyThisAction={result.primaryPattern?.reasons?.[0] ?? null}
              whatProvesProgress="Complete the first action within 14 days. The system tracks whether the alignment pattern improves or repeats."
              whatHappensNext="Constitutional Diagnostic reveals structural posture. Team Assessment reveals execution divergence."
            />
          )}
          <DecisionAdvantageSummary
            advantages={[
              ...(result.primaryPattern ? [{ label: "Internal authority conflict named", description: result.primaryPattern.label }] : []),
              ...(contextAnswers.avoidedDecision ? [{ label: "Avoided decision surfaced", description: contextAnswers.avoidedDecision }] : []),
              ...(contextAnswers.competingObligation ? [{ label: "Competing obligation identified", description: contextAnswers.competingObligation }] : []),
            ]}
            confidenceBand={result.coherenceBand === "SOVEREIGN" || result.coherenceBand === "ALIGNED" ? "high" : result.coherenceBand === "DRIFTING" ? "medium" : "low"}
            limitations={["Purpose alignment is self-assessed. Combine with team or constitutional assessment for structural validation."]}
          />
          <NextLayerUnlockedPanel
            currentStage="Purpose Alignment"
            nextStage={{
              name: "Constitutional Diagnostic",
              href: "/diagnostics/constitutional-diagnostic",
              whatItDetects: "Whether this internal conflict has structural consequences — governance posture, authority clarity, and institutional readiness.",
              whyContinue: "Purpose alignment reveals conviction vs obligation. Constitutional assessment reveals whether the structure supports or undermines your intent.",
            }}
            unresolvedItems={result.corrections?.slice(0, 2)}
          />
          <HumanReviewPrompt context="Purpose Alignment" />
          <GovernanceDisclosure context="purpose_alignment" compact />
        </div>
      </div>
    </div>
  );
}
