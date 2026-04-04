"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ShieldAlert,
  Zap,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Target,
  Brain,
  Orbit,
  ArrowRight,
  Gavel,
  Scale,
} from "lucide-react";

// ─── Constitutional Types ─────────────────────────────────────────────────────

import {
  evaluateConstitutionalRoute,
  type ConstitutionalRoute,
  type AuthorityType,
  type ReadinessTier,
  type OrgPosture,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

interface ContagionVector {
  source: string;
  target: string;
  impact: number;
  severity: "low" | "moderate" | "high" | "critical";
  confidence: number;
  constitutionalDecision?: ConstitutionalDecision;
}

interface ContagionMapProps {
  data?: ContagionVector[];
  isLoading?: boolean;
  onRecalculate?: () => void;
  
  // Constitutional inputs for deriving contagion vectors
  constitutionalInput?: {
    clarityScore: number;
    authorityType: AuthorityType;
    readinessTier: ReadinessTier;
    posture: OrgPosture;
    failureModeCount: number;
    failureModeSeverity: number;
    narrativeCoherence: number;
    interventionReadiness: number;
  };
  
  // Canonical contract data sources
  failureModes?: Array<{
    mode: string;
    severity: number;
    probability: number;
    propagationPath?: string[];
    systemicImpact?: number;
  }>;
  dominantDomains?: string[];
  priorityStack?: Array<{
    priority: string;
    domain: string;
    urgency: number;
    contagionRisk?: number;
  }>;
  integritySnapshot?: {
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
  };
  financialExposure?: {
    marketRiskBand: string;
    revenueBand: string;
    revenueScore: number;
  };
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getSeverityStyles(severity: ContagionVector["severity"]) {
  switch (severity) {
    case "critical":
      return {
        text: "text-red-300",
        bar: "bg-red-400",
        soft: "bg-red-500/[0.10]",
        border: "border-red-400/25",
        icon: ShieldAlert,
        label: "Critical",
        score: 4,
      };
    case "high":
      return {
        text: "text-orange-300",
        bar: "bg-orange-400",
        soft: "bg-orange-500/[0.10]",
        border: "border-orange-400/22",
        icon: AlertCircle,
        label: "High",
        score: 3,
      };
    case "moderate":
      return {
        text: "text-amber-300",
        bar: "bg-amber-400",
        soft: "bg-amber-500/[0.10]",
        border: "border-amber-400/20",
        icon: TrendingUp,
        label: "Moderate",
        score: 2,
      };
    default:
      return {
        text: "text-emerald-300",
        bar: "bg-emerald-400",
        soft: "bg-emerald-500/[0.10]",
        border: "border-emerald-400/20",
        icon: CheckCircle2,
        label: "Low",
        score: 1,
      };
  }
}

function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/34">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <Brain className="mb-4 h-8 w-8 text-white/12" />
      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
        No contagion vectors detected
      </div>
      <p className="mt-3 max-w-[24ch] text-[11px] leading-5 text-white/34">
        Insufficient stress propagation data for analysis.
      </p>
    </div>
  );
}

/**
 * Derives contagion vectors from constitutional rules engine
 * Following constitutional hierarchy: REJECT > DIAGNOSTIC > STRATEGY
 */
function deriveContagionFromConstitution(
  constitutionalInput: ContagionMapProps["constitutionalInput"],
  constitutionalDecision?: ConstitutionalDecision
): ContagionVector[] {
  const vectors: ContagionVector[] = [];
  
  if (!constitutionalInput) return vectors;

  const decision = constitutionalDecision || evaluateConstitutionalRoute(constitutionalInput);
  const { route, confidence, disqualifiersTriggered, recommendedInterventions } = decision;

  // Vector 1: Constitutional Route Impact
  let routeSeverity: ContagionVector["severity"] = "low";
  let routeImpact = 0;
  
  switch (route) {
    case "REJECT":
      routeSeverity = "critical";
      routeImpact = 95;
      break;
    case "DIAGNOSTIC":
      routeSeverity = constitutionalInput.failureModeCount > 2 ? "high" : "moderate";
      routeImpact = constitutionalInput.failureModeSeverity * 8 + 20;
      break;
    case "STRATEGY":
      routeSeverity = "low";
      routeImpact = 15;
      break;
  }

  vectors.push({
    source: "Constitutional Engine",
    target: `Route: ${route}`,
    impact: Math.min(routeImpact, 100),
    severity: routeSeverity,
    confidence: confidence,
    constitutionalDecision: decision,
  });

  // Vector 2: Disqualifiers as contagion vectors
  if (disqualifiersTriggered.length > 0) {
    const disqualifierSeverity: ContagionVector["severity"] = 
      disqualifiersTriggered.length >= 3 ? "critical" :
      disqualifiersTriggered.length === 2 ? "high" : "moderate";
    
    vectors.push({
      source: "Constitutional Disqualifiers",
      target: disqualifiersTriggered.slice(0, 2).join(", "),
      impact: 40 + (disqualifiersTriggered.length * 15),
      severity: disqualifierSeverity,
      confidence: 0.85,
      constitutionalDecision: decision,
    });
  }

  // Vector 3: Intervention Readiness Gap
  const readinessGap = Math.max(0, 70 - constitutionalInput.interventionReadiness);
  if (readinessGap > 20) {
    vectors.push({
      source: "Intervention Readiness",
      target: "Execution Capability",
      impact: readinessGap,
      severity: readinessGap > 60 ? "critical" : readinessGap > 40 ? "high" : "moderate",
      confidence: 0.78,
      constitutionalDecision: decision,
    });
  }

  return vectors;
}

/**
 * Derives contagion vectors from canonical data sources
 * Following canonical order: integritySnapshot → financialExposure → failureModes → dominantDomains
 */
function deriveContagionFromCanonical(
  integritySnapshot?: ContagionMapProps["integritySnapshot"],
  financialExposure?: ContagionMapProps["financialExposure"],
  failureModes?: ContagionMapProps["failureModes"],
  dominantDomains?: string[],
  priorityStack?: ContagionMapProps["priorityStack"]
): ContagionVector[] {
  const vectors: ContagionVector[] = [];

  // Source 1: Integrity snapshot (clarity, authority, governance)
  if (integritySnapshot) {
    const clarityGap = Math.max(0, 70 - integritySnapshot.clarityScore);
    if (clarityGap > 20) {
      vectors.push({
        source: "Integrity: Clarity",
        target: "Decision Authority",
        impact: clarityGap,
        severity: clarityGap > 60 ? "critical" : clarityGap > 40 ? "high" : "moderate",
        confidence: 0.82,
      });
    }

    const governanceGap = Math.max(0, 70 - integritySnapshot.governanceScore);
    if (governanceGap > 25) {
      vectors.push({
        source: "Integrity: Governance",
        target: "Structural Stability",
        impact: governanceGap,
        severity: governanceGap > 60 ? "critical" : governanceGap > 40 ? "high" : "moderate",
        confidence: 0.79,
      });
    }
  }

  // Source 2: Financial exposure
  if (financialExposure) {
    let marketSeverity: ContagionVector["severity"] = "low";
    let marketImpact = 20;
    
    switch (financialExposure.marketRiskBand) {
      case "HIGH":
        marketSeverity = "critical";
        marketImpact = 85;
        break;
      case "ELEVATED":
        marketSeverity = "high";
        marketImpact = 65;
        break;
      case "MODERATE":
        marketSeverity = "moderate";
        marketImpact = 40;
        break;
      default:
        marketSeverity = "low";
        marketImpact = 15;
    }
    
    vectors.push({
      source: "Financial Exposure",
      target: `Market Risk: ${financialExposure.marketRiskBand}`,
      impact: marketImpact,
      severity: marketSeverity,
      confidence: 0.88,
    });
  }

  // Source 3: Failure modes
  if (failureModes && failureModes.length > 0) {
    for (const mode of failureModes.slice(0, 4)) {
      const severityScore = mode.severity;
      let severity: ContagionVector["severity"] = "low";
      
      if (severityScore >= 80) severity = "critical";
      else if (severityScore >= 60) severity = "high";
      else if (severityScore >= 40) severity = "moderate";
      
      if (mode.propagationPath && mode.propagationPath.length >= 2) {
        vectors.push({
          source: mode.propagationPath[0],
          target: mode.propagationPath[1],
          impact: mode.systemicImpact || mode.severity,
          severity,
          confidence: mode.probability / 100,
        });
      } else {
        vectors.push({
          source: mode.mode,
          target: "Systemic Stability",
          impact: mode.severity,
          severity,
          confidence: mode.probability / 100,
        });
      }
    }
  }

  // Source 4: Priority stack with contagion risk
  if (priorityStack && priorityStack.length > 0 && vectors.length < 3) {
    for (const item of priorityStack.slice(0, 3)) {
      const contagionRisk = item.contagionRisk || item.urgency * 10;
      let severity: ContagionVector["severity"] = "low";
      
      if (contagionRisk >= 80) severity = "critical";
      else if (contagionRisk >= 60) severity = "high";
      else if (contagionRisk >= 40) severity = "moderate";
      
      vectors.push({
        source: item.domain,
        target: "Priority Risk",
        impact: contagionRisk,
        severity,
        confidence: 0.7 + (item.urgency / 100) * 0.25,
      });
    }
  }

  // Source 5: Dominant domains (market correlation)
  if (dominantDomains && dominantDomains.length >= 2 && vectors.length < 2) {
    for (let i = 0; i < Math.min(dominantDomains.length - 1, 3); i++) {
      vectors.push({
        source: dominantDomains[i],
        target: dominantDomains[i + 1],
        impact: 40 + (i * 10),
        severity: i === 0 ? "high" : i === 1 ? "moderate" : "low",
        confidence: 0.72 - (i * 0.05),
      });
    }
  }

  return vectors;
}

export function ContagionMap({
  data,
  isLoading = false,
  onRecalculate,
  constitutionalInput,
  failureModes,
  dominantDomains,
  priorityStack,
  integritySnapshot,
  financialExposure,
}: ContagionMapProps) {
  const [selectedMitigation, setSelectedMitigation] = useState<ContagionVector | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Derive vectors from constitutional rules and canonical sources
  const derivedVectors = useMemo(() => {
    // If explicit data provided, use it
    if (data && data.length > 0) return data;
    
    let vectors: ContagionVector[] = [];
    
    // Priority 1: Constitutional rules engine (most authoritative)
    if (constitutionalInput) {
      vectors = deriveContagionFromConstitution(constitutionalInput);
    }
    
    // Priority 2: Canonical data sources (if constitutional not available or insufficient)
    if (vectors.length === 0 || vectors.length < 2) {
      const canonicalVectors = deriveContagionFromCanonical(
        integritySnapshot,
        financialExposure,
        failureModes,
        dominantDomains,
        priorityStack
      );
      vectors = [...vectors, ...canonicalVectors];
    }
    
    // Deduplicate by source-target pair
    const seen = new Set<string>();
    const uniqueVectors = vectors.filter(v => {
      const key = `${v.source}|${v.target}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    return uniqueVectors.slice(0, 8); // Limit to top 8 vectors
  }, [data, constitutionalInput, integritySnapshot, financialExposure, failureModes, dominantDomains, priorityStack]);

  const safeData = derivedVectors;
  const displayData = expanded ? safeData : safeData.slice(0, 4);
  const hasMore = safeData.length > 4;

  const avgImpact = useMemo(() => {
    if (!safeData.length) return 0;
    return Math.round(
      safeData.reduce((sum, v) => sum + v.impact, 0) / safeData.length
    );
  }, [safeData]);

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(12,12,13,0.96)_0%,rgba(7,7,8,0.99)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.05),transparent_38%)]" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
            className="mb-4"
          >
            <Orbit className="h-7 w-7 text-[#C9A96A]/65" />
          </motion.div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
            Evaluating constitutional posture...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[24px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(12,12,13,0.96)_0%,rgba(7,7,8,0.99)_100%)] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.05),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Gavel size={11} className="text-[#C9A96A]/75" />
          <MonoLabel>Constitutional Contagion</MonoLabel>
        </div>

        <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">
          {safeData.length} Vectors
        </span>
      </div>

      {/* Body */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar">
        {displayData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-3">
            <div className="space-y-2.5">
              {displayData.map((vector, idx) => {
                const styles = getSeverityStyles(vector.severity);
                const Icon = styles.icon;

                return (
                  <motion.div
                    key={`${vector.source}-${vector.target}-${idx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.22 }}
                    className={cx(
                      "group rounded-[18px] border p-3 transition-all duration-300",
                      "bg-white/[0.02] hover:bg-white/[0.035]",
                      styles.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Icon className={cx("h-3.5 w-3.5", styles.text)} />
                          <span className={cx("font-mono text-[7px] uppercase tracking-[0.18em]", styles.text)}>
                            {styles.label}
                          </span>
                          {vector.constitutionalDecision && (
                            <span className="ml-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/[0.08] px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.1em] text-[#C9A96A]">
                              CONSTITUTIONAL
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <div className="truncate font-mono text-[8px] uppercase tracking-[0.16em] text-white/68">
                            {vector.source}
                          </div>
                          <ArrowRight className="h-3 w-3 text-white/18" />
                          <div className="truncate text-right font-mono text-[8px] uppercase tracking-[0.16em] text-white/46">
                            {vector.target}
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/26">
                              Propagation risk
                            </span>
                            <span className={cx("font-mono text-[10px]", styles.text)}>
                              {vector.impact}%
                            </span>
                          </div>

                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(0, Math.min(vector.impact, 100))}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className={cx("h-full rounded-full", styles.bar)}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-white/24">
                            Confidence {(vector.confidence * 100).toFixed(0)}%
                          </span>

                          <button
                            onClick={() => setSelectedMitigation(vector)}
                            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-[7px] uppercase tracking-[0.18em] text-white/62 transition hover:border-[#C9A96A]/25 hover:bg-[#C9A96A]/[0.08] hover:text-[#E4CB98]"
                          >
                            Mitigate
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {hasMore ? (
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="mt-3 w-full rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-3 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/36 transition hover:bg-white/[0.04] hover:text-white/70"
              >
                {expanded ? "Collapse Matrix" : `Show ${safeData.length - 4} Hidden Vectors`}
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Scale size={10} className="text-[#C9A96A]/65" />
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/34">
            Systemic Impact {avgImpact}%
          </span>
        </div>

        {onRecalculate ? (
          <button
            onClick={onRecalculate}
            className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/34 transition hover:text-[#E4CB98]"
          >
            <Zap size={10} />
            Re-evaluate
          </button>
        ) : null}
      </div>

      {/* Mitigation Modal */}
      <AnimatePresence>
        {selectedMitigation ? (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-30 flex flex-col bg-[linear-gradient(180deg,rgba(8,8,9,0.985)_0%,rgba(5,5,6,1)_100%)]"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4">
              <div>
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#C9A96A]/75">
                  Strategic Mitigation Plan
                </div>
                <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.16em] text-white/44">
                  {selectedMitigation.source} → {selectedMitigation.target}
                </div>
                {selectedMitigation.constitutionalDecision && (
                  <div className="mt-2 font-mono text-[7px] uppercase tracking-[0.14em] text-[#C9A96A]/60">
                    Constitutional Route: {selectedMitigation.constitutionalDecision.route}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedMitigation(null)}
                className="rounded-md border border-white/[0.08] p-1.5 text-white/45 transition hover:bg-white/[0.05] hover:text-white/82"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              <div
                className={cx(
                  "rounded-[18px] border p-4",
                  getSeverityStyles(selectedMitigation.severity).border,
                  getSeverityStyles(selectedMitigation.severity).soft
                )}
              >
                <div className="mb-3 flex items-center gap-2">
                  <ShieldAlert
                    size={14}
                    className={getSeverityStyles(selectedMitigation.severity).text}
                  />
                  <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/76">
                    {selectedMitigation.constitutionalDecision 
                      ? "Constitutional Containment Protocol" 
                      : "Containment Protocol Alpha"}
                  </span>
                </div>

                <p className="text-[12px] leading-6 text-white/68">
                  {selectedMitigation.constitutionalDecision 
                    ? `Constitutional evaluation detected ${selectedMitigation.impact}% systemic impact. 
                       Route: ${selectedMitigation.constitutionalDecision.route} with ${(selectedMitigation.confidence * 100).toFixed(0)}% confidence.`
                    : `Direct contagion detected at ${selectedMitigation.impact}%. Immediate isolation of origin node is advised.`}
                  {selectedMitigation.constitutionalDecision?.disqualifiersTriggered.length > 0 && (
                    <> Disqualifiers: {selectedMitigation.constitutionalDecision.disqualifiersTriggered.slice(0, 2).join(", ")}.</>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/28">
                    Impact Probability
                  </div>
                  <div className="mt-2 font-mono text-[15px] text-white/86">
                    {(selectedMitigation.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/28">
                    Intervention Window
                  </div>
                  <div className="mt-2 font-mono text-[15px] text-white/86">
                    {selectedMitigation.constitutionalDecision?.route === "REJECT" 
                      ? "Escalation Required" 
                      : selectedMitigation.constitutionalDecision?.route === "STRATEGY"
                      ? "Immediate Action"
                      : "12.4 Hours"}
                  </div>
                </div>
              </div>

              {selectedMitigation.constitutionalDecision?.recommendedInterventions && (
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/28">
                    Recommended Interventions
                  </div>
                  <ul className="mt-2 space-y-1">
                    {selectedMitigation.constitutionalDecision.recommendedInterventions.map((intervention, i) => (
                      <li key={i} className="text-[10px] text-white/62">
                        • {intervention}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-white/[0.08] p-5">
              <button
                onClick={() => setSelectedMitigation(null)}
                className="inline-flex w-full items-center justify-center gap-3 rounded-[16px] border border-[#C9A96A]/28 bg-[#C9A96A]/[0.10] px-4 py-4 font-mono text-[8px] uppercase tracking-[0.22em] text-[#E4CB98] transition hover:bg-[#C9A96A]/[0.14]"
              >
                <Zap size={12} />
                {selectedMitigation.constitutionalDecision?.route === "REJECT" 
                  ? "Escalate to Constitutional Review" 
                  : "Execute Mitigation Protocol"}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}