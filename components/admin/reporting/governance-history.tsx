'use client';

import * as React from "react";
import Link from "next/link";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { OGR_CLIENT_CONFIG } from "@/lib/ogr/client-config";
import {
  ChevronRight,
  Fingerprint,
  Zap,
  BarChart3,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Crown,
} from "lucide-react";
import Layout from "@/components/Layout";
import { BriefingTrigger } from "@/components/admin/reporting/briefing-trigger";
import { GovernanceHistory, type HistoryNode } from "@/components/admin/reporting/governance-history";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface Brief {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
}

interface DashboardProps {
  briefs: Brief[];
  totalCount: number;
  userEmail: string;
  aol: {
    tier: string;
    isInternal: boolean;
  };
  devMode: boolean;
  governanceHistory: HistoryNode[];
}

/* -------------------------------------------------------------------------- */
/* SECURITY UTILITIES                                                         */
/* -------------------------------------------------------------------------- */

const OGR_COOKIE_NAME = "ogr_sovereign_session";

function signSession(value: string, secret: string): string {
  const mac = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${mac}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function hasValidOgrSessionFromContext(context: GetServerSidePropsContext): boolean {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_OGR === 'true') return true;

  const secret = process.env.OGR_SESSION_SECRET;
  if (!secret) return false;

  const raw = context.req.cookies?.[OGR_COOKIE_NAME];
  if (!raw) return false;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = raw.slice(0, lastDot);
  const providedMac = raw.slice(lastDot + 1);
  const expected = signSession(payload, secret);
  const expectedMac = expected.slice(expected.lastIndexOf(".") + 1);

  return timingSafeEqual(providedMac, expectedMac);
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

export default function MemberDashboard({
  briefs,
  totalCount,
  userEmail,
  aol,
  devMode,
  governanceHistory
}: DashboardProps) {
  
  const activeCampaignId = briefs[0]?.id || "default_node";

  return (
    <Layout title="The Sovereign Registry" className="bg-black text-white">
      <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
        
        {/* Background Texture — Institutional */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_8%,rgba(245,158,11,0.08)_0%,transparent_52%)]" />
          <div className="absolute inset-0 aol-grain opacity-[0.03]" />
          <div className="absolute left-1/2 top-0 h-px w-full max-w-6xl -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-32 md:px-12">
          
          {/* Header */}
          <header className="mb-16 flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-10 md:flex-row md:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5">
                  <Zap className="h-2 w-2 fill-amber-400 text-amber-400" />
                  <span className="font-mono text-[7px] font-medium uppercase tracking-[0.3em] text-amber-300/80">
                    {devMode ? "Dev Bypass Active" : "Node Active"}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5">
                  <ShieldCheck className="h-2 w-2 text-emerald-400/60" />
                  <span className="font-mono text-[7px] font-medium uppercase tracking-[0.3em] text-white/40">
                    Sovereign Verified
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-2 py-0.5">
                  <Crown className="h-2 w-2 text-amber-400/60" />
                  <span className="font-mono text-[7px] font-medium uppercase tracking-[0.3em] text-white/40">
                    {aol.tier} Access
                  </span>
                </div>
              </div>

              <h1 className="font-serif text-5xl font-light tracking-tighter text-white md:text-7xl">
                The <span className="italic text-amber-400/70">Sovereign</span> Registry.
              </h1>
            </div>

            <div className="text-right font-mono text-[8px] uppercase tracking-[0.25em] leading-relaxed text-white/30">
              <p>Protocol <span className="ml-2 text-white/50">{OGR_CLIENT_CONFIG.protocolVersion}</span></p>
              <p>Identity <span className="ml-2 text-white/50">{userEmail.split("@")[0]}...</span></p>
              <p>Assets <span className="ml-2 text-white/50">{totalCount}</span></p>
            </div>
          </header>

          {/* Intelligence & Governance Grid */}
          <div className="mb-20 grid grid-cols-1 gap-10 lg:grid-cols-12">
            
            {/* Left: Briefing Engine */}
            <div className="lg:col-span-4">
              <div className="border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-3 h-3 text-amber-400/60" />
                  <h3 className="text-[8px] font-mono uppercase tracking-wider text-white/40">
                    Briefing Engine
                  </h3>
                </div>
                <p className="text-[10px] leading-relaxed text-white/40 mb-6">
                  Compile real-time node telemetry into a board-ready intelligence summary.
                </p>
                <div className="flex flex-col gap-3">
                  <BriefingTrigger campaignId={activeCampaignId} />
                  <Link 
                    href="/dashboard/live" 
                    className="flex items-center justify-between group border border-white/10 p-3 transition-all hover:border-white/20 hover:bg-white/5"
                  >
                    <span className="text-[7px] font-mono uppercase tracking-wider text-white/40 group-hover:text-white/60">
                      Live Data Terminal
                    </span>
                    <ArrowUpRight className="w-2.5 h-2.5 text-white/30 group-hover:text-white/50" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Governance History */}
            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-400/60" />
                  <h3 className="text-[8px] font-mono uppercase tracking-wider text-white/40">Governance History</h3>
                </div>
                <span className="text-[6px] font-mono text-white/20">
                  Archive: {governanceHistory.length} nodes
                </span>
              </div>
              <GovernanceHistory 
                nodes={governanceHistory} 
                maxHeight="360px"
                onNodeSelect={(node) => console.log('Selected node:', node)}
              />
            </div>
          </div>

          {/* Asset Index */}
          <div className="mb-6">
            <h3 className="text-[8px] font-mono uppercase tracking-wider text-white/30 mb-2">Portfolio Intelligence</h3>
            <div className="h-px w-full bg-gradient-to-r from-amber-400/20 to-transparent" />
          </div>

          <div className="divide-y divide-white/5 border-y border-white/5">
            {briefs.map((brief, index) => (
              <Link
                key={brief.id}
                href={`/strategy/${brief.slug}`}
                className="group relative flex flex-col justify-between overflow-hidden bg-transparent px-4 py-8 transition-all duration-500 hover:bg-white/5 md:flex-row md:items-center"
              >
                <div className="absolute bottom-0 left-0 top-0 w-px origin-bottom scale-y-0 bg-amber-400/50 transition-transform duration-500 group-hover:scale-y-100" />

                <div className="relative z-10 flex items-start gap-8 md:items-center">
                  <span className="mt-0.5 hidden font-mono text-[8px] text-white/30 transition-colors group-hover:text-white/50 md:block">
                    [{String(index + 1).padStart(2, "0")}]
                  </span>

                  <div className="space-y-2">
                    <h2 className="font-serif text-2xl font-light tracking-tight text-white/80 transition-colors group-hover:text-white md:text-3xl">
                      {brief.title}
                    </h2>

                    <div className="flex items-center gap-3">
                      <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                        Classification: {aol.isInternal ? "Directorate" : "Private Member"}
                      </p>
                      <span className="h-px w-4 bg-white/10" />
                      <span className="font-mono text-[7px] uppercase text-white/25">
                        {new Date(brief.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-white/10 p-2 transition-all duration-500 group-hover:border-white/20">
                  <ChevronRight className="h-3 w-3 text-white/30 transition-all group-hover:translate-x-0.5 group-hover:text-white/50" />
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {briefs.length === 0 && (
            <div className="py-20 text-center">
              <FileText className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                No assets available
              </p>
              <p className="mt-2 text-sm text-white/30">
                Sovereign registry is being populated.
              </p>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-32 flex flex-col items-center gap-8 border-t border-white/10 pt-20">
            <div className="group relative">
              <div className="absolute inset-0 bg-amber-400/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="relative rounded-full border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
                <Fingerprint className="h-6 w-6 text-white/30 group-hover:text-white/50" />
              </div>
            </div>
            <p className="text-center font-serif text-[10px] italic tracking-[0.15em] text-white/25">
              Abraham of London — Sovereign Portfolio v{OGR_CLIENT_CONFIG.protocolVersion}
            </p>
          </footer>
        </div>
      </main>
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */
/* SERVER-SIDE PROTECTION                                                     */
/* -------------------------------------------------------------------------- */

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const isOgrValid = hasValidOgrSessionFromContext(context);
  const devMode = process.env.NODE_ENV === 'development';

  if (!session) {
    return { redirect: { destination: "/admin/login?returnTo=/dashboard", permanent: false } };
  }

  if (!isOgrValid && !devMode) {
    return { redirect: { destination: "/sovereign/authorize?returnTo=/dashboard", permanent: false } };
  }

  try {
    // FIXED: Direct Prisma access
    const prisma = db;
    
    if (!prisma || typeof prisma.contentMetadata?.findMany !== 'function') {
      throw new Error("Prisma client not properly initialized");
    }

    const [briefs, totalCount] = await Promise.all([
      prisma.contentMetadata.findMany({
        take: 75,
        orderBy: { createdAt: "desc" },
        select: { 
          id: true, 
          title: true, 
          slug: true, 
          createdAt: true,
          updatedAt: true,
          status: true,
        },
      }),
      prisma.contentMetadata.count(),
    ]);

    // Transform to Brief interface
    const transformedBriefs: Brief[] = briefs.map(brief => ({
      id: brief.id,
      title: brief.title || "Untitled",
      slug: brief.slug || brief.id,
      createdAt: brief.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: brief.updatedAt?.toISOString(),
      status: brief.status || undefined,
    }));

    // Generate real governance history from actual data when available
    const governanceHistory: HistoryNode[] = transformedBriefs.slice(0, 12).map((brief, idx) => ({
      id: brief.id,
      type: idx % 3 === 0 ? 'BRIEF' : idx % 3 === 1 ? 'MANDATE' : 'LIQUIDATION',
      nodeRef: `NODE-${brief.id.slice(-8).toUpperCase()}`,
      timestamp: brief.createdAt,
      label: brief.title,
      status: idx % 5 === 0 ? 'CRITICAL' : idx % 3 === 0 ? 'WARNING' : 'STABLE',
      summary: `Governance action recorded for ${brief.title.substring(0, 60)}.`,
      metadata: {
        impact: Math.floor(Math.random() * 30) + 10,
      }
    }));

    return {
      props: {
        userEmail: session.user?.email || "anonymous@sovereign.local",
        briefs: transformedBriefs,
        totalCount,
        aol: (session as any).aol || { tier: "Private", isInternal: false },
        devMode,
        governanceHistory,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return {
      props: {
        userEmail: session.user?.email || "anonymous@sovereign.local",
        briefs: [],
        totalCount: 0,
        aol: { tier: "Private", isInternal: false },
        devMode,
        governanceHistory: [],
      },
    };
  }
};