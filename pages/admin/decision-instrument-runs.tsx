import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";

import AdminLayout from "@/components/admin/AdminLayout";
import BackToOperatorCommandCentre from "@/components/admin/BackToOperatorCommandCentre";
import { requireAdminPage } from "@/lib/access/server";

type RunRow = {
  id: string;
  instrumentSlug: string;
  userEmail: string | null;
  userId: string | null;
  entitlementSlug: string;
  entitlementVerified: boolean;
  status: string;
  artifactState: string;
  artifactUrl: string | null;
  artifactHash: string | null;
  nextRouteSlug: string | null;
  createdAt: string;
  completedAt: string | null;
  scoreSummary: string;
};

type PageProps = {
  runs: RunRow[];
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

function scoreSummary(scoreJson: unknown): string {
  if (!scoreJson || typeof scoreJson !== "object") return "No score payload";
  const value = scoreJson as Record<string, unknown>;
  const result = value.result && typeof value.result === "object"
    ? value.result as Record<string, unknown>
    : value;
  const candidates = [
    result.exposureBand,
    result.authorityType,
    result.recommendedPath,
    result.briefReadiness,
    result.primaryBand,
  ].filter(Boolean);
  return candidates.length ? candidates.map(String).join(" / ") : "Score payload recorded";
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.decisionInstrumentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return {
    props: {
      runs: rows.map((run) => ({
        id: run.id,
        instrumentSlug: run.instrumentSlug,
        userEmail: run.userEmail,
        userId: run.userId,
        entitlementSlug: run.entitlementSlug,
        entitlementVerified: run.entitlementVerified,
        status: run.status,
        artifactState: run.artifactState,
        artifactUrl: run.artifactUrl,
        artifactHash: run.artifactHash,
        nextRouteSlug: run.nextRouteSlug,
        createdAt: run.createdAt.toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
        scoreSummary: scoreSummary(run.scoreJson),
      })),
    },
  };
};

export default function DecisionInstrumentRunsPage({
  runs,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="Decision Instrument Runs">
      <Head>
        <title>Decision Instrument Runs | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6 text-white">
        <BackToOperatorCommandCentre />

        <section className="border border-white/10 bg-white/5 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500/70" style={mono}>
            Decision Instruments
          </p>
          <h1 className="mt-3 font-serif text-3xl">Instrument Run Authority</h1>
          <p className="mt-2 max-w-3xl text-sm text-white/55">
            Latest persisted DecisionInstrumentRun records, including entitlement verification and artifact state.
          </p>
        </section>

        <section className="overflow-x-auto border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[9px] uppercase tracking-[0.2em] text-white/40" style={mono}>
                <th className="px-4 py-3">Run</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Entitlement</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Artifact</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-white/55">
                    No instrument runs found.
                  </td>
                </tr>
              )}
              {runs.map((run) => (
                <tr key={run.id} className="border-b border-white/[0.06]">
                  <td className="px-4 py-3 text-white/55" style={{ ...mono, fontSize: "10px" }}>
                    {run.id.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-white/75">{run.instrumentSlug}</td>
                  <td className="px-4 py-3 text-white/55">{run.userEmail ?? run.userId ?? "Unknown"}</td>
                  <td className="px-4 py-3 text-white/55" style={{ ...mono, fontSize: "10px" }}>
                    {run.entitlementVerified ? "VERIFIED" : "UNVERIFIED"} · {run.entitlementSlug}
                  </td>
                  <td className="px-4 py-3 text-white/60" style={{ ...mono, fontSize: "10px" }}>
                    {run.status}
                  </td>
                  <td className="px-4 py-3 text-white/55" style={{ ...mono, fontSize: "10px" }}>
                    {run.artifactState}
                    {run.artifactHash ? ` · ${run.artifactHash.slice(0, 10)}` : ""}
                  </td>
                  <td className="px-4 py-3 text-white/60">{run.scoreSummary}</td>
                  <td className="px-4 py-3 text-white/50" style={{ ...mono, fontSize: "10px" }}>
                    {new Date(run.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AdminLayout>
  );
}
