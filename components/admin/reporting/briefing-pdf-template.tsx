"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  FileText,
  Shield,
  Target,
  TrendingUp,
} from "lucide-react";
import type { ExecutiveReportViewModel } from "@/lib/admin/reporting/executive-report-view-model";

export interface BriefingPDFTemplateProps {
  report: ExecutiveReportViewModel;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function money(value: number) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `£${Math.round(value || 0).toLocaleString()}`;
  }
}

function pct(value: number) {
  return `${Math.round(value || 0)}%`;
}

function safeDate(value: string) {
  try {
    return new Date(value).toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <div className="text-[8px] font-mono uppercase tracking-[0.24em] text-neutral-500">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-serif text-[20px] leading-tight text-neutral-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-2 text-[10px] leading-6 text-neutral-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-neutral-200 p-4">
      <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-3 font-serif text-[24px] leading-none text-neutral-900">
        {value}
      </div>
      {sub ? (
        <div className="mt-2 text-[9px] leading-5 text-neutral-600">{sub}</div>
      ) : null}
    </div>
  );
}

function ListBlock({
  title,
  items,
  icon = "check",
}: {
  title: string;
  items: string[];
  icon?: "check" | "alert";
}) {
  const Icon = icon === "alert" ? AlertTriangle : CheckCircle2;

  return (
    <div>
      <div className="text-[8px] font-mono uppercase tracking-[0.22em] text-neutral-500">
        {title}
      </div>
      <div className="mt-3 space-y-2.5">
        {items.length ? (
          items.map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-700" />
              <span className="text-[10px] leading-6 text-neutral-700">{item}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] leading-6 text-neutral-500">No items recorded.</div>
        )}
      </div>
    </div>
  );
}

function DomainTable({
  domains,
}: {
  domains: ExecutiveReportViewModel["telemetry"]["domains"];
}) {
  return (
    <div className="overflow-hidden border border-neutral-200">
      <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-neutral-200 bg-neutral-50 px-4 py-2">
        <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Domain
        </div>
        <div className="text-right text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Intent
        </div>
        <div className="text-right text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Reality
        </div>
        <div className="text-right text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Gap
        </div>
      </div>

      {domains.length ? (
        domains.slice(0, 8).map((domain) => (
          <div
            key={domain.label}
            className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr] border-b border-neutral-100 px-4 py-2.5 last:border-b-0"
          >
            <div className="text-[10px] leading-6 text-neutral-800">{domain.label}</div>
            <div className="text-right text-[10px] leading-6 text-neutral-700">
              {pct(domain.intent)}
            </div>
            <div className="text-right text-[10px] leading-6 text-neutral-700">
              {pct(domain.reality)}
            </div>
            <div className="text-right text-[10px] leading-6 text-neutral-900">
              {pct(domain.dissonance)}
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-4 text-[10px] text-neutral-500">
          No strategic domain analysis available.
        </div>
      )}
    </div>
  );
}

function RecommendationTable({
  recommendations,
}: {
  recommendations: ExecutiveReportViewModel["recommendations"]["matchedAssets"];
}) {
  return (
    <div className="overflow-hidden border border-neutral-200">
      <div className="grid grid-cols-[1.6fr_0.7fr_0.7fr] border-b border-neutral-200 bg-neutral-50 px-4 py-2">
        <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Recommendation
        </div>
        <div className="text-right text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Kind
        </div>
        <div className="text-right text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          Fit
        </div>
      </div>

      {recommendations.length ? (
        recommendations.slice(0, 6).map((item) => (
          <div
            key={`${item.id}-${item.title}`}
            className="grid grid-cols-[1.6fr_0.7fr_0.7fr] border-b border-neutral-100 px-4 py-3 last:border-b-0"
          >
            <div>
              <div className="text-[10px] leading-6 text-neutral-800">{item.title}</div>
            </div>
            <div className="text-right text-[9px] leading-6 text-neutral-700">
              {item.kind}
            </div>
            <div className="text-right text-[10px] leading-6 text-neutral-900">
              {pct(item.confidence)}
            </div>
          </div>
        ))
      ) : (
        <div className="px-4 py-4 text-[10px] text-neutral-500">
          No governed recommendations available.
        </div>
      )}
    </div>
  );
}

export default function BriefingPDFTemplate({
  report,
}: BriefingPDFTemplateProps) {
  const avgDissonance = Math.round(report.telemetry.averageDissonance || 0);
  const burnoutIndex = Math.round(report.telemetry.burnoutIndex || 0);
  const certainty = Math.round(report.telemetry.sovereignCertainty || 0);
  const exposure = report.financialExposure.totalExposure || 0;

  const routeTone =
    report.header.route === "STRATEGY"
      ? "text-emerald-700"
      : report.header.route === "REJECT"
        ? "text-red-700"
        : "text-amber-700";

  const stateTone =
    report.summary.state === "ORDERED"
      ? "text-emerald-700"
      : report.summary.state === "DISORDERED"
        ? "text-red-700"
        : "text-amber-700";

  return (
    <div className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[14mm] text-neutral-900 print:border-0">
      <header className="border-b border-neutral-200 pb-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[8px] font-mono uppercase tracking-[0.24em] text-neutral-500">
              <Crown className="h-3 w-3" />
              Abraham of London · Executive Reporting
            </div>

            <h1 className="mt-3 font-serif text-[30px] leading-none tracking-tight text-neutral-900">
              Boardroom Briefing
            </h1>

            <div className="mt-3 text-[10px] leading-6 text-neutral-600">
              {report.header.organisationName}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-1.5 border border-neutral-200 px-2 py-1 text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-600">
              <Shield className="h-3 w-3" />
              {report.header.classification}
            </div>
            <div className="mt-2 text-[8px] text-neutral-500">
              {safeDate(report.header.generatedAt)}
            </div>
            <div className="mt-1 text-[8px] text-neutral-500">
              Report ID: {report.header.reportId}
            </div>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-4 gap-3 border-b border-neutral-200 py-6">
        <MetricCard
          label="Route"
          value={report.header.route}
          sub="Escalation class"
        />
        <MetricCard
          label="Confidence"
          value={pct(report.header.confidence)}
          sub="Interpretation strength"
        />
        <MetricCard
          label="Avg dissonance"
          value={pct(avgDissonance)}
          sub="Structural gap"
        />
        <MetricCard
          label="Exposure"
          value={money(exposure)}
          sub="Estimated risk load"
        />
      </section>

      <section className="border-b border-neutral-200 py-6">
        <SectionTitle
          eyebrow="Executive headline"
          title={report.summary.headline}
          subtitle={report.summary.summary}
        />

        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="border border-neutral-200 p-4">
            <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              Operating state
            </div>
            <div className={cn("mt-2 text-[16px] font-medium", stateTone)}>
              {report.summary.state}
            </div>
          </div>

          <div className="border border-neutral-200 p-4">
            <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              Authority posture
            </div>
            <div className="mt-2 text-[16px] font-medium text-neutral-900">
              {report.header.authorityType}
            </div>
          </div>

          <div className="border border-neutral-200 p-4">
            <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              Readiness tier
            </div>
            <div className="mt-2 text-[16px] font-medium text-neutral-900">
              {report.header.readinessTier}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            Mandate
          </div>
          <p className="mt-2 text-[10px] leading-6 text-neutral-700">
            {report.summary.mandate}
          </p>
        </div>

        <div className="mt-4 rounded border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            <Target className="h-3 w-3" />
            Verdict
          </div>
          <p className="mt-2 text-[10px] leading-6 text-neutral-700">
            {report.summary.mandate}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6 border-b border-neutral-200 py-6">
        <ListBlock
          title="Failure modes"
          items={report.summary.failureModes.slice(0, 6)}
          icon="alert"
        />
        <ListBlock
          title="Priority stack"
          items={report.summary.priorityStack.slice(0, 6)}
          icon="check"
        />
      </section>

      <section className="border-b border-neutral-200 py-6">
        <SectionTitle
          eyebrow="Strategic domain analysis"
              title="Indicator translated into structure"
          subtitle="Intent, reality and dissonance across the dominant operating domains."
        />
        <div className="mt-4">
          <DomainTable domains={report.telemetry.domains} />
        </div>
      </section>

      <section className="border-b border-neutral-200 py-6">
        <SectionTitle
          eyebrow="Observed outcomes"
          title="Observed Outcomes (System Evidence)"
          subtitle={
            report.observedOutcomes.confidence === "insufficient"
              ? "Outcome evidence is present as a governed section and will strengthen as follow-up records accumulate."
              : "Comparable decision cases are now included as outcome evidence."
          }
        />

        <div className="mt-4 grid grid-cols-3 gap-4">
          <MetricCard
            label="Improved"
            value={pct(report.observedOutcomes.improvedPercent)}
            sub="Similar recorded cases"
          />
          <MetricCard
            label="Time"
            value={
              typeof report.observedOutcomes.averageTimeToImprovementDays === "number"
                ? `${Math.round(report.observedOutcomes.averageTimeToImprovementDays)}d`
                : "Pending"
            }
            sub="Average improvement window"
          />
          <MetricCard
            label="Failure"
            value={pct(report.observedOutcomes.failureRateWhenIgnored)}
            sub="Deterioration rate"
          />
        </div>

        <div className="mt-4 space-y-1.5">
          {report.observedOutcomes.statements.slice(0, 3).map((item) => (
            <div key={item} className="text-[10px] leading-6 text-neutral-700">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4 border-b border-neutral-200 py-6">
        <div className="border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            <TrendingUp className="h-3 w-3" />
            Sovereign certainty
          </div>
          <div className="mt-3 text-[24px] font-light text-neutral-900">
            {pct(certainty)}
          </div>
        </div>

        <div className="border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            <AlertTriangle className="h-3 w-3" />
            Burnout index
          </div>
          <div className="mt-3 text-[24px] font-light text-neutral-900">
            {pct(burnoutIndex)}
          </div>
        </div>

        <div className="border border-neutral-200 p-4">
          <div className="flex items-center gap-2 text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
            <FileText className="h-3 w-3" />
            Authorization
          </div>
          <div className={cn("mt-3 text-[24px] font-light", routeTone)}>
            {report.telemetry.authorized ? "Enabled" : "Controlled"}
          </div>
        </div>
      </section>

      <section className="border-b border-neutral-200 py-6">
        <SectionTitle
          eyebrow="Financial exposure"
          title="Commercial consequence"
          subtitle="Estimated financial load implied by current structural condition."
        />

        <div className="mt-4 grid grid-cols-3 gap-4">
          <MetricCard
            label="Replacement cost"
            value={report.financialExposure.replacementCostFormatted}
          />
          <MetricCard
            label="Execution loss"
            value={report.financialExposure.executionLossFormatted}
          />
          <MetricCard
            label="Total exposure"
            value={report.financialExposure.totalExposureFormatted}
          />
        </div>
      </section>

      <section className="py-6">
        <SectionTitle
          eyebrow="Recommendation layer"
          title="Governed next moves"
          subtitle={report.recommendations.nextAction}
        />

        <div className="mt-4">
          <RecommendationTable
            recommendations={report.recommendations.matchedAssets}
          />
        </div>

        {!!report.summary.rationale.length && (
          <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
              Guidance rationale
            </div>
            <div className="mt-2 space-y-1.5">
              {report.summary.rationale.slice(0, 4).map((item: string) => (
                <div key={item} className="text-[10px] leading-6 text-neutral-700">
                  • {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-neutral-200 pt-5">
        <div className="flex items-center justify-between text-[7px] font-mono uppercase tracking-[0.18em] text-neutral-500">
          <span>End-to-end verified</span>
          <span>Confidential</span>
          <span>Boardroom briefing</span>
        </div>
      </footer>
    </div>
  );
}
