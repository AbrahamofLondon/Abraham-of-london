"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Activity, 
  Target, 
  Info, 
  AlertTriangle, 
  CheckCircle2,
  Scale,
  ChevronDown,
  ChevronUp,
  Gavel,
  Brain,
  Heart,
  Users,
  Compass,
  Globe,
  Lock
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

// ─── Alignment Types ─────────────────────────────────────────────────────────

import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  PURPOSE_ALIGNMENT_QUESTIONS,
  type AlignmentDomain,
  type AlignmentQuestion,
} from "@/lib/alignment/checklist";

interface AuditFormProps {
  participantId: string;
  campaignId: string;
  campaignTitle: string;
}

interface DomainTelemetry {
  resonance: number;
  certainty: number;
}

interface AuditResponse {
  questionId: string;
  domain: AlignmentDomain;
  resonance: number;
  certainty: number;
}

interface AuditSubmission {
  participantId: string;
  campaignId: string;
  responses: AuditResponse[];
  constitutionalDecision?: ConstitutionalDecision;
  metadata: {
    submittedAt: string;
    userAgent: string;
    completionTime: number;
  };
}

// ─── Domain Icons ────────────────────────────────────────────────────────────

const DOMAIN_ICONS: Record<AlignmentDomain, React.ElementType> = {
  "mandate": ShieldCheck,
  "decision": Gavel,
  "environment": Globe,
  "behaviour": Users,
  "emotional-order": Heart,
  "legacy": Compass,
} as const;

// ─── UI Components ───────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function DomainCard({
  domain,
  telemetry,
  onChange,
  isExpanded,
  onToggle,
  questions,
  answers,
  onAnswerChange,
}: {
  domain: AlignmentDomain;
  telemetry: DomainTelemetry;
  onChange: (domain: AlignmentDomain, field: keyof DomainTelemetry, value: number) => void;
  isExpanded: boolean;
  onToggle: () => void;
  questions: AlignmentQuestion[];
  answers: Record<string, boolean>;
  onAnswerChange: (questionId: string, checked: boolean) => void;
}) {
  const Icon = DOMAIN_ICONS[domain];
  const answeredCount = questions.filter(q => answers[q.id]).length;
  const totalCount = questions.length;
  const completionPercent = Math.round((answeredCount / totalCount) * 100);

  return (
    <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-neutral-100 rounded-xl">
            <Icon className="w-5 h-5 text-neutral-700" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold uppercase tracking-tight">
                {ALIGNMENT_DOMAIN_LABELS[domain]}
              </h3>
              <span className="text-[10px] font-mono text-neutral-400">
                {answeredCount}/{totalCount}
              </span>
            </div>
            <div className="mt-1 h-1 w-32 rounded-full bg-neutral-100">
              <div 
                className="h-full rounded-full bg-neutral-700 transition-all"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[8px] font-mono uppercase text-neutral-400">Resonance</div>
            <div className="text-lg font-bold">{telemetry.resonance}%</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-mono uppercase text-neutral-400">Certainty</div>
            <div className="text-lg font-bold text-neutral-600">{telemetry.certainty}%</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-neutral-100 p-6 space-y-8">
          {/* Telemetry Controls */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Resonance</span>
                <span className="font-mono">{telemetry.resonance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.resonance}
                onChange={(e) => onChange(domain, "resonance", parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-700"
              />
              <div className="flex justify-between text-[8px] text-neutral-400">
                <span>Dissonant</span>
                <span>Neutral</span>
                <span>Aligned</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Certainty</span>
                <span className="font-mono text-neutral-600">{telemetry.certainty}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={telemetry.certainty}
                onChange={(e) => onChange(domain, "certainty", parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-500"
              />
              <div className="flex justify-between text-[8px] text-neutral-400">
                <span>Speculative</span>
                <span>Evidence</span>
                <span>Absolute</span>
              </div>
            </div>
          </div>

          {/* Domain-Specific Questions */}
          <div className="space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              Domain Diagnostics
            </div>
            {questions.map((question) => (
              <label
                key={question.id}
                className={cx(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  answers[question.id]
                    ? "border-neutral-300 bg-neutral-50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={answers[question.id] || false}
                  onChange={(e) => onAnswerChange(question.id, e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 accent-neutral-700"
                />
                <span className="text-sm leading-6 text-neutral-700">
                  {question.statement}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AuditForm({ participantId, campaignId, campaignTitle }: AuditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  
  // Telemetry state for each domain
  const [telemetry, setTelemetry] = useState<Record<AlignmentDomain, DomainTelemetry>>(() => {
    const initial: Record<AlignmentDomain, DomainTelemetry> = {} as any;
    ALIGNMENT_DOMAIN_ORDER.forEach(domain => {
      initial[domain] = { resonance: 50, certainty: 50 };
    });
    return initial;
  });

  // Answers for all 18 questions
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  
  // Expanded/collapsed state for domains
  const [expandedDomains, setExpandedDomains] = useState<Record<AlignmentDomain, boolean>>(() => {
    const initial: Record<AlignmentDomain, boolean> = {} as any;
    ALIGNMENT_DOMAIN_ORDER.forEach((domain, idx) => {
      initial[domain] = idx === 0; // Only first domain expanded by default
    });
    return initial;
  });

  // Group questions by domain
  const groupedQuestions = useMemo(() => {
    const grouped: Record<AlignmentDomain, AlignmentQuestion[]> = {} as any;
    for (const domain of ALIGNMENT_DOMAIN_ORDER) {
      grouped[domain] = PURPOSE_ALIGNMENT_QUESTIONS.filter(
        (q) => q.domain === domain
      );
    }
    return grouped;
  }, []);

  // Calculate completion metrics
  const totalQuestions = PURPOSE_ALIGNMENT_QUESTIONS.length;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const completionPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isComplete = answeredCount === totalQuestions;

  // Check for low certainty violations
  const hasLowCertainty = useMemo(() => {
    return Object.values(telemetry).some(t => t.certainty < 15);
  }, [telemetry]);

  // Derive constitutional inputs from telemetry and answers
  const constitutionalInput = useMemo(() => {
    // Calculate clarity score from answered questions
    const answeredQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(q => answers[q.id]);
    const clarityScore = answeredQuestions.length > 0 
      ? Math.round((answeredQuestions.length / totalQuestions) * 100)
      : 0;

    // Calculate average resonance across domains
    const avgResonance = Object.values(telemetry).reduce((sum, t) => sum + t.resonance, 0) / ALIGNMENT_DOMAIN_ORDER.length;
    
    // Determine posture based on resonance
    let posture: OrgPosture = "ORDERED";
    if (avgResonance < 30) posture = "DISORDERED";
    else if (avgResonance < 50) posture = "MISALIGNED";
    else if (avgResonance < 70) posture = "DRIFTING";

    // Calculate failure metrics
    const lowCertaintyCount = Object.values(telemetry).filter(t => t.certainty < 40).length;
    const lowResonanceCount = Object.values(telemetry).filter(t => t.resonance < 40).length;
    const failureModeCount = lowCertaintyCount + lowResonanceCount;
    const failureModeSeverity = Math.min(10, Math.floor((100 - avgResonance) / 10));

    // Determine readiness tier
    let readinessTier: ReadinessTier = "FRAGILE";
    if (completionPercent >= 90 && avgResonance >= 70) readinessTier = "SOVEREIGN";
    else if (completionPercent >= 75 && avgResonance >= 60) readinessTier = "EXECUTION_READY";
    else if (completionPercent >= 50 && avgResonance >= 45) readinessTier = "STABILIZING";
    else if (completionPercent >= 25) readinessTier = "EMERGING";

    // Determine authority type
    let authorityType: AuthorityType = "UNCLEAR";
    if (completionPercent >= 80 && avgResonance >= 60) authorityType = "DIRECT";
    else if (completionPercent >= 50) authorityType = "PROXY";

    return {
      clarityScore,
      authorityType,
      readinessTier,
      posture,
      failureModeCount,
      failureModeSeverity,
      narrativeCoherence: Math.round(avgResonance),
      interventionReadiness: completionPercent,
    };
  }, [answers, telemetry, totalQuestions, completionPercent]);

  // Evaluate constitutional route
  const constitutionalDecision = useMemo(() => {
    return evaluateConstitutionalRoute(constitutionalInput);
  }, [constitutionalInput]);

  // Handlers
  const handleTelemetryChange = useCallback((
    domain: AlignmentDomain,
    field: keyof DomainTelemetry,
    value: number
  ) => {
    setTelemetry(prev => ({
      ...prev,
      [domain]: { ...prev[domain], [field]: value }
    }));
  }, []);

  const handleAnswerChange = useCallback((questionId: string, checked: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: checked }));
  }, []);

  const toggleDomain = useCallback((domain: AlignmentDomain) => {
    setExpandedDomains(prev => ({ ...prev, [domain]: !prev[domain] }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isComplete) {
      alert(`Please complete all ${totalQuestions} questions before submitting. ${totalQuestions - answeredCount} remaining.`);
      return;
    }

    if (hasLowCertainty) {
      alert("Certainty below 15% in one or more domains. Please increase certainty to at least 15% before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build responses for all questions
      const responses: AuditResponse[] = [];
      
      for (const domain of ALIGNMENT_DOMAIN_ORDER) {
        const domainQuestions = groupedQuestions[domain];
        for (const question of domainQuestions) {
          responses.push({
            questionId: question.id,
            domain,
            resonance: telemetry[domain].resonance,
            certainty: telemetry[domain].certainty,
          });
        }
      }

      const submission: AuditSubmission = {
        participantId,
        campaignId,
        responses,
        constitutionalDecision,
        metadata: {
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          completionTime: Date.now() - startTime,
        },
      };

      const response = await fetch(`/api/audit/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      if (response.ok) {
        router.push(`/audit/success?campaign=${campaignId}&route=${constitutionalDecision.route}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }
    } catch (error) {
      console.error("AUDIT_SUBMISSION_FAILURE", error);
      alert(error instanceof Error ? error.message : "Failed to submit audit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get route color and message
  const getRouteDisplay = () => {
    switch (constitutionalDecision.route) {
      case "REJECT":
        return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle, message: "Constitutional review required" };
      case "DIAGNOSTIC":
        return { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Activity, message: "Diagnostic mode active" };
      case "STRATEGY":
        return { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, message: "Strategy execution ready" };
      default:
        return { color: "text-neutral-600", bg: "bg-neutral-50", border: "border-neutral-200", icon: ShieldCheck, message: "Awaiting evaluation" };
    }
  };

  const routeDisplay = getRouteDisplay();
  const RouteIcon = routeDisplay.icon;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="border-b border-neutral-200 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-neutral-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Sovereign Protocol Active
          </span>
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter leading-none mb-4">
          {campaignTitle}
        </h1>
        <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.15em] leading-relaxed">
          Calibrate your node across all 6 alignment domains. Your inputs will be mathematically decoupled from your identity.
        </p>
      </div>

      {/* CONSTITUTIONAL STATUS */}
      <div className={`p-4 rounded-lg border ${routeDisplay.border} ${routeDisplay.bg}`}>
        <div className="flex items-center gap-3">
          <RouteIcon className={`w-5 h-5 ${routeDisplay.color}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase ${routeDisplay.color}`}>
                Constitutional Status: {constitutionalDecision.route}
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Confidence: {(constitutionalDecision.confidence * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">{routeDisplay.message}</p>
            {constitutionalDecision.disqualifiersTriggered.length > 0 && (
              <div className="mt-2 text-[10px] text-amber-600">
                ⚠️ {constitutionalDecision.disqualifiersTriggered.join(" • ")}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] font-mono text-neutral-400">Completion</div>
            <div className="text-lg font-bold">{completionPercent}%</div>
          </div>
        </div>
      </div>

      {/* COMPLETION PROGRESS BAR */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="font-medium">Overall Progress</span>
          <span className="font-mono">{answeredCount}/{totalQuestions} questions</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-neutral-700 transition-all duration-500"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* DOMAIN CARDS - All 6 domains with all 18 questions */}
      <div className="space-y-4">
        {ALIGNMENT_DOMAIN_ORDER.map((domain) => (
          <DomainCard
            key={domain}
            domain={domain}
            telemetry={telemetry[domain]}
            onChange={handleTelemetryChange}
            isExpanded={expandedDomains[domain]}
            onToggle={() => toggleDomain(domain)}
            questions={groupedQuestions[domain]}
            answers={answers}
            onAnswerChange={handleAnswerChange}
          />
        ))}
      </div>

      {/* WARNINGS */}
      {hasLowCertainty && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-xs text-red-700">
            Certainty below 15% detected in one or more domains. Telemetry below constitutional minimum will be rejected.
          </span>
        </div>
      )}

      {/* CONSTITUTIONAL RECOMMENDATIONS */}
      {constitutionalDecision.recommendedInterventions.length > 0 && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-neutral-600" />
            <span className="text-[10px] font-black uppercase tracking-wider">
              Constitutional Recommendations
            </span>
          </div>
          <ul className="space-y-1">
            {constitutionalDecision.recommendedInterventions.map((rec, idx) => (
              <li key={idx} className="text-xs text-neutral-600 flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* SUBMISSION BUTTON */}
      <div className="pt-6 border-t border-neutral-200">
        <button
          type="submit"
          disabled={isSubmitting || !isComplete || hasLowCertainty}
          className={cx(
            "w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] transition-all",
            isComplete && !hasLowCertainty
              ? "bg-neutral-900 text-white hover:bg-neutral-700"
              : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 animate-spin" />
              Dispatching Telemetry...
            </span>
          ) : (
            "Validate & Submit Node"
          )}
        </button>
        
        {!isComplete && (
          <p className="mt-4 text-center text-[9px] text-neutral-400">
            Complete all {totalQuestions} diagnostic questions to enable submission
          </p>
        )}
        
        {isComplete && hasLowCertainty && (
          <p className="mt-4 text-center text-[9px] text-red-500">
            Increase certainty above 15% in all domains before submitting
          </p>
        )}
        
        <p className="mt-4 text-[9px] text-neutral-400 text-center">
          Verification: Once submitted, node state is locked within the constitutional registry.
          Constitutional routing: {constitutionalDecision.route} • Confidence: {(constitutionalDecision.confidence * 100).toFixed(0)}%
        </p>
      </div>
    </form>
  );
}