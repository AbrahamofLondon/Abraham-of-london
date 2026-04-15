/* pages/inner-circle/reports/[ref].tsx — Chamber mode: simplified detail view */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";

import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { canUnlockReport } from "@/lib/server/diagnostics/report-engine";
import { resolveDiagnosticReport } from "@/lib/server/diagnostics/report-resolver";

type Props = {
  item: any | null;
  renderedReport: any | null;
  unlocked: boolean;
  diagnosticRef: string;
  version: string;
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function safeArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

const ReportDetailPage: NextPage<Props> = ({
  item,
  renderedReport,
  unlocked,
  diagnosticRef,
  version,
}) => {
  if (!item || !renderedReport) {
    return (
      <Layout title="Report Not Found | Inner Circle">
        <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
          <WorkspaceNav />
          <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              INNER CIRCLE · REPORT
            </p>
            <h1 className="mt-5 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-light italic leading-[0.95] text-white/92">
              Report not found.
            </h1>
            <div className="mt-8">
              <Link
                href="/inner-circle/reports"
                className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white/62"
              >
                ← Reports
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const title = safeString(item?.title, "Diagnostic Report");
  const type = safeString(renderedReport?.type, safeString(item?.type, "Diagnostic"));
  const generatedAt = safeString(renderedReport?.generatedAt);
  const dateLabel = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const executiveSummary = safeString(renderedReport?.executiveSummary);
  const narrativeSummary = safeString(renderedReport?.narrativeSummary);
  const keyFindings = safeArray<string>(renderedReport?.keyFindings);
  const recommendations = safeArray<any>(renderedReport?.recommendations);

  const pdfHref = `/api/diagnostics/report/pdf?ref=${encodeURIComponent(
    diagnosticRef,
  )}&version=${encodeURIComponent(version)}`;

  return (
    <Layout title={`${title} | Inner Circle`}>
      <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
          <header>
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              INNER CIRCLE · REPORT
            </p>

            <div className="mt-5">
              <Link
                href="/inner-circle/reports"
                className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-white/38 transition-colors hover:text-white/62"
              >
                ← Reports
              </Link>
            </div>

            <h1 className="mt-6 font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-light italic leading-[1.05] text-white/92">
              {title}
            </h1>

            <p className="mt-4 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/38">
              {type}
              {dateLabel ? ` · ${dateLabel}` : ""}
            </p>
          </header>

          <article className="mt-12 max-w-[65ch] space-y-12">
            {executiveSummary ? (
              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Executive Summary
                </h2>
                <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.8] text-white/72">
                  {executiveSummary}
                </p>
              </section>
            ) : null}

            {narrativeSummary ? (
              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Narrative Summary
                </h2>
                <p className="mt-4 whitespace-pre-line text-[17px] leading-[1.8] text-white/72">
                  {narrativeSummary}
                </p>
              </section>
            ) : null}

            {keyFindings.length > 0 ? (
              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Key Findings
                </h2>
                <div className="mt-4 space-y-4 text-[17px] leading-[1.8] text-white/72">
                  {keyFindings.map((finding, idx) => (
                    <p key={`${idx}-${finding.slice(0, 24)}`}>{finding}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {recommendations.length > 0 ? (
              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Recommendations
                </h2>
                <div className="mt-4 space-y-4 text-[17px] leading-[1.8] text-white/72">
                  {recommendations.map((rec, idx) => {
                    const text =
                      typeof rec === "string"
                        ? rec
                        : safeString(rec?.body) ||
                          safeString(rec?.text) ||
                          safeString(rec?.title);
                    if (!text) return null;
                    return <p key={`rec-${idx}`}>{text}</p>;
                  })}
                </div>
              </section>
            ) : null}

            {unlocked ? (
              <section>
                <a
                  href={pdfHref}
                  className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-[#F59E0B] transition-opacity hover:opacity-80"
                >
                  Download PDF →
                </a>
              </section>
            ) : null}
          </article>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log("[PAGE_DATA] pages/inner-circle/reports/[ref].tsx getServerSideProps START");
  try {
  const diagnosticRef = safeString(context.params?.ref);

  const [
    { readAccessCookie },
    { getSessionContext, tierAtLeast },
  ] = await Promise.all([
    import("@/lib/server/auth/cookies"),
    import("@/lib/server/auth/tokenStore.postgres"),
  ]);

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
      return { redirect: { destination: "/inner-circle", permanent: false } };
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

    const version = safeString(renderedReport?.version, "2026.1");

    return {
      props: {
        item: JSON.parse(JSON.stringify(item)),
        renderedReport: JSON.parse(JSON.stringify(renderedReport)),
        unlocked,
        diagnosticRef,
        version,
      },
    };
  } catch (error) {
    console.error("[inner-circle/reports/[ref]]", error);
    return { notFound: true };
  }

  } finally {
    console.log("[PAGE_DATA] pages/inner-circle/reports/[ref].tsx getServerSideProps END");
  }
};

export default ReportDetailPage;
