/**
 * pages/decision-centre.tsx — Decision Centre v0
 *
 * The user's governed case console. Shows active Living Cases,
 * evidence state, admissibility, commercial access, continuity,
 * and next required action.
 *
 * This is not a dashboard. This is a governed operating console.
 * The core object is the Living Case, not the diagnostic record.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

const DecisionCentreOrientation = dynamic(
  () => import("@/components/decision-centre/DecisionCentreOrientation"),
  { ssr: false },
);

import Layout from "@/components/Layout";
import AdmissionNotice from "@/components/product/AdmissionNotice";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import ContinuityStatement from "@/components/product/ContinuityStatement";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import DecisionVelocityCard from "@/components/Intelligence/public/DecisionVelocityCard";
import WhatChangedPanel from "@/components/Intelligence/public/WhatChangedPanel";
import CrossAssessmentInsight from "@/components/Intelligence/public/CrossAssessmentInsight";
import ContradictionMapPreview from "@/components/Intelligence/public/ContradictionMapPreview";
import RetainerMemoryPreview from "@/components/decision-centre/RetainerMemoryPreview";
import type {
  DecisionCentreCase,
  DecisionCentreResponse,
  DecisionCreditSummary,
  CognitiveState,
  StrategyRoomSessionRef,
} from "@/lib/product/decision-centre-contract";
import {
  formatMemorySourceLabel,
  isMemoryDisplaySafe,
  type GovernedMemoryItem,
} from "@/lib/product/governed-memory-contract";
import { groupDecisionCentreMemory } from "@/lib/product/governed-memory-presenter";
import {
  clearPendingSessionCase,
  readPendingSessionCase,
} from "@/lib/product/session-case-continuity";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// COGNITIVE STATE LABELS
// ─────────────────────────────────────────────────────────────────────────────

const COGNITIVE_LABELS: Record<CognitiveState, { label: string; color: string }> = {
  SIGNAL_DISCOVERY: { label: "Signal Discovery", color: "rgba(255,255,255,0.35)" },
  STRUCTURAL_RECOGNITION: { label: "Structural Recognition", color: "rgba(251,191,36,0.55)" },
  CONSEQUENCE_REALISATION: { label: "Consequence Realisation", color: "rgba(251,191,36,0.70)" },
  INTERVENTION_READINESS: { label: "Intervention Readiness", color: `${GOLD}CC` },
  EXECUTION_GOVERNANCE: { label: "Execution Governance", color: "rgba(110,231,183,0.65)" },
  INSTITUTIONAL_INTELLIGENCE: { label: "Institutional Intelligence", color: "rgba(110,231,183,0.80)" },
};

// ─────────────────────────────────────────────────────────────────────────────
// CASE CARD
// ─────────────────────────────────────────────────────────────────────────────

function formatDisplayDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function CaseCard({ c, isMostUrgent }: { c: DecisionCentreCase; isMostUrgent: boolean }) {
  const cognitive = COGNITIVE_LABELS[c.cognitiveState];
  const memoryGroups = groupDecisionCentreMemory(c.governedMemory ?? []);

  function statusLabel(status: GovernedMemoryItem["status"]): string {
    return status.toLowerCase().replace(/_/g, " ");
  }

  const sourceLabel = c.sourceType ? c.sourceType.replace(/_/g, " ").toLowerCase() : null;
  const lastActivity = formatDisplayDate(c.updatedAt);

  return (
    <div style={{ border: isMostUrgent ? `1px solid ${GOLD}30` : `1px solid rgba(255,255,255,0.07)`, backgroundColor: isMostUrgent ? "rgba(201,169,110,0.04)" : "rgba(255,255,255,0.02)", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
        <div>
          {isMostUrgent && (
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA`, display: "block", marginBottom: "8px" }}>
              Most urgent case
            </span>
          )}
          <h2 style={{ ...serif, fontSize: "1.25rem", lineHeight: 1.2, color: "rgba(255,255,255,0.85)", fontStyle: "italic" }}>
            {c.title}
          </h2>
          <div style={{ display: "flex", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: cognitive.color }}>
              {cognitive.label}
            </span>
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              Evidence: {c.evidenceTier.replace("_", " ")}
            </span>
            {sourceLabel && (
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}77` }}>
                {sourceLabel}
              </span>
            )}
            {c.unresolvedContradictions > 0 && (
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
                {c.unresolvedContradictions} contradiction{c.unresolvedContradictions !== 1 ? "s" : ""}
              </span>
            )}
            {lastActivity && (
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.18)" }}>
                Last activity: {lastActivity}
              </span>
            )}
          </div>
        </div>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>
          {c.caseId.slice(0, 16)}
        </span>
      </div>

      {/* Decision statement */}
      {c.decisionText && (
        <div style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "14px", marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
            &ldquo;{c.decisionText.length > 200 ? c.decisionText.slice(0, 197) + "..." : c.decisionText}&rdquo;
          </p>
        </div>
      )}

      {/* Primary finding */}
      {c.primaryFinding && (
        <div style={{ borderLeft: `2px solid ${GOLD}40`, paddingLeft: "14px", marginBottom: "12px" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "4px" }}>
            Primary finding
          </p>
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.55)" }}>
            {c.primaryFinding}
          </p>
        </div>
      )}

      {/* Governance implication */}
      {c.governanceImplication && (
        <div style={{ border: "1px solid rgba(255,200,100,0.10)", backgroundColor: "rgba(255,200,100,0.03)", padding: "10px 14px", marginBottom: "16px" }}>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "4px" }}>
            Governance implication
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.42)" }}>
            {c.governanceImplication}
          </p>
        </div>
      )}

      {c.urgencyReasons && c.urgencyReasons.length > 0 && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,165,165,0.62)" }}>
            Why this case is first
          </span>
          {c.urgencyReasons.map((reason) => (
            <p key={reason} style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", marginTop: "4px" }}>
              {reason}
            </p>
          ))}
        </div>
      )}

      {/* Evidence stage checklist */}
      <div style={{ marginBottom: "20px" }}>
        <EvidenceStrengthMeter
          level={c.evidenceTier}
          stagesCompleted={c.completedStages.filter((s) => s.status === "completed").length}
          stages={c.completedStages}
        />
      </div>

      {/* Admission status */}
      <div style={{ display: "grid", gap: "8px", marginBottom: "20px" }}>
        {c.admission.executiveReporting && (
          <AdmissionRow surface="Executive Reporting" admission={c.admission.executiveReporting} paymentRequired={c.commercial.paymentRequiredFor.includes("executive_reporting")} />
        )}
        {c.admission.strategyRoom && (
          <AdmissionRow surface="Strategy Room" admission={c.admission.strategyRoom} paymentRequired={c.commercial.paymentRequiredFor.includes("strategy_room")} />
        )}
      </div>

      {/* Repair actions — shown when any surface is restricted */}
      {(c.admission.executiveReporting?.status === "RESTRICTED" || c.admission.strategyRoom?.status === "RESTRICTED") && (
        <div style={{ border: "1px solid rgba(252,165,165,0.10)", backgroundColor: "rgba(252,165,165,0.02)", padding: "12px 16px", marginBottom: "16px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(252,165,165,0.50)", display: "block", marginBottom: "6px" }}>
            Required to proceed
          </span>
          {[
            ...(c.admission.executiveReporting?.repairActions || []),
            ...(c.admission.strategyRoom?.repairActions || []),
          ].filter((v, i, a) => a.indexOf(v) === i).map((action, i) => (
            <p key={i} style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.45)", marginBottom: "2px" }}>
              {action}
            </p>
          ))}
          {!(c.admission.executiveReporting?.repairActions?.length || c.admission.strategyRoom?.repairActions?.length) && (
            <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
              Repair actions not yet recorded.
            </p>
          )}
        </div>
      )}

      {/* Cost-of-Inaction Clock */}
      {c.costOfInaction && c.costOfInaction.accumulatedCost > 0 && (
        <div style={{ marginBottom: "16px", border: `1px solid rgba(252,165,165,0.12)`, backgroundColor: "rgba(252,165,165,0.02)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
            Cost of inaction
          </span>
          <p style={{ ...serif, fontSize: "1.1rem", color: `${GOLD}CC`, marginTop: "4px" }}>
            &pound;{c.costOfInaction.accumulatedCost.toLocaleString()}
          </p>
          <p style={{ fontSize: "11px", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "2px" }}>
            Estimated over {c.costOfInaction.daysElapsed} day{c.costOfInaction.daysElapsed !== 1 ? "s" : ""} since last action. Delay is not neutral.
          </p>
        </div>
      )}

      {/* Value at risk — what would be lost */}
      {c.valueAtRisk && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)", padding: "10px 14px" }}>
          <p style={{ fontSize: "12px", lineHeight: 1.6, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}>
            {c.valueAtRisk}
          </p>
        </div>
      )}

      {c.irreversibility && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(252,165,165,0.10)", backgroundColor: "rgba(252,165,165,0.02)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: c.irreversibility.score >= 45 ? "rgba(252,165,165,0.58)" : `${GOLD}88` }}>
            Irreversibility: {c.irreversibility.level}
          </span>
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.70)", marginTop: "4px" }}>
            {c.irreversibility.summary}
          </p>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginTop: "6px" }}>
            Source: {c.irreversibility.sourceLabel} · Recorded: {formatDisplayDate(c.irreversibility.computedAt) ?? "Date unavailable"} · Evidence posture: {c.irreversibility.evidencePosture.replace(/_/g, " ").toLowerCase()}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "4px" }}>
            {c.irreversibility.evidenceBasis}
          </p>
          {c.irreversibility.windowRemaining && (
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.24)", marginTop: "6px" }}>
              Window remaining: {c.irreversibility.windowRemaining}
            </p>
          )}
        </div>
      )}

      {c.decisionVelocitySummary && (
        <div style={{ marginBottom: "16px" }}>
          <DecisionVelocityCard summary={c.decisionVelocitySummary} />
        </div>
      )}

      {c.whatChanged && (
        <div style={{ marginBottom: "16px" }}>
          <WhatChangedPanel summary={c.whatChanged} title="What changed since your last assessment" />
        </div>
      )}

      {c.crossAssessmentIntelligence && (c.crossAssessmentIntelligence.conflicts.length > 0 || c.crossAssessmentIntelligence.reinforcingSignals.length > 0) && (
        <div style={{ marginBottom: "16px" }}>
          <CrossAssessmentInsight intelligence={c.crossAssessmentIntelligence} />
        </div>
      )}

      {c.contradictionMap && c.contradictionMap.activeContradictions.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <ContradictionMapPreview view={c.contradictionMap} />
        </div>
      )}

      {memoryGroups.length > 0 && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(201,169,110,0.10)", backgroundColor: "rgba(201,169,110,0.03)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}99` }}>
            Case memory
          </span>
          <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "4px" }}>
            This case is carrying forward prior evidence. The next step should not ignore it.
          </p>
          <div style={{ display: "grid", gap: "12px", marginTop: "10px" }}>
            {memoryGroups.map((group) => (
              <div key={group.key}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(201,169,110,0.78)", marginBottom: "6px" }}>
                  {group.title}
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {group.items.map((item) => {
                    const safeToShow = isMemoryDisplaySafe(item);
                    const capturedDate = formatDisplayDate(item.capturedAt);
                    return (
                      <div key={item.id} style={{ borderLeft: "1px solid rgba(201,169,110,0.42)", paddingLeft: "10px" }}>
                        <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.34)" }}>
                          {formatMemorySourceLabel(item)}
                          {capturedDate ? ` · ${capturedDate}` : ""}
                          {` · ${statusLabel(item.status)}`}
                        </div>
                        <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", textTransform: "uppercase", color: `${GOLD}88`, marginTop: "4px" }}>
                          {item.label}
                        </div>
                        <div style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(255,255,255,0.68)", marginTop: "2px" }}>
                          {safeToShow ? item.summary : item.suppressedReason || "Evidence captured but withheld from display."}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Briefs */}
      <div style={{ marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "10px 14px" }}>
        <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "6px" }}>
          Return Briefs
        </span>
        {c.returnBriefs.length > 0 ? (
          <>
            {c.returnBriefs.map((rb) => (
              <Link
                key={rb.sessionId}
                href={rb.href}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px", textDecoration: "none" }}
              >
                <div>
                  <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}BB`, display: "block" }}>
                    View Return Brief
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", marginTop: "1px", display: "block" }}>
                    {rb.sessionKey.slice(0, 16)} · {new Date(rb.generatedAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: rb.trajectory === "DETERIORATING" ? "rgba(252,165,165,0.55)" : rb.trajectory === "FRAGILE" ? "rgba(251,191,36,0.55)" : "rgba(110,231,183,0.55)", flexShrink: 0 }}>
                  {rb.trajectory}
                </span>
              </Link>
            ))}
            <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.22)", marginTop: "8px" }}>
              A generated client-safe Return Brief appears here when the governed record contains enough return-cycle evidence to reopen the condition safely.
            </p>
          </>
        ) : (
          <p style={{ fontSize: "11px", lineHeight: 1.6, color: "rgba(255,255,255,0.28)" }}>
            No generated Return Brief yet. A Return Brief appears when the governed record contains enough return-cycle evidence.
          </p>
        )}
      </div>

      {/* Strategy Room Record */}
      {c.strategyRoomRecord && (
        <StrategyRoomRecordRow record={c.strategyRoomRecord} />
      )}

      {/* Outcome status */}
      {c.outcomeStatus && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
          <Clock style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.25)" }} />
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
            Outcome: {c.outcomeStatus}
          </span>
        </div>
      )}

      {c.patternRecurrence && c.patternRecurrence.status !== "NO_PRIOR_PATTERN" && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: c.patternRecurrence.status === "VERIFIED_RECURRENCE" ? `${GOLD}AA` : "rgba(251,191,36,0.60)" }}>
            Pattern recurrence: {c.patternRecurrence.status === "VERIFIED_RECURRENCE" ? "verified" : "possible"}
          </span>
          <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "4px" }}>
            {c.patternRecurrence.status === "VERIFIED_RECURRENCE"
              ? c.patternRecurrence.explanation
              : `This case resembles ${c.patternRecurrence.priorCount} prior case${c.patternRecurrence.priorCount === 1 ? "" : "s"}. Treat as recurrence risk, not proof.`}
          </p>
        </div>
      )}

      {/* Boardroom eligibility */}
      {c.boardroom && (
        <div style={{ marginBottom: "16px", border: c.boardroom.qualified ? `1px solid rgba(201,169,110,0.20)` : "1px solid rgba(255,255,255,0.05)", backgroundColor: c.boardroom.qualified ? "rgba(201,169,110,0.03)" : "rgba(255,255,255,0.01)", padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: c.boardroom.qualified ? `${GOLD}AA` : "rgba(255,255,255,0.22)" }}>
                {c.boardroom.qualified ? "Boardroom Dossier available" : "Boardroom Dossier not generated"}
              </span>
              {!c.boardroom.qualified && c.boardroom.reason && (
                <p style={{ fontSize: "11px", lineHeight: 1.5, color: "rgba(255,255,255,0.28)", marginTop: "2px" }}>
                  {c.boardroom.reason}
                </p>
              )}
              {(c.boardroom.historyCount ?? 0) > 0 && (
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", color: "rgba(255,255,255,0.25)", marginTop: "6px" }}>
                  {c.boardroom.historyCount} archived boardroom cycle{c.boardroom.historyCount === 1 ? "" : "s"}
                </p>
              )}
            </div>
            {c.boardroom.qualified && c.boardroom.href && (
              <Link
                href={c.boardroom.href}
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}CC`, textDecoration: "none", border: `1px solid ${GOLD}30`, padding: "4px 10px" }}
              >
                Open
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Retainer readiness */}
      {c.retainerReadiness && (
        <div style={{ marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "10px 14px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: c.retainerReadiness.level === "HIGH" ? `${GOLD}AA` : c.retainerReadiness.level === "MEDIUM" ? "rgba(251,191,36,0.60)" : "rgba(255,255,255,0.22)" }}>
            Oversight potential: {c.retainerReadiness.level}
          </span>
          <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.34)", marginTop: "4px" }}>
            {c.retainerReadiness.reason}
          </p>
          {c.retainerReadiness.signals && c.retainerReadiness.signals.length > 0 && (
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)", marginTop: "6px" }}>
              {c.retainerReadiness.signals.join(" • ")}
            </p>
          )}
          {c.retainerReadiness.cadenceStatus && (
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.22)", marginTop: "6px" }}>
              Cadence: {c.retainerReadiness.cadenceStatus}
            </p>
          )}
        </div>
      )}

      {/* Continuity */}
      {c.continuity && (
        <div style={{ marginBottom: "20px" }}>
          <ContinuityStatement
            continuity={c.continuity.status as any}
            reason={c.continuity.summary}
            priorOccurrences={c.continuity.priorOccurrences}
            trend={c.continuity.trend as any}
            compact
          />
        </div>
      )}

      {/* Next required action */}
      {c.nextRequiredAction && (
        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "12px 16px", marginBottom: "16px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70`, display: "block", marginBottom: "4px" }}>
            Next required action
          </span>
          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.60)" }}>
            {c.nextRequiredAction}
          </p>
        </div>
      )}

      {/* Commercial */}
      {c.commercial.ownedProducts.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {c.commercial.ownedProducts.map((p) => (
            <span key={p} style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(110,231,183,0.45)", border: "1px solid rgba(110,231,183,0.12)", padding: "2px 8px" }}>
              {p.replace(/_/g, " ").replace(/\./g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StrategyRoomRecordRow({ record }: { record: StrategyRoomSessionRef }) {
  return (
    <div style={{ marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "10px 14px" }}>
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "6px" }}>
        Strategy Room Record
      </span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(110,231,183,0.60)" }}>
            Recorded
          </span>
          <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.28)", marginTop: "3px" }}>
            {record.provenanceStatus === "available"
              ? "Live client-safe provenance is available for this persisted Strategy Room record."
              : "Case-specific provenance is not yet available for this record."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link
            href={record.href}
            style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}BB`, textDecoration: "none", border: `1px solid ${GOLD}25`, padding: "4px 9px" }}
          >
            View record
          </Link>
          {record.provenanceStatus === "available" && record.provenanceHref && (
            <Link
              href={record.provenanceHref}
              style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}BB`, textDecoration: "none", border: `1px solid ${GOLD}25`, padding: "4px 9px" }}
            >
              View provenance
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AdmissionRow({
  surface,
  admission,
  paymentRequired,
}: {
  surface: string;
  admission: DecisionCentreCase["admission"]["executiveReporting"];
  paymentRequired: boolean;
}) {
  if (!admission) return null;
  const isAdmitted = admission.status === "ADMITTED";

  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {isAdmitted ? (
          <CheckCircle style={{ width: "10px", height: "10px", color: "rgba(110,231,183,0.50)" }} />
        ) : (
          <XCircle style={{ width: "10px", height: "10px", color: "rgba(252,165,165,0.50)" }} />
        )}
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
          {surface}
        </span>
      </div>
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: isAdmitted ? "rgba(110,231,183,0.50)" : "rgba(252,165,165,0.45)" }}>
        {isAdmitted
          ? paymentRequired ? "Eligible — payment required" : "Admitted"
          : "Restricted — repair evidence"
        }
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION CREDIT
// ─────────────────────────────────────────────────────────────────────────────

function CreditPanel({ credit }: { credit: DecisionCreditSummary }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "16px 20px" }}>
      <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "8px" }}>
        Decision Credit
      </span>
      <div style={{ display: "flex", gap: "24px" }}>
        <div>
          <span style={{ ...serif, fontSize: "1.8rem", color: "rgba(255,255,255,0.70)" }}>{credit.score}</span>
          <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.25)", marginLeft: "6px" }}>
            {credit.trend}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ ...mono, fontSize: "8px", color: "rgba(110,231,183,0.45)" }}>{credit.fulfilled} fulfilled</span>
          {credit.breached > 0 && <span style={{ ...mono, fontSize: "8px", color: "rgba(252,165,165,0.45)" }}>{credit.breached} breached</span>}
          {credit.disputed > 0 && <span style={{ ...mono, fontSize: "8px", color: "rgba(251,191,36,0.45)" }}>{credit.disputed} disputed</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <h2 style={{ ...serif, fontSize: "1.6rem", lineHeight: 1.2, color: "rgba(255,255,255,0.75)", fontStyle: "italic", marginBottom: "12px" }}>
        No active cases under governance.
      </h2>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.38)", maxWidth: "44ch", margin: "0 auto 32px" }}>
        Begin with a diagnostic when you have a decision, tension, or pattern worth testing.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/diagnostics/fast"
          style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}10`, padding: "12px 22px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          Start Fast Diagnostic <ArrowRight style={{ width: "10px", height: "10px" }} />
        </Link>
        <Link
          href="/diagnostics/purpose-alignment"
          style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", border: "1px solid rgba(255,255,255,0.10)", padding: "12px 22px", textDecoration: "none" }}
        >
          Test Purpose Alignment
        </Link>
        <Link
          href="/diagnostics"
          style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", border: "1px solid rgba(255,255,255,0.06)", padding: "12px 22px", textDecoration: "none" }}
        >
          View diagnostics ladder
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH REQUIRED STATE
// ─────────────────────────────────────────────────────────────────────────────

function AuthRequired() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <h2 style={{ ...serif, fontSize: "1.4rem", lineHeight: 1.2, color: "rgba(255,255,255,0.65)", fontStyle: "italic", marginBottom: "12px" }}>
        Authentication required.
      </h2>
      <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.35)", maxWidth: "40ch", margin: "0 auto 24px" }}>
        The Decision Centre shows governed case state for authenticated users.
      </p>
      <Link
        href="/diagnostics/fast"
        style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}CC`, border: `1px solid ${GOLD}40`, padding: "12px 22px", textDecoration: "none" }}
      >
        Start with a diagnostic
      </Link>
    </div>
  );
}

function CheckpointSection({
  title,
  items,
}: {
  title: string;
  items: DecisionCentreResponse["checkpoints"]["requiresResponse"];
}) {
  return (
    <div style={{ border: `1px solid rgba(201,169,110,0.20)`, backgroundColor: "rgba(201,169,110,0.03)", padding: "16px 20px", marginBottom: "16px" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(201,169,110,0.60)", marginBottom: "12px" }}>
        {title}
      </p>
      {items.map((cp) => {
        const responded = cp.status === "RESPONDED";
        const responseColor = cp.responseStatus === "COMPLETED"
          ? "rgba(110,231,183,0.55)"
          : cp.responseStatus === "BLOCKED" || cp.responseStatus === "ABANDONED"
            ? "rgba(252,165,165,0.55)"
            : "rgba(201,169,110,0.55)";
        return (
          <div key={cp.id} style={{ borderLeft: `2px solid ${cp.status === "OVERDUE" ? "rgba(252,165,165,0.40)" : responded ? "rgba(110,231,183,0.30)" : "rgba(201,169,110,0.30)"}`, paddingLeft: "12px", marginBottom: "10px" }}>
            <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>{cp.commandTitle}</p>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginTop: "4px" }}>
              Source: {cp.sourceLabel} · Surface: {cp.sourceSurface.replace(/_/g, " ").toLowerCase()} · Evidence posture: {cp.evidencePosture.replace(/_/g, " ").toLowerCase()}
            </p>
            <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.40)", marginTop: "4px" }}>{cp.verificationQuestion}</p>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: responded ? responseColor : cp.status === "OVERDUE" ? "rgba(252,165,165,0.45)" : "rgba(255,255,255,0.20)", marginTop: "6px" }}>
              {responded
                ? `Response: ${(cp.responseStatus ?? "RESPONDED").replace(/_/g, " ")} · ${formatDisplayDate(cp.respondedAt) ?? "Date unavailable"}`
                : `${cp.status} · Due ${formatDisplayDate(cp.dueAt) ?? "Date unavailable"}`}
            </p>
            {cp.evidenceNote && (
              <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.35)", marginTop: "4px", fontStyle: "italic" }}>
                &ldquo;{cp.evidenceNote.slice(0, 150)}&rdquo;
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DecisionCentrePage() {
  const [data, setData] = React.useState<DecisionCentreResponse | null>(null);
  const [authRequired, setAuthRequired] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState("all");

  const filteredCases = React.useMemo(() => {
    if (!data) return [];
    if (activeFilter === "all") return data.cases;
    return data.cases.filter((c) => {
      switch (activeFilter) {
        case "diagnostics":
          return c.sourceType === "FAST_DIAGNOSTIC" || c.sourceType === "PURPOSE_ALIGNMENT" || c.sourceType === "CONSTITUTIONAL_DIAGNOSTIC";
        case "assessments":
          return c.sourceType === "TEAM_ASSESSMENT" || c.sourceType === "ENTERPRISE_ASSESSMENT";
        case "strategy_room":
          return c.sourceType === "STRATEGY_ROOM_RECORD" || Boolean(c.strategyRoomRecord);
        case "return_briefs":
          return c.returnBriefs.length > 0;
        case "proof":
          return c.sourceType === "PROOF_PACK" || Boolean(c.strategyRoomRecord?.provenanceStatus === "available");
        case "needs_action":
          return Boolean(c.nextRequiredAction) || c.unresolvedContradictions > 0;
        default:
          return true;
      }
    });
  }, [data, activeFilter]);
  const [continuityMessage, setContinuityMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      const response = await fetch("/api/decision-centre/cases");
      const json = await response.json();
      if (cancelled) return;
      if (json.ok) {
        setData(json);
        setAuthRequired(false);
        trackLaunch("decision_centre_opened", "decision_centre");
      } else if (json.reason === "AUTH_REQUIRED") {
        setAuthRequired(true);
      }
    }

    async function continuePendingCaseIfRequested() {
      const params = new URLSearchParams(window.location.search);
      if (params.get("continueCase") !== "1") return;
      const pending = readPendingSessionCase();
      if (!pending) return;

      const response = await fetch("/api/decision-centre/save-session-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const json = await response.json() as { ok?: boolean; reason?: string };
      if (cancelled) return;

      if (response.ok && json.ok) {
        clearPendingSessionCase();
        trackLaunch("account_continuity_started", "decision_centre");
        setContinuityMessage("Saved session case carried into Decision Centre.");
        window.history.replaceState({}, "", "/decision-centre");
      } else if (json.reason !== "AUTH_REQUIRED") {
        setContinuityMessage("The session case could not be carried forward automatically.");
      }
    }

    Promise.resolve()
      .then(continuePendingCaseIfRequested)
      .then(loadCases)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Layout
      title="Decision Centre | Abraham of London"
      description="Your active cases, evidence state, admissibility, interventions, and outcome memory."
    >
      <Head>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ backgroundColor: "rgb(3,3,5)", minHeight: "80vh" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 24px 96px" }}>

          {/* Hero */}
          <div style={{ marginBottom: "48px" }}>
            <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, display: "block", marginBottom: "8px" }}>
              Decision Infrastructure by Abraham of London
            </span>
            <h1 style={{ ...serif, fontSize: "clamp(1.8rem, 5vw, 2.6rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.90)", fontStyle: "italic" }}>
              Decision Centre
            </h1>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.62)", marginTop: "10px", maxWidth: "58ch" }}>
              The operating console for governed cases. Evidence state, admissibility, intervention eligibility, and outcome memory — across every decision in the record.
            </p>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginTop: "8px", maxWidth: "58ch", lineHeight: 1.6 }}>
              This is not a report viewer. It is the live state of decisions under governance — from diagnostic through to intervention and oversight.
            </p>

            {/* Progression ladder — compact inline */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: "0" }}>
              {[
                { label: "Fast Diagnostic", href: "/diagnostics/fast" },
                { label: "Executive Reporting", href: "/diagnostics/executive-reporting" },
                { label: "Strategy Room", href: "/strategy-room" },
                { label: "Retained Oversight", href: "/oversight" },
              ].map((step, i, arr) => (
                <React.Fragment key={step.label}>
                  <Link
                    href={step.href}
                    style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: i === 0 ? `${GOLD}BB` : "rgba(255,255,255,0.28)", textDecoration: "none" }}
                  >
                    {step.label}
                  </Link>
                  {i < arr.length - 1 && (
                    <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.14)", margin: "0 0.5rem" }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* First-visit orientation */}
          <DecisionCentreOrientation />

          {continuityMessage && (
            <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}05`, padding: "12px 16px", marginBottom: "16px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                {continuityMessage}
              </p>
            </div>
          )}

          {!loading && data?.retainerMemoryPreview && (
            <RetainerMemoryPreview preview={data.retainerMemoryPreview} />
          )}

          {/* Loading */}
          {loading && (
            <p style={{ color: "rgba(255,255,255,0.30)", fontSize: "14px" }}>Loading case state...</p>
          )}

          {/* Auth required */}
          {!loading && authRequired && <AuthRequired />}

          {/* Empty state */}
          {!loading && data && data.cases.length === 0 && <EmptyState />}

          {!loading && data && data.checkpoints.requiresResponse.length > 0 && (
            <CheckpointSection
              title="Requires response"
              items={data.checkpoints.requiresResponse}
            />
          )}

          {!loading && data && data.checkpoints.recentResponses.length > 0 && (
            <CheckpointSection
              title="Recent checkpoint responses"
              items={data.checkpoints.recentResponses}
            />
          )}

          {!loading && data && (data.cases.length > 0 || data.checkpoints.requiresResponse.length > 0) && (
            <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}05`, padding: "16px 20px", marginBottom: "16px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "8px" }}>
                Selective engagement pathway
              </p>
              <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>
                Your existing case record may support a selective engagement review. This is not a starting point and not a generic offer menu.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px" }}>
                <Link href="/engagements/selective-pilot" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}CC`, textDecoration: "none" }}>
                  Review engagement path
                </Link>
              </div>
            </div>
          )}

          {/* Cases */}
          {!loading && data && data.cases.length > 0 && (
            <>
              {/* ── Filter bar ── */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { key: "all", label: "All" },
                  { key: "diagnostics", label: "Diagnostics" },
                  { key: "assessments", label: "Assessments" },
                  { key: "strategy_room", label: "Strategy Room" },
                  { key: "return_briefs", label: "Return Briefs" },
                  { key: "proof", label: "Proof/Provenance" },
                  { key: "needs_action", label: "Needs action" },
                ].map((f) => {
                  const active = activeFilter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFilter(f.key)}
                      style={{
                        ...mono,
                        fontSize: "7.5px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: active ? `${GOLD}CC` : "rgba(255,255,255,0.25)",
                        border: active ? `1px solid ${GOLD}40` : "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: active ? `${GOLD}0A` : "transparent",
                        padding: "6px 12px",
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {filteredCases.length === 0 && (
                <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)", padding: "20px 0", textAlign: "center" }}>
                  No cases match the selected filter.
                </p>
              )}

            <div style={{ display: "grid", gap: "16px" }}>
              {data.mostUrgentCase && (
                <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}05`, padding: "16px 20px" }}>
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "10px" }}>
                    Most urgent case
                  </p>
                  {data.mostUrgentCase.reasons.map((reason) => (
                    <p key={reason} style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>
                      {reason}
                    </p>
                  ))}
                </div>
              )}
              {filteredCases.map((c) => (
                <CaseCard key={c.caseId} c={c} isMostUrgent={data.mostUrgentCase?.caseId === c.caseId} />
              ))}

              {/* Decision Credit */}
              {data.credit && (
                <CreditPanel credit={data.credit} />
              )}

              {/* Strategy Room escalation corridor */}
              <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}04`, padding: "16px 20px" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "8px" }}>
                  Intervention escalation
                </p>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.50)" }}>
                  If the executive report has confirmed structural escalation risk, the Strategy Room is the next governed surface. It is not a starting point — entry requires a prior evidence record.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px", alignItems: "center" }}>
                  <Link
                    href="/strategy-room"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "10px 20px", border: `1px solid ${GOLD}40`, backgroundColor: `${GOLD}0E`, color: "#F5F5F5", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}
                  >
                    Strategy Room
                    <ArrowRight style={{ width: 11, height: 11 }} />
                  </Link>
                  <Link
                    href="/diagnostics/executive-reporting"
                    style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", textDecoration: "none" }}
                  >
                    Executive Reporting required first →
                  </Link>
                </div>
              </div>

              {/* Archive link */}
              <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Link
                  href="/diagnostics"
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", textDecoration: "none" }}
                >
                  View diagnostic records archive
                </Link>
              </div>

              {/* Persistence boundary */}
              <div style={{ marginTop: "32px", padding: "14px 18px", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.18)", lineHeight: 1.6 }}>
                  Authenticated Decision Centre records are reconstructed from available account and diagnostic evidence. Session-only previews must be saved before they become account-bound governed cases.
                </p>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
