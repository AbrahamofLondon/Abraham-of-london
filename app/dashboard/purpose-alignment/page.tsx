// DEPRECATED: orphaned dashboard — no inbound references.
// Pending deletion in cleanup pass. Do not add new logic here.
export const dynamic = "force-dynamic";

import {
  ALIGNMENT_DOMAIN_LABELS,
  ALIGNMENT_DOMAIN_ORDER,
} from "@/lib/alignment/checklist";
import { buildPurposeAlignmentDashboard } from "@/lib/alignment/dashboard";
import { listPurposeAlignmentAssessments } from "@/lib/alignment/repository";
import { getOrCreatePurposeAlignmentSessionKey } from "@/lib/alignment/session";
import { buildAlignmentNarrative } from "@/lib/alignment/report-language";
import { getReminderStatus } from "@/lib/alignment/reminders";

import PurposeAlignmentTrendChart from "@/components/alignment/PurposeAlignmentTrendChart";
import PurposeAlignmentRadarChart from "@/components/alignment/PurposeAlignmentRadarChart";
import AlignmentCTA from "@/components/alignment/AlignmentCTA";

function formatPosture(value: string): string {
  return value.toUpperCase();
}

function formatChange(value: number | null): string {
  if (value === null) return "No prior record";
  if (value > 0) return "Strengthened";
  if (value < 0) return "Weakened";
  return "Stable";
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
}

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getPostureSurface(posture?: string | null): string {
  switch (posture) {
    case "aligned":
      return "bg-emerald-50 border-emerald-200";
    case "drifting":
      return "bg-amber-50 border-amber-200";
    case "misaligned":
      return "bg-orange-50 border-orange-200";
    case "disordered":
      return "bg-red-50 border-red-200";
    default:
      return "bg-white border-neutral-200";
  }
}

function getPostureText(posture?: string | null): string {
  switch (posture) {
    case "aligned":
      return "text-emerald-700";
    case "drifting":
      return "text-amber-700";
    case "misaligned":
      return "text-orange-700";
    case "disordered":
      return "text-red-700";
    default:
      return "text-neutral-950";
  }
}

function getDomainState(percent: number | null | undefined): string {
  if (typeof percent !== "number") return "Under review";
  if (percent >= 80) return "Anchored";
  if (percent >= 60) return "Holding";
  if (percent >= 40) return "Drifting";
  return "Exposed";
}

export default async function PurposeAlignmentDashboardPage() {
  const sessionKey = await getOrCreatePurposeAlignmentSessionKey();

  const history = await listPurposeAlignmentAssessments({
    sessionKey,
    limit: 12,
  });

  const dashboard = buildPurposeAlignmentDashboard(history);
  const latest = dashboard.latest;
  const narrative = latest ? buildAlignmentNarrative(latest) : null;
  const reminderStatus = await getReminderStatus({ sessionKey });

  const chartData = [...history].reverse().map((item, index) => ({
    label: index === 0 ? "Start" : formatShortDate(item.createdAt),
    reading: item.totalScore,
  }));

  const radarData =
    latest?.domainScores.map((item) => ({
      domain: ALIGNMENT_DOMAIN_LABELS[item.domain],
      percent: item.percent,
      strength: (
        item.percent >= 80
          ? 'strong'
          : item.percent >= 60
            ? 'developing'
            : item.percent >= 40
              ? 'weak'
              : 'critical'
      ) as 'strong' | 'developing' | 'weak' | 'critical',
    })) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[32px] border bg-white p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A6A2F]">
            Purpose Alignment System
          </div>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            Executive Dashboard
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
            A governed dashboard for directional integrity, posture movement,
            correction priority, reassessment cadence, and report retrieval.
          </p>
        </div>
      </section>

      {reminderStatus.isDue ? (
        <section className="mt-8 rounded-[32px] border bg-[#FCFBF7] p-8 shadow-sm">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
              Reassessment Due
            </div>

            <div className="mt-4 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <h2 className="text-3xl font-semibold tracking-tight text-neutral-950">
                  Monthly Review Window Now Open
                </h2>

                <p className="mt-4 text-sm leading-7 text-neutral-700">
                  {reminderStatus.prompt}
                </p>

                {reminderStatus.nextDueAt ? (
                  <p className="mt-4 text-sm leading-7 text-neutral-500">
                    Scheduled review point: {formatLongDate(reminderStatus.nextDueAt)}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/purpose-alignment"
                  className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                >
                  Run this month’s assessment
                </a>

                <a
                  href="/dashboard/purpose-alignment"
                  className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                >
                  Review current dashboard
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-8 rounded-[32px] border bg-[#FCFBF7] p-8 shadow-sm">
        <div className="max-w-4xl">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
            Executive Reading
          </div>

          <p className="mt-3 text-base leading-7 text-neutral-800">
            {narrative?.posture ?? "No assessment reading has yet been established."}
          </p>

          {narrative ? (
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              {narrative.executiveSummary}
            </p>
          ) : (
            <p className="mt-4 text-sm leading-7 text-neutral-600">
              Run the first assessment to establish a baseline reading across
              identity, decisions, environment, behaviour, emotional order, and legacy.
            </p>
          )}
        </div>
      </section>

      {narrative ? (
        <section className="mt-8 rounded-[32px] border bg-[#FCFBF7] p-8 shadow-sm">
          <div className="max-w-5xl">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A6A2F]">
              Decision Pressure
            </div>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
              Required Action Cannot Be Deferred
            </h2>

            <p className="mt-4 text-sm leading-7 text-neutral-700">
              {narrative.correctivePriorityBody}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/purpose-alignment"
                className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Re-run assessment
              </a>

              {latest ? (
                <a
                  href={`/.netlify/functions/purpose-alignment-report-id?assessmentId=${encodeURIComponent(latest.id)}`}
                  className="inline-flex rounded-2xl border bg-white px-5 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                >
                  Download current report
                </a>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-4">
        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Latest Reading
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {latest ? "Available" : "—"}
          </div>
          <div className="mt-2 text-sm text-neutral-500">
            {latest ? "Most recent assessment stored" : "No record yet"}
          </div>
        </div>

        <div
          className={`rounded-[28px] border p-6 shadow-sm ${getPostureSurface(
            latest?.band ?? null
          )}`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Current Posture
          </div>
          <div className={`mt-4 text-4xl font-semibold ${getPostureText(latest?.band ?? null)}`}>
            {latest ? formatPosture(latest.band) : "—"}
          </div>
          <div className="mt-2 text-sm text-neutral-500">Structural reading</div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Recent Change
          </div>
          <div className="mt-4 text-4xl font-semibold text-neutral-950">
            {formatChange(dashboard.scoreDelta)}
          </div>
          <div className="mt-2 text-sm text-neutral-500">
            Versus previous assessment
          </div>
        </div>

        <div className="rounded-[28px] border bg-white p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Latest Timestamp
          </div>
          <div className="mt-4 text-lg font-semibold text-neutral-950">
            {latest ? formatDate(latest.createdAt) : "—"}
          </div>
          <div className="mt-2 text-sm text-neutral-500">Most recent record</div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-2">
        <section className="rounded-[32px] border bg-white p-8 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
              Reading Movement
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
              Assessment Trend
            </h2>
          </div>

          <div className="mt-6">
            <PurposeAlignmentTrendChart data={chartData} />
          </div>
        </section>

        <section className="rounded-[32px] border bg-white p-8 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
              Domain Shape
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
              Radar Reading
            </h2>
          </div>

          <div className="mt-6">
            <PurposeAlignmentRadarChart data={radarData} />
          </div>
        </section>
      </div>

      {narrative ? (
        <>
          <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
            <div className="grid gap-6 xl:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                  Correction Priority
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                  {narrative.correctivePriorityTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {narrative.correctivePriorityBody}
                </p>
              </div>

              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
                  Primary Pattern
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
                  {narrative.strongestSignalTitle}
                </h2>
                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {narrative.strongestSignalBody}
                </p>
              </div>
            </div>
          </section>

          <AlignmentCTA
            narrative={narrative}
            reportUrl={latest ? `/.netlify/functions/purpose-alignment-report-id?assessmentId=${encodeURIComponent(latest.id)}` : undefined}
          />
        </>
      ) : null}

      <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
            Domain Movement
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Drift and Strength by Domain
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ALIGNMENT_DOMAIN_ORDER.map((domain) => {
            const trend = dashboard.domainTrend.find((item) => item.domain === domain);
            const delta =
              typeof trend?.delta === "number"
                ? trend.delta > 0
                  ? `+${trend.delta}%`
                  : `${trend.delta}%`
                : "—";

            return (
              <div key={domain} className="rounded-[22px] border bg-[#FCFBF7] p-5">
                <div className="text-sm font-semibold text-neutral-950">
                  {ALIGNMENT_DOMAIN_LABELS[domain]}
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Current
                    </div>
                    <div className="mt-1 text-3xl font-semibold text-neutral-950">
                      {trend?.currentPercent ?? 0}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                      Change
                    </div>
                    <div className="mt-1 text-lg font-medium text-neutral-700">
                      {typeof trend?.delta === "number"
                        ? trend.delta > 0
                          ? "Strengthened"
                          : trend.delta < 0
                            ? "Weakened"
                            : "Stable"
                        : "—"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-sm text-neutral-600">
                  State: {getDomainState(trend?.currentPercent)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-[32px] border bg-white p-8 shadow-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A6A2F]">
            Report Archive
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">
            Assessment History
          </h2>
        </div>

        <div className="mt-6 grid gap-3">
          {history.length === 0 ? (
            <div className="rounded-[22px] border bg-[#FCFBF7] p-5 text-sm leading-6 text-neutral-600">
              No assessments have been recorded yet.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-[22px] border bg-[#FCFBF7] p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-base font-semibold text-neutral-950">
                    {formatPosture(item.band)} assessment
                  </div>

                  <div className="mt-1 text-sm text-neutral-500">
                    {formatDate(item.createdAt)}
                  </div>

                  <div className="mt-2 text-sm text-neutral-600">
                    Weakest domains:{" "}
                    {item.weakestDomains
                      .map((domain) => ALIGNMENT_DOMAIN_LABELS[domain])
                      .join(", ")}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/.netlify/functions/purpose-alignment-report-id?assessmentId=${encodeURIComponent(item.id)}`}
                    className="inline-flex rounded-2xl border bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
