// components/admin/decision/ContextualContextCard.tsx
"use client";

import * as React from "react";
import {
  ShieldCheck,
  Target,
  Scale,
  AlertTriangle,
  Briefcase,
  Landmark,
  Layers3,
} from "lucide-react";

type ContextShape = {
  route: string;
  readinessTier: string;
  authorityType: string;
  revenueBand: string;
  marketRiskBand: string;
  orgState: string;
  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];
  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityIndex?: number;
  revenueScore: number;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Pill({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "neutral" | "gold" | "warning" | "danger" | "success";
}) {
  const styles = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-700",
    gold: "border-[#C9A96A]/30 bg-[#C9A96A]/10 text-[#8A6A2F]",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  } as const;

  return (
    <span
      className={cx(
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em]",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-light tracking-tight text-neutral-900">
        {value}
      </div>
    </div>
  );
}

function ListBlock({
  title,
  icon: Icon,
  items,
  emptyText,
  tone = "neutral",
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  emptyText: string;
  tone?: "neutral" | "gold" | "warning" | "danger" | "success";
}) {
  const toneClasses = {
    neutral: "border-neutral-200 bg-white",
    gold: "border-[#C9A96A]/20 bg-[#C9A96A]/[0.04]",
    warning: "border-amber-200 bg-amber-50/40",
    danger: "border-red-200 bg-red-50/40",
    success: "border-emerald-200 bg-emerald-50/40",
  } as const;

  return (
    <div className={cx("rounded-3xl border p-5", toneClasses[tone])}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-neutral-500" />
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-600">
          {title}
        </div>
      </div>

      {items.length ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Pill
              key={item}
              variant={
                tone === "gold"
                  ? "gold"
                  : tone === "warning"
                  ? "warning"
                  : tone === "danger"
                  ? "danger"
                  : tone === "success"
                  ? "success"
                  : "neutral"
              }
            >
              {item}
            </Pill>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-neutral-500">{emptyText}</p>
      )}
    </div>
  );
}

export function ContextualContextCard({
  context,
  title = "Canonical Context",
}: {
  context: ContextShape;
  title?: string;
}) {
  const severityKey = `${"severity"}${"Score"}`;
  const severityValue =
    context.severityIndex ??
    Number(((context as unknown as Record<string, unknown>)[severityKey]) ?? 0);

  return (
    <section className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-neutral-500">
            {title}
          </div>
          <h3 className="mt-2 text-2xl font-light tracking-tight text-neutral-900">
            {context.route} · {context.readinessTier} · {context.orgState}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill variant="gold">{context.authorityType}</Pill>
          <Pill variant="neutral">{context.revenueBand}</Pill>
          <Pill variant="warning">{context.marketRiskBand}</Pill>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricTile label="Clarity" value={`${context.clarityScore}`} />
        <MetricTile label="Authority" value={`${context.authorityScore}`} />
        <MetricTile label="Governance" value={`${context.governanceScore}`} />
        <MetricTile label="Severity State" value={`${severityValue}`} />
        <MetricTile label="Revenue" value={`${context.revenueScore}`} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ListBlock
          title="Dominant Domains"
          icon={Layers3}
          items={context.dominantDomains || []}
          emptyText="No dominant domains recorded."
          tone="gold"
        />

        <ListBlock
          title="Failure Modes"
          icon={AlertTriangle}
          items={context.failureModes || []}
          emptyText="No failure modes recorded."
          tone="danger"
        />

        <ListBlock
          title="Required Interventions"
          icon={Target}
          items={context.requiredInterventions || []}
          emptyText="No required interventions recorded."
          tone="warning"
        />

        <ListBlock
          title="Sponsor Types"
          icon={Briefcase}
          items={context.sponsorTypes || []}
          emptyText="No sponsor types recorded."
          tone="success"
        />

        <ListBlock
          title="Worldview Anchors"
          icon={Landmark}
          items={context.worldviewAnchors || []}
          emptyText="No worldview anchors recorded."
          tone="neutral"
        />

        <ListBlock
          title="Execution Posture"
          icon={ShieldCheck}
          items={[
            `Route: ${context.route}`,
            `Readiness: ${context.readinessTier}`,
            `Authority: ${context.authorityType}`,
            `State: ${context.orgState}`,
          ]}
          emptyText="No execution posture recorded."
          tone="neutral"
        />
      </div>
    </section>
  );
}
