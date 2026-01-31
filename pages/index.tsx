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
  ScrollText,
  Sparkles,
  Command,
  Activity,
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

// --- Types & Helpers (Unchanged for build safety) ---
type FeaturedShort = { title: string; slug: string; excerpt?: string | null; href: string; dateISO?: string | null; };
type HomePageProps = { featuredShorts: FeaturedShort[]; };

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

  return (
    <Layout
      title="Abraham of London | Strategic Architecture"
      description="Canon-rooted strategy, frameworks, and deployable assets."
      ogImage="/assets/images/social/og-image.jpg"
      canonicalUrl="/"
    >
      <Head>
        <meta property="og:type" content="website" />
      </Head>

      {/* 1. HERO - Enhanced with an ambient glow container */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        <HeroSection />
      </div>

      {/* 2. THE SYSTEM OVERVIEW - Refined Typographic Grid */}
      <section className="relative bg-black py-24 overflow-hidden">
        {/* Subtle Grid Background Overlay */}
        <div className="absolute inset-0 bg-[url('/assets/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 mb-8">
                <Command className="h-3 w-3" />
                Operational Doctrine v1.0
              </div>

              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.1]">
                A system built for <br />
                <span className="text-amber-200/90 italic">High-Stakes Execution.</span>
              </h2>

              <p className="mt-8 text-lg text-white/50 leading-relaxed max-w-2xl font-light">
                We strip away the decorative. The <span className="text-white font-medium">Canon</span> provides the bedrock architecture. 
                <span className="text-white font-medium"> Frameworks</span> translate that into logic. 
                The <span className="text-white font-medium">Vault</span> delivers the artifacts.
              </p>

              {/* High-Signal Trust Cards */}
              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <Shield className="h-5 w-5 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                  <h3 className="mt-4 font-bold text-white text-sm tracking-wide">Governance Architecture</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">Engineered for review cadences and failure-mode analysis.</p>
                </div>
                <div className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
                  <Activity className="h-5 w-5 text-amber-500/50 group-hover:text-amber-400 transition-colors" />
                  <h3 className="mt-4 font-bold text-white text-sm tracking-wide">Deployable Precision</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/40">Not mere content. These are artifacts ready for active environments.</p>
                </div>
              </div>
            </div>

            {/* Tactical Navigation Sidebar */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-4">
                {[
                  { title: "The Mini-Book", icon: BookOpen, href: "/canon/architecture", color: "amber" },
                  { title: "Strategic Frameworks", icon: Layers, href: "/resources/frameworks", color: "white" },
                  { title: "Access the Vault", icon: Vault, href: "/downloads/vault", color: "amber" }
                ].map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group relative overflow-hidden flex items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${
                      item.color === 'amber' 
                        ? 'border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/40 hover:bg-amber-500/[0.08]' 
                        : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${item.color === 'amber' ? 'bg-amber-500/10' : 'bg-white/10'}`}>
                        <item.icon className={`h-5 w-5 ${item.color === 'amber' ? 'text-amber-400' : 'text-white/70'}`} />
                      </div>
                      <span className={`font-bold tracking-wide ${item.color === 'amber' ? 'text-amber-200' : 'text-white'}`}>
                        {item.title}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/20 group-hover:translate-x-1 transition-transform" />
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
      <ContentShowcase />
      <SectionDivider />
      <ExecutiveIntelligenceStrip shorts={featuredShorts as any} />
      <SectionDivider />
      <EventsSection />

      {/* CLOSING: THE DECISION POINT */}
      <section className="bg-black py-32">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-block p-px rounded-3xl bg-gradient-to-b from-amber-500/20 to-transparent">
            <div className="rounded-[calc(1.5rem-1px)] bg-black px-8 py-16 md:px-16">
              <h2 className="font-serif text-3xl md:text-5xl font-medium text-white mb-6">
                Enter the system.
              </h2>
              <p className="text-white/50 max-w-xl mx-auto mb-10 text-lg font-light leading-relaxed">
                Architecture, then logic, then deployment. Start with the Canon or go straight to the Vault.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/canon/the-architecture-of-human-purpose"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-colors duration-300"
                >
                  The Mini-Book
                </Link>
                <Link
                  href="/downloads/vault"
                  className="w-full sm:w-auto px-10 py-5 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all duration-300"
                >
                  Enter Vault
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// -----------------------------
// Build-safe content fetch
// -----------------------------
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts: FeaturedShort[] = [];

  try {
    const mod: any = await import("@/lib/content").catch(() => null);

    const pullFrom = async (all: any[]) => {
      const picked = (all || [])
        .filter((s: any) => !s?.draft)
        .sort((a: any, b: any) => {
          const da = new Date(a?.date || 0).getTime() || 0;
          const db = new Date(b?.date || 0).getTime() || 0;
          return db - da;
        })
        .slice(0, 8);

      for (const s of picked) {
        const slug = safeNormalizeSlug(s?.slug || s?._raw?.flattenedPath || "");
        if (!slug) continue;

        featuredShorts.push({
          title: String(s?.title || "Untitled"),
          slug,
          excerpt: String(s?.excerpt || s?.description || "").slice(0, 180) || null,
          href: slug.startsWith("shorts/") ? `/${slug}` : `/shorts/${slug.replace(/^shorts\//, "")}`,
          dateISO: toISO(s?.date),
        });
      }
    };

    if (mod?.getContentlayerData) {
      const data = (await mod.getContentlayerData()) || {};
      await pullFrom(Array.isArray(data.allShorts) ? data.allShorts : []);
    } else {
      const gen: any = await import("contentlayer/generated").catch(() => null);
      await pullFrom(Array.isArray(gen?.allShorts) ? gen.allShorts : []);
    }
  } catch {
    // swallow, always build
  }

  return { props: { featuredShorts }, revalidate: 900 };
};

export default HomePage;