// DEPRECATED: orphaned route — no inbound references.
// Pending operator decision: surface, redirect, or delete.
// Do not add new logic here.
/* ============================================================================
   FILE: pages/directorate/oversight.tsx
   DIRECTORATE OVERSIGHT — Hardened, Pages Router Safe, SSR Admin-Gated
============================================================================ */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  Activity,
  ShieldAlert,
  BarChart3,
  Database,
  ChevronRight,
} from "lucide-react";

type IntakeRecord = {
  id: string;
  fullName: string;
  organisation: string;
  status: string;
  score: number;
  createdAt: string;
};

type Props = {
  records: IntakeRecord[];
  stats: {
    total: number;
    highGravity: number;
    meanAssessment: string;
    nodeHealth: "ACTIVE";
  };
};

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : "";
  }

  const raw = safeString(value);
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return "";
  return new Date(t).toISOString();
}

function toDisplayDate(value: string): string {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toISOString().split("T")[0] || "—";
}

function normalizeStatus(status: unknown): string {
  const s = safeString(status, "PENDING").toUpperCase();
  return s || "PENDING";
}

function computeStats(records: IntakeRecord[]) {
  const total = records.length;
  const highGravity = records.filter((r) => r.score >= 20).length;
  const mean =
    total > 0
      ? (
          records.reduce((sum, r) => sum + safeNumber(r.score), 0) / total
        ).toFixed(1)
      : "0.0";

  return {
    total,
    highGravity,
    meanAssessment: mean,
    nodeHealth: "ACTIVE" as const,
  };
}

function statusDot(status: string): string {
  const s = normalizeStatus(status);

  if (["ACCEPTED", "APPROVED", "CLEARED", "PASSED"].includes(s)) {
    return "bg-emerald-500";
  }
  if (["REJECTED", "DECLINED", "FAILED", "FLAGGED"].includes(s)) {
    return "bg-red-500";
  }
  if (["REVIEW", "UNDER_REVIEW", "IN_REVIEW", "PENDING"].includes(s)) {
    return "bg-amber-500";
  }

  return "bg-zinc-600";
}

function scoreClass(score: number): string {
  if (score >= 20) return "text-amber-400";
  if (score >= 12) return "text-zinc-100";
  return "text-zinc-500";
}

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) => {
  return (
    <div className="border-r border-zinc-800 p-6 last:border-r-0">
      <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <div className="font-sans text-2xl text-zinc-100">{value}</div>
    </div>
  );
};

const OversightDashboard: NextPage<Props> = ({ records, stats }) => {
  return (
    <Layout
      title="Directorate Oversight"
      description="Administrative oversight for Strategy Room intake records."
    >
      <main className="min-h-screen bg-[#050505] px-6 py-8 text-zinc-400 lg:px-12 lg:py-12">
        <section className="mx-auto max-w-7xl">
          <header className="mb-10 border-b border-zinc-900 pb-8">
            <div className="text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
              Directorate // Oversight
            </div>

            <h1 className="mt-4 font-serif text-4xl tracking-tight text-zinc-100 md:text-5xl">
              Intake Oversight Ledger
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Administrative view across Strategy Room intake traffic,
              assessment gravity, and decision-state movement.
            </p>
          </header>

          <section className="mb-10 grid grid-cols-1 border border-zinc-800 bg-black md:grid-cols-4">
            <StatCard label="Total Intakes" value={stats.total} icon={Database} />
            <StatCard
              label="High Gravity"
              value={stats.highGravity}
              icon={ShieldAlert}
            />
            <StatCard
              label="Mean Assessment"
              value={stats.meanAssessment}
              icon={BarChart3}
            />
            <StatCard label="Node Health" value={stats.nodeHealth} icon={Activity} />
          </section>

          <section className="overflow-hidden border border-zinc-800 bg-black">
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
                  Records
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  {records.length} dossier entries loaded
                </div>
              </div>
            </div>

            {records.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-600">
                  No records
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  No Strategy Room intake records are currently available.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                      <th className="px-6 py-4 font-normal">Timestamp</th>
                      <th className="px-6 py-4 font-normal">
                        Principal / Organisation
                      </th>
                      <th className="px-6 py-4 text-center font-normal">Score</th>
                      <th className="px-6 py-4 font-normal">Status</th>
                      <th className="px-6 py-4 text-right font-normal">Dossier</th>
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((r) => (
                      <tr
                        key={r.id}
                        className="group border-b border-zinc-900 transition-colors hover:bg-zinc-800/20"
                      >
                        <td className="px-6 py-5 text-xs text-zinc-600">
                          {toDisplayDate(r.createdAt)}
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-sans text-sm font-semibold text-zinc-100">
                            {r.fullName}
                          </div>
                          <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-zinc-600">
                            {r.organisation || "—"}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center">
                          <span className={["font-semibold", scoreClass(r.score)].join(" ")}>
                            {r.score}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 text-xs text-zinc-300">
                            <span
                              className={[
                                "h-1.5 w-1.5 rounded-full",
                                statusDot(r.status),
                              ].join(" ")}
                            />
                            {normalizeStatus(r.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/directorate/dossier/${encodeURIComponent(r.id)}`}
                            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500 opacity-0 transition-all hover:text-zinc-200 group-hover:opacity-100"
                          >
                            Access Log
                            <ChevronRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { req, res } = ctx;

  const [{ getServerSession }, authModule, prismaModule] = await Promise.all([
    import("next-auth/next"),
    import("@/lib/auth/config"),
    import("@/lib/prisma"),
  ]);

  const session = await getServerSession(req, res, authModule.authOptions);

  const maybeUser = session?.user as { role?: string } | undefined;
  const maybeTier = (session as any)?.aol?.tier as string | undefined;

  const isAdmin =
    maybeUser?.role === "ADMIN" ||
    maybeUser?.role === "owner" ||
    maybeTier === "owner";

  if (!session || !isAdmin) {
    return {
      redirect: {
        destination: "/auth/signin",
        permanent: false,
      },
    };
  }

  const prisma = prismaModule.default ?? prismaModule.prisma;

  const data = await prisma.strategyIntake.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      organisation: true,
      status: true,
      score: true,
      createdAt: true,
    },
  });

  const records: IntakeRecord[] = (data || []).map((row: any) => ({
    id: safeString(row?.id),
    fullName: safeString(row?.fullName, "Unknown"),
    organisation: safeString(row?.organisation),
    status: normalizeStatus(row?.status),
    score: safeNumber(row?.score, 0),
    createdAt: toIsoDate(row?.createdAt),
  }));

  return {
    props: {
      records,
      stats: computeStats(records),
    },
  };

};

export default OversightDashboard;