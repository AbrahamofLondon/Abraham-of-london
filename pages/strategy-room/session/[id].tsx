/* pages/strategy-room/session/[id].tsx
   STRATEGY ROOM EXECUTION SURFACE — the real product
   Design: darker than rest of site, tighter spacing, less explanation, more structure
   Typography: JetBrains Mono data · Cormorant Garamond headings (weight 300)
*/

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Lock, Plus, XCircle } from "lucide-react";

import Layout from "@/components/Layout";
import ReturnBriefInterruptionBar from "@/components/strategy-room/ReturnBriefInterruptionBar";
import CounselStatusPanel from "@/components/strategy-room/CounselStatusPanel";
import GovernanceEvidenceCarryForward from "@/components/strategy-room/GovernanceEvidenceCarryForward";
import {
  convertPurposeAlignmentToGovernedMemory,
} from "@/lib/alignment/evidence-loader";
import {
  convertFinancialExposureToGovernedMemory,
} from "@/lib/product/financial-exposure-persistence";
import {
  extractAssessmentEvidenceCapture,
  type AssessmentEvidenceCapture,
} from "@/lib/product/evidence-capture-contract";
import {
  buildGovernedMemoryFromEvidenceCapture,
  selectStrategySessionMemory,
} from "@/lib/product/governed-memory-presenter";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type InterventionStep = {
  order: number;
  action: string;
  intent: string;
  expectedEffect: string;
  riskIfIgnored: string;
  dependency?: number;
  urgency: "immediate" | "short_term" | "structural";
};

type ConstraintMap = {
  authorityGaps: string[];
  resourceConstraints: string[];
  stakeholderResistance: string[];
};

type DecisionLog = {
  id: string;
  decision: string;
  status: "pending" | "executed" | "blocked";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SessionData = {
  id: string;
  sessionKey: string;
  directive: string | null;
  escalationLevel: string | null;
  conditionSummary: string | null;
  coreProblem: string | null;
  decisionQuestion: string | null;
  constraints: string[];
  exposureLevel: string | null;
  interventionStack: InterventionStep[];
  constraintMap: ConstraintMap | null;
  evidenceGraph: {
    decisionObjects: Array<{
      decisionText?: string;
      constraintText?: string | null;
      priorAttemptText?: string | null;
      costOfDelayText?: string | null;
      stakeholderText?: string | null;
    }>;
    nodes: Array<{
      kind?: string;
      label?: string;
      summary?: string;
      evidenceText?: string | null;
      severity?: string;
      confidence?: number;
    }>;
  } | null;
  evidenceCapture?: AssessmentEvidenceCapture | null;
  status: string;
  decisions: DecisionLog[];
  createdAt: string;
};

type PageProps = {
  session: SessionData | null;
  error?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — darker than rest of site
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const DEEP = "rgb(2 2 3)";
const AMBER = "#F59E0B";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "10px",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ ...mono, fontSize: "10px", color: `${GOLD}90` }}>{children}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.24)", marginBottom: "0.65rem" }}>
      {children}
    </div>
  );
}

function urgencyColor(u: string): string {
  if (u === "immediate") return "rgba(252,165,165,0.70)";
  if (u === "short_term") return "rgba(253,186,116,0.70)";
  return "rgba(255,255,255,0.40)";
}

function statusIcon(s: string) {
  if (s === "executed") return <CheckCircle style={{ width: 12, height: 12, color: "rgba(110,231,183,0.70)" }} />;
  if (s === "blocked") return <XCircle style={{ width: 12, height: 12, color: "rgba(252,165,165,0.70)" }} />;
  return <Clock style={{ width: 12, height: 12, color: "rgba(255,255,255,0.35)" }} />;
}

function statusColor(s: string): string {
  if (s === "executed") return "rgba(110,231,183,0.70)";
  if (s === "blocked") return "rgba(252,165,165,0.70)";
  return "rgba(255,255,255,0.45)";
}

function parseJsonFallback<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function StrategyRoomSessionPage({ session: initial, error }: PageProps) {
  const [session, setSession] = React.useState(initial);
  const [newDecision, setNewDecision] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [localError, setLocalError] = React.useState("");
  const [microFeedback, setMicroFeedback] = React.useState("");

  // Execution engine state — populated from decisions API responses
  const [executionState, setExecutionState] = React.useState<{
    systemState: string | null;
    consequenceScore: number | null;
    consequenceTrend: string | null;
    consequenceLabel: string | null;
    consequenceExplanation: string | null;
    directive: string | null;
    avoidancePattern: string | null;
    escalationTriggers: Array<{ triggerType: string; message: string }>;
  }>({
    systemState: initial?.status ?? null,
    consequenceScore: null,
    consequenceTrend: null,
    consequenceLabel: null,
    consequenceExplanation: null,
    directive: null,
    avoidancePattern: null,
    escalationTriggers: [],
  });

  // Load execution state on mount from the state API
  React.useEffect(() => {
    if (!initial?.id) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // Forward access token if present in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("access");
      if (accessToken) headers["x-strategy-access-token"] = accessToken;
    }
    fetch(`/api/strategy-room/execution/${initial.id}/state`, { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data) return;
        setExecutionState((prev) => ({
          ...prev,
          systemState: data.state ?? prev.systemState,
          consequenceScore: data.consequence?.currentExposure ?? null,
          consequenceTrend: data.consequenceTrend ?? null,
          consequenceLabel: data.consequenceLabel ?? null,
          consequenceExplanation: data.consequenceExplanation ?? null,
          directive: data.directive ?? prev.directive,
          avoidancePattern: data.repeatedPatternLabel ? `Decision avoidance detected (${data.avoidanceCount}x)` : null,
          escalationTriggers: data.triggers ?? [],
        }));
      })
      .catch(() => {});
  }, [initial?.id]);

  if (error || !session) {
    return (
      <Layout title="Strategy Room Session | Abraham of London" fullWidth headerTransparent>
        <Head><meta name="robots" content="noindex, nofollow" /></Head>
        <div style={{ backgroundColor: DEEP, minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div>
            <div style={{ ...mono, color: "rgba(252,165,165,0.70)" }}>Session not found</div>
            <Link href="/strategy-room" style={{ ...mono, color: AMBER, marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              Return to Strategy Room <ArrowRight style={{ width: 10, height: 10 }} />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  async function logDecision() {
    if (!newDecision.trim() || !session) return;
    setSubmitting(true);
    setLocalError("");
    try {
      const res = await fetch(`/api/strategy-room/execution/${session.id}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: newDecision.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log decision");
      setSession((prev) => prev ? {
        ...prev,
        decisions: [...prev.decisions, data.decision],
        status: data.systemState ?? prev.status,
      } : prev);
      // Update execution engine state from API response
      if (data.consequence || data.systemState) {
        setExecutionState((prev) => ({
          ...prev,
          systemState: data.systemState ?? prev.systemState,
          consequenceScore: data.consequence?.score ?? prev.consequenceScore,
          consequenceTrend: data.consequence?.trend ?? prev.consequenceTrend,
          consequenceLabel: data.consequence?.label ?? prev.consequenceLabel,
          consequenceExplanation: data.consequence?.explanation ?? prev.consequenceExplanation,
          directive: data.directive ?? prev.directive,
          avoidancePattern: data.avoidancePattern ?? prev.avoidancePattern,
        }));
      }
      setNewDecision("");
      setMicroFeedback("Recorded.");
      setTimeout(() => setMicroFeedback(""), 2000);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Error logging decision");
    } finally {
      setSubmitting(false);
    }
  }

  async function updateDecisionStatus(decisionId: string, status: "executed" | "blocked") {
    if (!session) return;
    try {
      const res = await fetch(`/api/strategy-room/execution/${session.id}/decisions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSession((prev) => prev ? {
        ...prev,
        decisions: prev.decisions.map((d) => d.id === decisionId ? { ...d, status } : d),
      } : prev);
    } catch {
      // Silent — UI will reflect current state
    }
  }

  async function updateSessionStatus(status: "completed" | "monitoring" | "escalated") {
    if (!session) return;
    try {
      await fetch(`/api/strategy-room/execution/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setSession((prev) => prev ? { ...prev, status } : prev);
    } catch {
      // Silent
    }
  }

  const interventions: InterventionStep[] = session.interventionStack ?? [];
  const constraints: ConstraintMap | null = session.constraintMap;
  const decisions: DecisionLog[] = session.decisions ?? [];
  const isActive = session.status === "active";
  const graphNodes = session.evidenceGraph?.nodes ?? [];
  const graphDecision = [...(session.evidenceGraph?.decisionObjects ?? [])].reverse()[0];
  const graphContradictions = graphNodes.filter((node) => node.kind === "contradiction").slice(-3);
  const graphConsequences = graphNodes.filter((node) => node.kind === "consequence" || node.kind === "exposure_estimate").slice(-3);
  const evidenceCarryForward = session.evidenceCapture ?? null;
  const sessionMemory = selectStrategySessionMemory(buildGovernedMemoryFromEvidenceCapture({
    evidence: evidenceCarryForward,
    sourceSurface: "STRATEGY_ROOM",
    capturedAt: session.createdAt,
    relatedSessionId: session.id,
    defaultStatus: {
      failureCause: "UNRESOLVED",
      verificationCriteria: "ACTIVE",
      stopSignal: "UNRESOLVED",
      escalationTrigger: "UNRESOLVED",
    },
  }));

  // ── PURPOSE ALIGNMENT EVIDENCE CARRIED FORWARD ──
  const paMemory = React.useMemo(() => {
    const paBlock = (session as any)?.purposeAlignmentMemory;
    if (!paBlock) return [];
    return convertPurposeAlignmentToGovernedMemory({
      available: true,
      sourceSurface: "PURPOSE_ALIGNMENT",
      assessedAt: paBlock.assessedAt ?? null,
      schemaVersion: null,
      profile: null,
      compositeScore: null,
      strongestDomain: null,
      weakestDomain: paBlock.weakestDomain ?? null,
      competingObligation: paBlock.competingObligation ?? null,
      consequence: paBlock.consequence ?? null,
      institutionalConsequence: null,
      primaryPattern: paBlock.primaryPattern ?? null,
      patternConsequence: null,
      contradictions: [],
      domainScores: [],
      firstAction: paBlock.firstAction ?? null,
      corrections: [],
      assessmentId: null,
    });
  }, [session]);
  // ── FINANCIAL EXPOSURE EVIDENCE CARRIED FORWARD ──
  const feMemory = React.useMemo(() => {
    const exposureBlock = (session as any)?.financialExposure;
    if (!exposureBlock) return [];
    return convertFinancialExposureToGovernedMemory({
      userCostOfDelayText: null,
      estimatedFinancialExposure: exposureBlock.totalExposure ?? null,
      exposureBand: exposureBlock.totalExposure >= 100000 ? "high" : exposureBlock.totalExposure >= 25000 ? "moderate" : exposureBlock.totalExposure > 0 ? "low" : null,
      exposureBasis: null,
      computedAt: typeof session.createdAt === "string" ? session.createdAt : new Date().toISOString(),
      sourceSurface: "EXECUTIVE_REPORTING",
      schemaVersion: "1.0.0",
    });
  }, [session]);
  const mergedSessionMemory = React.useMemo(
    () => [...paMemory, ...feMemory, ...sessionMemory],
    [paMemory, feMemory, sessionMemory],
  );

  return (
    <Layout title="Strategy Room Session | Abraham of London" fullWidth headerTransparent>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>

      <div style={{ backgroundColor: DEEP, minHeight: "100vh", color: "white" }}>
        <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "1.5rem 1.25rem 3rem" }}>

          {/* ── Session authority line ── */}
          <div style={{ padding: "1rem 0 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: "1rem" }}>
            <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.70)" }}>
              This session is now active. Your decision is in scope.
            </p>
            <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginTop: "0.25rem" }}>
              Everything from this point forward is execution.
            </p>
          </div>

          {/* ── Next Required Action ── */}
          {(() => {
            const pending = session.decisions?.filter((d: any) => d.status === "pending").length ?? 0;
            const blocked = session.decisions?.filter((d: any) => d.status === "blocked").length ?? 0;
            const total = session.decisions?.length ?? 0;
            const action = blocked > 0
              ? `${blocked} decision${blocked === 1 ? " is" : "s are"} blocked. Name the structural cause and determine whether escalation is required.`
              : pending > 0
                ? `${pending} decision${pending === 1 ? "" : "s"} pending execution. Record whether each was executed, blocked, or abandoned.`
                : total === 0
                  ? "Record your first decision. The system cannot govern what it cannot see."
                  : "All decisions addressed. Schedule the next verification checkpoint.";
            return (
              <div style={{ borderLeft: `2px solid rgba(201,169,110,0.35)`, backgroundColor: "rgba(201,169,110,0.04)", padding: "14px 18px", marginBottom: "12px" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(201,169,110,0.60)" }}>Next required action</p>
                <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.78)", marginTop: "4px" }}>{action}</p>
              </div>
            );
          })()}

          {/* ── Return brief interruption (if available) ── */}
          <ReturnBriefInterruptionBar sessionKey={session.sessionKey} />

          {/* ── Counsel status — automated governance or escalation ── */}
          <div style={{ paddingBottom: "0.75rem" }}>
            <CounselStatusPanel
              status={
                session.directive === "block" || session.directive === "restrict"
                  ? "REQUIRED"
                  : "NOT_REQUIRED"
              }
              explanation={
                session.directive === "block"
                  ? "Execution is paused. Authority enforcement has blocked further automated governance for this session."
                  : session.directive === "restrict"
                    ? "Counsel review is recommended. The session directive indicates restricted governance."
                    : "Automated governance is active. The system has sufficient authority and evidence to continue."
              }
              compact
            />
          </div>

          {/* ── 1. ENTRY STATE — immediate grounding ── */}
          <section style={{ paddingBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <Eyebrow>Execution Session</Eyebrow>
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(3, 1fr)" }}>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Directive</div>
                <div style={{ ...mono, fontSize: "9px", marginTop: "0.25rem", color: session.directive === "allow" ? "rgba(110,231,183,0.80)" : session.directive === "block" ? "rgba(252,165,165,0.80)" : `${GOLD}CC` }}>
                  {session.directive ?? "allow"}
                </div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Escalation</div>
                <div style={{ ...mono, fontSize: "9px", marginTop: "0.25rem", color: "rgba(255,255,255,0.65)" }}>
                  {session.escalationLevel ?? "standard"}
                </div>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Status</div>
                <div style={{ ...mono, fontSize: "9px", marginTop: "0.25rem", color: isActive ? GOLD : "rgba(255,255,255,0.45)" }}>
                  {session.status}
                </div>
              </div>
            </div>
            {session.conditionSummary && (
              <p style={{ ...serif, marginTop: "0.75rem", fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)", fontStyle: "italic" }}>
                {session.conditionSummary}
              </p>
            )}
          </section>

          {mergedSessionMemory.length > 0 && (
            <section style={{ padding: "1.15rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <GovernanceEvidenceCarryForward
                title="Unresolved execution memory"
                intro="These items remain active in this session. They should shape what is committed, stopped, or escalated."
                items={mergedSessionMemory}
                variant="session"
              />
            </section>
          )}

          {(graphDecision || graphContradictions.length > 0 || graphConsequences.length > 0) && (
            <section style={{ padding: "1.15rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <SectionLabel>Evidence Case</SectionLabel>
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: "rgba(201,169,110,0.035)", padding: "0.85rem 0.95rem" }}>
                {graphDecision?.decisionText && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <div style={{ ...mono, fontSize: "10px", color: `${GOLD}80` }}>Decision under execution</div>
                    <div style={{ ...serif, marginTop: "0.25rem", fontSize: "1rem", lineHeight: 1.45, color: "rgba(255,255,255,0.78)" }}>
                      {graphDecision.decisionText}
                    </div>
                    {[graphDecision.constraintText, graphDecision.priorAttemptText, graphDecision.costOfDelayText, graphDecision.stakeholderText]
                      .filter(Boolean)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={`${item}-${index}`} style={{ ...mono, marginTop: "0.35rem", fontSize: "10px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.30)" }}>
                          {index === 0 ? "Constraint" : index === 1 ? "Prior failure" : "Delay cost"}: {item}
                        </div>
                      ))}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(252,165,165,0.52)", marginBottom: "0.35rem" }}>Contradiction evidence</div>
                    {graphContradictions.length ? graphContradictions.map((node, index) => (
                      <div key={`${node.label}-${index}`} style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(252,165,165,0.58)", marginBottom: "0.35rem" }}>
                        {node.summary || node.label}
                      </div>
                    )) : (
                      <div style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.24)" }}>No contradiction evidence attached.</div>
                    )}
                  </div>
                  <div>
                    <div style={{ ...mono, fontSize: "10px", color: `${GOLD}80`, marginBottom: "0.35rem" }}>Consequence evidence</div>
                    {graphConsequences.length ? graphConsequences.map((node, index) => (
                      <div key={`${node.label}-${index}`} style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.52)", marginBottom: "0.35rem" }}>
                        {node.summary}{node.evidenceText ? ` · ${node.evidenceText}` : ""}
                      </div>
                    )) : (
                      <div style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.24)" }}>No consequence evidence attached.</div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── 2. DECISION FRAME ── */}
          <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <SectionLabel>Decision Frame</SectionLabel>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {session.coreProblem && (
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                  <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Core Problem</div>
                  <div style={{ ...serif, marginTop: "0.3rem", fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.72)" }}>
                    {session.coreProblem}
                  </div>
                </div>
              )}
              {session.decisionQuestion && (
                <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}05`, padding: "0.65rem 0.85rem" }}>
                  <div style={{ ...mono, fontSize: "10px", color: `${GOLD}80` }}>Decision Question</div>
                  <div style={{ ...serif, marginTop: "0.3rem", fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
                    {session.decisionQuestion}
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {session.constraints.length > 0 && (
                  <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Constraints</div>
                    {session.constraints.map((c, i) => (
                      <div key={i} style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.48)", marginTop: "0.2rem" }}>{c}</div>
                    ))}
                  </div>
                )}
                {session.exposureLevel && (
                  <div style={{ border: "1px solid rgba(252,165,165,0.12)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.65rem 0.85rem" }}>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(252,165,165,0.55)" }}>Exposure Level</div>
                    <div style={{ ...mono, fontSize: "10px", marginTop: "0.3rem", color: "rgba(252,165,165,0.80)" }}>
                      {session.exposureLevel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── 3. INTERVENTION STACK ── */}
          {interventions.length > 0 && (
            <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <SectionLabel>Intervention Stack</SectionLabel>
              <div style={{ display: "grid", gap: "0.4rem" }}>
                {interventions.sort((a, b) => a.order - b.order).map((step) => (
                  <div
                    key={step.order}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.015)",
                      padding: "0.75rem 0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ ...mono, fontSize: "8px", color: `${GOLD}80` }}>
                        {String(step.order).padStart(2, "0")}
                      </span>
                      <span style={{ ...mono, fontSize: "7px", color: urgencyColor(step.urgency) }}>
                        {step.urgency}
                      </span>
                      {step.dependency && (
                        <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>
                          depends on {String(step.dependency).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <div style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}>
                      {step.action}
                    </div>
                    <div style={{ marginTop: "0.4rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                      <div>
                        <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>Intent</div>
                        <div style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.45, color: "rgba(255,255,255,0.42)" }}>{step.intent}</div>
                      </div>
                      <div>
                        <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.18)" }}>Expected Effect</div>
                        <div style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.45, color: "rgba(255,255,255,0.42)" }}>{step.expectedEffect}</div>
                      </div>
                      <div>
                        <div style={{ ...mono, fontSize: "10px", color: "rgba(252,165,165,0.35)" }}>Risk if Ignored</div>
                        <div style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.45, color: "rgba(252,165,165,0.55)" }}>{step.riskIfIgnored}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 5. CONSTRAINT MAPPING ── */}
          {constraints && (
            <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <SectionLabel>Constraint Map</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                {[
                  { label: "Authority Gaps", items: constraints.authorityGaps, color: "rgba(252,165,165,0.55)" },
                  { label: "Resource Constraints", items: constraints.resourceConstraints, color: "rgba(253,186,116,0.55)" },
                  { label: "Stakeholder Resistance", items: constraints.stakeholderResistance, color: "rgba(255,255,255,0.40)" },
                ].map((col) => (
                  <div key={col.label} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.65rem 0.85rem" }}>
                    <div style={{ ...mono, fontSize: "10px", color: col.color }}>{col.label}</div>
                    {col.items.length === 0 ? (
                      <div style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.22)", marginTop: "0.25rem" }}>None identified</div>
                    ) : (
                      col.items.map((item, i) => (
                        <div key={i} style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.48)", marginTop: "0.2rem" }}>{item}</div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── EXECUTION INTELLIGENCE — live engine data ── */}
          {(executionState.consequenceScore != null || executionState.directive || executionState.avoidancePattern || executionState.escalationTriggers.length > 0) && (
            <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <SectionLabel>Execution Intelligence</SectionLabel>
              <div style={{ display: "grid", gap: "0.5rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>

                {/* Decision State Banner */}
                {executionState.systemState && (
                  <div style={{
                    border: `1px solid ${executionState.systemState === "EXECUTED" ? "rgba(110,231,183,0.25)" : executionState.systemState === "ESCALATED" || executionState.systemState === "FAILED" ? "rgba(252,165,165,0.25)" : executionState.systemState === "BLOCKED" ? "rgba(253,186,116,0.25)" : "rgba(255,255,255,0.08)"}`,
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "0.75rem 0.85rem",
                  }}>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>System State</div>
                    <div style={{
                      ...mono, fontSize: "12px", marginTop: "0.3rem",
                      color: executionState.systemState === "EXECUTED" ? "rgba(110,231,183,0.80)" : executionState.systemState === "ESCALATED" || executionState.systemState === "FAILED" ? "rgba(252,165,165,0.80)" : `${GOLD}CC`,
                    }}>
                      {executionState.systemState}
                    </div>
                  </div>
                )}

                {/* Consequence Score */}
                {executionState.consequenceScore != null && (
                  <div style={{
                    border: `1px solid ${executionState.consequenceScore >= 70 ? "rgba(252,165,165,0.25)" : executionState.consequenceScore >= 40 ? "rgba(253,186,116,0.25)" : "rgba(255,255,255,0.08)"}`,
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "0.75rem 0.85rem",
                  }}>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.22)" }}>Consequence Score</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginTop: "0.3rem" }}>
                      <span style={{
                        ...mono, fontSize: "18px", fontWeight: "bold",
                        color: executionState.consequenceScore >= 70 ? "rgba(252,165,165,0.90)" : executionState.consequenceScore >= 40 ? "rgba(253,186,116,0.90)" : "rgba(110,231,183,0.80)",
                      }}>
                        {executionState.consequenceScore}
                      </span>
                      <span style={{ ...mono, fontSize: "10px", color: "rgba(255,255,255,0.30)" }}>/100</span>
                    </div>
                    {executionState.consequenceTrend && (
                      <div style={{ ...mono, fontSize: "10px", marginTop: "0.25rem", color: executionState.consequenceTrend === "CRITICAL" ? "rgba(252,165,165,0.70)" : executionState.consequenceTrend === "ESCALATING" ? "rgba(253,186,116,0.70)" : "rgba(255,255,255,0.35)" }}>
                        {executionState.consequenceTrend}
                      </div>
                    )}
                  </div>
                )}

                {/* Directive */}
                {executionState.directive && (
                  <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "0.75rem 0.85rem", gridColumn: "1 / -1" }}>
                    <div style={{ ...mono, fontSize: "10px", color: `${GOLD}80` }}>System Directive</div>
                    <div style={{ ...serif, marginTop: "0.3rem", fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>
                      {executionState.directive}
                    </div>
                  </div>
                )}

                {/* Avoidance Pattern */}
                {executionState.avoidancePattern && (
                  <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.75rem 0.85rem", gridColumn: "1 / -1" }}>
                    <div style={{ ...mono, fontSize: "10px", color: "rgba(252,165,165,0.55)" }}>Avoidance Pattern Detected</div>
                    <div style={{ ...serif, marginTop: "0.3rem", fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(252,165,165,0.65)" }}>
                      {executionState.avoidancePattern}
                    </div>
                  </div>
                )}
              </div>

              {/* Escalation Triggers */}
              {executionState.escalationTriggers.length > 0 && (
                <div style={{ marginTop: "0.75rem", border: "1px solid rgba(252,165,165,0.20)", backgroundColor: "rgba(252,165,165,0.02)", padding: "0.75rem 0.85rem" }}>
                  <div style={{ ...mono, fontSize: "10px", color: "rgba(252,165,165,0.65)", marginBottom: "0.4rem" }}>Escalation Triggers Active</div>
                  {executionState.escalationTriggers.map((trigger, i) => (
                    <div key={i} style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(252,165,165,0.55)", marginBottom: "0.25rem" }}>
                      {trigger.triggerType}: {trigger.message}
                    </div>
                  ))}
                </div>
              )}

              {executionState.consequenceExplanation && (
                <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)", marginTop: "0.5rem", fontStyle: "italic" }}>
                  {executionState.consequenceExplanation}
                </p>
              )}
            </section>
          )}

          {/* ── 6. DECISION LOG ── */}
          <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <SectionLabel>Decision Log</SectionLabel>

            {decisions.length === 0 && (
              <div style={{ ...serif, fontSize: "0.88rem", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                No decisions logged. Record decisions as they are made.
              </div>
            )}

            {decisions.map((d) => (
              <div
                key={d.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "0.65rem 0.85rem",
                  marginBottom: "0.35rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {statusIcon(d.status)}
                    <span style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.45, color: "rgba(255,255,255,0.72)" }}>{d.decision}</span>
                  </div>
                  <span style={{ ...mono, fontSize: "7px", color: statusColor(d.status) }}>{d.status}</span>
                </div>
                {d.notes && (
                  <p style={{ ...serif, fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", marginTop: "0.25rem", fontStyle: "italic" }}>{d.notes}</p>
                )}
                {isActive && d.status === "pending" && (
                  <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => updateDecisionStatus(d.id, "executed")}
                      style={{
                        ...mono,
                        fontSize: "10px",
                        background: "none",
                        border: "1px solid rgba(110,231,183,0.25)",
                        color: "rgba(110,231,183,0.70)",
                        padding: "4px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Mark executed
                    </button>
                    <button
                      onClick={() => updateDecisionStatus(d.id, "blocked")}
                      style={{
                        ...mono,
                        fontSize: "10px",
                        background: "none",
                        border: "1px solid rgba(252,165,165,0.25)",
                        color: "rgba(252,165,165,0.70)",
                        padding: "4px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Mark blocked
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* New decision input */}
            {isActive && (
              <div style={{ marginTop: "0.75rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") logDecision(); }}
                    placeholder="Record action taken"
                    style={{
                      flex: 1,
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.09)",
                      outline: "none",
                      padding: "8px 10px",
                      ...serif,
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  />
                  <button
                    onClick={logDecision}
                    disabled={submitting || !newDecision.trim()}
                    style={{
                      ...mono,
                      fontSize: "7px",
                      background: "none",
                      border: `1px solid ${GOLD}35`,
                      color: `${GOLD}BB`,
                      padding: "8px 14px",
                      cursor: submitting ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <Plus style={{ width: 10, height: 10 }} />
                    Log decision
                  </button>
                </div>
                {microFeedback && (
                  <div style={{ ...mono, fontSize: "7.5px", color: "rgba(110,231,183,0.55)", marginTop: "0.35rem" }}>
                    {microFeedback}
                  </div>
                )}
                {localError && (
                  <div style={{ ...mono, fontSize: "7px", color: "rgba(252,165,165,0.70)", marginTop: "0.35rem" }}>
                    {localError}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── 8. EXIT STATES ── */}
          <section style={{ padding: "1.25rem 0" }}>
            <SectionLabel>Session Control</SectionLabel>
            {isActive ? (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => updateSessionStatus("completed")}
                  style={{
                    ...mono,
                    fontSize: "7.5px",
                    background: "none",
                    border: `1px solid ${GOLD}35`,
                    color: `${GOLD}BB`,
                    padding: "8px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <CheckCircle style={{ width: 10, height: 10 }} />
                  Continue execution
                </button>
                <button
                  onClick={() => updateSessionStatus("monitoring")}
                  style={{
                    ...mono,
                    fontSize: "7.5px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.50)",
                    padding: "8px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  Return to monitoring
                </button>
                <button
                  onClick={() => updateSessionStatus("escalated")}
                  style={{
                    ...mono,
                    fontSize: "10px",
                    background: "none",
                    border: "1px solid rgba(252,165,165,0.25)",
                    color: "rgba(252,165,165,0.70)",
                    padding: "8px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    minHeight: "44px",
                  }}
                >
                  <AlertTriangle style={{ width: 10, height: 10 }} />
                  Escalate
                </button>
              </div>
            ) : (
              <div style={{ ...mono, fontSize: "8px", color: statusColor(session.status) }}>
                Session {session.status} &middot;{" "}
                <Link href="/strategy-room" style={{ color: AMBER, textDecoration: "underline" }}>
                  Return to Strategy Room
                </Link>
              </div>
            )}
          </section>

          {/* Footer */}
          <div style={{ paddingTop: "1.5rem" }}>
            <Link
              href="/strategy-room"
              style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.22)", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              Back to Strategy Room
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER SIDE
// ─────────────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const id = ctx.params?.id;
  if (!id || typeof id !== "string") {
    return { props: { session: null, error: "Invalid session ID" } };
  }

  try {
    // Access validation via internal API call — the canonical access.server.ts
    // uses "server-only" which is incompatible with Pages Router webpack compilation.
    // Calling our own API route keeps the security boundary intact while allowing
    // Pages Router to render the session page.
    const host = ctx.req.headers.host ?? "localhost";
    const proto = ctx.req.headers["x-forwarded-proto"] || "http";
    const baseUrl = `${proto}://${host}`;

    const fetchHeaders: Record<string, string> = {
      "content-type": "application/json",
    };
    if (ctx.req.headers.cookie) fetchHeaders.cookie = ctx.req.headers.cookie;
    if (ctx.req.headers.authorization) fetchHeaders.authorization = ctx.req.headers.authorization;
    if (typeof ctx.query.access === "string") {
      fetchHeaders["x-strategy-access-token"] = ctx.query.access;
    }

    const accessRes = await fetch(
      `${baseUrl}/api/strategy-room/execution/${id}`,
      { headers: fetchHeaders },
    );

    if (!accessRes.ok) {
      return {
        props: {
          session: null,
          error: accessRes.status === 404 ? "Session not found" : "Access denied",
        },
      };
    }

    const accessData = await accessRes.json();
    const raw = accessData.session;

    if (!raw) {
      return { props: { session: null, error: "Session not found" } };
    }

    // The API route already parses JSON fields (constraints, interventionStack, etc.)
    // and returns dates as ISO strings in JSON serialization.
    const session: SessionData = {
      id: raw.id,
      sessionKey: raw.sessionKey,
      directive: raw.directive,
      escalationLevel: raw.escalationLevel,
      conditionSummary: raw.conditionSummary,
      coreProblem: raw.coreProblem,
      decisionQuestion: raw.decisionQuestion,
      constraints: Array.isArray(raw.constraints) ? raw.constraints : parseJsonFallback(raw.constraints, []),
      exposureLevel: raw.exposureLevel,
      interventionStack: Array.isArray(raw.interventionStack) ? raw.interventionStack : parseJsonFallback(raw.interventionStack, []),
      constraintMap: raw.constraintMap && typeof raw.constraintMap === "object" ? raw.constraintMap : parseJsonFallback(raw.constraintMap, null),
      evidenceGraph: raw.canonicalSnapshot?.evidenceGraph ?? (
        typeof raw.canonicalSnapshot === "object"
          ? (raw.canonicalSnapshot as any)?.evidenceGraph ?? null
          : parseJsonFallback<{ evidenceGraph?: SessionData["evidenceGraph"] }>(raw.canonicalSnapshot, {}).evidenceGraph ?? null
      ),
      evidenceCapture: extractAssessmentEvidenceCapture(raw.canonicalSnapshot),
      status: raw.status,
      decisions: Array.isArray(raw.decisions) ? raw.decisions.map((d: any) => ({
        id: d.id,
        decision: d.decision,
        status: d.status as "pending" | "executed" | "blocked",
        notes: d.notes,
        createdAt: typeof d.createdAt === "string" ? d.createdAt : new Date(d.createdAt).toISOString(),
        updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : new Date(d.updatedAt).toISOString(),
      })) : [],
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(raw.createdAt).toISOString(),
    };

    return { props: { session } };
  } catch (err) {
    console.error("[strategy-room-session]", err);
    return { props: { session: null, error: "Failed to load session" } };
  }
};
