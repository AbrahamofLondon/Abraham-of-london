import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import type { AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import type {
  OperatorActionGroup,
  OperatorCommandCentreSummary,
  OperatorMetricTone,
  OperatorQueueCard,
} from "@/lib/admin/operator-command-centre";
import type { AdminActionDoctrineRecommendation } from "@/lib/admin/admin-action-doctrine";
import type { ProvenanceGapMonitorSummary } from "@/lib/admin/provenance-gap-monitor";

type PageProps = {
  summary: OperatorCommandCentreSummary;
  doctrine: AdminActionDoctrineRecommendation[];
  provenanceGaps: ProvenanceGapMonitorSummary | null;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { buildOperatorCommandCentreSummary } = await import("@/lib/admin/operator-command-centre");
  const { buildOperatorDoctrine } = await import("@/lib/admin/admin-action-doctrine");
  const { loadProvenanceGapMonitor } = await import("@/lib/admin/provenance-gap-monitor");

  const summary = await buildOperatorCommandCentreSummary();
  const doctrine = buildOperatorDoctrine(summary.cards);

  let provenanceGaps: ProvenanceGapMonitorSummary | null = null;
  try {
    provenanceGaps = await loadProvenanceGapMonitor({ limit: 20 });
  } catch {
    // degrades to null — operator page renders without the gap panel
  }

  return { props: { summary, doctrine, provenanceGaps } };
};

function operatorTone(tone?: OperatorMetricTone): AdminBadgeTone {
  if (tone === "risk") return "danger";
  if (tone === "attention") return "warning";
  if (tone === "good") return "success";
  return "neutral";
}

function priorityBorder(priority: OperatorQueueCard["priority"], status: OperatorQueueCard["status"]): string {
  if (status === "unavailable") return "border-white/10";
  if (priority === "risk") return "border-rose-500/25";
  if (priority === "attention") return "border-amber-500/20";
  return "border-white/10";
}

function groupAccent(groupId: OperatorActionGroup["id"]): string {
  switch (groupId) {
    case "do-first":
      return "border-rose-500/20 bg-rose-500/[0.04]";
    case "watch":
      return "border-amber-500/20 bg-amber-500/[0.04]";
    case "healthy":
      return "border-emerald-500/15 bg-emerald-500/[0.03]";
    case "unavailable":
      return "border-white/10 bg-white/[0.02]";
    default:
      return "border-white/10 bg-white/[0.02]";
  }
}

function metricValue(value: number | null): string | number {
  return typeof value === "number" ? value : "Unavailable";
}

function QueueCard({ card }: { card: OperatorQueueCard }) {
  return (
    <section className={`border ${priorityBorder(card.priority, card.status)} bg-zinc-950/70 p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <AdminStatusBadge
            label={card.status === "available" ? "Connected" : "Not connected"}
            tone={card.status === "available" ? "success" : "muted"}
          />
          <h2 className="mt-2 font-serif text-xl text-white">{card.title}</h2>
          <p className="mt-2 max-w-xl text-sm text-white/50">{card.description}</p>
        </div>
        {card.status === "unavailable" ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-white/35" />
        ) : card.priority === "risk" ? (
          <ShieldAlert className="h-5 w-5 shrink-0 text-rose-300/70" />
        ) : card.priority === "attention" ? (
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300/70" />
        ) : (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300/60" />
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {card.metrics.map((item) => (
          <AdminMetricCard
            key={`${card.id}-${item.label}`}
            label={item.label}
            value={metricValue(item.value)}
            detail={item.detail ?? undefined}
            tone={operatorTone(item.tone)}
            variant="inner"
          />
        ))}
      </div>

      {card.note ? <p className="mt-4 text-xs text-white/35">{card.note}</p> : null}

      <Link
        href={card.href}
        className="mt-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
      >
        Open surface
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}

const DOCTRINE_PRIORITY_STYLE: Record<AdminActionDoctrineRecommendation["priority"], { border: string; label: string; tone: AdminBadgeTone }> = {
  CRITICAL: { border: "border-l-rose-500/60",   label: "Critical", tone: "critical" },
  HIGH:     { border: "border-l-rose-500/30",   label: "High",     tone: "danger" },
  MEDIUM:   { border: "border-l-amber-500/40",  label: "Medium",   tone: "warning" },
  LOW:      { border: "border-l-white/15",       label: "Low",      tone: "muted" },
};

function DoctrineCard({ rec }: { rec: AdminActionDoctrineRecommendation }) {
  const style = DOCTRINE_PRIORITY_STYLE[rec.priority];
  return (
    <div className={`border-l-2 pl-4 ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{rec.title}</span>
            <AdminStatusBadge label={style.label} tone={style.tone} size="md" />
          </div>
          <p className="mt-1 text-[11px] text-white/45">{rec.rationale}</p>
          <p className="mt-2 text-[11px] text-white/65">{rec.recommendedAction}</p>
          {rec.blockers && rec.blockers.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {rec.blockers.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-[10px] text-amber-400/80">
                  <span className="mt-px shrink-0">⚠</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {rec.href && (
          <Link
            href={rec.href}
            className="shrink-0 border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-white/45 hover:border-amber-500/25 hover:text-amber-200"
          >
            {rec.actionLabel ?? "Open"}
          </Link>
        )}
      </div>
    </div>
  );
}

function DoctrinePanel({ recommendations }: { recommendations: AdminActionDoctrineRecommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <section className="border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
          Action Doctrine
        </p>
        <div className="mt-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400/60" />
          <p className="text-sm text-emerald-300/70">
            No recommended actions — all connected queues are clear.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
          Action Doctrine
        </p>
        <p className="mt-1 text-xs text-white/40">
          Rule-governed recommendations derived from live queue signals. Not AI. Not advisory.
          These reflect the current state of connected queues only.
        </p>
      </div>
      <div className="space-y-5">
        {recommendations.map((rec) => (
          <DoctrineCard key={rec.id} rec={rec} />
        ))}
      </div>
    </section>
  );
}

const GAP_SEVERITY_STYLE: Record<"INFO" | "WARNING" | "CRITICAL", { dot: string; label: string }> = {
  CRITICAL: { dot: "bg-rose-500",   label: "Critical" },
  WARNING:  { dot: "bg-amber-400",  label: "Warning" },
  INFO:     { dot: "bg-white/30",   label: "Info" },
};

function ProvenanceGapsPanel({ monitor }: { monitor: ProvenanceGapMonitorSummary | null }) {
  if (!monitor) {
    return (
      <section className="border border-white/10 bg-zinc-950/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
            Provenance Gap Monitor
          </p>
          <Link
            href="/admin/oversight-review"
            className="shrink-0 border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-white/45 hover:border-amber-500/25 hover:text-amber-200"
          >
            Open review
          </Link>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-white/25" />
          <p className="text-sm text-white/35">Provenance gaps unavailable — composition failed or no cycles loaded.</p>
        </div>
      </section>
    );
  }

  const topGaps = monitor.items.filter((item) => item.gapCount > 0).slice(0, 3);

  return (
    <section className="border border-white/10 bg-zinc-950/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
            Provenance Gap Monitor
          </p>
          <p className="mt-1 text-xs text-white/40">
            Gap status across the {monitor.totalSubjects} most recent oversight cycles. Not a decision — a posture signal.
          </p>
        </div>
        <Link
          href="/admin/oversight-review"
          className="shrink-0 border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-white/45 hover:border-amber-500/25 hover:text-amber-200"
        >
          Open review
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AdminMetricCard
          label="Critical"
          value={monitor.critical}
          tone={monitor.critical > 0 ? "danger" : "neutral"}
          variant="inner"
        />
        <AdminMetricCard
          label="Warning"
          value={monitor.warning}
          tone={monitor.warning > 0 ? "warning" : "neutral"}
          variant="inner"
        />
        <AdminMetricCard
          label="Complete"
          value={monitor.complete}
          tone={monitor.complete > 0 ? "success" : "neutral"}
          variant="inner"
        />
        <AdminMetricCard
          label="Unavailable"
          value={monitor.unavailable}
          tone={monitor.unavailable > 0 ? "warning" : "neutral"}
          variant="inner"
        />
      </div>

      {topGaps.length > 0 && (
        <div className="mt-4 space-y-2">
          {topGaps.map((item) => {
            const topGap = item.gaps[0];
            if (!topGap) return null;
            const style = GAP_SEVERITY_STYLE[topGap.severity];
            return (
              <div
                key={item.subjectId}
                className="flex items-start gap-3 border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-white/35">{item.subjectId}</span>
                    <AdminStatusBadge
                      label={style.label}
                      tone={topGap.severity === "CRITICAL" ? "critical" : topGap.severity === "WARNING" ? "warning" : "muted"}
                      size="md"
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-white/55">{topGap.description}</p>
                </div>
                {item.nextActionHref && (
                  <Link
                    href={item.nextActionHref}
                    className="shrink-0 text-[9px] font-mono uppercase tracking-[0.16em] text-white/30 hover:text-amber-200"
                  >
                    {item.nextAction ?? "Review"}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {monitor.withGaps === 0 && monitor.totalSubjects > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400/60" />
          <p className="text-sm text-emerald-300/70">No provenance gaps detected across loaded cycles.</p>
        </div>
      )}
    </section>
  );
}

function QueueGroup({ group }: { group: OperatorActionGroup }) {
  return (
    <section className={`border p-5 ${groupAccent(group.id)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500/70">
            {group.title}
          </h2>
          <p className="mt-1 max-w-3xl text-xs text-white/45">{group.description}</p>
        </div>
        <span className="shrink-0 font-mono text-sm text-white/45">{group.cards.length}</span>
      </div>

      {group.cards.length === 0 ? (
        <div className="mt-4 border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/35">
          No queues in this group.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {group.cards.map((card) => (
            <QueueCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function OperatorCommandCentrePage({
  summary,
  doctrine,
  provenanceGaps,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const generatedAt = new Date(summary.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <AdminLayout title="Operator Command Centre">
      <Head>
        <title>Operator Command Centre | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-amber-500/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Operator Command Centre
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Today&apos;s operational queues</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                A compact operator cockpit for overdue work, blocked records, safe approvals, and escalation risk. Specialist surfaces remain the source of action.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 md:flex">
              <Clock3 className="h-3.5 w-3.5 text-white/30" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
                {generatedAt}
              </span>
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          {summary.headlines.map((item) => (
            <AdminMetricCard
              key={item.label}
              label={item.label}
              value={metricValue(item.value)}
              detail={item.detail}
              tone={operatorTone(item.tone)}
            />
          ))}
        </section>

        <DoctrinePanel recommendations={doctrine} />

        <ProvenanceGapsPanel monitor={provenanceGaps} />

        <section className="space-y-4">
          {summary.actionGroups.map((group) => (
            <QueueGroup key={group.id} group={group} />
          ))}
        </section>
      </div>
    </AdminLayout>
  );
}
