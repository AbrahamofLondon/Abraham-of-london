"use client";

import React from "react";
import type { PurposeProfileResult } from "@/lib/alignment/types";
import type { PurposeAlignmentPaidResult } from "@/lib/alignment/purpose-alignment-paid-contract";
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
  paidResult: PurposeAlignmentPaidResult;
  contextAnswers: {
    avoidedDecision: string;
    competingObligation: string;
    consequence: string;
  };
  anchorNarrative: AnchorNarrative | null;
  socialProof: string;
  assessmentId: string;
  analysisError: string;
  retryAnalysis: () => void;
};

const VALUE_RECEIPT = [
  "Mandate clarity reading",
  "Obligation conflict map",
  "Decision behaviour pattern",
  "Alignment drift warning",
  "Execution integrity implication",
  "Personal decision constitution",
  "Next admissible move",
  "Decision Centre memory record",
  "PDF dossier",
  "Corridor bridge where justified",
];

function DossierSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-neutral-100 pt-6 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3">
        <span className="mt-0.5 font-mono text-[10px] text-neutral-400">
          {String(number).padStart(2, "0")}
        </span>
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#8a6a2f]/70">{title}</div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">{children}</div>
  );
}

function FieldBody({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm leading-7 text-neutral-700">{children}</p>;
}

function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "amber" | "red" | "green";
}) {
  const colors = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    green: "border-green-200 bg-green-50 text-green-700",
  };
  return (
    <span className={`inline-block rounded-full border px-3 py-0.5 text-[11px] ${colors[variant]}`}>
      {children}
    </span>
  );
}

export default function PurposeAlignmentPaidResultSurface({
  result,
  paidResult,
  contextAnswers,
  anchorNarrative,
  socialProof,
  assessmentId,
  analysisError,
  retryAnalysis,
}: Props) {
  const {
    mandateReading,
    obligationConflictMap,
    decisionBehaviourPattern,
    alignmentDriftWarning,
    executionIntegrityImplication,
    personalDecisionConstitution,
    nextAdmissibleMove,
    decisionCentreMemory,
    pdfDossier,
    corridorBridge,
  } = paidResult;

  const escalationHref =
    corridorBridge.bridgeJustified && corridorBridge.targetSurface !== "NONE"
      ? corridorBridge.targetSurface === "STRATEGY_ROOM"
        ? "/strategy-room"
        : "/diagnostics/executive-reporting"
      : "/diagnostics/constitutional-diagnostic";

  return (
    <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-[680px]">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">
            Personal decision audit · Paid mandate dossier
          </div>
          <span className="shrink-0 rounded-full border border-[#C9A96E]/40 bg-[#C9A96E]/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#8a6a2f]">
            {result.coherenceBand ?? "—"}
          </span>
        </div>

        <h2 className="mt-4 font-serif text-4xl leading-tight text-neutral-950">
          {result.contradictions?.[0]
            ? `Your strongest contradiction is between ${result.contradictions[0].domains.join(" and ")}.`
            : `Your pattern: ${result.primaryPattern?.label ?? result.coherenceBand}`}
        </h2>
        <p className="mt-4 text-lg leading-8 text-neutral-800">
          {mandateReading.operatingMandateSentence}
        </p>
        {socialProof && (
          <p className="mt-4 border-l-2 border-[#8a6a2f] pl-4 text-sm leading-7 text-neutral-700">
            {socialProof}
          </p>
        )}

        <div className="mt-8">
          <ResultEmailCapture source="purpose_alignment" resultRef={result.createdAt} />
        </div>

        {/* Value receipt */}
        <section className="mt-8 rounded-[20px] border border-[#C9A96E]/25 bg-[#C9A96E]/5 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#8a6a2f]/70">
            Your paid assessment produced
          </div>
          <div className="mt-3 grid gap-1.5 text-sm text-neutral-700 sm:grid-cols-2">
            {VALUE_RECEIPT.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="text-[#8a6a2f]">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Anchor narrative if present */}
        {anchorNarrative && (
          <div className="mt-8 grid gap-6">
            <p className="text-base leading-8 text-neutral-800">{anchorNarrative.opening}</p>
            <section>
              <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Condition</div>
              <p className="mt-2 text-base leading-8 text-neutral-800">{anchorNarrative.condition}</p>
            </section>
            <section>
              <div className="text-[11px] uppercase tracking-[0.24em] text-neutral-500">Pattern</div>
              <p className="mt-2 text-base leading-8 text-neutral-800">{anchorNarrative.pattern}</p>
            </section>
          </div>
        )}

        {/* ═══ MANDATE DOSSIER ═══ */}
        <div className="mt-10 grid gap-6">

          {/* 01 — Mandate Reading */}
          <DossierSection number={1} title="Mandate clarity reading">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Declared mandate</FieldLabel>
                <FieldBody>{mandateReading.declaredMandate}</FieldBody>
              </div>
              <div>
                <FieldLabel>Inferred mandate pressure</FieldLabel>
                <FieldBody>{mandateReading.inferredMandatePressure}</FieldBody>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <FieldLabel>Alignment band</FieldLabel>
                  <div className="mt-1">
                    <Badge>{mandateReading.alignmentBand.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <div>
                  <FieldLabel>Mandate viability</FieldLabel>
                  <div className="mt-1">
                    <Badge
                      variant={
                        mandateReading.mandateViability === "VIABLE"
                          ? "green"
                          : mandateReading.mandateViability === "FRAGILE"
                            ? "amber"
                            : "red"
                      }
                    >
                      {mandateReading.mandateViability}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Operating mandate</FieldLabel>
                <p className="mt-2 rounded-[12px] border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-3 text-sm italic leading-7 text-neutral-800">
                  {mandateReading.operatingMandateSentence}
                </p>
              </div>
            </div>
          </DossierSection>

          {/* 02 — Obligation Conflict Map */}
          <DossierSection number={2} title="Obligation conflict map">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Primary competing obligation</FieldLabel>
                <FieldBody>{obligationConflictMap.primaryCompetingObligation}</FieldBody>
              </div>
              <div>
                <FieldLabel>Distortion effect</FieldLabel>
                <FieldBody>{obligationConflictMap.distortionEffect}</FieldBody>
              </div>
              <div>
                <FieldLabel>Obligation nature</FieldLabel>
                <div className="mt-1">
                  <Badge>{obligationConflictMap.obligationNature.replace(/_/g, " ")}</Badge>
                </div>
              </div>
              {obligationConflictMap.renegotiationPath && (
                <div>
                  <FieldLabel>Renegotiation path</FieldLabel>
                  <FieldBody>{obligationConflictMap.renegotiationPath}</FieldBody>
                </div>
              )}
              <div>
                <FieldLabel>Carrying cost</FieldLabel>
                <FieldBody>{obligationConflictMap.carryingCost}</FieldBody>
              </div>
              <div>
                <FieldLabel>Consequence if unresolved</FieldLabel>
                <FieldBody>{obligationConflictMap.consequenceIfUnresolved}</FieldBody>
              </div>
            </div>
          </DossierSection>

          {/* 03 — Decision Behaviour Pattern */}
          <DossierSection number={3} title="Decision behaviour pattern">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Primary pattern</FieldLabel>
                <div className="mt-1 text-[13px] font-semibold text-neutral-900">
                  {decisionBehaviourPattern.primaryPattern.label}
                </div>
                <FieldBody>{decisionBehaviourPattern.manifestation}</FieldBody>
              </div>
              {decisionBehaviourPattern.secondaryPattern && (
                <div>
                  <FieldLabel>Secondary pattern</FieldLabel>
                  <FieldBody>{decisionBehaviourPattern.secondaryPattern.label}</FieldBody>
                </div>
              )}
              <div>
                <FieldLabel>Trigger conditions</FieldLabel>
                <ul className="mt-2 grid gap-1.5">
                  {decisionBehaviourPattern.triggerConditions.map((trigger) => (
                    <li key={trigger} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="mt-0.5 text-[#8a6a2f]">—</span>
                      <span>{trigger}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <FieldLabel>Recurrence risk</FieldLabel>
                <div className="mt-1">
                  <Badge
                    variant={
                      decisionBehaviourPattern.recurrenceRisk === "HIGH"
                        ? "red"
                        : decisionBehaviourPattern.recurrenceRisk === "MEDIUM"
                          ? "amber"
                          : "green"
                    }
                  >
                    {decisionBehaviourPattern.recurrenceRisk}
                  </Badge>
                </div>
              </div>
              <div>
                <FieldLabel>Historical resolution</FieldLabel>
                <FieldBody>{decisionBehaviourPattern.historicalResolution}</FieldBody>
              </div>
            </div>
          </DossierSection>

          {/* 04 — Alignment Drift Warning */}
          <DossierSection number={4} title="Alignment drift warning">
            <div className="grid gap-4">
              {alignmentDriftWarning.driftActive && (
                <div className="rounded-[12px] border border-amber-200/50 bg-amber-50/50 p-3">
                  <FieldLabel>Drift active</FieldLabel>
                  <FieldBody>{alignmentDriftWarning.driftDirection}</FieldBody>
                </div>
              )}
              {!alignmentDriftWarning.driftActive && (
                <div>
                  <FieldLabel>Drift direction</FieldLabel>
                  <FieldBody>{alignmentDriftWarning.driftDirection}</FieldBody>
                </div>
              )}
              <div>
                <FieldLabel>Projected trajectory</FieldLabel>
                <div className="mt-2 grid gap-3">
                  <p className="text-sm leading-7 text-neutral-700">
                    <span className="font-semibold">30 days</span> → {alignmentDriftWarning.projectedStateAt30Days}
                  </p>
                  <p className="text-sm leading-7 text-neutral-700">
                    <span className="font-semibold">60 days</span> → {alignmentDriftWarning.projectedStateAt60Days}
                  </p>
                  <p className="text-sm leading-7 text-neutral-700">
                    <span className="font-semibold">90 days</span> → {alignmentDriftWarning.projectedStateAt90Days}
                  </p>
                </div>
              </div>
              <div>
                <FieldLabel>Corrective vector</FieldLabel>
                <FieldBody>{alignmentDriftWarning.correctiveVector}</FieldBody>
              </div>
            </div>
          </DossierSection>

          {/* 05 — Execution Integrity Implication */}
          <DossierSection number={5} title="Execution integrity implication">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <FieldLabel>Integrity score</FieldLabel>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold text-neutral-900">
                      {executionIntegrityImplication.integrityScore}
                    </span>
                    <span className="text-sm text-neutral-500">/100</span>
                  </div>
                </div>
                <div>
                  <FieldLabel>Impact</FieldLabel>
                  <div className="mt-1">
                    <Badge variant={executionIntegrityImplication.integrityImpacted ? "red" : "green"}>
                      {executionIntegrityImplication.integrityImpacted ? "Impacted" : "Stable"}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <FieldLabel>Execution manifestation</FieldLabel>
                <FieldBody>{executionIntegrityImplication.executionManifestation}</FieldBody>
              </div>
              <div>
                <FieldLabel>Execution risk</FieldLabel>
                <FieldBody>{executionIntegrityImplication.executionRisk}</FieldBody>
              </div>
              {executionIntegrityImplication.mustProtect.length > 0 && (
                <div>
                  <FieldLabel>Must protect</FieldLabel>
                  <ul className="mt-2 grid gap-1.5">
                    {executionIntegrityImplication.mustProtect.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="mt-0.5 text-green-600">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {executionIntegrityImplication.mustStop.length > 0 && (
                <div>
                  <FieldLabel>Must stop</FieldLabel>
                  <ul className="mt-2 grid gap-1.5">
                    {executionIntegrityImplication.mustStop.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="mt-0.5 text-red-500">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DossierSection>

          {/* 06 — Personal Decision Constitution */}
          <DossierSection number={6} title="Personal decision constitution">
            <div className="grid gap-4">
              <div>
                <FieldLabel>Governing principle</FieldLabel>
                <p className="mt-2 rounded-[12px] border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-3 text-sm italic leading-7 text-neutral-800">
                  {personalDecisionConstitution.governingPrinciple}
                </p>
              </div>
              <div>
                <FieldLabel>Decision rules</FieldLabel>
                <ul className="mt-2 grid gap-1.5">
                  {personalDecisionConstitution.decisionRules.map((rule, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                      <span className="mt-0.5 font-mono text-[10px] text-neutral-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <FieldLabel>Decision rights statement</FieldLabel>
                <FieldBody>{personalDecisionConstitution.decisionRightsStatement}</FieldBody>
              </div>
              {personalDecisionConstitution.escalationTriggers.length > 0 && (
                <div>
                  <FieldLabel>Escalation triggers</FieldLabel>
                  <ul className="mt-2 grid gap-1.5">
                    {personalDecisionConstitution.escalationTriggers.map((trigger, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="mt-0.5 text-amber-600">!</span>
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {personalDecisionConstitution.contestedObligations.length > 0 && (
                <div>
                  <FieldLabel>Contested obligations</FieldLabel>
                  <ul className="mt-2 grid gap-1.5">
                    {personalDecisionConstitution.contestedObligations.map((ob, i) => (
                      <li key={i} className="text-sm leading-7 text-neutral-700">{ob}</li>
                    ))}
                  </ul>
                </div>
              )}
              {personalDecisionConstitution.acceptedObligations.length > 0 && (
                <div>
                  <FieldLabel>Accepted obligations</FieldLabel>
                  <ul className="mt-2 grid gap-1.5">
                    {personalDecisionConstitution.acceptedObligations.map((ob, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                        <span className="mt-0.5 text-[#8a6a2f]">—</span>
                        <span>{ob}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DossierSection>

          {/* 07 — Next Admissible Move */}
          <DossierSection number={7} title="Next admissible move">
            <div className="grid gap-4">
              <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4">
                <FieldLabel>Required move</FieldLabel>
                <p className="mt-2 text-base font-medium leading-7 text-neutral-900">
                  {nextAdmissibleMove.move}
                </p>
              </div>
              <div>
                <FieldLabel>Rationale</FieldLabel>
                <FieldBody>{nextAdmissibleMove.rationale}</FieldBody>
              </div>
              {nextAdmissibleMove.precondition && (
                <div>
                  <FieldLabel>Precondition</FieldLabel>
                  <FieldBody>{nextAdmissibleMove.precondition}</FieldBody>
                </div>
              )}
              <div>
                <FieldLabel>Cost of delay</FieldLabel>
                <FieldBody>{nextAdmissibleMove.costOfDelay}</FieldBody>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <FieldLabel>Time sensitivity</FieldLabel>
                  <div className="mt-1">
                    <Badge variant={nextAdmissibleMove.timeSensitivity === "IMMEDIATE" ? "red" : nextAdmissibleMove.timeSensitivity === "THIS_WEEK" ? "amber" : "neutral"}>
                      {nextAdmissibleMove.timeSensitivity.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                {nextAdmissibleMove.escalationQualified && nextAdmissibleMove.escalationTarget && (
                  <div>
                    <FieldLabel>Escalation</FieldLabel>
                    <div className="mt-1">
                      <Badge variant="amber">
                        {nextAdmissibleMove.escalationTarget.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DossierSection>

          {/* 08 — Decision Centre Memory */}
          <DossierSection number={8} title="Decision Centre memory record">
            <div className="rounded-[16px] border border-emerald-200/40 bg-emerald-50/30 p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${decisionCentreMemory.written ? "bg-emerald-500" : "bg-amber-400"}`}
                />
                <FieldLabel>
                  {decisionCentreMemory.written ? "Memory written to Decision Centre" : "Memory pending"}
                </FieldLabel>
              </div>
              <FieldBody>{decisionCentreMemory.summary}</FieldBody>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
                Status: {decisionCentreMemory.status}
              </p>
            </div>
          </DossierSection>

          {/* 09 — PDF Dossier */}
          <DossierSection number={9} title="PDF dossier">
            <div className="flex flex-wrap gap-3">
              {assessmentId ? (
                <a
                  href={`/.netlify/functions/purpose-alignment-paid-dossier?assessmentId=${encodeURIComponent(assessmentId)}`}
                  className="rounded-full border border-[#8a6a2f]/40 bg-[#C9A96E]/10 px-5 py-2.5 text-sm font-medium text-[#5a4a1f]"
                >
                  Download mandate dossier (PDF)
                </a>
              ) : (
                <p className="text-sm leading-7 text-neutral-500">
                  PDF dossier will be available once the assessment is fully recorded.
                </p>
              )}
            </div>
            {pdfDossier.generated && pdfDossier.downloadUrl && (
              <p className="mt-2 text-[10px] text-neutral-400">
                Generated: {pdfDossier.generatedAt ?? "—"}
              </p>
            )}
          </DossierSection>

          {/* 10 — Corridor Bridge */}
          <DossierSection number={10} title="Corridor bridge">
            {corridorBridge.bridgeJustified ? (
              <div className="rounded-[16px] border border-amber-200/40 bg-amber-50/30 p-4">
                <FieldLabel>Bridge justified — escalation recommended</FieldLabel>
                <FieldBody>{corridorBridge.justification}</FieldBody>
                {corridorBridge.bridgeEvidence.length > 0 && (
                  <div className="mt-3">
                    <FieldLabel>Evidence supporting escalation</FieldLabel>
                    <ul className="mt-1 grid gap-1">
                      {corridorBridge.bridgeEvidence.map((e) => (
                        <li key={e} className="text-xs text-neutral-600">{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={escalationHref}
                    className="rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white"
                  >
                    Proceed to {corridorBridge.targetSurface.replace(/_/g, " ")}
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 p-4">
                <FieldLabel>Bridge not yet justified</FieldLabel>
                <FieldBody>{corridorBridge.justification}</FieldBody>
              </div>
            )}
          </DossierSection>

        </div>

        {/* Evidence posture caveat — self-reported result, not guaranteed outcomes */}
        <section className="mt-10 rounded-[20px] border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">Evidence posture</div>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            This assessment is self-reported. The mandate dossier is derived from your answers, not external data. No outcome is guaranteed. No therapeutic, medical, legal, or financial advice is provided. The constitution, rules, and moves are structural recommendations based on the pattern your answers revealed — they are not certified by independent audit.
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            Combine with Constitutional Diagnostic and Team Assessment for independent structural validation.
          </p>
        </section>

        {/* Analysis error */}
        {analysisError && (
          <div className="mt-8 rounded-[24px] border border-amber-300 bg-amber-50 p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-amber-800">Analysis note</div>
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

        {/* Living intelligence panels */}
        <div className="mt-8 space-y-4">
          <IntelligenceGainPanel
            stage="Purpose Alignment"
            findings={[
              { label: "Pattern", value: result.primaryPattern?.label ?? "Pattern identified" },
              { label: "Coherence", value: result.coherenceBand ?? "—" },
              { label: "Mandate viability", value: mandateReading.mandateViability },
              { label: "Integrity score", value: `${executionIntegrityImplication.integrityScore}/100` },
              ...(nextAdmissibleMove.move ? [{ label: "Next move", value: nextAdmissibleMove.move.slice(0, 60) + (nextAdmissibleMove.move.length > 60 ? "…" : "") }] : []),
            ]}
          />
          <EvidenceStrengthMeter
            level="single_source"
            stagesCompleted={2}
            whatWouldStrengthen="Continue to Constitutional Diagnostic to reveal whether this mandate conflict has structural consequences."
          />
          {nextAdmissibleMove.move && (
            <GovernedActionPanel
              requiredAction={nextAdmissibleMove.move}
              whyThisAction={nextAdmissibleMove.rationale}
              whatProvesProgress="Complete the next admissible move within the stated time sensitivity. The system tracks progress through Decision Centre memory."
              whatHappensNext={
                nextAdmissibleMove.escalationQualified
                  ? `Evidence justifies escalation to ${nextAdmissibleMove.escalationTarget?.replace(/_/g, " ") ?? "the next layer"}.`
                  : "Constitutional Diagnostic reveals structural posture. Team Assessment reveals execution divergence."
              }
            />
          )}
          <DecisionAdvantageSummary
            advantages={[
              { label: "Mandate dossier produced", description: "10 governed deliverables" },
              ...(result.primaryPattern ? [{ label: "Decision pattern identified", description: result.primaryPattern.label }] : []),
              ...(contextAnswers.avoidedDecision ? [{ label: "Avoided decision surfaced", description: contextAnswers.avoidedDecision }] : []),
              ...(contextAnswers.competingObligation ? [{ label: "Competing obligation mapped", description: contextAnswers.competingObligation }] : []),
            ]}
            confidenceBand={
              result.coherenceBand === "SOVEREIGN" || result.coherenceBand === "ALIGNED"
                ? "high"
                : result.coherenceBand === "DRIFTING"
                  ? "medium"
                  : "low"
            }
            limitations={[
              "This assessment is self-reported. Combine with Constitutional Diagnostic for structural validation.",
              "The mandate dossier does not constitute legal, financial, medical, or therapeutic advice.",
            ]}
          />
          <NextLayerUnlockedPanel
            currentStage="Purpose Alignment"
            nextStage={{
              name: corridorBridge.bridgeJustified && corridorBridge.targetSurface !== "NONE"
                ? corridorBridge.targetSurface.replace(/_/g, " ")
                : "Constitutional Diagnostic",
              href: escalationHref,
              whatItDetects: corridorBridge.bridgeJustified
                ? "Whether the mandate pattern requires institutional-level intervention."
                : "Whether this internal conflict has structural consequences — governance posture, authority clarity, and institutional readiness.",
              whyContinue: corridorBridge.bridgeJustified
                ? "The evidence from this assessment justifies escalation."
                : "Purpose alignment reveals conviction vs obligation. Constitutional assessment reveals whether the structure supports or undermines your intent.",
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
