/* pages/inner-circle/reports/index.tsx — Chamber mode: artifact registry */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";

type ReportRow = {
  diagnosticRef: string;
  title: string;
  type: string;
  date: string;
  href: string;
};

type Props = {
  memberName: string;
  tier: string;
  reports: ReportRow[];
};

const ReportsIndexPage: NextPage<Props> = ({ memberName, tier, reports }) => {
  return (
    <Layout title="Reports | Inner Circle">
      <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
          <header className="max-w-3xl">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              INNER CIRCLE · REPORTS
            </p>
            <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-[0.95] text-white/92">
              The artifact registry.
            </h1>
            <p className="mt-4 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/48">
              Active session · {memberName} · {tier}
            </p>
          </header>

          <section className="mt-12">
            <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
              Governed Artifacts
            </h2>
            <div className="mt-4 border-t border-white/8">
              {reports.length > 0 ? (
                reports.map((r) => (
                  <Link
                    key={r.diagnosticRef}
                    href={r.href}
                    className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                  >
                    <span>
                      {r.title} · {r.type} · {r.date}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                      → View
                    </span>
                  </Link>
                ))
              ) : (
                <div className="border-b border-white/6 py-3 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/28">
                  No reports available.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log("[PAGE_DATA] pages/inner-circle/reports/index.tsx getServerSideProps START");
  try {
  const [
    { prisma },
    { readAccessCookie },
    { getSessionContext, tierAtLeast },
  ] = await Promise.all([
    import("@/lib/prisma"),
    import("@/lib/server/auth/cookies"),
    import("@/lib/server/auth/tokenStore.postgres"),
  ]);

  try {
    const sessionId = readAccessCookie(context.req as any) || "";
    const ctx = await getSessionContext(sessionId);

    if (!ctx?.ok || !ctx?.valid) {
      return { redirect: { destination: "/inner-circle", permanent: false } };
    }

    if (!tierAtLeast(ctx.tier, "inner-circle")) {
      return { redirect: { destination: "/inner-circle/locked", permanent: false } };
    }

    const userEmail = ctx.email || null;
    let reports: ReportRow[] = [];

    if (userEmail) {
      const grants = await prisma.diagnosticArtifactAccessGrant.findMany({
        where: { granteeEmail: userEmail },
        select: { artifactId: true },
        orderBy: { createdAt: "desc" },
      });

      if (grants.length > 0) {
        const artifactIds = grants.map((g) => g.artifactId);
        const artifacts = await prisma.diagnosticArtifact.findMany({
          where: { id: { in: artifactIds } },
          orderBy: { createdAt: "desc" },
        });

        reports = artifacts.map((a) => ({
          diagnosticRef: a.diagnosticRef,
          title: a.fileName || "Diagnostic Report",
          type: a.version ? `v${a.version}` : "report",
          date: a.createdAt
            ? new Date(a.createdAt).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })
            : "",
          href: `/inner-circle/reports/${encodeURIComponent(a.diagnosticRef)}`,
        }));
      }
    }

    return {
      props: {
        memberName: ctx.name || "Member",
        tier: ctx.tier || "public",
        reports,
      },
    };
  } catch (error) {
    console.error("[inner-circle/reports/index]", error);
    return {
      props: {
        memberName: "Member",
        tier: "public",
        reports: [],
      },
    };
  }

  } finally {
    console.log("[PAGE_DATA] pages/inner-circle/reports/index.tsx getServerSideProps END");
  }
};

export default ReportsIndexPage;
