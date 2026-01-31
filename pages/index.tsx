import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Layers,
  Vault,
  ChevronRight,
  Shield,
  Activity,
  Command,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  HeroSection,
  StrategicFunnelStrip,
  OperatorBriefing,
  VaultTeaserRail,
  ContentShowcase,
  EventsSection,
  ExecutiveIntelligenceStrip,
  SectionDivider,
} from "@/components/homepage";

// --- Types & Helpers (Strict Implementation) ---
type FeaturedShort = { 
  title: string; 
  slug: string; 
  excerpt?: string | null; 
  href: string; 
  dateISO?: string | null; 
  theme?: string;
};

type HomePageProps = { 
  featuredShorts: FeaturedShort[]; 
};

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London | Strategic Architecture"
      description="Canon-rooted strategy, frameworks, and deployable assets for high-stakes execution."
      ogImage="https://www.abrahamoflondon.org/api/og/short?title=Strategic%20Architecture&category=SYSTEM"
      canonicalUrl="/"
    >
      <Head>
        <meta property="og:type" content="website" />
      </Head>

      {/* 1. HERO - Atmospheric Focal Point */}
      <div className="relative overflow-hidden bg-black">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none opacity-50" />
        <HeroSection />
      </div>

      {/* 2. THE SYSTEM OVERVIEW - Using City-Gate Design Patterns */}
      <section className="relative bg-black py-32 overflow-hidden border-y border-white/[0.03]">
        {/* Technical Grid Background */}
        <div className="bg-grid-technical mask-radial-fade absolute inset-0 opacity-20 pointer-events-none" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-20 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-10">
                <div className="signal-dot" />
                <span className="text-kicker">Operational Doctrine v2.026</span>
              </div>

              <h2 className="heading-statement mb-10">
                A system built for <br />
                <span className="text-amber-500 italic">High-Stakes Execution.</span>
              </h2>

              <p className="mt-8 text-xl text-white/40 leading-relaxed max-w-2xl font-light">
                We strip away the decorative. The <span className="text-white/80 font-medium">Canon</span> provides the bedrock architecture. 
                The <span className="text-white/80 font-medium">Vault</span> delivers the artifacts.
                The <span className="text-white/80 font-medium">Shorts</span> provide real-time intel.
              </p>

              {/* High-Signal Cards */}
              <div className="mt-16 grid gap-6 sm:grid-cols-2">
                <div className="city-gate-card p-8 group">
                  <Shield className="h-6 w-6 text-amber-500/50 group-hover:text-amber-500 transition-colors mb-6" />
                  <h3 className="text-metadata text-white/90 mb-3">Governance Architecture</h3>
                  <p className="text-sm leading-relaxed text-white/30">Engineered for review cadences and institutional failure-mode analysis.</p>
                </div>
                <div className="city-gate-card p-8 group">
                  <Activity className="h-6 w-6 text-amber-500/50 group-hover:text-amber-500 transition-colors mb-6" />
                  <h3 className="text-metadata text-white/90 mb-3">Deployable Precision</h3>
                  <p className="text-sm leading-relaxed text-white/30">Not mere content. These are artifacts ready for active, high-pressure environments.</p>
                </div>
              </div>
            </div>

            {/* Tactical Navigation Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                {[
                  { title: "The Mini-Book", icon: BookOpen, href: "/canon/architecture", theme: "Canon" },
                  { title: "Strategic Frameworks", icon: Layers, href: "/resources/frameworks", theme: "Logic" },
                  { title: "Access the Vault", icon: Vault, href: "/downloads/vault", theme: "Assets" }
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="group city-gate-card flex items-center justify-between p-7 hover:border-amber-500/40"
                  >
                    <div className="flex items-center gap-5">
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                         <span className="text-[10px] font-mono text-amber-500/50 block uppercase tracking-[0.2em] mb-1">
                           {item.theme}
                         </span>
                         <span className="font-serif text-xl italic text-white/80 group-hover:text-white transition-colors">
                           {item.title}
                         </span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/10 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider tight />
      <OperatorBriefing />
      
      <SectionDivider tight />
      <StrategicFunnelStrip />
      
      <SectionDivider tight />
      <VaultTeaserRail />
      
      <SectionDivider />
      {/* Passing fetched shorts to the Showcase for real-time visibility */}
      <ContentShowcase items={featuredShorts as any} />
      
      <SectionDivider />
      <ExecutiveIntelligenceStrip shorts={featuredShorts as any} />
      
      <SectionDivider />
      <EventsSection />

      {/* CLOSING: THE DECISION POINT */}
      <section className="bg-black py-48 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
        
        <div className="mx-auto max-w-5xl px-4 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="city-gate-card p-16 md:p-24 bg-white/[0.01]"
          >
            <Zap className="h-10 w-10 text-amber-500 mx-auto mb-10" />
            <h2 className="heading-statement mb-8">
              Enter the system.
            </h2>
            <p className="text-white/40 max-w-xl mx-auto mb-12 text-lg font-light leading-relaxed">
              Architecture, then logic, then deployment. Start with the Canon or go straight to the Vault to evaluate the assets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/canon/the-architecture-of-human-purpose"
                className="w-full sm:w-auto px-12 py-5 rounded-full bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
              >
                The Mini-Book
              </Link>
              <Link
                href="/downloads/vault"
                className="w-full sm:w-auto px-12 py-5 rounded-full border border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-[0.2em] hover:border-white/30 hover:bg-white/10 transition-all duration-300"
              >
                Enter Vault
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

// -----------------------------
// Build-safe content fetch (Sanitized & Systematic)
// -----------------------------
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    const { getAllContentlayerDocs, normalizeSlug, isDraftContent } = await import("@/lib/contentlayer-helper");
    
    const docs = getAllContentlayerDocs();
    const shorts = docs
      .filter((d: any) => (d.kind === "Short" || d._raw?.sourceFileDir?.includes("short")) && !isDraftContent(d))
      .sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 8);

    shorts.forEach((s: any) => {
      const slug = normalizeSlug(s.slug || s._raw?.flattenedPath || "").replace(/^shorts\//, "");
      featuredShorts.push({
        title: s.title || "Untitled Briefing",
        slug,
        excerpt: s.excerpt || s.description || null,
        href: `/shorts/${slug}`,
        dateISO: s.date ? new Date(s.date).toISOString() : null,
        theme: s.theme || "Intel"
      });
    });
  } catch (err) {
    console.error("Home Data Fetch Error:", err);
  }

  return { 
    props: { 
      featuredShorts: JSON.parse(JSON.stringify(featuredShorts)) 
    }, 
    revalidate: 3600 
  };
};

export default HomePage;