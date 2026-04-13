/* pages/dev/dashboard.tsx — DEVELOPMENT DASHBOARD (No Auth Gates) */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import Link from "next/link";
import type { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  ChevronRight,
  Fingerprint,
  Zap,
  BookOpen,
  ShieldCheck,
  Heart,
  Briefcase,
  Sparkles,
  ArrowRight,
  Activity,
  FileText,
  Brain,
  Target,
  Compass,
  Crown,
  Scale,
  Clock,
} from "lucide-react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";

// Import prisma for data fetching
import { prisma } from "@/lib/prisma";

// Dynamically import widgets
const PdfAnalyticsWidget = dynamic(
  () => import("@/components/dashboard/PdfAnalyticsWidget").then(mod => mod.PdfAnalyticsWidget),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-white/5 rounded-sm" /> }
);

const SovereignDashboard = dynamic(
  () => import("@/lib/components/ai/SovereignDashboard").then(mod => mod.SovereignDashboard),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-white/5 rounded-sm" /> }
);

interface Brief {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  createdAt: string;
  category?: string;
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
  dealFlowStats?: any;
}

/* -------------------------------------------------------------------------- */
/* STATELESS COMPONENTS                                                       */
/* -------------------------------------------------------------------------- */

function Divider() {
  return (
    <div className="flex items-center gap-3 my-12">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="h-1 w-1 rounded-full bg-[#8A6A2F]/30" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function SectionHeader({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType; 
  title: string; 
  description?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-px w-8 bg-[#8A6A2F]" />
        <Icon className="w-4 h-4 text-[#8A6A2F]" />
        <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#8A6A2F] font-semibold">
          {title}
        </span>
      </div>
      {description && (
        <p className="text-sm text-white/40 max-w-2xl">{description}</p>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  trend, 
  icon: Icon 
}: { 
  label: string; 
  value: string | number; 
  trend?: number; 
  icon: React.ElementType;
}) {
  return (
    <div className="border border-white/5 bg-white/[0.02] p-5 hover:border-[#8A6A2F]/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-4 h-4 text-[#8A6A2F]/60" />
        {trend !== undefined && (
          <span className={`text-[8px] font-mono ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-3xl font-light tracking-tight text-white">{value}</p>
      <p className="text-[8px] font-mono uppercase tracking-wider text-white/30 mt-1">{label}</p>
    </div>
  );
}

function FeatureGrid() {
  const features = [
    { icon: Brain, title: "Institutional Intelligence", description: "Real-time assessment of strategic alignment and execution capacity." },
    { icon: Scale, title: "Governance Architecture", description: "Frameworks for decision hygiene and institutional legitimacy." },
    { icon: Compass, title: "Strategic Navigation", description: "Constraint-aware pathways for high-consequence decisions." },
    { icon: Crown, title: "Sovereign Priority", description: "Elite-level access for qualified institutional operators." },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      {features.map((feature, idx) => {
        const Icon = feature.icon;
        return (
          <div key={idx} className="border-l-2 border-[#8A6A2F]/30 pl-4 py-2">
            <Icon className="w-4 h-4 text-[#8A6A2F] mb-2" />
            <h3 className="text-xs font-medium text-white mb-1">{feature.title}</h3>
            <p className="text-[10px] text-white/40 leading-relaxed">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}

function BriefRow({ brief, index }: { brief: Brief; index: number }) {
  return (
    <Link
      href={`/strategy/${brief.slug}`}
      className="group flex items-center justify-between py-4 border-b border-white/5 hover:border-[#8A6A2F]/20 transition-all"
    >
      <div className="flex items-center gap-4 flex-1">
        <span className="text-[9px] font-mono text-white/20 group-hover:text-[#8A6A2F] transition-colors w-8">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <h3 className="text-sm font-light tracking-tight text-white/80 group-hover:text-white transition-colors">
            {brief.title}
          </h3>
          {brief.excerpt && (
            <p className="text-[10px] text-white/30 group-hover:text-white/50 transition-colors line-clamp-1">
              {brief.excerpt}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-white/20">
            {new Date(brief.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-[#8A6A2F] group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="mt-20 pt-12 border-t border-white/5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Fingerprint className="w-3 h-3 text-[#8A6A2F]" />
            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">Sovereign Protocol</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Institutional intelligence for leaders, builders, and institutions that intend to endure.
          </p>
        </div>
        
        <div>
          <h4 className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/60 mb-3">Registry</h4>
          <ul className="space-y-2">
            <li><Link href="/canon" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Canon</Link></li>
            <li><Link href="/books" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Books</Link></li>
            <li><Link href="/library" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Library</Link></li>
            <li><Link href="/shorts" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Shorts</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/60 mb-3">Architecture</h4>
          <ul className="space-y-2">
            <li><Link href="/resources/strategic-frameworks" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Frameworks</Link></li>
            <li><Link href="/vault" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Vault</Link></li>
            <li><Link href="/resources" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Resources</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/60 mb-3">Engage</h4>
          <ul className="space-y-2">
            <li><Link href="/consulting" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Consulting</Link></li>
            <li><Link href="/consulting/strategy-room" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Strategy Room</Link></li>
            <li><Link href="/contact" className="text-[10px] text-white/40 hover:text-[#8A6A2F] transition-colors">Contact</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-6 border-t border-white/5 text-center">
        <p className="text-[6px] text-white/20 font-mono tracking-wider">
          © {new Date().getFullYear()} ABRAHAM OF LONDON • All Rights Reserved • Development Preview
        </p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN DASHBOARD COMPONENT                                                   */
/* -------------------------------------------------------------------------- */

function DevDashboardComponent({
  briefs,
  totalCount,
  userEmail,
  aol,
  featuredBriefs,
  recentBriefs,
  dealFlowStats,
}: DashboardProps) {
  const [liveResonance, setLiveResonance] = React.useState(82);
  const [isLoadingMetrics, setIsLoadingMetrics] = React.useState(true);
  
  // Extract username from email
  const userName = React.useMemo(() => {
    if (userEmail && userEmail !== "developer@sovereign.internal") {
      const name = userEmail.split("@")[0] ?? "";
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Developer Preview";
  }, [userEmail]);

  React.useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/telemetry/resonance");
        const data = await response.json();
        setLiveResonance(data.resonance || 82);
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      } finally {
        setIsLoadingMetrics(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Sovereign Registry [DEV]" className="bg-black">
      <main className="relative min-h-screen overflow-x-hidden bg-black font-sans text-white">
        {/* Background Texture */}
        <div className="pointer-events-none fixed inset-0 z-0">
          <div className="pointer-events-none absolute inset-0 bg-[url('/grain.png')] opacity-[0.02]" />
          <div className="absolute left-1/2 top-0 h-px w-full max-w-7xl -translate-x-1/2 bg-gradient-to-r from-transparent via-[#8A6A2F]/10 to-transparent" />
        </div>

        {/* Dev Mode Banner */}
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
          <span className="text-[8px] font-mono uppercase tracking-wider text-amber-400">
            🔧 Development Mode • No Authentication Required
          </span>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-28 md:px-12">
          
          {/* Header: User Identity & Status */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-16 pb-8 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/30">
                  Development Session • Sovereign Preview
                </span>
              </div>
              <h1 className="text-3xl font-light tracking-tight text-white">
                {userName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                <span className="font-mono text-[7px] font-bold uppercase tracking-[0.3em] text-emerald-500">
                  Preview Mode
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-[#8A6A2F]/20 bg-[#8A6A2F]/5">
                <Zap className="h-2.5 w-2.5 text-[#8A6A2F]" />
                <span className="font-mono text-[7px] font-bold uppercase tracking-[0.3em] text-[#8A6A2F]">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px w-10 bg-[#8A6A2F]" />
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#8A6A2F]">
                  Sovereign Intelligence
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-light tracking-tight text-white leading-[1.1] mb-4">
                The Architecture of
                <br />
                <span className="font-serif italic text-[#8A6A2F]">Sovereign</span> Intelligence
              </h1>
              <p className="text-sm text-white/40 max-w-xl leading-relaxed">
                A disciplined framework for institutional clarity, strategic execution,
                and enduring governance.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[9px] font-mono uppercase tracking-wider hover:bg-[#8A6A2F] hover:text-white transition-all"
                >
                  Explore Doctrine
                  <ArrowRight className="w-3 h-3" />
                </Link>
                <Link
                  href="/consulting/strategy-room"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white/70 text-[9px] font-mono uppercase tracking-wider hover:border-[#8A6A2F] hover:text-[#8A6A2F] transition-all"
                >
                  Strategy Room
                </Link>
              </div>
            </div>
          </div>

          {/* Intelligence Dashboard - Three-Column Layout */}
          <SectionHeader icon={Activity} title="Command Center" description="Real-time institutional metrics and intelligence" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
            <StatCard label="Systemic Resonance" value={isLoadingMetrics ? "--" : `${liveResonance}%`} trend={3} icon={Target} />
            <StatCard label="Active Briefs" value={totalCount} icon={BookOpen} />
            <StatCard label="Deal Flow" value={dealFlowStats?.strategy || 0} trend={12} icon={Briefcase} />
          </div>

          {/* Live Intelligence Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-20">
            {/* OGR Terminal */}
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-3.5 h-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">Systemic Resonance</span>
              </div>
              <div className="text-center py-2">
                <div className="text-4xl font-light tracking-tight text-white mb-2">
                  {isLoadingMetrics ? "--" : liveResonance}%
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#8A6A2F] transition-all duration-500"
                    style={{ width: `${isLoadingMetrics ? 0 : liveResonance}%` }}
                  />
                </div>
                <Link
                  href="/dashboard/live"
                  className="inline-flex items-center gap-1 mt-4 text-[7px] font-mono uppercase tracking-wider text-white/30 hover:text-[#8A6A2F] transition-colors"
                >
                  Open Terminal <ArrowRight className="w-2 h-2" />
                </Link>
              </div>
            </div>

            {/* Human Capital */}
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-3.5 h-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">Human Capital</span>
              </div>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div>
                  <p className="text-[7px] font-mono text-white/30">Burnout Index</p>
                  <p className="text-2xl font-light text-white">42<span className="text-xs text-white/40">%</span></p>
                </div>
                <div>
                  <p className="text-[7px] font-mono text-white/30">Utilization</p>
                  <p className="text-2xl font-light text-white">68<span className="text-xs text-white/40">%</span></p>
                </div>
              </div>
              <Link
                href="/dashboard/live?view=HCD"
                className="inline-flex items-center gap-1 mt-2 text-[7px] font-mono uppercase tracking-wider text-white/30 hover:text-[#8A6A2F] transition-colors"
              >
                Analyze <ArrowRight className="w-2 h-2" />
              </Link>
            </div>

            {/* PDF Analytics */}
            <div className="border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-3.5 h-3.5 text-[#8A6A2F]" />
                <span className="text-[8px] font-mono uppercase tracking-wider text-white/40">Asset Intelligence</span>
              </div>
              <PdfAnalyticsWidget />
            </div>
          </div>

          {/* Deal Flow Intelligence - Sovereign Dashboard */}
          {dealFlowStats && (
            <div className="mb-20">
              <SectionHeader icon={Brain} title="Deal Intelligence" description="Institutional assessment of qualified opportunities" />
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
                      "Active deal flow with strategic alignment indicators"
                    ]
                  }}
                  input={{
                    ruleScore: dealFlowStats.avg || 75,
                    aiScore: dealFlowStats.avg || 75,
                    authority: true,
                    problem: "Institutional pipeline analysis",
                    urgency: "Active",
                    revenue: 1000000
                  }}
                />
              </div>
            </div>
          )}

          {/* Featured Intelligence */}
          {featuredBriefs.length > 0 && (
            <>
              <SectionHeader icon={Sparkles} title="Featured Intelligence" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
                {featuredBriefs.slice(0, 2).map((brief) => (
                  <Link
                    key={brief.id}
                    href={`/strategy/${brief.slug}`}
                    className="group border border-white/10 bg-white/[0.02] p-6 hover:border-[#8A6A2F]/30 transition-all"
                  >
                    <h3 className="text-lg font-light tracking-tight text-white group-hover:text-[#8A6A2F] transition-colors mb-2">
                      {brief.title}
                    </h3>
                    {brief.excerpt && (
                      <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors line-clamp-2">
                        {brief.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2 text-[7px] font-mono text-white/30 group-hover:text-[#8A6A2F] transition-colors">
                      <span>Read Brief</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Recent Intelligence */}
          <SectionHeader icon={Clock} title="Recent Intelligence" />
          <div className="divide-y divide-white/5 mb-20">
            {recentBriefs.slice(0, 8).map((brief, idx) => (
              <BriefRow key={brief.id} brief={brief} index={idx} />
            ))}
          </div>

          {/* Feature Grid */}
          <FeatureGrid />
          <Divider />

          {/* Footer */}
          <Footer />
        </div>
      </main>
    </Layout>
  );
}

// Export the component as default export
export default DevDashboardComponent;

/* -------------------------------------------------------------------------- */
/* SERVER-SIDE PROPS - NO AUTH GATES                                          */
/* -------------------------------------------------------------------------- */

export const getServerSideProps: GetServerSideProps<DashboardProps> = async (
  context: GetServerSidePropsContext
) => {
  // Development mode - bypass all authentication
  if (process.env.NODE_ENV !== "development") {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  try {
    // Fetch briefs from database
    let briefs: Brief[] = [];
    let totalCount = 0;
    
    try {
      const allBriefs = await prisma.contentMetadata.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          createdAt: true,
          contentType: true,
        },
      });

      briefs = allBriefs.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        excerpt: b.summary ?? undefined,
        createdAt: b.createdAt.toISOString(),
        category: String(b.contentType),
      }));
      totalCount = await prisma.contentMetadata.count();
    } catch (error) {
      console.warn("Briefs unavailable, using mock data:", error);
      // Mock data for development
      briefs = [
        { id: "1", title: "Strategic Frameworks", slug: "strategic-frameworks", excerpt: "Institutional architecture for decision-making", createdAt: new Date().toISOString(), category: "Featured" },
        { id: "2", title: "Governance Protocol", slug: "governance-protocol", excerpt: "Disciplined oversight structures", createdAt: new Date().toISOString(), category: "Strategy" },
        { id: "3", title: "Execution Architecture", slug: "execution-architecture", excerpt: "Moving from strategy to operational reality", createdAt: new Date().toISOString(), category: "Strategy" },
        { id: "4", title: "Risk Posture Framework", slug: "risk-posture", excerpt: "Institutional risk management protocols", createdAt: new Date().toISOString(), category: "Risk" },
      ];
      totalCount = 75;
    }

    const featuredBriefs = briefs.filter(b => 
      b.category === "Featured" || b.title.toLowerCase().includes("strategic")
    ).slice(0, 2);
    
    const recentBriefs = briefs.slice(0, 8);

    // Mock deal flow stats for development
    const dealFlowStats = {
      strategy: 12,
      avg: 78,
      ai: {
        highQualityDeals: 8,
        avgAiConfidence: 85,
      },
      submissions: [],
    };

    return {
      props: {
        userEmail: "developer@sovereign.internal",
        briefs: JSON.parse(JSON.stringify(briefs)),
        totalCount,
        featuredBriefs: JSON.parse(JSON.stringify(featuredBriefs)),
        recentBriefs: JSON.parse(JSON.stringify(recentBriefs)),
        aol: { tier: "Inner Circle", isInternal: true },
        dealFlowStats: dealFlowStats || null,
      },
    };
  } catch (error) {
    console.error("[Dev Dashboard Error]:", error);

    return {
      props: {
        userEmail: "developer@sovereign.internal",
        briefs: [],
        totalCount: 75,
        featuredBriefs: [],
        recentBriefs: [],
        aol: { tier: "Inner Circle", isInternal: true },
        dealFlowStats: null,
      },
    };
  }
};