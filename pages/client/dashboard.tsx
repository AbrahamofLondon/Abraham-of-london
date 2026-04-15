// DEPRECATED: orphaned route — no inbound references.
// Pending operator decision: surface, redirect, or delete.
// Do not add new logic here.
/* pages/client/dashboard.tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Layout from "@/components/layout/Layout";
import ClientReportRequestPanel from "@/components/reports/ClientReportRequestPanel";
import ClientReportList from "@/components/reports/ClientReportList";
import { Activity, ShieldCheck, FileText, Crown } from "lucide-react";

type DiagnosticRecord = {
  id: string;
  reference: string;
  diagnosticType: string;
  score: number | null;
  severity: string | null;
  verdict: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  userEmail: string | null;
  payload: Record<string, any> | null;
};

type ClientReportRequest = {
  id: string;
  diagnosticId?: string | null;
  diagnosticType?: string | null;
  reportTier?: string | null;
  amount?: number | null;
  currency?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
};

type Props = {
  user: {
    name: string;
    tier: string;
    email: string | null;
  };
  diagnostics: DiagnosticRecord[];
  reports: ClientReportRequest[];
};

const ClientDashboardPage: NextPage<Props> = ({ user, diagnostics, reports }) => {
  const deliveredCount = React.useMemo(
    () => reports.filter((r) => String(r.status || "").toLowerCase() === "delivered").length,
    [reports],
  );

  return (
    <Layout title="Client Dashboard | Abraham of London" className="bg-white">
      <main className="min-h-screen bg-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-12 border-b border-gray-100 pb-12">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-700">
              <ShieldCheck size={14} />
              Client Reporting Console
            </div>

            <h1 className="font-serif text-5xl italic tracking-tighter text-gray-900 md:text-6xl">
              Paid reporting, properly governed.
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-light leading-relaxed text-gray-600">
              Welcome, <span className="font-medium text-gray-900">{user.name}</span>. This console links
              diagnostic telemetry, report purchase, and delivery visibility into one clean operating surface.
            </p>
          </header>

          <section className="mb-12 grid gap-6 md:grid-cols-4">
            <Tile label="Client Tier" value={user.tier} icon={<Crown size={18} />} />
            <Tile label="Diagnostics" value={diagnostics.length} icon={<Activity size={18} />} />
            <Tile label="Report Requests" value={reports.length} icon={<FileText size={18} />} />
            <Tile label="Delivered Reports" value={deliveredCount} icon={<ShieldCheck size={18} />} />
          </section>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="space-y-10">
              <ClientReportRequestPanel
                diagnostics={diagnostics.map((d) => ({
                  id: d.id,
                  diagnosticType: d.diagnosticType,
                  score: d.score,
                  createdAt: d.createdAt,
                  verdict: d.verdict,
                }))}
              />
            </section>

            <aside className="rounded-[28px] border border-gray-100 bg-gray-50 p-8">
              <div className="mb-4 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
                Why this matters
              </div>
              <h2 className="font-serif text-3xl italic text-gray-900">
                Same signal. Better monetisation. Better discipline.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Diagnostics are now traceable, reusable, and report-ready. That means
                serious buyers do not need to repeat themselves, and commercial escalation
                can happen without operational confusion.
              </p>
            </aside>
          </div>

          <section className="mt-14">
            <div className="mb-6 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">
              Report queue
            </div>
            <ClientReportList reports={reports.map((r) => ({
              id: r.id,
              reference: r.id,
              title: r.diagnosticType ?? r.reportTier ?? "Report",
              packageKey: r.reportTier ?? "",
              amountGbp: r.amount ?? 0,
              status: r.status,
              createdAt: r.createdAt,
              paidAt: null,
              deliveredAt: null,
              reportUrl: null,
            }))} />
          </section>
        </div>
      </main>
    </Layout>
  );
};

function Tile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
      <div className="mb-4 text-gray-400">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-serif italic text-gray-900">{value}</div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log("[PAGE_DATA] pages/client/dashboard.tsx getServerSideProps START");
  try {
  const [{ readAccessCookie }, { getSessionContext, tierAtLeast }, diagnosticsStore, reportsStore] =
    await Promise.all([
      import("@/lib/server/auth/cookies"),
      import("@/lib/server/auth/tokenStore.postgres"),
      import("@/lib/diagnostics/store"),
      import("@/lib/reports/store"),
    ]);

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

  if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "inner-circle")) {
    return {
      redirect: {
        destination: "/inner-circle/locked",
        permanent: false,
      },
    };
  }

  const email = (ctx as any).email || null;
  const memberId = ctx.memberId || null;

  const [diagnostics, reports] = await Promise.all([
    diagnosticsStore.getDiagnosticRecordsForUser({
      userId: memberId,
      userEmail: email,
      limit: 20,
    }),
    reportsStore.getReportRequestsForUser({
      userId: memberId,
      userEmail: email,
      limit: 20,
    }),
  ]);

  return {
    props: {
      user: {
        name: ctx.name || "Client",
        tier: ctx.tier || "inner-circle",
        email,
      },
      diagnostics,
      reports,
    },
  };

  } finally {
    console.log("[PAGE_DATA] pages/client/dashboard.tsx getServerSideProps END");
  }
};

export default ClientDashboardPage;