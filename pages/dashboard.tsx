/* pages/dashboard.tsx — UNIFIED SOVEREIGN DASHBOARD (ENTERPRISE-GRADE, SCHEMA-ALIGNED) */
import * as React from "react";
import Link from "next/link";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import dynamic from "next/dynamic";
import {
  ChevronRight,
  Fingerprint,
  Zap,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Heart,
  Briefcase,
  ArrowRight,
  Activity,
  FileText,
  Brain,
  Target,
  Crown,
  Clock,
  CreditCard,
} from "lucide-react";

import Layout from "@/components/Layout";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { OGR_CLIENT_CONFIG } from "@/lib/ogr/client-config";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

/* -------------------------------------------------------------------------- */
/* DYNAMIC PANELS                                                             */
/* -------------------------------------------------------------------------- */

const PdfAnalyticsWidget = dynamic(
  () =>
    import("@/components/dashboard/PdfAnalyticsWidget").then(
      (mod) => mod.PdfAnalyticsWidget
    ),
  {
    ssr: false,
    loading: () => <div className="h-32 animate-pulse rounded-sm bg-white/5" />,
  }
);

const SovereignDashboard = dynamic(
  () =>
    import("@/lib/components/ai/SovereignDashboard").then(
      (mod) => mod.SovereignDashboard
    ),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-sm bg-white/5" />,
  }
);

const BillingEntitlementsPanel = dynamic(
  () =>
    import("@/components/dashboard/BillingEntitlementsPanel").then(
      (mod) => mod.default
    ),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-sm bg-white/5" />,
  }
);

const DiagnosticLineagePanel = dynamic(
  () =>
    import("@/components/dashboard/DiagnosticLineagePanel").then(
      (mod) => mod.default
    ),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-sm bg-white/5" />,
  }
);

const MyReportsPanel = dynamic(
  () =>
    import("@/components/dashboard/MyReportsPanel").then(
      (mod) => mod.MyReportsPanel
    ),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-sm bg-white/5" />,
  }
);

const AdminJobsPanel = dynamic(
  () =>
    import("@/components/dashboard/AdminJobsPanel").then(
      (mod) => mod.AdminJobsPanel
    ),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-sm bg-white/5" />,
  }
);

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface Brief {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  createdAt: string;
  category?: string | null;
}

interface ReportItem {
  id: string;
  diagnosticRef: string;
  fileName: string;
  version: string;
  createdAt: string;
  downloadUrl: string;
  status: string;
  kind: string;
  retentionClass?: string | null;
}

interface EntitlementItem {
  productCode: string;
  tier: string;
  status: string;
  endsAt?: string | null;
}

interface LineageItem {
  id: string;
  eventType: string;
  version?: string | null;
  actor?: string | null;
  createdAt: string;
}

interface DashboardProps {
  briefs: Brief[];
  totalCount: number;
  userEmail: string;
  aol: {
    tier: string;
    isInternal: boolean;
  };
  featuredBriefs: Brief[];
  recentBriefs: Brief[];
  dealFlowStats: {
    strategy: number;
    avg: number;
    ai?: {
      highQualityDeals: number;
      avgAiConfidence: number;
    };
    submissions: Array<{
      id: string;
      score: number;
      route: string;
      aiScore: number | null;
      aiConfidence: number | null;
      aiDealQuality: string | null;
    }>;
  } | null;
  entitlements: EntitlementItem[];
  lineageEvents: LineageItem[];
  reports: ReportItem[];
  innerCircle: {
    hasValidToken: boolean;
    tier: string;
    expiresAt: string | null;
  };
}

/* -------------------------------------------------------------------------- */
/* SECURITY                                                                   */
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

function hasValidOgrSessionFromContext(
  context: GetServerSidePropsContext
): boolean {
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

function resolveAuthenticatedEmail(session: any): string {
  const primary = String(session?.user?.email || "")
    .trim()
    .toLowerCase();

  if (primary) return primary;

  const allowedFallbacks = [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com",
  ];

  if (process.env.NODE_ENV === "development") {
    return allowedFallbacks[1]!;
  }

  throw new Error("AUTH_EMAIL_MISSING");
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function safeJsonArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeString(value: unknown, fallback = ""): string {
  const s = typeof value === "string" ? value.trim() : "";
  return s || fallback;
}

function formatUserNameFromEmail(email: string): string {
  const stem = safeString(email.split("@")[0], "Client");
  return stem.charAt(0).toUpperCase() + stem.slice(1);
}

function Divider() {
  return (
    <div className="my-12 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="h-1 w-1 rounded-full bg-[#8A6A2F]/30" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-px w-8 bg-[#8A6A2F]" />
        <Icon className="h-4 w-4 text-[#8A6A2F]" />
        <span className="text-[9px] font-semibold uppercase tracking-[0.3em] text-[#8A6A2F]">
          {title}
        </span>
      </div>
      {description ? (
        <p className="max-w-2xl text-sm text-white/40">{description}</p>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ElementType;
}) {
  return (
    <div className="border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-[#8A6A2F]/20">
      <div className="mb-3 flex items-start justify-between">
        <Icon className="h-4 w-4 text-[#8A6A2F]/60" />
        {typeof trend === "number" ? (
          <span
            className={`text-[8px] font-mono ${
              trend >= 0 ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {trend >= 0 ? "+" : ""}
            {trend}%
          </span>
        ) : null}
      </div>
      <p className="text-3xl font-light tracking-tight text-white">{value}</p>
      <p className="mt-1 text-[8px] uppercase tracking-wider text-white/30">
        {label}
      </p>
    </div>
  );
}

function BriefRow({ brief, index }: { brief: Brief; index: number }) {
  return (
    <Link
      href={`/strategy/${brief.slug}`}
      className="group flex items-center justify-between border-b border-white/5 py-4 transition-all hover:border-[#8A6A2F]/20"
    >
      <div className="flex flex-1 items-center gap-4">
        <span className="w-8 text-[9px] font-mono text-white/20 transition-colors group-hover:text-[#8A6A2F]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-light tracking-tight text-white/80 transition-colors group-hover:text-white">
            {brief.title}
          </h3>
          {brief.excerpt ? (
            <p className="line-clamp-1 text-[10px] text-white/30 transition-colors group-hover:text-white/50">
              {brief.excerpt}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-white/20">
            {new Date(brief.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <ChevronRight className="h-3 w-3 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-[#8A6A2F]" />
        </div>
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 pt-12">
      <div className="mb-4 flex items-center gap-2">
        <Fingerprint className="h-3 w-3 text-[#8A6A2F]" />
        <span className="text-[8px] uppercase tracking-[0.3em] text-white/40">
          Sovereign Protocol
        </span>
      </div>
      <p className="max-w-xl text-[10px] leading-relaxed text-white/40">
        Institutional intelligence for leaders, builders, and institutions that
        intend to endure.
      </p>
      <div className="mt-6 border-t border-white/5 pt-6 text-center">
        <p className="text-[6px] tracking-wider text-white/20">
          © {new Date().getFullYear()} ABRAHAM OF LONDON • Protocol{" "}
          {OGR_CLIENT_CONFIG.protocolVersion}
        </p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

export default function UnifiedDashboard({
  totalCount,
  userEmail,
  aol,
  featuredBriefs,
  recentBriefs,
  dealFlowStats,
  entitlements,
  lineageEvents,
  reports,
  innerCircle,
}: DashboardProps) {
  const [liveResonance, setLiveResonance] = React.useState<number>(82);
  const [isLoadingMetrics, setIsLoadingMetrics] = React.useState<boolean>(true);

  const userName = React.useMemo(
    () => formatUserNameFromEmail(userEmail),
    [userEmail]
  );

  React.useEffect(() => {
    let active = true;

    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/telemetry/resonance", {
          credentials: "same-origin",
        });

        if (!response.ok) throw new Error("TELEMETRY_FETCH_FAILED");

        const data = await response.json();
        if (!active) return;

        const resonance =
          typeof data?.resonance === "number" && Number.isFinite(data.resonance)
            ? Math.max(0, Math.min(100, Math.round(data.resonance)))
            : 82;

        setLiveResonance(resonance);
      } catch {
        if (active) setLiveResonance(82);
      } finally {
        if (active) setIsLoadingMetrics(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Layout title="Sovereign Registry" className="bg-black">
      <main className="relative min-h-screen overflow-x-hidden bg-black font-sans text-white">
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[url('/grain.png')] opacity-[0.02]" />
          <div className="absolute left-1/2 top-0 h-px w-full max-w-7xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8A6A2F]/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-20 md:px-12">
          <div className="mb-16 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-8">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                <span className="text-[8px] uppercase tracking-[0.3em] text-white/30">
                  Secure Session • Sovereign Node
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight text-white">
                {userName}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-emerald-500">
                  {aol.isInternal ? "Directorate" : "Inner Circle"}
                </span>
              </div>
              <div className="flex items-center gap-2 border border-[#8A6A2F]/20 bg-[#8A6A2F]/5 px-3 py-1.5">
                <Zap className="h-2.5 w-2.5 text-[#8A6A2F]" />
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] text-[#8A6A2F]">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="mb-20">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-[#8A6A2F]" />
                <span className="text-[8px] uppercase tracking-[0.3em] text-[#8A6A2F]">
                  Sovereign Intelligence
                </span>
              </div>

              <h1 className="mb-4 text-5xl font-light leading-[1.1] tracking-tight text-white md:text-6xl">
                The Architecture of
                <br />
                <span className="font-serif italic text-[#8A6A2F]">
                  Sovereign
                </span>{" "}
                Intelligence
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-white/40">
                A disciplined framework for institutional clarity, strategic
                execution, and enduring governance.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 bg-white px-5 py-2.5 text-[9px] uppercase tracking-wider text-black transition-all hover:bg-[#8A6A2F] hover:text-white"
                >
                  Explore Doctrine
                  <ArrowRight className="h-3 w-3" />
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="inline-flex items-center gap-2 border border-white/20 px-5 py-2.5 text-[9px] uppercase tracking-wider text-white/70 transition-all hover:border-[#8A6A2F] hover:text-[#8A6A2F]"
                >
                  Strategy Room
                </Link>
              </div>
            </div>
          </div>

          <SectionHeader
            icon={Activity}
            title="Command Center"
            description="Real-time institutional metrics and intelligence"
          />

          <div className="mb-20 grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard
              label="Systemic Resonance"
              value={isLoadingMetrics ? "--" : `${liveResonance}%`}
              trend={3}
              icon={Target}
            />
            <StatCard label="Active Briefs" value={totalCount} icon={BookOpen} />
            <StatCard
              label="Deal Flow"
              value={dealFlowStats?.strategy || 0}
              trend={12}
              icon={Briefcase}
            />
          </div>

          <div className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] uppercase tracking-wider text-white/40">
                  Systemic Resonance
                </span>
              </div>
              <div className="py-2 text-center">
                <div className="mb-2 text-4xl font-light tracking-tight text-white">
                  {isLoadingMetrics ? "--" : liveResonance}%
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-[#8A6A2F] transition-all duration-500"
                    style={{
                      width: `${isLoadingMetrics ? 0 : liveResonance}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-3.5 w-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] uppercase tracking-wider text-white/40">
                  Human Capital
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-[7px] text-white/30">Burnout Index</p>
                  <p className="text-2xl font-light text-white">
                    42<span className="text-xs text-white/40">%</span>
                  </p>
                </div>
                <div>
                  <p className="text-[7px] text-white/30">Utilization</p>
                  <p className="text-2xl font-light text-white">
                    68<span className="text-xs text-white/40">%</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] uppercase tracking-wider text-white/40">
                  Asset Intelligence
                </span>
              </div>
              <PdfAnalyticsWidget />
            </div>
          </div>

          {/* My Access Panel — reads from getUnifiedSession-equivalent data */}
          <div className="mb-12 border border-white/10 bg-white/[0.02] p-6">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[#8A6A2F]" />
              <span className="text-[8px] uppercase tracking-wider text-white/40">
                My Access
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-white/30 mb-2">
                  Identity Tier
                </div>
                <div className="text-sm font-bold text-white uppercase">
                  {aol.tier}
                </div>
              </div>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-white/30 mb-2">
                  Inner Circle Token
                </div>
                <div
                  className={`text-sm font-bold uppercase ${
                    innerCircle.hasValidToken ? "text-emerald-400" : "text-white/40"
                  }`}
                >
                  {innerCircle.hasValidToken ? "Active" : "Inactive"}
                </div>
              </div>
              <div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-white/30 mb-2">
                  Token Expires
                </div>
                <div className="text-sm font-mono text-white/80">
                  {innerCircle.expiresAt
                    ? new Date(innerCircle.expiresAt).toLocaleDateString()
                    : "—"}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/inner-circle/account"
                className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                Manage Access Key
                <ArrowRight className="h-3 w-3" />
              </Link>

              {innerCircle.hasValidToken && (
                <Link
                  href="/inner-circle/dashboard"
                  className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-4 py-2 text-[9px] font-black uppercase tracking-widest text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Inner Circle Vault
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}

              {aol.isInternal && (
                <Link
                  href="/inner-circle/admin/dashboard"
                  className="inline-flex items-center gap-2 border border-[#8A6A2F]/40 bg-[#8A6A2F]/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[#E7C16B] hover:bg-[#8A6A2F]/20 transition-colors"
                >
                  Directorate Command
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          <SectionHeader
            icon={CreditCard}
            title="Client Entitlements & Chain of Custody"
            description="Active subscriptions, grants, and report visibility"
          />

          <div className="mb-20 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <BillingEntitlementsPanel
              email={userEmail}
              entitlements={entitlements}
            />
            <DiagnosticLineagePanel events={lineageEvents} />
            <MyReportsPanel />
          </div>

          {aol.isInternal ? (
            <div className="mb-20">
              <SectionHeader
                icon={Crown}
                title="Admin Controls"
                description="Processing and retention controls"
              />
              <AdminJobsPanel />
            </div>
          ) : null}

          {dealFlowStats && dealFlowStats.submissions?.length > 0 ? (
            <div className="mb-20">
              <SectionHeader
                icon={Brain}
                title="Deal Intelligence"
                description="Institutional assessment of qualified opportunities"
              />
              <div className="border border-white/10 bg-white/[0.02] p-6">
                <SovereignDashboard
                  result={{
                    route: "STRATEGY",
                    priority: "SOVEREIGN",
                    fusedScore: dealFlowStats.avg || 75,
                    routeConfidence: dealFlowStats.ai?.avgAiConfidence || 70,
                    temperature: "HOT",
                    rationale: [
                      `${dealFlowStats.strategy} chamber-qualified opportunities identified`,
                      `${dealFlowStats.ai?.highQualityDeals || 0} high-quality institutional signals`,
                      "Active deal flow with strategic alignment indicators",
                    ],
                  }}
                  input={{
                    ruleScore: dealFlowStats.avg || 75,
                    aiScore: dealFlowStats.avg || 75,
                    authority: true,
                    problem: "Institutional pipeline analysis",
                    urgency: "Active",
                    revenue: 1000000,
                  }}
                />
              </div>
            </div>
          ) : null}

          {featuredBriefs.length > 0 ? (
            <>
              <SectionHeader icon={TrendingUp} title="Featured Intelligence" />
              <div className="mb-20 grid grid-cols-1 gap-5 md:grid-cols-2">
                {featuredBriefs.slice(0, 2).map((brief) => (
                  <Link
                    key={brief.id}
                    href={`/strategy/${brief.slug}`}
                    className="group border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-[#8A6A2F]/30"
                  >
                    <h3 className="mb-2 text-lg font-light tracking-tight text-white transition-colors group-hover:text-[#8A6A2F]">
                      {brief.title}
                    </h3>
                    {brief.excerpt ? (
                      <p className="line-clamp-2 text-xs text-white/40 transition-colors group-hover:text-white/60">
                        {brief.excerpt}
                      </p>
                    ) : null}
                  </Link>
                ))}
              </div>
            </>
          ) : null}

          <SectionHeader icon={Clock} title="Recent Intelligence" />
          <div className="mb-20 divide-y divide-white/5">
            {recentBriefs.slice(0, 8).map((brief, idx) => (
              <BriefRow key={brief.id} brief={brief} index={idx} />
            ))}
          </div>

          <Divider />
          <Footer />
        </div>
      </main>
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */
/* SERVER                                                                     */
/* -------------------------------------------------------------------------- */

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (
  context
) => {
  // NextAuth session enforcement is handled by middleware.ts (Tier 1).
  // By the time this handler runs, the session is guaranteed to exist.
  const session = await getServerSession(context.req, context.res, authOptions);
  const isOgrValid = hasValidOgrSessionFromContext(context);

  // OGR is a secondary gate that is NOT migrated to middleware — it
  // remains as a page-level redirect until the operator decides its fate.
  if (!isOgrValid) {
    return {
      redirect: {
        destination: "/sovereign/authorize?returnTo=/dashboard",
        permanent: false,
      },
    };
  }

  // Resolve Inner Circle entitlement state alongside NextAuth identity.
  // This mirrors what lib/auth/session-helpers.ts#getUnifiedSession returns,
  // integrated inline so the dashboard's existing complex auth flow can
  // consume the signal without a second getServerSession pass.
  let innerCircleState: DashboardProps["innerCircle"] = {
    hasValidToken: false,
    tier: "public",
    expiresAt: null,
  };
  try {
    const cookieValue = readAccessCookie(context.req as any);
    if (cookieValue) {
      const ctx = await getSessionContext(cookieValue);
      if (ctx.ok && ctx.valid) {
        innerCircleState = {
          hasValidToken: true,
          tier: ctx.tier ?? "public",
          expiresAt: ctx.expiresAt ?? null,
        };
      }
    }
  } catch {
    // Fall through to default — never block dashboard on Inner Circle state.
  }

  try {
    const userEmail = resolveAuthenticatedEmail(session);
    const normalizedEmail = userEmail.toLowerCase();

    const entitlementsRaw = await prisma.clientEntitlement.findMany({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const entitlements: EntitlementItem[] = entitlementsRaw.map((e) => ({
      productCode: e.productCode,
      tier: e.tier,
      status: e.status,
      endsAt: e.endsAt ? e.endsAt.toISOString() : null,
    }));

    const grantsRaw = await prisma.diagnosticArtifactAccessGrant.findMany({
      where: {
        granteeEmail: normalizedEmail,
        status: { in: ["active", "expired", "revoked"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const artifactIds = Array.from(
      new Set(grantsRaw.map((g) => g.artifactId).filter(Boolean))
    );

    const diagnosticRefs = Array.from(
      new Set(grantsRaw.map((g) => g.diagnosticRef).filter(Boolean))
    );

    const artifactsRaw =
      artifactIds.length > 0
        ? await prisma.diagnosticArtifact.findMany({
            where: {
              id: { in: artifactIds },
            },
            orderBy: { createdAt: "desc" },
          })
        : [];

    const artifactsById = new Map(artifactsRaw.map((a) => [a.id, a]));

    const reports: ReportItem[] = (grantsRaw
      .map((grant) => {
        const artifact = artifactsById.get(grant.artifactId);
        if (!artifact) return null;

        return {
          id: artifact.id,
          diagnosticRef: artifact.diagnosticRef,
          fileName: artifact.fileName,
          version: artifact.version,
          createdAt: artifact.createdAt.toISOString(),
          downloadUrl: `/api/diagnostics/reports/download/${artifact.id}`,
          status: grant.status,
          kind: String(artifact.kind),
          retentionClass: artifact.retentionClass,
        };
      })
      .filter((item) => item !== null) as ReportItem[]);

    const lineageEventsRaw =
      diagnosticRefs.length > 0
        ? await prisma.diagnosticLineageEvent.findMany({
            where: {
              diagnosticRef: { in: diagnosticRefs },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [];

    const lineageEvents: LineageItem[] = lineageEventsRaw.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      version: e.version,
      actor: e.actor,
      createdAt: e.createdAt.toISOString(),
    }));

    const allContent = await prisma.contentMetadata.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        summary: true,
        createdAt: true,
        contentType: true,
        metadata: true,
      },
    });

    const briefs: Brief[] = allContent.map((b) => {
      const metadata = (b.metadata || {}) as Record<string, unknown>;
      const category =
        safeString(metadata.category) ||
        safeString(metadata.series) ||
        safeString(b.contentType, "Brief");

      return {
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.summary || null,
        createdAt: b.createdAt.toISOString(),
        category,
      };
    });

    const totalCount = await prisma.contentMetadata.count();

    const featuredBriefs = briefs
      .filter((b) => {
        const title = b.title.toLowerCase();
        const category = safeString(b.category).toLowerCase();
        return category.includes("featured") || title.includes("strategic");
      })
      .slice(0, 2);

    const recentBriefs = briefs.slice(0, 8);

    let dealFlowStats: DashboardProps["dealFlowStats"] = null;

    try {
      const submissions = await prisma.dealFlowSubmission.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          score: true,
          route: true,
          aiScore: true,
          aiConfidence: true,
          aiDealQuality: true,
        },
      });

      if (submissions.length > 0) {
        const strategy = submissions.filter(
          (s) => safeString(s.route).toUpperCase() === "STRATEGY"
        ).length;

        const avg =
          submissions.reduce((acc, s) => acc + (s.score || 0), 0) /
          submissions.length;

        const highQualityDeals = submissions.filter((s) =>
          ["ELITE", "HIGH"].includes(
            safeString(s.aiDealQuality).toUpperCase()
          )
        ).length;

        const avgAiConfidence =
          submissions.reduce((acc, s) => acc + (s.aiConfidence || 0), 0) /
          submissions.length;

        dealFlowStats = {
          strategy,
          avg,
          ai: {
            highQualityDeals,
            avgAiConfidence: Math.round(avgAiConfidence * 100),
          },
          submissions,
        };
      }
    } catch (error) {
      console.warn("[dashboard] Deal flow stats unavailable:", error);
    }

    return {
      props: {
        briefs,
        totalCount,
        userEmail: normalizedEmail,
        featuredBriefs,
        recentBriefs,
        aol: (session as any).aol || {
          tier: "Inner Circle",
          isInternal: false,
        },
        dealFlowStats,
        entitlements,
        lineageEvents,
        reports,
        innerCircle: innerCircleState,
      },
    };
  } catch (error) {
    console.error("[Dashboard Fetch Error]:", error);

    return {
      props: {
        userEmail: "seunadaramola@gmail.com",
        briefs: [],
        totalCount: 0,
        featuredBriefs: [],
        recentBriefs: [],
        aol: { tier: "Inner Circle", isInternal: false },
        innerCircle: innerCircleState,
        dealFlowStats: null,
        entitlements: [],
        lineageEvents: [],
        reports: [],
      },
    };
  }
};