// app/admin/campaigns/[id]/report/page.tsx
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { 
  ShieldCheck, 
  Lock, 
  ChevronLeft, 
  AlertTriangle, 
  Activity, 
  Clock, 
  TrendingUp, 
  Zap, 
  Heart, 
  Users,
  Download,
  Printer,
  Target,
  Network,
  Briefcase,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileJson,
  FileBarChart,
  History
} from "lucide-react";

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { ReportEngineClient } from "@/components/admin/reporting/report-engine-client";
import { InterventionProposal } from "@/components/admin/reporting/intervention-proposal";
import { CorrectionRegistry } from "@/components/admin/governance/correction-registry";
import { BriefingTrigger } from "@/components/admin/governance/briefing-trigger";
import ReportPrintButton from "./ReportPrintButton";

import { 
  checkProtocolExpiry, 
  analyzeContagionRisk,
  type ExpiryStatus 
} from "@/lib/alignment/governance-logic";

import { buildExecutiveReport, type ExecutiveReport } from "@/lib/admin/reporting/executive-report-builder";
import { logExecutiveReportAudit } from "@/lib/admin/reporting/executive-report-audit";
import { 
  serializeExecutiveReportToJson, 
  serializeExecutiveReportToPdfPayload,
  type ExecutiveReportJson,
  type ExecutiveReportPdfPayload
} from "@/lib/admin/reporting/executive-report-serializer";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Executive Intelligence Brief | Abraham of London",
  description: "Sovereign Alignment Report — Institutional Intelligence",
  robots: "noindex, nofollow",
};

// ============================================================
// ENTERPRISE COMPONENTS
// ============================================================

function StateBadge({ state }: { state: ExecutiveReport['state'] }) {
  const config = {
    ORDERED: { label: "ORDERED", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
    DRIFTING: { label: "DRIFTING", color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", icon: TrendingUp },
    MISALIGNED: { label: "MISALIGNED", color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50", icon: AlertTriangle },
    DISORDERED: { label: "DISORDERED", color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", icon: XCircle }
  };

  const Icon = config[state].icon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config[state].bg} border border-${config[state].color}/20`}>
      <Icon className={`w-3 h-3 ${config[state].text}`} />
      <span className={`text-[8px] font-mono uppercase tracking-wider font-semibold ${config[state].text}`}>
        {config[state].label}
      </span>
    </div>
  );
}

function EnterpriseMetricCard({ 
  label, 
  value, 
  subtext, 
  status,
  icon: Icon,
  trend
}: { 
  label: string; 
  value: string | number; 
  subtext?: string; 
  status?: 'critical' | 'warning' | 'healthy' | 'optimal';
  icon?: React.ElementType;
  trend?: { value: number; direction: 'up' | 'down' | 'stable' };
}) {
  const statusColors = {
    critical: "border-red-500 bg-red-50/30",
    warning: "border-amber-500 bg-amber-50/30",
    healthy: "border-emerald-500 bg-emerald-50/30",
    optimal: "border-blue-500 bg-blue-50/30",
  };

  return (
    <div className={`border-l-4 p-5 ${status ? statusColors[status] : "border-neutral-200 bg-neutral-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-neutral-500" />}
          <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500 font-medium">
            {label}
          </p>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[8px] font-mono ${
            trend.direction === 'up' ? 'text-emerald-600' : 
            trend.direction === 'down' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <p className="text-3xl font-light tracking-tight text-neutral-900 mb-1">
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] text-neutral-500 leading-relaxed">{subtext}</p>
      )}
    </div>
  );
}

function EnterpriseKpiGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
      {children}
    </div>
  );
}

function InsightPanel({ 
  title, 
  icon: Icon, 
  children,
  variant = 'default'
}: { 
  title: string; 
  icon?: React.ElementType; 
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'critical';
}) {
  const variantStyles = {
    default: "border-neutral-200 bg-white",
    warning: "border-amber-200 bg-amber-50/20",
    success: "border-emerald-200 bg-emerald-50/20",
    critical: "border-red-200 bg-red-50/20",
  };

  return (
    <div className={`border p-6 ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-neutral-600" />}
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-semibold">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function PriorityStack({ priorities }: { priorities: string[] }) {
  return (
    <div className="space-y-3">
      {priorities.map((priority, idx) => (
        <div key={idx} className="flex items-center gap-3 border-b border-neutral-100 pb-3 last:border-0">
          <span className="w-6 h-6 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-mono flex items-center justify-center">
            {idx + 1}
          </span>
          <p className="text-sm text-neutral-700">{priority}</p>
        </div>
      ))}
    </div>
  );
}

function FailureModes({ modes }: { modes: string[] }) {
  if (modes.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600">
        <CheckCircle className="w-4 h-4" />
        <span>No critical failure modes detected</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {modes.map((mode, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>{mode}</span>
        </div>
      ))}
    </div>
  );
}

function DomainMetricsTable({ domains }: { domains: ExecutiveReportJson['resonance']['domains'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-500">Domain</th>
            <th className="text-right py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-500">Intent</th>
            <th className="text-right py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-500">Reality</th>
            <th className="text-right py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-500">Dissonance</th>
            <th className="text-right py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-500">Coverage</th>
          </tr>
        </thead>
        <tbody>
          {domains.map((domain, idx) => (
            <tr key={idx} className="border-b border-neutral-100">
              <td className="py-2 text-neutral-700 font-medium">{domain.label}</td>
              <td className="text-right py-2 text-neutral-600">{domain.intent}%</td>
              <td className="text-right py-2 text-neutral-600">{domain.reality}%</td>
              <td className={`text-right py-2 font-mono ${domain.dissonance > 30 ? 'text-red-600' : domain.dissonance > 20 ? 'text-amber-600' : 'text-neutral-600'}`}>
                {domain.dissonance}%
              </td>
              <td className="text-right py-2 text-neutral-500 text-[10px] font-mono">
                {domain.coverage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditFooter({ reportId, generatedAt }: { reportId: string; generatedAt: string }) {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-100 text-[7px] text-neutral-400 font-mono flex items-center justify-between">
      <div className="flex items-center gap-2">
        <History className="w-3 h-3" />
        <span>Audit ID: {reportId}</span>
      </div>
      <span>Generated: {new Date(generatedAt).toLocaleString()}</span>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default async function ExecutiveReportPage({ params }: PageProps) {
  const { id } = await params;

  // Get current session for audit logging
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || session?.user?.email || null;

  // Database connection
  const prisma = typeof (db as any)?.getPrismaClient === "function" 
    ? await (db as any).getPrismaClient() 
    : db;

  if (!prisma) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-600">Database connection error</p>
        </div>
      </div>
    );
  }

  // Fetch campaign data
  const campaign = await prisma.alignmentCampaign.findUnique({
    where: { id },
    include: {
      organisation: true,
      correctionNodes: { orderBy: { createdAt: 'desc' } },
      participants: {
        where: { status: "completed" },
        include: { responses: true },
      },
    },
  });

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">Report not found</p>
          <Link href="/admin/campaigns" className="text-sm text-neutral-500 underline mt-2 inline-block">
            Return to Registry
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // DATA AGGREGATION FOR EXECUTIVE REPORT BUILDER
  // ============================================================

  // Strategic metrics from responses
  const strategicMetrics = campaign.participants?.length 
    ? campaign.participants.flatMap(p => p.responses).reduce((acc, r) => {
        // Aggregate response data here
        return acc;
      }, [])
    : [
        { label: "STRATEGIC_INTENT", intent: 95, reality: 72 },
        { label: "OPERATIONAL_CLARITY", intent: 88, reality: 45 },
        { label: "LEADERSHIP_TRUST", intent: 92, reality: 58 },
        { label: "CULTURAL_COHESION", intent: 85, reality: 79 },
      ];

  // Human Capital Metrics
  const hcdMetrics = [
    { label: "ENGINEERING_VELOCITY", potential: 100, extraction: 94, wellbeing: 42, headcount: 12, tenure: 18 },
    { label: "LEADERSHIP_EXHAUSTION", potential: 90, extraction: 95, wellbeing: 35, headcount: 5, tenure: 42 },
    { label: "TALENT_ATTRITION", potential: 85, extraction: 78, wellbeing: 65, headcount: 8, tenure: 24 },
    { label: "ROLE_VACANCY", potential: 95, extraction: 82, wellbeing: 71, headcount: 15, tenure: 12 },
  ];

  // OGR Metrics
  const ogrMetrics = {
    resonanceScore: 72,
    marketFriction: 42,
    targetRevenue: campaign.organisation?.annualRevenue || 5000,
  };

  // Build Executive Report using your builder
  const executiveReport = buildExecutiveReport({
    responses: campaign.participants?.flatMap(p => p.responses) || [],
    hcdMetrics,
    ogrMetrics,
  });

  // Serialize for export
  const jsonPayload = serializeExecutiveReportToJson(executiveReport);
  const pdfPayload = serializeExecutiveReportToPdfPayload(executiveReport);

  // Calculate recovery metrics
  const parseRecovery = (val: string): number => {
    const match = val?.match(/\d+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const totalRecovery = campaign.correctionNodes
    .filter(node => node.status === "LIQUIDATED")
    .reduce((acc, node) => acc + parseRecovery(node.recoveryProjection), 0);

  const rawDissonance = executiveReport.resonance.telemetry.averageDissonance;
  const adjustedDissonance = Math.max(0, rawDissonance - totalRecovery);
  const integrityIndex = 100 - Math.round(adjustedDissonance);
  const isDisordered = executiveReport.state === "DISORDERED";

  // Governance Analysis
  const expiryStatus = await checkProtocolExpiry(id);
  const contagionRisks = analyzeContagionRisk(strategicMetrics);

  // Log audit with proper parameters
  const auditResult = await logExecutiveReportAudit({
    campaignId: id,
    actorId: userId,
    organisationName: campaign.organisation?.name,
    report: executiveReport,
  });

  if (!auditResult.ok) {
    console.warn(`[Audit] Failed to log report generation: ${auditResult.reason}`);
  }

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const reportId = `REP-${id.slice(-8).toUpperCase()}`;
  const generatedAt = new Date().toISOString();

  // Export handlers
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(jsonPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-report-${id}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdfData = () => {
    const dataStr = JSON.stringify(pdfPayload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-report-payload-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans print:bg-white">
      <style jsx global>{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-8 print:px-4 print:py-4">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-8 no-print">
          <Link 
            href={`/admin/campaigns/${id}`} 
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="font-mono uppercase tracking-wider text-[10px]">Back to Registry</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportJson}
              className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-600 text-[10px] font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
              title="Export as JSON"
            >
              <FileJson className="w-3 h-3" />
              JSON
            </button>
            <button 
              onClick={handleExportPdfData}
              className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-600 text-[10px] font-mono uppercase tracking-wider hover:bg-neutral-100 transition-colors"
              title="Export PDF Payload"
            >
              <FileBarChart className="w-3 h-3" />
              PDF Data
            </button>
            <BriefingTrigger campaignId={id} />
            <ReportPrintButton />
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-white shadow-sm border border-neutral-200 overflow-hidden mb-8 print:shadow-none">
          <div className="p-8 md:p-12 print:p-6">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-12 bg-neutral-400" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-500 font-semibold">
                    Sovereign Alignment Registry
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-light tracking-tight text-neutral-900 mb-3">
                  Executive<br />
                  Intelligence Brief
                </h1>
                <p className="text-sm text-neutral-500 mt-2">
                  {campaign.organisation?.name || "Sovereign Client"} • {reportDate}
                </p>
              </div>
              <StateBadge state={executiveReport.state} />
            </div>

            {/* System State Narrative */}
            <div className={`mb-8 p-6 border ${executiveReport.state === 'DISORDERED' ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-neutral-100'}`}>
              <p className="text-lg leading-relaxed text-neutral-700 mb-3">
                {executiveReport.narrative.headline}
              </p>
              <p className="text-sm text-neutral-600">
                {executiveReport.narrative.summary}
              </p>
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <p className="text-xs font-mono text-neutral-500">
                  {executiveReport.narrative.mandate}
                </p>
              </div>
            </div>

            {/* KPI Grid */}
            <EnterpriseKpiGrid>
              <EnterpriseMetricCard 
                label="Systemic Integrity"
                value={`${integrityIndex}%`}
                subtext={`${executiveReport.state} state`}
                status={executiveReport.state === 'ORDERED' ? 'optimal' : 
                        executiveReport.state === 'DRIFTING' ? 'healthy' :
                        executiveReport.state === 'MISALIGNED' ? 'warning' : 'critical'}
                icon={ShieldCheck}
                trend={{ value: totalRecovery > 0 ? totalRecovery : 0, direction: totalRecovery > 0 ? 'up' : 'stable' }}
              />
              <EnterpriseMetricCard 
                label="Strategic Dissonance"
                value={`${executiveReport.resonance.telemetry.averageDissonance}%`}
                subtext={`${executiveReport.resonance.telemetry.domains.length} domains affected`}
                status={executiveReport.resonance.telemetry.averageDissonance > 30 ? 'critical' : 
                        executiveReport.resonance.telemetry.averageDissonance > 20 ? 'warning' : 'healthy'}
                icon={Target}
              />
              <EnterpriseMetricCard 
                label="Burnout Index"
                value={`${executiveReport.hcdAggregate.overallBurnoutIndex}%`}
                subtext={`${executiveReport.hcdAggregate.criticalDomains.length} critical domains`}
                status={executiveReport.hcdAggregate.overallBurnoutIndex > 70 ? 'critical' : 
                        executiveReport.hcdAggregate.overallBurnoutIndex > 50 ? 'warning' : 'healthy'}
                icon={Heart}
              />
              <EnterpriseMetricCard 
                label="Financial Exposure"
                value={`$${Math.round(executiveReport.financialExposure.totalExposure / 1000)}K`}
                subtext={`${Math.round(executiveReport.financialExposure.executionLoss / 1000)}K execution loss`}
                icon={Briefcase}
              />
            </EnterpriseKpiGrid>

            {/* Sovereign Certainty */}
            <div className="mb-8 p-5 border border-neutral-200">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">
                  Sovereign Certainty
                </p>
                <p className="text-sm font-medium text-neutral-800">
                  {Math.round(executiveReport.ogr.sovereignCertainty)}%
                </p>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    executiveReport.ogr.sovereignCertainty >= 80 ? 'bg-emerald-500' :
                    executiveReport.ogr.sovereignCertainty >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${executiveReport.ogr.sovereignCertainty}%` }}
                />
              </div>
              {!executiveReport.ogr.isAuthorizedToExecute && (
                <div className="mt-3 p-2 bg-red-50 border-l-2 border-red-500">
                  <p className="text-[8px] font-mono text-red-600">⚠️ Execution Authorization Suspended</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Domain Metrics Table */}
        <div className="bg-white border border-neutral-200 p-6 mb-8">
          <h2 className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-4">
            Strategic Domain Analysis
          </h2>
          <DomainMetricsTable domains={jsonPayload.resonance.domains} />
        </div>

        {/* Two-Column Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          
          {/* Priority Stack */}
          <InsightPanel title="Priority Stack" icon={Target} variant={executiveReport.state === 'DISORDERED' ? 'critical' : 'default'}>
            <PriorityStack priorities={executiveReport.priorityStack} />
          </InsightPanel>

          {/* Failure Modes */}
          <InsightPanel title="Failure Modes" icon={AlertTriangle} variant={executiveReport.failureModes.length > 0 ? 'warning' : 'default'}>
            <FailureModes modes={executiveReport.failureModes} />
          </InsightPanel>
        </div>

        {/* Report Engine Client */}
        <div className="mb-10 print-break-inside-avoid">
          <ReportEngineClient 
            strategicMetrics={strategicMetrics}
            humanCapitalMetrics={executiveReport.hcd.map(r => ({
              label: r.label,
              intent: r.potential,
              reality: r.extraction,
              subtext: `${r.attritionRisk} risk`,
              burnoutIndex: r.burnoutIndex,
              wellbeing: r.wellbeing,
            }))}
            financialMetrics={[
              { label: "Replacement Cost", value: executiveReport.financialExposure.replacementCost },
              { label: "Execution Loss", value: executiveReport.financialExposure.executionLoss },
            ]}
            operationalMetrics={[]}
            cohortSize={campaign.participants?.length || 0}
          />
        </div>

        {/* Intervention Proposal */}
        {isDisordered && (
          <div className="mb-10 print-break-inside-avoid">
            <InterventionProposal 
              metrics={strategicMetrics} 
              campaignId={id}
              reportContext={{
                state: executiveReport.state,
                priorityStack: executiveReport.priorityStack,
                failureModes: executiveReport.failureModes,
              }}
            />
          </div>
        )}

        {/* Correction Registry */}
        <div className="mb-10">
          <CorrectionRegistry 
            campaignId={id}
            nodes={campaign.correctionNodes.map(node => ({
              internalId: node.id,
              id: node.id.slice(-7).toUpperCase(),
              domain: node.domain,
              action: node.action,
              recovery: node.recoveryProjection,
              status: node.status as any
            }))} 
          />
        </div>

        {/* Footer with Audit Trail */}
        <footer className="pt-12 border-t border-neutral-200 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-neutral-500" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-semibold">
                  Verified Registry Node
                </span>
              </div>
              <p className="text-xs text-neutral-500 max-w-md leading-relaxed">
                {executiveReport.narrative.mandate}
              </p>
              <AuditFooter reportId={reportId} generatedAt={generatedAt} />
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                Sovereign Protocol v2.1
              </p>
              <p className="text-[7px] font-mono text-neutral-400 mt-1">
                OGR-IV • Canary Wharf Node
              </p>
              {auditResult.ok && (
                <p className="text-[6px] font-mono text-emerald-600 mt-2">
                  ✓ Audit logged
                </p>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}