/* pages/inner-circle/reports/[ref].tsx */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  FileText,
  RefreshCw,
} from "lucide-react";

import Layout from "@/components/layout/Layout";
import ReportShell from "@/components/diagnostics/report/ReportShell";
import ReportHeader from "@/components/diagnostics/report/ReportHeader";
import ReportSummaryBlock from "@/components/diagnostics/report/ReportSummaryBlock";
import ReportSectionScores from "@/components/diagnostics/report/ReportSectionScores";
import ReportRecommendations from "@/components/diagnostics/report/ReportRecommendations";
import ReportVersionHistory from "@/components/diagnostics/report/ReportVersionHistory";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { canUnlockReport } from "@/lib/server/diagnostics/report-engine";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";
import { listDiagnosticPdfArtifacts } from "@/lib/server/diagnostics/report-archive";

type Props = {
  item: any | null;
  renderedReport: any | null;
  canGenerate: boolean;
  unlocked: boolean;
  reportVersions: Array<{
    reportId: string;
    version: string;
    generatedAt: string;
    htmlPath?: string | null;
    pdfPath?: string | null;
    archivedArtifactId?: string | null;
    archivedAt?: string | null;
  }>;
};

export default function ReportDetailPage({
  item,
  renderedReport,
  canGenerate,
  unlocked,
  reportVersions,
}: Props) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [signedUrlBusy, setSignedUrlBusy] = React.useState(false);

  if (!item || !renderedReport) {
    return (
      <Layout title="Report Not Found">
        <main className="min-h-screen bg-black text-white p-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-serif text-4xl">Report not found</h1>
          </div>
        </main>
      </Layout>
    );
  }

  const handleGenerate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/diagnostics/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosticRef: item.diagnosticRef }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setError(json?.error || "REPORT_GENERATION_FAILED");
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
    try {
      setSignedUrlBusy(true);
      const res = await fetch(
        `/api/diagnostics/report/signed-url?ref=${encodeURIComponent(item.diagnosticRef)}&version=${encodeURIComponent(latestVersion)}`,
      );
      const json = await res.json();
      if (res.ok && json?.ok && json.url) {
        window.open(json.url, "_blank", "noopener,noreferrer");
      }
    } finally {
      setSignedUrlBusy(false);
    }
  };

  const latestVersion = renderedReport?.version || "2026.1";

  return (
    <Layout title={`${item.title} | Report`}>
      <ReportShell>
        <div className="space-y-8">
          <ReportHeader
            diagnosticRef={item.diagnosticRef}
            title={item.title}
            headline={renderedReport.headline}
            strapline={renderedReport.strapline}
            version={renderedReport.version}
            generatedAt={renderedReport.generatedAt}
          />

          <div className="flex flex-wrap gap-4">
            {canGenerate ? (
              <button
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
                  href={`/api/diagnostics/report/pdf?ref=${encodeURIComponent(item.diagnosticRef)}&version=${encodeURIComponent(
                    latestVersion,
                  )}`}
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
                body={renderedReport.executiveSummary}
              />
              <ReportSummaryBlock
                title="Narrative Summary"
                body={renderedReport.narrativeSummary}
              />
              <ReportSectionScores sections={item.summary?.sectionScores || []} />
            </div>

            <div className="space-y-8">
              <section className="border border-white/[0.08] bg-white/[0.02] p-8">
                <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
                  Key Findings
                </div>
                <div className="mt-6 space-y-4">
                  {(renderedReport.keyFindings || []).map((finding: string, idx: number) => (
                    <div
                      key={`${finding}-${idx}`}
                      className="border border-white/6 bg-black/20 p-4 text-sm leading-relaxed text-white/64"
                    >
                      {finding}
                    </div>
                  ))}
                </div>
              </section>

              <ReportRecommendations recommendations={renderedReport.recommendations || []} />
            </div>
          </div>

          <ReportVersionHistory
            diagnosticRef={item.diagnosticRef}
            reports={reportVersions}
          />
        </div>
      </ReportShell>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const diagnosticRef = String(context.params?.ref || "");

  try {
    const sessionId = readAccessCookie(context.req as any);
    if (!sessionId) {
      return {
        redirect: {
          destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`,
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

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) return { notFound: true };

    const isAdmin = tierAtLeast(String(ctx.tier || "public"), "private");
    if (!isAdmin && item.actor.userId && item.actor.userId !== ctx.memberId) {
      return { notFound: true };
    }

    const unlocked = canUnlockReport({
      record: item,
      userTier: String(ctx.tier || "public"),
      isAdmin,
    });

    const renderedReport = resolveDiagnosticReport({
      item,
      unlocked,
    });

    const current = item.report ? [item.report] : [];
    const history = Array.isArray(item.reportHistory) ? item.reportHistory : [];
    const merged = [...current, ...history]
      .filter(Boolean)
      .filter(
        (r, idx, arr) =>
          idx ===
          arr.findIndex(
            (x) =>
              x?.reportId === r?.reportId &&
              x?.version === r?.version,
          ),
      )
      .sort((a, b) => (b?.generatedAt || "").localeCompare(a?.generatedAt || ""));

    const archivedArtifacts = listDiagnosticPdfArtifacts(diagnosticRef);
    const reportVersions = merged.map((report) => {
      const artifact = archivedArtifacts.find((a) => a.version === report.version) || null;
      return {
        reportId: report.reportId,
        version: report.version,
        generatedAt: report.generatedAt,
        htmlPath: report.htmlPath ?? null,
        pdfPath:
          report.pdfPath ??
          `/api/diagnostics/report/pdf?ref=${encodeURIComponent(diagnosticRef)}&version=${encodeURIComponent(
            report.version,
          )}`,
        archivedArtifactId: report.archivedArtifactId ?? artifact?.artifactId ?? null,
        archivedAt: report.archivedAt ?? artifact?.createdAt ?? null,
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