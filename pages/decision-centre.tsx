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
import { ArrowRight, ShieldCheck, AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

import Layout from "@/components/Layout";
import AdmissionNotice from "@/components/product/AdmissionNotice";
import ContinuityStatement from "@/components/product/ContinuityStatement";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import type {
  DecisionCentreCase,
  DecisionCentreResponse,
  DecisionCreditSummary,
  CognitiveState,
} from "@/lib/product/decision-centre-contract";
import {
  formatMemorySourceLabel,
  isMemoryDisplaySafe,
  type GovernedMemoryItem,
} from "@/lib/product/governed-memory-contract";
import { groupDecisionCentreMemory } from "@/lib/product/governed-memory-presenter";

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

function CaseCard({ c }: { c: DecisionCentreCase }) {
  const cognitive = COGNITIVE_LABELS[c.cognitiveState];
  const memoryGroups = groupDecisionCentreMemory(c.governedMemory ?? []);

  function formatCapturedDate(value: string | null): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function statusLabel(status: GovernedMemoryItem["status"]): string {
    return status.toLowerCase().replace(/_/g, " ");
  }

  return (
    <div style={{ border: `1px solid rgba(255,255,255,0.07)`, backgroundColor: "rgba(255,255,255,0.02)", padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
        <div>
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
            {c.unresolvedContradictions > 0 && (
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)" }}>
                {c.unresolvedContradictions} contradiction{c.unresolvedContradictions !== 1 ? "s" : ""}
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
                    const capturedDate = formatCapturedDate(item.capturedAt);
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
      {c.returnBriefs.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "6px" }}>
            Return Briefs
          </span>
          {c.returnBriefs.map((rb) => (
            <Link
              key={rb.sessionId}
              href={`/briefing/return/${rb.sessionId}`}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "4px", textDecoration: "none" }}
            >
              <span style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.40)" }}>
                {rb.sessionKey.slice(0, 12)}
              </span>
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: rb.trajectory === "DETERIORATING" ? "rgba(252,165,165,0.50)" : rb.trajectory === "FRAGILE" ? "rgba(251,191,36,0.50)" : "rgba(110,231,183,0.50)" }}>
                {rb.trajectory}
              </span>
            </Link>
          ))}
        </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DecisionCentrePage() {
  const [data, setData] = React.useState<DecisionCentreResponse | null>(null);
  const [authRequired, setAuthRequired] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/decision-centre/cases")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok) {
          setData(json);
        } else if (json.reason === "AUTH_REQUIRED") {
          setAuthRequired(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
            <p style={{ fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.38)", marginTop: "8px", maxWidth: "56ch" }}>
              Your active cases, evidence state, admissibility, interventions, and outcome memory.
            </p>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)", marginTop: "6px" }}>
              You are not viewing reports. You are viewing the state of decisions under governance.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <p style={{ color: "rgba(255,255,255,0.30)", fontSize: "14px" }}>Loading case state...</p>
          )}

          {/* Auth required */}
          {!loading && authRequired && <AuthRequired />}

          {/* Empty state */}
          {!loading && data && data.cases.length === 0 && <EmptyState />}

          {/* Cases */}
          {!loading && data && data.cases.length > 0 && (
            <div style={{ display: "grid", gap: "16px" }}>
              {data.cases.map((c) => (
                <CaseCard key={c.caseId} c={c} />
              ))}

              {/* Decision Credit */}
              {data.credit && (
                <CreditPanel credit={data.credit} />
              )}

              {/* Archive link */}
              <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <Link
                  href="/diagnostics"
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", textDecoration: "none" }}
                >
                  View diagnostic records archive
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
