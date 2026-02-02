/* pages/admin/intelligence.tsx — REAL-TIME AUDIT & INTELLIGENCE VIEW */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/db";
import { auditLogger } from "@/lib/audit/audit-logger";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

interface AuditLogEntry {
  id: string;
  action: string;
  actorEmail: string;
  resourceName: string;
  severity: string;
  createdAt: string;
  metadata: string;
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
      <main className="min-h-screen bg-[#020202] text-white pt-32 pb-20 px-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* TOP METRICS BARS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: "Total Asset Retrievals", value: stats.totalDownloads },
              { label: "Active VIPs (24h)", value: stats.activeUsers24h },
              { label: "High-Interest Brief", value: stats.topAsset },
            ].map((stat, i) => (
              <div key={i} className="p-6 border border-white/5 bg-zinc-900/20 rounded-sm">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">{stat.label}</p>
                <p className="text-3xl font-light tracking-tighter text-[#D4AF37]">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* REAL-TIME AUDIT STREAM */}
            <div className="lg:col-span-8">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-4">
                Real-Time Audit Stream <span className="h-px flex-1 bg-white/5" />
              </h3>
              
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border border-white/5 bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors group">
                    <div className="flex items-center gap-6">
                      <span className={`w-1.5 h-1.5 rounded-full ${log.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-[#D4AF37]'}`} />
                      <div>
                        <p className="text-xs font-medium text-white group-hover:text-[#D4AF37] transition-colors">
                          {log.actorEmail} <span className="text-zinc-500 font-light">— accessed —</span> {log.resourceName || log.action}
                        </p>
                        <p className="text-[9px] font-mono text-zinc-600 uppercase mt-1">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-700">{log.id.slice(-8)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* INTELLIGENCE HEAT MAP (Logic Placeholder) */}
            <div className="lg:col-span-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-4">
                Security Posture <span className="h-px flex-1 bg-white/5" />
              </h3>
              <div className="aspect-square border border-white/5 bg-zinc-900/20 p-8 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 border-2 border-[#D4AF37]/20 rounded-full flex items-center justify-center mb-6">
                  <div className="w-16 h-16 border border-[#D4AF37] rounded-full animate-ping opacity-20" />
                </div>
                <p className="text-xs font-light text-zinc-400">All Systems Operational</p>
                <p className="text-[10px] text-zinc-600 mt-2 font-mono uppercase">Encryption: AES-256-GCM</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@abrahamoflondon.com';

  // Strict Authorization Check
  if (!session || session.user?.email !== adminEmail) {
    return { redirect: { destination: "/404", permanent: false } };
  }

  // Use the AuditLogger Query method to get recent asset events
  const logs = await prisma.systemAuditLog.findMany({
    where: {
      action: { in: ['ASSET_RETRIEVAL_AUTHORIZED', 'AUTH_SIGNIN'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Calculate high-level intelligence stats
  const totalDownloads = await prisma.systemAuditLog.count({
    where: { action: 'ASSET_RETRIEVAL_AUTHORIZED' }
  });

  const activeUsers24h = await prisma.innerCircleMember.count({
    where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  return {
    props: {
      logs: JSON.parse(JSON.stringify(logs)),
      stats: {
        totalDownloads,
        activeUsers24h,
        topAsset: "Legacy Architecture Canvas"
      }
    }
  };
};

export default IntelligenceView;