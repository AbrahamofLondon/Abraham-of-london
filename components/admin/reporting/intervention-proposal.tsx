'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { generateMandate, InterventionDomain } from "@/lib/alignment/intervention-engine";
import { generateHCDMandate, HCDInterventionDomain } from "@/lib/alignment/human-capital-delta";
import { mandateProtocol } from "@/app/actions/governance";
import { 
  ArrowRight, 
  Lock, 
  Activity, 
  TrendingUp, 
  Heart, 
  Briefcase, 
  Gauge, 
  Brain,
  AlertTriangle,
  ShieldCheck,
  Target
} from "lucide-react";

export type TelemetryLens = 'STRATEGIC' | 'HUMAN_CAPITAL' | 'FINANCIAL' | 'OPERATIONAL' | 'GOVERNANCE';

interface InterventionProposalProps {
  metrics: any[];
  campaignId: string;
  lens?: TelemetryLens;
  onLensChange?: (lens: TelemetryLens) => void;
  reportContext?: {
    state: string;
    priorityStack: string[];
    failureModes: string[];
  };
}

/**
 * ALIGNMENT ORBIT — Visual Recovery Tracker
 */
function AlignmentOrbit({ raw, current, label = "Resonance" }: { raw: number; current: number; label?: string }) {
  const recovered = raw - current;
  const percentage = Math.round((recovered / raw) * 100) || 0;

  return (
    <div className="border-t border-neutral-100 pt-6 mt-6 flex items-center justify-between gap-6">
      <div className="flex-1">
        <div className="flex justify-between items-end mb-1.5">
          <p className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">{label}</p>
          <p className="text-[7px] font-mono text-neutral-400">{percentage}% Recovered</p>
        </div>
        <div className="h-px w-full bg-neutral-200 relative">
          <div 
            className="absolute top-0 left-0 h-full bg-neutral-500 transition-all duration-1000 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[5px] font-mono text-neutral-400 uppercase">Baseline: {Math.round(raw)}%</span>
          <span className="text-[5px] font-mono text-neutral-400 uppercase">Target: Zero</span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="text-right border-l border-neutral-200 pl-4">
          <p className="text-[5px] font-mono text-neutral-400 uppercase mb-0.5">Current Delta</p>
          <p className="text-base font-light text-neutral-700 tracking-tight">{Math.round(current)}%</p>
        </div>
        <div className="text-right border-l border-neutral-200 pl-4">
          <p className="text-[5px] font-mono text-neutral-400 uppercase mb-0.5">Status</p>
          <p className={`text-[7px] font-mono uppercase tracking-wider ${current < 30 ? 'text-emerald-600' : 'text-neutral-500'}`}>
            {current < 30 ? "Stable" : "Correcting"}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * LENS SELECTOR — Toggle between telemetry modes
 */
function LensSelector({ currentLens, onLensChange }: { currentLens: TelemetryLens; onLensChange: (lens: TelemetryLens) => void }) {
  const lenses: { value: TelemetryLens; label: string; icon: React.ReactNode }[] = [
    { value: 'STRATEGIC', label: 'Strategic', icon: <TrendingUp className="w-2.5 h-2.5" /> },
    { value: 'HUMAN_CAPITAL', label: 'Human Capital', icon: <Heart className="w-2.5 h-2.5" /> },
    { value: 'OPERATIONAL', label: 'Operational', icon: <Gauge className="w-2.5 h-2.5" /> },
    { value: 'FINANCIAL', label: 'Financial', icon: <Briefcase className="w-2.5 h-2.5" /> },
    { value: 'GOVERNANCE', label: 'Governance', icon: <Brain className="w-2.5 h-2.5" /> },
  ];

  return (
    <div className="flex items-center gap-1 border border-neutral-100 bg-neutral-50/30 p-0.5 rounded-sm">
      {lenses.map((lens) => (
        <button
          key={lens.value}
          onClick={() => onLensChange(lens.value)}
          className={`flex items-center gap-1 px-2 py-1 text-[6px] font-mono uppercase tracking-wider transition-all ${
            currentLens === lens.value
              ? 'bg-white text-neutral-800 shadow-sm border border-neutral-200'
              : 'text-neutral-400 hover:text-neutral-600'
          }`}
        >
          {lens.icon}
          <span>{lens.label}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * CONTEXT BADGES — Display report context if available
 */
function ContextBadges({ context }: { context?: InterventionProposalProps['reportContext'] }) {
  if (!context) return null;

  const stateConfig = {
    ORDERED: { label: "ORDERED", color: "text-emerald-600", bg: "bg-emerald-50", icon: ShieldCheck },
    DRIFTING: { label: "DRIFTING", color: "text-amber-600", bg: "bg-amber-50", icon: TrendingUp },
    MISALIGNED: { label: "MISALIGNED", color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
    DISORDERED: { label: "DISORDERED", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
  }[context.state] || { label: context.state, color: "text-neutral-600", bg: "bg-neutral-50", icon: AlertTriangle };

  const Icon = stateConfig.icon;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className={`flex items-center gap-1.5 px-2 py-1 ${stateConfig.bg}`}>
        <Icon className={`w-2.5 h-2.5 ${stateConfig.color}`} />
        <span className={`text-[6px] font-mono uppercase tracking-wider ${stateConfig.color}`}>
          {stateConfig.label}
        </span>
      </div>
      {context.failureModes?.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50">
          <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
          <span className="text-[6px] font-mono uppercase tracking-wider text-red-600">
            {context.failureModes.length} Failure Mode{context.failureModes.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {context.priorityStack?.length > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100">
          <Target className="w-2.5 h-2.5 text-neutral-500" />
          <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-600">
            {context.priorityStack.length} Priority{context.priorityStack.length !== 1 ? 'ies' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * SOVEREIGN KEY AUTHORIZATION OVERLAY
 */
function SovereignKeyAuth({ actionLabel, isPending, onConfirm, onCancel }: { 
  actionLabel: string; 
  isPending: boolean;
  onConfirm: (key: string) => void; 
  onCancel: () => void; 
}) {
  const [keyCode, setKeyCode] = useState('');
  const REQUIRED_KEY = "SOVEREIGN-ALIGN-2026"; 

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-neutral-200 p-8 text-center shadow-2xl">
        <Lock className="w-6 h-6 text-neutral-400 mx-auto mb-5" />
        <h3 className="text-base font-light tracking-tight text-neutral-800 mb-1">Authorization Required</h3>
        <p className="text-[7px] font-mono text-neutral-500 uppercase tracking-wider mb-6">
          {actionLabel}
        </p>

        <div className="space-y-4">
          <input 
            type="text"
            autoFocus
            value={keyCode}
            onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
            placeholder="Sovereign Key"
            className="w-full border border-neutral-200 px-4 py-2 text-center text-[9px] font-mono tracking-wider text-neutral-700 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-400 transition-all"
            disabled={isPending}
          />

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={onCancel}
              disabled={isPending}
              className="py-2 text-[7px] font-mono uppercase tracking-wider text-neutral-500 border border-neutral-200 hover:bg-neutral-50 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm(keyCode)}
              disabled={keyCode !== REQUIRED_KEY || isPending}
              className={`py-2 text-[7px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                keyCode === REQUIRED_KEY && !isPending
                  ? 'bg-neutral-800 text-white hover:bg-neutral-700' 
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isPending ? <Activity className="w-2 h-2 animate-spin" /> : "Authorize"} 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate enhanced mandate with context awareness
 */
function generateEnhancedMandate(
  domain: string,
  delta: number,
  lens: TelemetryLens,
  context?: InterventionProposalProps['reportContext']
): { title: string; description: string; investment_tier: string; urgency: string } {
  // Get base mandate from existing generators
  const baseMandate = lens === 'HUMAN_CAPITAL'
    ? generateHCDMandate(domain as HCDInterventionDomain, delta)
    : generateMandate(domain as InterventionDomain, delta);

  if (!context) return baseMandate;

  // Enhance mandate with context awareness
  let urgency = "STANDARD";
  let title = baseMandate.title;
  let description = baseMandate.description;

  // Adjust urgency based on state
  if (context.state === "DISORDERED") {
    urgency = "CRITICAL";
    title = `[CRITICAL] ${title}`;
    description = `${description} The organisation is in a DISORDERED state requiring immediate intervention.`;
  } else if (context.state === "MISALIGNED") {
    urgency = "HIGH";
    description = `${description} Systemic misalignment detected across multiple domains.`;
  } else if (context.state === "DRIFTING") {
    urgency = "ELEVATED";
    description = `${description} Early intervention recommended to prevent further drift.`;
  }

  // Incorporate failure modes into description
  if (context.failureModes?.length > 0) {
    const primaryFailure = context.failureModes[0];
    description = `${description} Primary failure mode: ${primaryFailure}.`;
  }

  // Reference priority stack
  if (context.priorityStack?.length > 0) {
    const topPriority = context.priorityStack[0];
    description = `${description} Aligns with top priority: "${topPriority}".`;
  }

  return {
    ...baseMandate,
    title,
    description,
    investment_tier: baseMandate.investment_tier,
    urgency,
  };
}

export function InterventionProposal({ 
  metrics, 
  campaignId, 
  lens = 'STRATEGIC', 
  onLensChange,
  reportContext 
}: InterventionProposalProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [activeLens, setActiveLens] = useState<TelemetryLens>(lens);
  const [isPending, startTransition] = useTransition();

  // Keep internal state synced with parent prop if it changes
  useEffect(() => {
    setActiveLens(lens);
  }, [lens]);

  useEffect(() => { setIsMounted(true); }, []);

  const topIssue = React.useMemo(() => {
    if (!metrics || metrics.length === 0) return null;
    const sorted = [...metrics].sort((a, b) => {
      const aVal = activeLens === 'HUMAN_CAPITAL' ? (a.burnoutIndex || (a.intent - a.reality)) : (a.intent - a.reality);
      const bVal = activeLens === 'HUMAN_CAPITAL' ? (b.burnoutIndex || (b.intent - b.reality)) : (b.intent - b.reality);
      return bVal - aVal;
    });
    return sorted[0];
  }, [metrics, activeLens]);

  if (!topIssue) return null;

  const delta = Math.max(0, activeLens === 'HUMAN_CAPITAL' ? (topIssue.burnoutIndex || (topIssue.intent - topIssue.reality)) : (topIssue.intent - topIssue.reality));
  
  const domain = topIssue.label.toUpperCase().replace(/\s/g, '_');
  const mandate = generateEnhancedMandate(domain, delta, activeLens, reportContext);

  const recoveryProjection = `+${Math.round(delta * (activeLens === 'FINANCIAL' ? 0.95 : 0.85))}%`;
  const currentDissonance = delta;
  const rawDissonance = delta * 1.25;

  const lensStyles = {
    STRATEGIC: { accent: "border-neutral-500", bg: "bg-neutral-50", text: "text-neutral-500", icon: <TrendingUp className="w-3 h-3" /> },
    HUMAN_CAPITAL: { accent: "border-blue-500", bg: "bg-blue-50/30", text: "text-blue-500", icon: <Heart className="w-3 h-3" /> },
    OPERATIONAL: { accent: "border-amber-500", bg: "bg-amber-50/30", text: "text-amber-500", icon: <Gauge className="w-3 h-3" /> },
    FINANCIAL: { accent: "border-emerald-500", bg: "bg-emerald-50/30", text: "text-emerald-500", icon: <Briefcase className="w-3 h-3" /> },
    GOVERNANCE: { accent: "border-purple-500", bg: "bg-purple-50/30", text: "text-purple-500", icon: <Brain className="w-3 h-3" /> },
  }[activeLens];

  const urgencyStyles = {
    CRITICAL: "border-red-500 bg-red-50 text-red-700",
    HIGH: "border-orange-500 bg-orange-50 text-orange-700",
    ELEVATED: "border-amber-500 bg-amber-50 text-amber-700",
    STANDARD: "border-neutral-500 bg-neutral-50 text-neutral-700",
  }[mandate.urgency] || "border-neutral-500 bg-neutral-50 text-neutral-700";

  const handleFinalDeployment = (key: string) => {
    startTransition(async () => {
      const result = await mandateProtocol({
        campaignId,
        domain: topIssue.label,
        action: mandate?.title || `${activeLens} Intervention`,
        recoveryProjection,
        sovereignKey: key,
        context: reportContext ? {
          state: reportContext.state,
          failureModes: reportContext.failureModes,
          priorityStack: reportContext.priorityStack,
        } : undefined,
      });

      if (result.success) {
        setShowAuth(false);
      } else {
        alert(result.error || 'Deployment failed');
      }
    });
  };

  return (
    <>
      {showAuth && (
        <SovereignKeyAuth 
          actionLabel={mandate?.title || `${activeLens} Intervention`}
          isPending={isPending}
          onCancel={() => setShowAuth(false)}
          onConfirm={handleFinalDeployment}
        />
      )}

      <div className="bg-white border border-neutral-100 overflow-hidden shadow-sm">
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 border ${lensStyles.accent} ${lensStyles.bg}`}>
                {React.cloneElement(lensStyles.icon as React.ReactElement, { className: `w-3 h-3 ${lensStyles.text}` })}
              </div>
              <div>
                <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400 block">Sovereign Mandate</span>
                <div className="h-px w-5 bg-neutral-200 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LensSelector currentLens={activeLens} onLensChange={(l) => { setActiveLens(l); onLensChange?.(l); }} />
              <span className={`px-2 py-0.5 text-[5px] font-mono uppercase tracking-wider border ${urgencyStyles}`}>
                {mandate.urgency}
              </span>
              <span className="px-2 py-0.5 text-[5px] font-mono uppercase tracking-wider border border-neutral-200 text-neutral-500">
                {mandate.investment_tier || "Standard"}
              </span>
            </div>
          </div>

          {/* Context badges - show report context if available */}
          <ContextBadges context={reportContext} />

          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 lg:col-span-7">
              <h3 className="text-lg font-light tracking-tight text-neutral-800 leading-tight mb-3 italic">
                {mandate?.title || `${activeLens} Intervention Required`}
              </h3>
              <div className="max-w-md">
                <p className="text-[10px] font-light leading-relaxed text-neutral-500 border-l border-neutral-200 pl-3 py-1">
                  {mandate?.description || `Institutional variance of ${delta}% requires immediate recalibration within the ${activeLens.toLowerCase()} domain.`}
                </p>
              </div>
            </div>
            
            <div className="col-span-12 lg:col-span-5">
              <div className="border border-neutral-100 bg-neutral-50/30 p-5">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <p className="text-[5px] font-mono uppercase tracking-wider text-neutral-400 mb-0.5">Efficiency Recovery</p>
                    <p className="text-lg font-light tracking-tight text-neutral-700">{recoveryProjection}</p>
                  </div>
                </div>
                
                <div className="w-full h-px bg-neutral-200 mb-4 overflow-hidden">
                  <div 
                    className={`h-full ${lensStyles.text.replace('text', 'bg')} transition-all duration-1000 ease-out`} 
                    style={{ width: isMounted ? `${Math.min(100, Math.round(delta * 0.85))}%` : '0%' }} 
                  />
                </div>

                <button 
                  type="button"
                  onClick={() => setShowAuth(true)}
                  className="group w-full py-2.5 text-[6px] font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-300 border border-neutral-800 bg-neutral-900 text-white hover:bg-black"
                >
                  <span>Deploy Protocol</span>
                  <ArrowRight className="w-2 h-2 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>

          <AlignmentOrbit raw={rawDissonance} current={currentDissonance} label={`${activeLens.replace('_', ' ')} Delta`} />
        </div>
      </div>
    </>
  );
}