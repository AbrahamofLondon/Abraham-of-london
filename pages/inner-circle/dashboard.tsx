/* pages/inner-circle/dashboard.tsx — Member Dashboard (Enterprise-Grade) */

import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";


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
    diagnostics: any[];
    briefs: any[];
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

  if (error) {
    return (
      <Layout title="Vault Error | Abraham of London">
        <div>
          <div>
            <ShieldCheck />
            <h1>Vault Sync Error</h1>
            <p>{error}</p>
            <button onClick={() => router.reload()}>
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
       
      >
        <div className="min-h-screen bg-[rgb(3,3,5)] text-white">
          <WorkspaceNav />
          <div className="mx-auto max-w-5xl px-6 pb-16 pt-20 lg:px-12 lg:pb-20">
            <header className="max-w-3xl">
              <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
                INNER CIRCLE · CHAMBER MODE
              </p>
              <h1 className="mt-5 font-serif text-[clamp(2rem,4vw,3rem)] font-light italic leading-[0.95] text-white/92">
                The workspace.
              </h1>
              <p className="mt-4 font-mono text-[7.5px] uppercase tracking-[0.12em] text-white/48">
                Active session · {initialData.user.name} · {access.tier}
              </p>
            </header>

            <div className="mt-12 space-y-12">
              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Diagnostic Records
                </h2>
                <div className="mt-4 border-t border-white/8">
                  {initialData.diagnostics.length > 0 ? (
                    initialData.diagnostics.map((item, i) => (
                      <Link
                        key={item.diagnosticRef || i}
                        href={item.href}
                        className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                      >
                        <span>
                          {item.title || item.date} · {item.reportStatus}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                          → View
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="border-b border-white/6 py-3 text-sm text-white/32">
                      No diagnostic records available.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Restricted Manuscripts
                </h2>
                <div className="mt-4 border-t border-white/8">
                  {initialData.briefs.length > 0 ? (
                    initialData.briefs.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          {item.restricted ? <Lock size={14} className="text-white/34" /> : null}
                          {item.title} · {item.accessTier}
                        </span>
                        <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                          → Read
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="border-b border-white/6 py-3 text-sm text-white/32">
                      No manuscripts available at your access tier.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="font-mono text-[7.5px] uppercase tracking-[0.28em] text-white/38">
                  Quick Actions
                </h2>
                <div className="mt-4 border-t border-white/8">
                  <Link
                    href="/purpose-alignment"
                    className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                  >
                    <span>New diagnostic</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                      → Open
                    </span>
                  </Link>
                  <Link
                    href="/strategy-room"
                    className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                  >
                    <span>Strategy Room</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                      → Open
                    </span>
                  </Link>
                  <Link
                    href="/inner-circle/account"
                    className="flex items-center justify-between border-b border-white/6 py-3 text-sm text-white/72 transition-colors hover:text-white"
                  >
                    <span>Account settings</span>
                    <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/38">
                      → Manage
                    </span>
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Server-only modules loaded dynamically (Wave 4 boundary enforcement).
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
    // Per-kind helper — avoids bundling `contentlayer/generated`.
    const { getAllBriefs } = await import("@/lib/content/server");
    const allBriefs = (getAllBriefs() || []) as any[];
    const briefs = allBriefs
      .filter((b) => (b as any).status === "published" || process.env.NODE_ENV === "development")
      .filter((b) => {
        const tier = String((b as any).accessTier ?? "public").toLowerCase();
        if (tier === "public") return true;
        return tierAtLeast(ctx.tier, "inner-circle");
      })
      .sort((a, b) => new Date(String((b as any).date ?? "")).getTime() - new Date(String((a as any).date ?? "")).getTime())
      .map((b) => {
        const ab = b as any;
        return {
          title: String(ab.title ?? ""),
          accessTier: String(ab.accessTier ?? "inner-circle"),
          href: `/inner-circle/briefs/${ab._raw?.flattenedPath ?? ""}`,
          restricted: String(ab.accessTier ?? "inner-circle").toLowerCase() !== "public",
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
          diagnostics: diagnostics,
          briefs,
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




