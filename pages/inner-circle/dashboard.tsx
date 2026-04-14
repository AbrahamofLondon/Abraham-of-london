/* pages/inner-circle/dashboard.tsx — Member Dashboard (Enterprise-Grade) */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  Lock,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingUp,
  Zap,
  Fingerprint,
  FileText,
} from "lucide-react";

import { allBriefs } from "contentlayer/generated";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { prisma } from "@/lib/prisma";

import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import { useRouter } from "next/router";

interface DashboardProps {
  access: {
    hasAccess: boolean;
    userId?: string | null;
    tier: string;
    email?: string | null;
  };
  initialData: {
    content: any[];
    diagnostics: any[];
    stats: {
      total: number;
      diagnostics: number;
      reportsReady: number;
    };
    user: {
      name: string;
      tier: string;
      lastLogin: string;
    };
  };
  error?: string;
}

export default function InnerCircleDashboard({ access, initialData, error }: DashboardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const filteredContent = React.useMemo(() => {
    if (!initialData?.content) return [];
    if (!searchTerm) return initialData.content;
    const term = searchTerm.toLowerCase();
    return initialData.content.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.excerpt?.toLowerCase().includes(term) ||
        item.kind?.toLowerCase().includes(term),
    );
  }, [searchTerm, initialData.content]);

  const filteredDiagnostics = React.useMemo(() => {
    if (!initialData?.diagnostics) return [];
    if (!searchTerm) return initialData.diagnostics;
    const term = searchTerm.toLowerCase();
    return initialData.diagnostics.filter(
      (item) =>
        item.title?.toLowerCase().includes(term) ||
        item.kind?.toLowerCase().includes(term) ||
        item.diagnosticRef?.toLowerCase().includes(term) ||
        item.respondentName?.toLowerCase().includes(term) ||
        item.organisation?.toLowerCase().includes(term),
    );
  }, [searchTerm, initialData.diagnostics]);

  const handleRefresh = () => {
    setLoading(true);
    router.reload();
  };

  if (error) {
    return (
      <Layout title="Vault Error | Abraham of London">
        <div>
          <div>
            <ShieldCheck />
            <h1>Vault Sync Error</h1>
            <p>{error}</p>
            <button
              onClick={handleRefresh}
             
            >
              Retry Protocol Connection
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout
        title="Member Dashboard | Abraham of London"
        currentPath="/inner-circle/dashboard"
       
      >
        <div>
          <WorkspaceNav />
          <header>
            <div>
              <div>
                <span>
                  {access.tier} Clearance
                </span>
                <span>
                  Sync: {initialData.user.lastLogin ? new Date(initialData.user.lastLogin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                </span>
              </div>

              <h1>
                The Kingdom <span>Vault.</span>
              </h1>
              <p>
                Welcome back, <span>{initialData.user.name}</span>.
                Your restricted manuscripts and diagnostic records now sit in the same operating surface.
              </p>
            </div>

            <div>
              <Link
                href="/inner-circle/account"
               
              >
                My Account
              </Link>
              <button
                onClick={handleRefresh}
                disabled={loading}
               
              >
                <RefreshCw size={18} className={`${loading ? "animate-spin text-blue-600" : "group-hover:rotate-180 transition-transform duration-500"}`} />
              </button>
            </div>
          </header>

          <section>
            <StatTile label="Briefs Available" val={initialData.stats.total} icon={BookOpen} />
            <StatTile label="Diagnostics" val={initialData.stats.diagnostics} icon={Fingerprint} />
            <StatTile label="Reports Ready" val={initialData.stats.reportsReady} icon={FileText} />
            <StatTile label="Vault Tier" val={access.tier.toUpperCase()} icon={ShieldCheck} />
          </section>

          <div>
            <Search size={18} />
            <input
              type="text"
              placeholder="Filter manuscripts and diagnostic records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
             
            />
          </div>

          <div>
            <div>
              <section>
                <div>
                  <h2>Diagnostic Records</h2>
                  <Link
                    href="/diagnostics"
                   
                  >
                    New Diagnostic <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Diagnostics Grid */}
                <div>
                  {initialData.content.length > 0 ? (
                    initialData.content.map((item, i) => (
                      <Link
                        key={item.diagnosticRef || i}
                        href={item.href}
                       
                      >
                        <div>
                          <ArrowRight />
                        </div>

                        <div>
                          <span>
                            {item.kind}
                          </span>
                          <span>
                            {item.reportStatus}
                          </span>
                        </div>

                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {item.excerpt}
                        </p>

                        <div>
                          Ref: {item.diagnosticRef}
                        </div>

                        <div>
                          <span>{item.date}</span>
                          <span>{item.readTime}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div>
                      <Lock size={32} />
                      <p>
                        No reports found matching your query.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div>
                  <h2>Restricted Manuscripts</h2>
                </div>

                <div>
                  {filteredContent.length > 0 ? (
                    filteredContent.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                       
                      >
                        <div>
                          <ArrowRight />
                        </div>
                        <div>
                          <span>
                            {item.kind}
                          </span>
                        </div>
                        <h3>
                          {item.title}
                        </h3>
                        <p>{item.excerpt}</p>
                        <div>
                          <span>{item.date}</span>
                          <span>{item.readTime}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div>
                      <Lock size={32} />
                      <p>No manuscripts found matching your query.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside>
              <div>
                <div></div>
                <h3>Institutional Advisory</h3>
                <p>
                  Direct access for board-level diagnostics, report review, or strategic escalation.
                </p>
                <Link href="/consulting/strategy-room">
                  Enter Strategy Room
                </Link>
              </div>

              <div>
                <h3>
                  <TrendingUp size={14} /> System Rhythms
                </h3>
                <div>
                  <RhythmItem label="Next Salon" val="Feb 2026" />
                  <RhythmItem label="Intel Cycle" val="Active" />
                  <RhythmItem label="Diagnostic Loop" val="Closed" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

const StatTile = ({ label, val, icon: Icon }: any) => (
  <div>
    <div>
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <span>{label}</span>
    <div>{val}</div>
  </div>
);

const RhythmItem = ({ label, val }: any) => (
  <div>
    <span>{label}</span>
    <span>{val}</span>
  </div>
);

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // AL token cookie presence is enforced by middleware.ts (Tier 2).
    // By the time this handler runs, the cookie is guaranteed to exist.
    const sessionId = readAccessCookie(context.req as any) || "";

    const ctx = await getSessionContext(sessionId);

    if (!ctx.ok || !ctx.valid) {
      return { redirect: { destination: "/inner-circle", permanent: false } };
    }

    const required = "inner-circle";
    if (!tierAtLeast(ctx.tier, required)) {
      return { redirect: { destination: "/inner-circle/locked", permanent: false } };
    }

    const userEmail = ctx.email || null;

    // ✅ PROPER GRANT-BASED DIAGNOSTIC FETCH
    let diagnostics: any[] = [];

    if (userEmail) {
      // Step 1: Get grants for this user
      const grants = await prisma.diagnosticArtifactAccessGrant.findMany({
        where: { granteeEmail: userEmail },
        select: { artifactId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      if (grants.length > 0) {
        const artifactIds = grants.map(g => g.artifactId);
        
        // Step 2: Fetch artifacts from grants
        const artifacts = await prisma.diagnosticArtifact.findMany({
          where: { id: { in: artifactIds } },
          orderBy: { createdAt: "desc" },
          take: 12,
        });

        diagnostics = artifacts.map((artifact) => ({
          diagnosticRef: artifact.diagnosticRef,
          title: artifact.fileName || "Diagnostic Report",
          kind: "diagnostic",
          excerpt: "Structured diagnostic report.",
          href: `/inner-circle/reports/${encodeURIComponent(artifact.diagnosticRef)}`,
          date: artifact.createdAt
            ? new Date(artifact.createdAt).toLocaleDateString("en-GB", {
                month: "short",
                year: "numeric",
              })
            : "2026",
          readTime: artifact.version ? `v${artifact.version}` : "draft",
          reportStatus: artifact.isRevoked ? "pending" : "generated",
        }));
      }
    }

    // ✅ CONTENT QUERY ALIGNED TO SCHEMA (uses summary, not excerpt)
    const content = allBriefs
      .filter((b) => (b as any).status === "published" || process.env.NODE_ENV === "development")
      .sort((a, b) => new Date(String((b as any).date ?? "")).getTime() - new Date(String((a as any).date ?? "")).getTime())
      .map((b) => {
        const ab = b as any;
        return {
          title: String(ab.title ?? ""),
          kind: String(ab.category ?? "Briefing"),
          excerpt: String(ab.summary ?? ab.excerpt ?? "Institutional strategic summary."),
          href: `/inner-circle/briefs/${ab._raw?.flattenedPath ?? ""}`,
          date: ab.date ? new Date(ab.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "2026",
          readTime: ab.readingTime?.text ?? "12m",
        };
      });

    return {
      props: {
        access: {
          hasAccess: true,
          userId: ctx.memberId || null,
          tier: ctx.tier || "public",
          email: userEmail,
        },
        initialData: {
          content: diagnostics,
          diagnostics: diagnostics,
          stats: {
            total: content.length,
            diagnostics: diagnostics.length,
            reportsReady: diagnostics.filter((d) => d.reportStatus === "generated").length,
          },
          user: {
            name: ctx.name || "Member",
            tier: ctx.tier || "public",
            lastLogin: ctx.expiresAt || new Date().toISOString(),
          },
        },
      },
    };
  } catch (err) {
    console.error("[VAULT_FATAL]:", err);
    return { props: { error: "Institutional Vault connectivity lost. Systems re-aligning." } };
  }
};




