/* pages/inner-circle/reports/[ref].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import { ArrowRight, Download, FileText, RefreshCw } from "lucide-react";

import Layout from "@/components/Layout";
import ReportShell from "@/components/diagnostics/report/ReportShell";
import ReportHeader from "@/components/diagnostics/report/ReportHeader";
import ReportSummaryBlock from "@/components/diagnostics/report/ReportSummaryBlock";
import ReportSectionScores from "@/components/diagnostics/report/ReportSectionScores";
import ReportRecommendations from "@/components/diagnostics/report/ReportRecommendations";
import ReportVersionHistory from "@/components/diagnostics/report/ReportVersionHistory";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import {
  getSessionContext,
  tierAtLeast,
} from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { canUnlockReport } from "@/lib/server/diagnostics/report-engine";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";
import { listDiagnosticPdfArtifacts } from "@/lib/server/diagnostics/report-archive";

type ReportVersionRow = {
  reportId: string;
  version: string;
  generatedAt: string;
  htmlPath?: string | null;
  pdfPath?: string | null;
  archivedArtifactId?: string | null;
  archivedAt?: string | null;
};

type Props = {
  item: any | null;
  renderedReport: any | null;
  canGenerate: boolean;
  unlocked: boolean;
  reportVersions: ReportVersionRow[];
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function uniqBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

const ReportDetailPage: NextPage<Props> = ({
  item,
  renderedReport,
  canGenerate,
  unlocked,
  reportVersions,
}) => {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signedUrlBusy, setSignedUrlBusy] = React.useState(false);

  if (!item || !renderedReport) {
    return (
      <Layout title="Report Not Found">
        <main className="min-h-screen bg-black p-10 text-white">
          <div className="mx-auto max-w-4xl">
            <h1 className="font-serif text-4xl">Report not found</h1>
          </div>
        </main>
      </Layout>
    );
  }

  const diagnosticRef = safeString(item?.diagnosticRef);
  const latestVersion = safeString(renderedReport?.version, "2026.1");
  const sectionScores = safeArray(item?.summary?.sectionScores);
  const keyFindings = safeArray<string>(renderedReport?.keyFindings);
  const recommendations = safeArray(renderedReport?.recommendations);

  const handleGenerate = async () => {
    if (!diagnosticRef) return;

    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/diagnostics/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticRef }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setError(
          safeString(json?.error) ||
            safeString(json?.reason) ||
            "REPORT_GENERATION_FAILED",
        );
      } else {
        window.location.reload();
      }
    } catch {
      setError("REPORT_GENERATION_FAILED");
    } finally {
      setBusy(false);
    }
  };

  const handleOpenSignedPdf = async () => {
    if (!diagnosticRef || !latestVersion) return;

    try {
      setSignedUrlBusy(true);

      const res = await fetch(
        `/api/diagnostics/report/signed-url?ref=${encodeURIComponent(
          diagnosticRef,
        )}&version=${encodeURIComponent(latestVersion)}`,
      );

      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.ok && json?.url) {
        window.open(String(json.url), "_blank", "noopener,noreferrer");
      } else {
        setError(
          safeString(json?.error) ||
            safeString(json?.reason) ||
            "SIGNED_URL_FAILED",
        );
      }
    } catch {
      setError("SIGNED_URL_FAILED");
    } finally {
      setSignedUrlBusy(false);
    }
  };

  return (
    <Layout title={`${safeString(item?.title, "Report")} | Report`}>
      <ReportShell>
        <div className="space-y-8">
          <ReportHeader
            diagnosticRef={diagnosticRef}
            title={safeString(item?.title, "Diagnostic Report")}
            headline={safeString(renderedReport?.headline)}
            strapline={safeString(renderedReport?.strapline)}
            version={latestVersion}
            generatedAt={safeString(renderedReport?.generatedAt)}
          />

          <div className="flex flex-wrap gap-4">
            {canGenerate ? (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={busy}
                className="inline-flex items-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50 disabled:opacity-50"
              >
                {busy ? "Regenerating…" : "Generate New Version"}
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              </button>
            ) : null}

            {unlocked ? (
              <>
                <a
                  href={`/api/diagnostics/report/pdf?ref=${encodeURIComponent(
                    diagnosticRef,
                  )}&version=${encodeURIComponent(latestVersion)}`}
                  className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/82 hover:bg-white/[0.04]"
                >
                  Download Latest PDF
                  <Download className="h-4 w-4" />
                </a>

                <button
                  type="button"
                  onClick={handleOpenSignedPdf}
                  disabled={signedUrlBusy}
                  className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/82 hover:bg-white/[0.04] disabled:opacity-50"
                >
                  {signedUrlBusy ? "Preparing URL…" : "Open Signed PDF"}
                  <Download className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-3 border border-amber-500/20 bg-amber-500/[0.06] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300">
                Report PDF locked behind member clearance
                <FileText className="h-4 w-4" />
              </div>
            )}

            <Link
              href="/inner-circle/dashboard"
              className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/82 hover:bg-white/[0.04]"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {error ? (
            <div className="border border-red-500/20 bg-red-500/[0.04] p-4 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <ReportSummaryBlock
                title="Executive Summary"
                body={safeString(renderedReport?.executiveSummary)}
              />
              <ReportSummaryBlock
                title="Narrative Summary"
                body={safeString(renderedReport?.narrativeSummary)}
              />
              <ReportSectionScores sections={sectionScores} />
            </div>

            <div className="space-y-8">
              <section className="border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
                  Key Findings
                </div>

                <div className="mt-6 space-y-4">
                  {keyFindings.length ? (
                    keyFindings.map((finding, idx) => (
                      <div
                        key={`${finding}-${idx}`}
                        className="border border-white/6 bg-black/20 p-4 text-sm leading-relaxed text-white/64"
                      >
                        {finding}
                      </div>
                    ))
                  ) : (
                    <div className="border border-white/6 bg-black/20 p-4 text-sm leading-relaxed text-white/50">
                      No key findings available.
                    </div>
                  )}
                </div>
              </section>

              <ReportRecommendations recommendations={recommendations} />
            </div>
          </div>

          <ReportVersionHistory
            diagnosticRef={diagnosticRef}
            reports={reportVersions}
          />
        </div>
      </ReportShell>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const diagnosticRef = safeString(context.params?.ref);

  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return {
        redirect: {
          destination: `/inner-circle?returnTo=${encodeURIComponent(
            context.resolvedUrl,
          )}`,
          permanent: false,
        },
      };
    }

    const ctx = await getSessionContext(sessionId);

    if (!ctx?.ok || !ctx?.valid) {
      return {
        redirect: {
          destination: "/inner-circle",
          permanent: false,
        },
      };
    }

    if (!diagnosticRef) {
      return { notFound: true };
    }

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) return { notFound: true };

    const tier = safeString((ctx as any)?.tier, "public");
    const memberId = safeString((ctx as any)?.memberId);
    const isAdmin = tierAtLeast(tier, "private");

    const actorUserId = safeString(item?.actor?.userId);
    if (!isAdmin && actorUserId && actorUserId !== memberId) {
      return { notFound: true };
    }

    const unlocked = canUnlockReport({
      record: item,
      userTier: tier,
      isAdmin,
    });

    const renderedReport = resolveDiagnosticReport({
      item,
      unlocked,
    });

    const current = item?.report ? [item.report] : [];
    const history = safeArray(item?.reportHistory);
    const merged = uniqBy(
      [...current, ...history].filter(Boolean),
      (r: any) =>
        `${safeString(r?.reportId, "no-report-id")}::${safeString(
          r?.version,
          "no-version",
        )}`,
    ).sort((a: any, b: any) =>
      safeString(b?.generatedAt).localeCompare(safeString(a?.generatedAt)),
    );

    const archivedArtifacts = listDiagnosticPdfArtifacts(diagnosticRef);

    const reportVersions: ReportVersionRow[] = merged.map((report: any) => {
      const version = safeString(report?.version, renderedReport?.version || "2026.1");
      const artifact =
        archivedArtifacts.find((a) => safeString(a?.version) === version) || null;

      return {
        reportId: safeString(report?.reportId, `RPT-${diagnosticRef}-${version}`),
        version,
        generatedAt: safeString(
          report?.generatedAt,
          safeString(renderedReport?.generatedAt),
        ),
        htmlPath: report?.htmlPath ?? null,
        pdfPath:
          report?.pdfPath ??
          `/api/diagnostics/report/pdf?ref=${encodeURIComponent(
            diagnosticRef,
          )}&version=${encodeURIComponent(version)}`,
        archivedArtifactId:
          report?.archivedArtifactId ?? artifact?.artifactId ?? null,
        archivedAt: report?.archivedAt ?? artifact?.createdAt ?? null,
      };
    });

    return {
      props: {
        item: JSON.parse(JSON.stringify(item)),
        renderedReport: JSON.parse(JSON.stringify(renderedReport)),
        canGenerate: isAdmin,
        unlocked,
        reportVersions: JSON.parse(JSON.stringify(reportVersions)),
      },
    };
  } catch (error) {
    console.error("[inner-circle/reports/[ref]]", error);
    return { notFound: true };
  }
};

export default ReportDetailPage;
