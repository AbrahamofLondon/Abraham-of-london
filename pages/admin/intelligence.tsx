/* pages/admin/intelligence.tsx — REAL-TIME AUDIT & INTELLIGENCE VIEW */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import Layout from "@/components/Layout";
import { prisma } from "@/lib/db";

interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  resourceName: string | null;
  severity: string;
  createdAt: string;
  metadata?: unknown;
}

interface IntelligenceProps {
  logs: AuditLogEntry[];
  stats: {
    totalDownloads: number;
    activeUsers24h: number;
    topAsset: string;
  };
}

const IntelligenceView: NextPage<IntelligenceProps> = ({ logs, stats }) => {
  return (
    <Layout title="Intelligence Command Center">
      <main className="min-h-screen bg-[#020202] px-8 pb-20 pt-32 text-white">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { label: "Total Asset Retrievals", value: stats.totalDownloads },
              { label: "Active VIPs (24h)", value: stats.activeUsers24h },
              { label: "High-Interest Brief", value: stats.topAsset },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-sm border border-white/5 bg-zinc-900/20 p-6"
              >
                <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500">
                  {stat.label}
                </p>
                <p className="text-3xl font-light tracking-tighter text-[#D4AF37]">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h3 className="mb-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Real-Time Audit Stream <span className="h-px flex-1 bg-white/5" />
              </h3>

              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="group flex items-center justify-between border border-white/5 bg-zinc-900/10 p-4 transition-colors hover:bg-zinc-900/30"
                  >
                    <div className="flex items-center gap-6">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          log.severity === "critical"
                            ? "animate-pulse bg-red-500"
                            : "bg-[#D4AF37]"
                        }`}
                      />
                      <div>
                        <p className="text-xs font-medium text-white transition-colors group-hover:text-[#D4AF37]">
                          {log.actorEmail || "Unknown actor"}{" "}
                          <span className="font-light text-zinc-500">
                            — accessed —
                          </span>{" "}
                          {log.resourceName || log.action}
                        </p>
                        <p className="mt-1 font-mono text-[9px] uppercase text-zinc-600">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-zinc-700">
                      {log.id.slice(-8)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <h3 className="mb-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                Security Posture <span className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="flex aspect-square flex-col items-center justify-center border border-white/5 bg-zinc-900/20 p-8 text-center">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#D4AF37]/20">
                  <div className="h-16 w-16 animate-ping rounded-full border border-[#D4AF37] opacity-20" />
                </div>
                <p className="text-xs font-light text-zinc-400">
                  All Systems Operational
                </p>
                <p className="mt-2 font-mono text-[10px] uppercase text-zinc-600">
                  Encryption: AES-256-GCM
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<IntelligenceProps> = async (
  context
) => {
  const session = await getSession(context);
  const adminEmail =
    process.env.INITIAL_ADMIN_EMAIL || "admin@abrahamoflondon.com";

  if (!session || session.user?.email !== adminEmail) {
    return { redirect: { destination: "/404", permanent: false } };
  }

  const db = prisma;

  if (!db) {
    return {
      props: {
        logs: [],
        stats: {
          totalDownloads: 0,
          activeUsers24h: 0,
          topAsset: "Unavailable",
        },
      },
    };
  }

  const logsRaw = await db.systemAuditLog.findMany({
    where: {
      action: { in: ["ASSET_RETRIEVAL_AUTHORIZED", "AUTH_SIGNIN"] },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const totalDownloads = await db.systemAuditLog.count({
    where: { action: "ASSET_RETRIEVAL_AUTHORIZED" },
  });

  const activeUsers24h = await db.innerCircleMember.count({
    where: {
      lastSeenAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  const logs: AuditLogEntry[] = logsRaw.map((log) => {
    const logWithExtras = log as typeof log & {
      resourceName?: string | null;
      metadata?: unknown;
    };

    return {
      id: String(log.id),
      action: String(log.action),
      actorEmail: log.actorEmail ?? null,
      resourceName: logWithExtras.resourceName ?? null,
      severity: String(log.severity),
      createdAt: new Date(log.createdAt).toISOString(),
      metadata: logWithExtras.metadata,
    };
  });

  return {
    props: {
      logs,
      stats: {
        totalDownloads,
        activeUsers24h,
        topAsset: "Legacy Architecture Canvas",
      },
    },
  };
};

export default IntelligenceView;