'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  Zap, MessageSquare, ArrowUpRight, Copy, Check, AlertTriangle, Scale, 
  Shield, Target, Compass, Brain, Gavel, Globe, Heart, Users, Lock,
  ShieldCheck, FileText, Clock, Key, Fingerprint, Eye, FileSignature,
  TrendingUp, AlertOctagon, CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { DomainDiagnostic } from '@/lib/alignment/domain-diagnostic';
import { toast } from 'sonner';

// ─── Constitutional Types ─────────────────────────────────────────────────────

import {
  evaluateConstitutionalRoute,
  type ConstitutionalRoute,
  type AuthorityType,
  type ReadinessTier,
  type OrgPosture,
  type ConstitutionalDecision,
} from '@/lib/constitution/rules';

import {
  validateAuthority,
  validateThreshold,
  type ConstitutionalAuthority,
  type AuthorityLevel,
  type AuditEntry,
} from '@/lib/constitution/constitutional-authority';

import { SovereignDataEncryption, type SovereignDataContainer } from '@/lib/constitution/sovereign-data';

// ─── Alignment Types ─────────────────────────────────────────────────────────

import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
  type AlignmentDomain,
  PURPOSE_ALIGNMENT_QUESTIONS,
} from '@/lib/alignment/checklist';

// ─── Extended Types ─────────────────────────────────────────────────────────

export interface EnhancedDomainDiagnostic extends DomainDiagnostic {
  constitutionalImpact: {
    routeImpact: number;
    disqualifierRelevance: string[];
    recommendedInterventionPriority: 'immediate' | 'short-term' | 'medium-term' | 'strategic';
    constitutionalRouteAlignment: ConstitutionalRoute;
    authorityTypeRequired: AuthorityType;
    readinessTierRequired: ReadinessTier;
    authorityLevelRequired: AuthorityLevel;
  };
  questionsCompleted: number;
  questionsTotal: number;
  weakestQuestions: string[];
  strongestQuestions: string[];
  questionIds: string[];
  domainSpecificGuidance: string;
  precedentCases: string[];
  estimatedTimeline: string;
  resourceRequirements: {
    effort: 'low' | 'medium' | 'high' | 'critical';
    expertise: string[];
    externalSupport: boolean;
    authorityRequired: AuthorityLevel;
  };
  auditTrail?: AuditEntry[];
  sovereignDataHash?: string;
  signatureRequired: boolean;
  quorumRequired: number;
}

interface InterventionCopilotProps {
  diagnostics: DomainDiagnostic[];
  constitutionalDecision?: ConstitutionalDecision;
  constitutionalAuthority?: ConstitutionalAuthority;
  completedQuestions?: Record<AlignmentDomain, number>;
  totalQuestionsPerDomain?: Record<AlignmentDomain, number>;
  campaignId: string;
  organisationType?: 'corporation' | 'foundation' | 'sovereign' | 'partnership';
  governanceModel?: AuthorityType;
  participantCount?: number;
  threshold?: number;
  onCopyScript?: (domain: string, script: string) => void;
  onRequestDetail?: (domain: string) => void;
  onCreateIntervention?: (domain: string, intervention: string, signature?: string) => Promise<void>;
  onVerifyAuthority?: () => Promise<boolean>;
  onAuditAction?: (action: string, domain: string) => Promise<void>;
}

// ─── Domain Icons & Guidance ─────────────────────────────────────────────────

const DOMAIN_ICONS: Record<AlignmentDomain, React.ElementType> = {
  mandate: Shield,
  decision: Gavel,
  environment: Globe,
  behaviour: Users,
  'emotional-order': Heart,
  legacy: Compass,
} as const;

const DOMAIN_GUIDANCE: Record<AlignmentDomain, string> = {
  mandate: "Focus on clarifying the core purpose and decision authority. Ensure the mandate is explicit, documented, and understood across the organisation.",
  decision: "Establish clear decision-making protocols. Identify who has authority for which decisions and ensure accountability mechanisms are in place.",
  environment: "Map the operational context and market dynamics. Understand external pressures and align internal capabilities with external demands.",
  behaviour: "Observe and document behavioural patterns. Identify misalignments between stated values and actual practices.",
  'emotional-order': "Assess psychological safety and emotional resilience. Address underlying tensions before they become systemic issues.",
  legacy: "Evaluate historical patterns and institutional memory. Ensure past lessons inform current strategy without constraining necessary evolution.",
};

const PRECEDENT_CASES: Record<AlignmentDomain, string[]> = {
  mandate: [
    "Fortune 500: Clarified mandate → 40% reduction in strategic drift",
    "Public Sector: Documented authority → 65% faster decision cycles",
  ],
  decision: [
    "Tech Scale-up: Proxy authority model → 3x execution speed",
    "Financial Services: Direct authority → 90% compliance rate",
  ],
  environment: [
    "Manufacturing: Market mapping → 30% better risk anticipation",
    "Retail: Competitive analysis → 25% market share gain",
  ],
  behaviour: [
    "Healthcare: Pattern documentation → 50% reduction in conflicts",
    "Professional Services: Value alignment → 35% retention increase",
  ],
  'emotional-order': [
    "Creative Agency: Safety protocols → 80% lower turnover",
    "Non-profit: Resilience program → 45% burnout reduction",
  ],
  legacy: [
    "Family Office: Memory architecture → preserved while evolving",
    "Institution: Pattern recognition → avoided repeat failures",
  ],
};

// ─── UI Components ───────────────────────────────────────────────────────────

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function CopyButton({ text, onCopy }: { text: string; onCopy?: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Intervention script copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy script');
    }
  }, [text, onCopy]);

  return (
    <button
      onClick={handleCopy}
      className="flex-1 bg-neutral-800 text-white text-[7px] font-mono uppercase tracking-wider py-2 flex items-center justify-center gap-1.5 hover:bg-neutral-700 transition-all"
    >
      {copied ? (
        <>
          <Check className="w-2.5 h-2.5" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-2.5 h-2.5" /> Copy Script
        </>
      )}
    </button>
  );
}

function getPriorityColor(priority: EnhancedDomainDiagnostic['constitutionalImpact']['recommendedInterventionPriority']) {
  switch (priority) {
    case 'immediate':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertOctagon };
    case 'short-term':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Zap };
    case 'medium-term':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Target };
    case 'strategic':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: TrendingUp };
    default:
      return { bg: 'bg-neutral-50', text: 'text-neutral-700', border: 'border-neutral-200', icon: Shield };
  }
}

function getAuthorityLevelRequired(score: number, completionRate: number): AuthorityLevel {
  if (score < 30 || completionRate < 40) return 'SOVEREIGN';
  if (score < 50 || completionRate < 60) return 'AUTHORITY';
  if (score < 70) return 'DELEGATE';
  if (score < 85) return 'PARTICIPANT';
  return 'OBSERVER';
}

function getAuthorityTypeRequired(score: number, completionRate: number): AuthorityType {
  if (score < 40 || completionRate < 60) return 'DIRECT';
  if (score < 70) return 'PROXY';
  return 'UNCLEAR';
}

function getReadinessTierRequired(score: number, trajectory: string): ReadinessTier {
  if (score < 30 || trajectory === 'DECAYING') return 'FRAGILE';
  if (score < 50) return 'EMERGING';
  if (score < 70) return 'STABILIZING';
  if (score < 85) return 'EXECUTION_READY';
  return 'SOVEREIGN';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InterventionCopilot({ 
  diagnostics, 
  constitutionalDecision,
  constitutionalAuthority,
  completedQuestions = {},
  totalQuestionsPerDomain = {},
  campaignId,
  organisationType = 'corporation',
  governanceModel = 'UNCLEAR',
  participantCount = 0,
  threshold = 5,
  onCopyScript,
  onRequestDetail,
  onCreateIntervention,
  onVerifyAuthority,
  onAuditAction,
}: InterventionCopilotProps) {
  const [signing, setSigning] = useState<Record<string, boolean>>({});
  const [verifying, setVerifying] = useState(false);
  const [thresholdValid, setThresholdValid] = useState<{ valid: boolean; reason?: string }>({ valid: true });

  // Validate threshold on mount
  useEffect(() => {
    const validation = validateThreshold(participantCount, threshold);
    setThresholdValid(validation);
    
    if (!validation.valid) {
      toast.warning(validation.reason || 'Threshold not met', {
        duration: 5000,
        description: 'Constitutional authority may be limited until threshold is met.',
      });
    }
  }, [participantCount, threshold]);

  // Validate inputs
  if (!diagnostics || diagnostics.length === 0) {
    return (
      <div className="space-y-5 font-serif">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-base font-light tracking-tight text-neutral-800">Intervention Strategy</h3>
            <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
              Constitutional Prescriptive Actions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!thresholdValid.valid && (
              <div className="flex items-center gap-1.5 text-red-500">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span className="text-[6px] font-mono">THRESHOLD NOT MET</span>
              </div>
            )}
            <span className="text-[6px] font-mono bg-neutral-100 text-neutral-500 px-2 py-1 uppercase tracking-wider">
              Constitutional AI
            </span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-xs text-amber-700">No diagnostic data available</p>
          <p className="text-[10px] text-amber-600 mt-1">Complete the alignment assessment to generate interventions</p>
        </div>
      </div>
    );
  }

  // Enhance diagnostics with constitutional context
  const enhancedDiagnostics = useMemo((): EnhancedDomainDiagnostic[] => {
    return diagnostics.map((diag) => {
      const domain = diag.domain as AlignmentDomain;
      const questionsCompleted = completedQuestions[domain] || 0;
      const questionsTotal = totalQuestionsPerDomain[domain] || 3;
      const completionRate = questionsTotal > 0 ? (questionsCompleted / questionsTotal) * 100 : 0;

      const domainQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(q => q.domain === domain);
      const questionIds = domainQuestions.map(q => q.id);
      
      // Determine constitutional impact based on domain score and completion
      let routeImpact = 0;
      const disqualifierRelevance: string[] = [];
      let recommendedInterventionPriority: EnhancedDomainDiagnostic['constitutionalImpact']['recommendedInterventionPriority'] = 'medium-term';
      let constitutionalRouteAlignment: ConstitutionalRoute = 'DIAGNOSTIC';
      let signatureRequired = false;
      let quorumRequired = 0;

      // Score-based impact (0-100 scale)
      if (diag.score < 30) {
        routeImpact = 85;
        recommendedInterventionPriority = 'immediate';
        constitutionalRouteAlignment = 'REJECT';
        signatureRequired = true;
        quorumRequired = Math.ceil(participantCount * 0.5);
        disqualifierRelevance.push('Critical resonance deficiency');
        disqualifierRelevance.push('Constitutional threshold violation');
      } else if (diag.score < 50) {
        routeImpact = 65;
        recommendedInterventionPriority = 'short-term';
        constitutionalRouteAlignment = 'DIAGNOSTIC';
        signatureRequired = true;
        quorumRequired = Math.ceil(participantCount * 0.3);
        disqualifierRelevance.push('Significant misalignment detected');
        disqualifierRelevance.push('Diagnostic intervention required');
      } else if (diag.score < 70) {
        routeImpact = 40;
        recommendedInterventionPriority = 'medium-term';
        constitutionalRouteAlignment = 'DIAGNOSTIC';
        signatureRequired = false;
        disqualifierRelevance.push('Moderate drift observed');
      } else {
        routeImpact = 15;
        constitutionalRouteAlignment = 'STRATEGY';
        recommendedInterventionPriority = diag.trajectory === 'IMPROVING' ? 'strategic' : 'medium-term';
        signatureRequired = false;
        disqualifierRelevance.push('Within strategic tolerance');
      }

      // Adjust for completion rate
      if (completionRate < 50) {
        routeImpact += 20;
        disqualifierRelevance.push(`Incomplete domain data (${questionsCompleted}/${questionsTotal})`);
        if (recommendedInterventionPriority !== 'immediate') {
          recommendedInterventionPriority = 'short-term';
        }
      }

      // Adjust for trajectory
      if (diag.trajectory === 'DECAYING') {
        routeImpact += 15;
        disqualifierRelevance.push('Negative trajectory detected');
        disqualifierRelevance.push('Immediate intervention required');
        if (recommendedInterventionPriority !== 'immediate') {
          recommendedInterventionPriority = 'short-term';
        }
      }

      // Determine authority level required
      const authorityLevelRequired = getAuthorityLevelRequired(diag.score, completionRate);
      const authorityTypeRequired = getAuthorityTypeRequired(diag.score, completionRate);
      const readinessTierRequired = getReadinessTierRequired(diag.score, diag.trajectory);

      // Find weakest and strongest questions
      const weakestQuestions: string[] = [];
      const strongestQuestions: string[] = [];

      if (diag.questions) {
        const sortedQuestions = [...diag.questions].sort((a, b) => (a.answered ? 0 : 1) - (b.answered ? 0 : 1));
        weakestQuestions.push(...sortedQuestions.filter(q => !q.answered).slice(0, 2).map(q => q.text.substring(0, 60)));
        strongestQuestions.push(...sortedQuestions.filter(q => q.answered).slice(0, 2).map(q => q.text.substring(0, 60)));
      }

      // Determine estimated timeline based on priority
      let estimatedTimeline = '';
      let resourceRequirements: EnhancedDomainDiagnostic['resourceRequirements'] = {
        effort: 'medium',
        expertise: [],
        externalSupport: false,
        authorityRequired: authorityLevelRequired,
      };

      switch (recommendedInterventionPriority) {
        case 'immediate':
          estimatedTimeline = '24-72 hours';
          resourceRequirements = { 
            effort: 'critical', 
            expertise: ['Executive', 'Governance'], 
            externalSupport: true,
            authorityRequired: 'SOVEREIGN',
          };
          break;
        case 'short-term':
          estimatedTimeline = '1-2 weeks';
          resourceRequirements = { 
            effort: 'high', 
            expertise: ['Strategy', 'Operations'], 
            externalSupport: false,
            authorityRequired: 'AUTHORITY',
          };
          break;
        case 'medium-term':
          estimatedTimeline = '2-4 weeks';
          resourceRequirements = { 
            effort: 'medium', 
            expertise: ['Domain Expert'], 
            externalSupport: false,
            authorityRequired: 'DELEGATE',
          };
          break;
        case 'strategic':
          estimatedTimeline = '1-3 months';
          resourceRequirements = { 
            effort: 'low', 
            expertise: ['Advisory'], 
            externalSupport: false,
            authorityRequired: 'PARTICIPANT',
          };
          break;
      }

      return {
        ...diag,
        constitutionalImpact: {
          routeImpact: Math.min(routeImpact, 100),
          disqualifierRelevance,
          recommendedInterventionPriority,
          constitutionalRouteAlignment,
          authorityTypeRequired,
          readinessTierRequired,
          authorityLevelRequired,
        },
        questionsCompleted,
        questionsTotal,
        weakestQuestions,
        strongestQuestions,
        questionIds,
        domainSpecificGuidance: DOMAIN_GUIDANCE[domain],
        precedentCases: PRECEDENT_CASES[domain],
        estimatedTimeline,
        resourceRequirements,
        signatureRequired,
        quorumRequired,
      };
    });
  }, [diagnostics, completedQuestions, totalQuestionsPerDomain, participantCount]);

  // Sort by constitutional priority and impact
  const sortedDiagnostics = useMemo(() => {
    const priorityOrder = { immediate: 0, 'short-term': 1, 'medium-term': 2, strategic: 3 };
    return [...enhancedDiagnostics].sort((a, b) => {
      const priorityDiff = priorityOrder[a.constitutionalImpact.recommendedInterventionPriority] - 
                          priorityOrder[b.constitutionalImpact.recommendedInterventionPriority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.constitutionalImpact.routeImpact - a.constitutionalImpact.routeImpact;
    });
  }, [enhancedDiagnostics]);

  // Generate constitutional summary
  const constitutionalSummary = useMemo(() => {
    if (!constitutionalDecision) return null;
    
    const summary = {
      route: constitutionalDecision.route,
      confidence: constitutionalDecision.confidence,
      disqualifiers: constitutionalDecision.disqualifiersTriggered,
      interventions: constitutionalDecision.recommendedInterventions,
    };
    
    return summary;
  }, [constitutionalDecision]);

  // Check authority for actions
  const canCreateIntervention = useMemo(() => {
    if (!constitutionalAuthority) return false;
    const authorityCheck = validateAuthority(
      { type: 'SUBMIT', payload: { campaignId }, authoritySignature: '', id: '', timestamp: '' } as any,
      constitutionalAuthority,
      'PARTICIPANT'
    );
    return authorityCheck.valid;
  }, [constitutionalAuthority, campaignId]);

  // Calculate overall constitutional posture
  const overallPosture = useMemo(() => {
    const avgScore = diagnostics.reduce((sum, d) => sum + d.score, 0) / diagnostics.length;
    const hasCritical = enhancedDiagnostics.some(d => d.constitutionalImpact.recommendedInterventionPriority === 'immediate');
    const hasThresholdViolation = !thresholdValid.valid;
    
    if (hasThresholdViolation) return { label: 'THRESHOLD NOT MET', color: 'text-red-600', bg: 'bg-red-50', icon: AlertOctagon };
    if (hasCritical) return { label: 'CRITICAL INTERVENTION REQUIRED', color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle };
    if (avgScore < 50) return { label: 'DIAGNOSTIC MODE ACTIVE', color: 'text-amber-600', bg: 'bg-amber-50', icon: Activity };
    if (avgScore < 70) return { label: 'STABILIZING', color: 'text-blue-600', bg: 'bg-blue-50', icon: TrendingUp };
    return { label: 'STRATEGY READY', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle };
  }, [diagnostics, enhancedDiagnostics, thresholdValid]);

  // Handler for create intervention with signing
  const handleCreateIntervention = useCallback(async (domain: string, intervention: string) => {
    if (!canCreateIntervention) {
      toast.error('Insufficient constitutional authority', {
        description: `This action requires ${constitutionalAuthority?.authorityLevel || 'PARTICIPANT'} level authority.`,
      });
      return;
    }

    if (!thresholdValid.valid) {
      toast.error('Threshold not met', {
        description: thresholdValid.reason || 'Minimum participant count not reached.',
      });
      return;
    }

    setSigning(prev => ({ ...prev, [domain]: true }));

    try {
      // Verify authority if needed
      if (onVerifyAuthority) {
        const verified = await onVerifyAuthority();
        if (!verified) {
          throw new Error('Authority verification failed');
        }
      }

      // Create signature
      const signature = await generateConstitutionalSignature(campaignId, domain, constitutionalAuthority);
      
      // Create intervention
      if (onCreateIntervention) {
        await onCreateIntervention(domain, intervention, signature);
      }

      // Audit the action
      if (onAuditAction) {
        await onAuditAction('CREATE_INTERVENTION', domain);
      }

      toast.success('Intervention created', {
        description: `Constitutional intervention for ${domain} has been recorded.`,
      });
    } catch (error) {
      console.error('Failed to create intervention:', error);
      toast.error('Failed to create intervention', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setSigning(prev => ({ ...prev, [domain]: false }));
    }
  }, [canCreateIntervention, thresholdValid, campaignId, constitutionalAuthority, onCreateIntervention, onVerifyAuthority, onAuditAction]);

  // Generate constitutional signature
  const generateConstitutionalSignature = async (campaignId: string, domain: string, authority?: ConstitutionalAuthority): Promise<string> => {
    const timestamp = Date.now();
    const payload = `${campaignId}:${domain}:${timestamp}:${authority?.userId || 'unknown'}`;
    
    // In production, this would use actual cryptographic signing
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${authority?.userId || 'system'}:${hashHex.slice(0, 16)}:${timestamp}`;
  };

  const overallIcon = overallPosture.icon || Shield;

  return (
    <div className="space-y-5 font-serif">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-base font-light tracking-tight text-neutral-800">Intervention Strategy</h3>
          <p className="text-[7px] font-mono text-neutral-400 uppercase tracking-wider mt-1">
            Constitutional Prescriptive Actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Authority Badge */}
          {constitutionalAuthority && (
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-2.5 h-2.5 text-neutral-500" />
              <span className="text-[6px] font-mono bg-neutral-100 text-neutral-600 px-2 py-1 uppercase tracking-wider">
                {constitutionalAuthority.authorityLevel}
              </span>
            </div>
          )}
          
          {/* Threshold Status */}
          {!thresholdValid.valid && (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span className="text-[6px] font-mono">THRESHOLD NOT MET</span>
            </div>
          )}
          
          {/* Overall Posture Badge */}
          <div className={`px-2 py-1 rounded ${overallPosture.bg}`}>
            <div className={`flex items-center gap-1 text-[6px] font-mono uppercase tracking-wider ${overallPosture.color}`}>
              <overallIcon className="w-2.5 h-2.5" />
              {overallPosture.label}
            </div>
          </div>
          
          {constitutionalSummary && (
            <div className="flex items-center gap-1.5">
              <Scale className="w-2.5 h-2.5 text-neutral-500" />
              <span className="text-[6px] font-mono bg-neutral-100 text-neutral-600 px-2 py-1 uppercase tracking-wider">
                {constitutionalSummary.route} · {(constitutionalSummary.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
          
          <span className="text-[6px] font-mono bg-neutral-100 text-neutral-500 px-2 py-1 uppercase tracking-wider">
            Constitutional AI v2
          </span>
        </div>
      </div>

      {/* Organisation Context with Constitutional Authority */}
      <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-3 h-3 text-neutral-500" />
          <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">Constitutional Context</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div>
            <span className="text-neutral-400">Type:</span>{' '}
            <span className="text-neutral-700 font-medium">{organisationType.toUpperCase()}</span>
          </div>
          <div>
            <span className="text-neutral-400">Governance:</span>{' '}
            <span className="text-neutral-700 font-medium">{governanceModel}</span>
          </div>
          <div>
            <span className="text-neutral-400">Participants:</span>{' '}
            <span className="text-neutral-700 font-medium">{participantCount}</span>
            <span className="text-neutral-400 text-[8px] ml-1">/ {threshold} threshold</span>
          </div>
          <div>
            <span className="text-neutral-400">Authority:</span>{' '}
            <span className="text-neutral-700 font-medium">{constitutionalAuthority?.authorityLevel || 'NONE'}</span>
          </div>
          {campaignId && (
            <div className="col-span-2">
              <span className="text-neutral-400">Campaign:</span>{' '}
              <span className="text-neutral-700 font-mono text-[8px]">{campaignId.slice(0, 8)}...</span>
              <Key className="w-2.5 h-2.5 inline ml-1 text-neutral-400" />
            </div>
          )}
        </div>
      </div>

      {/* Constitutional Context Alert */}
      {constitutionalSummary && constitutionalSummary.disqualifiers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-[8px] font-mono uppercase tracking-wider text-amber-700 mb-1">
                Constitutional Disqualifiers Active
              </p>
              <ul className="space-y-0.5">
                {constitutionalSummary.disqualifiers.slice(0, 2).map((d, idx) => (
                  <li key={idx} className="text-[9px] text-amber-700">
                    • {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {sortedDiagnostics.map((item) => {
          const priorityStyle = getPriorityColor(item.constitutionalImpact.recommendedInterventionPriority);
          const PriorityIcon = priorityStyle.icon;
          const DomainIcon = DOMAIN_ICONS[item.domain as AlignmentDomain] || Shield;
          const isSigning = signing[item.domain];

          return (
            <div key={item.domain} className="bg-white border border-neutral-100 hover:border-neutral-200 transition-all overflow-hidden rounded-lg">
              <div className="flex flex-col lg:flex-row">
                
                {/* Left: Signal */}
                <div className="p-5 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-neutral-100 bg-neutral-50/30">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <DomainIcon className="w-3 h-3 text-neutral-500" />
                      <div>
                        <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-500">
                          {ALIGNMENT_DOMAIN_LABELS[item.domain as AlignmentDomain] || item.domain}
                        </span>
                        {item.questionsTotal > 0 && (
                          <div className="text-[6px] font-mono text-neutral-400 mt-0.5">
                            {item.questionsCompleted}/{item.questionsTotal} questions
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`${item.trajectory === 'IMPROVING' ? 'text-emerald-500' : item.trajectory === 'DECAYING' ? 'text-red-400' : 'text-neutral-400'}`}>
                      <ArrowUpRight className={`w-3 h-3 ${item.trajectory === 'DECAYING' ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-light text-neutral-800">{item.score}%</span>
                    <span className="text-[7px] font-mono text-neutral-400 uppercase">Resonance</span>
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[7px] font-mono uppercase">
                      <span className="text-neutral-500">Effort</span>
                      <span className="text-neutral-600">{item.effortIndex}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-100">
                      <div 
                        className="h-full bg-neutral-500 transition-all duration-700" 
                        style={{ width: `${item.effortIndex}%` }} 
                      />
                    </div>
                  </div>
                  
                  {/* Constitutional requirements */}
                  <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                    <div className="flex justify-between text-[6px] font-mono">
                      <span className="text-neutral-400">Authority Required:</span>
                      <span className="text-neutral-600">{item.resourceRequirements.authorityRequired}</span>
                    </div>
                    <div className="flex justify-between text-[6px] font-mono">
                      <span className="text-neutral-400">Readiness Required:</span>
                      <span className="text-neutral-600">{item.constitutionalImpact.readinessTierRequired}</span>
                    </div>
                    <div className="flex justify-between text-[6px] font-mono">
                      <span className="text-neutral-400">Timeline:</span>
                      <span className="text-neutral-600">{item.estimatedTimeline}</span>
                    </div>
                    {item.signatureRequired && (
                      <div className="flex justify-between text-[6px] font-mono">
                        <span className="text-amber-600">Signature Required:</span>
                        <span className="text-amber-700">Quorum: {item.quorumRequired}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Constitutional impact indicator */}
                  {item.constitutionalImpact.routeImpact > 50 && (
                    <div className="mt-2 pt-2 border-t border-neutral-100">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-2 h-2 text-amber-500" />
                        <span className="text-[6px] font-mono text-amber-600 uppercase tracking-wider">
                          Constitutional Impact: {item.constitutionalImpact.routeImpact}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Intervention */}
                <div className="p-5 lg:w-2/3 flex flex-col justify-between space-y-3">
                  <div>
                    <div className={`flex items-center gap-1.5 mb-2 ${priorityStyle.text}`}>
                      <PriorityIcon className="w-2.5 h-2.5" />
                      <span className="text-[7px] font-mono uppercase tracking-wider">
                        {item.constitutionalImpact.recommendedInterventionPriority.toUpperCase()} · {item.recommendedAction}
                      </span>
                      {item.signatureRequired && (
                        <span className="ml-2 text-[6px] font-mono bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          SIGNATURE REQUIRED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed text-neutral-600 mb-3">
                      {item.interventionScript}
                    </p>
                    
                    {/* Domain-specific guidance */}
                    <div className="mt-2 p-2 bg-neutral-50 rounded">
                      <p className="text-[6px] font-mono uppercase text-neutral-400 mb-1">
                        Domain Guidance
                      </p>
                      <p className="text-[8px] text-neutral-600">
                        {item.domainSpecificGuidance}
                      </p>
                    </div>
                    
                    {/* Weakest questions context */}
                    {item.weakestQuestions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-neutral-50">
                        <p className="text-[6px] font-mono uppercase text-neutral-400 mb-1">
                          Critical Gaps
                        </p>
                        <ul className="space-y-0.5">
                          {item.weakestQuestions.slice(0, 1).map((q, idx) => (
                            <li key={idx} className="text-[8px] text-neutral-500 italic">
                              "{q.length > 50 ? q.substring(0, 50) + '...' : q}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Precedent Cases */}
                    {item.precedentCases.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-neutral-50">
                        <p className="text-[6px] font-mono uppercase text-neutral-400 mb-1">
                          Precedent Cases
                        </p>
                        <ul className="space-y-0.5">
                          {item.precedentCases.slice(0, 2).map((case_, idx) => (
                            <li key={idx} className="text-[7px] text-neutral-500">
                              • {case_}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resource Requirements */}
                    <div className="mt-2 flex gap-2 text-[6px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded ${
                        item.resourceRequirements.effort === 'critical' ? 'bg-red-100 text-red-700' :
                        item.resourceRequirements.effort === 'high' ? 'bg-amber-100 text-amber-700' :
                        item.resourceRequirements.effort === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        Effort: {item.resourceRequirements.effort.toUpperCase()}
                      </span>
                      {item.resourceRequirements.externalSupport && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                          External Support
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <CopyButton 
                      text={item.interventionScript} 
                      onCopy={onCopyScript?.bind(null, item.domain, item.interventionScript)}
                    />
                    <button 
                      onClick={() => onRequestDetail?.(item.domain)}
                      className="flex-1 border border-neutral-200 text-[7px] font-mono uppercase tracking-wider py-2 hover:border-neutral-300 transition-all hover:bg-neutral-50"
                    >
                      View Data
                    </button>
                    {onCreateIntervention && (
                      <button 
                        onClick={() => handleCreateIntervention(item.domain, item.interventionScript)}
                        disabled={isSigning || !canCreateIntervention || (!thresholdValid.valid && item.signatureRequired)}
                        className={cx(
                          "flex-1 text-[7px] font-mono uppercase tracking-wider py-2 transition-all",
                          canCreateIntervention && (!item.signatureRequired || thresholdValid.valid)
                            ? "bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700"
                            : "bg-neutral-50 border border-neutral-200 text-neutral-400 cursor-not-allowed"
                        )}
                      >
                        {isSigning ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin inline mr-1" />
                            Signing...
                          </>
                        ) : (
                          <>
                            <FileSignature className="w-2.5 h-2.5 inline mr-1" />
                            Create Task
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Constitutional Recommendations Footer */}
      {constitutionalSummary && constitutionalSummary.interventions.length > 0 && (
        <div className="mt-4 p-4 bg-neutral-50 border border-neutral-100 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="w-3 h-3 text-neutral-600" />
            <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-600">
              Constitutional Recommendations
            </span>
          </div>
          <ul className="space-y-1">
            {constitutionalSummary.interventions.slice(0, 3).map((intervention, idx) => (
              <li key={idx} className="text-[9px] text-neutral-600 flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                {intervention}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Global Resource Summary with Authority Check */}
      <div className="mt-4 p-4 bg-neutral-50 border border-neutral-100 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3 h-3 text-neutral-600" />
          <span className="text-[7px] font-mono uppercase tracking-wider text-neutral-600">
            Intervention Summary
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[8px]">
          <div>
            <span className="text-neutral-400">Immediate:</span>{' '}
            <span className="text-neutral-700 font-medium">
              {enhancedDiagnostics.filter(d => d.constitutionalImpact.recommendedInterventionPriority === 'immediate').length}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Short-term:</span>{' '}
            <span className="text-neutral-700 font-medium">
              {enhancedDiagnostics.filter(d => d.constitutionalImpact.recommendedInterventionPriority === 'short-term').length}
            </span>
          </div>
          <div>
            <span className="text-neutral-400">Strategic:</span>{' '}
            <span className="text-neutral-700 font-medium">
              {enhancedDiagnostics.filter(d => d.constitutionalImpact.recommendedInterventionPriority === 'strategic').length}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-neutral-100 text-[6px] text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>
              Constitutional Authority: {constitutionalAuthority?.authorityLevel || 'NONE'} · 
              Interventions require {constitutionalAuthority?.authorityLevel === 'SOVEREIGN' ? 'any' : 'signature'} level approval
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}