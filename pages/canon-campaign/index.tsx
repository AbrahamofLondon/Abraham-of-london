/* pages/canon-campaign/index.tsx — LONG-HORIZON BUILD (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  Crown, 
  Sparkles, 
  Users, 
  Target, 
  Shield, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  ChevronRight, 
  Heart, 
  Map, 
  Layers, 
  Zap 
} from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * All roadmap phases and material references are locked to verified vault paths.
 */
const CanonCampaignPage: NextPage = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.com";

  const phases = [
    {
      title: "Foundation",
      description: "Core volumes establishing first principles of stewardship and authority.",
      status: "Complete",
      icon: <Shield className="h-6 w-6" />,
      color: "from-blue-500/20 to-cyan-500/10",
      items: ["Human Purpose Architecture", "Fatherhood Foundations", "Governance Doctrine"]
    },
    {
      title: "Expansion",
      description: "Practical implementation guides and strategic board toolkits.",
      status: "In Progress",
      icon: <Layers className="h-6 w-6" />,
      color: "from-amber-500/20 to-orange-500/10",
      items: ["Legacy Roadmap", "Decision Systems", "Household Charter"]
    },
    {
      title: "Community",
      description: "Live rooms, strategic salons, and cohort-based formation.",
      status: "Planning",
      icon: <Users className="h-6 w-6" />,
      color: "from-emerald-500/20 to-green-500/10",
      items: ["Strategy Salons", "Fatherhood Cohorts", "Leadership Rooms"]
    }
  ];

  return (
    <Layout
      title="Canon Campaign"
      description="The long-horizon build of applied wisdom for fathers, founders, and leaders."
      className="bg-black min-h-screen"
    >
      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white">
        
        {/* HERO: LONG-HORIZON BUILD */}
        <section className="relative overflow-hidden border-b border-white/10 pt-24 pb-16 lg:pt-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),transparent_70%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Canon · The Build</span>
              </div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                The Canon Campaign
              </h1>
              <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                A methodical architecture of applied wisdom for men carrying the weight of legacy. Not content—foundation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Volumes", icon: BookOpen, desc: "Long-form arguments." },
                  { label: "Rooms", icon: Calendar, desc: "Private sessions." },
                  { label: "Tools", icon: Target, desc: "Deployable assets." }
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
                    <stat.icon className="h-5 w-5 text-amber-500 mb-3" />
                    <h4 className="text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</h4>
                    <p className="text-xs text-gray-500">{stat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ROADMAP PHASES */}
        <section className="py-20 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Building in Phases</h2>
              <p className="text-gray-400 max-w-xl mx-auto">The Canon is built methodically. No shortcuts, just deliberate, institutional progress.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {phases.map((phase, i) => (
                <div key={i} className="group rounded-3xl border border-white/10 bg-white/[0.02] p-8 hover:border-amber-500/30 transition-all flex flex-col h-full">
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${phase.color} text-white`}>
                    {phase.icon}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">{phase.title}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{phase.status}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-8 flex-grow leading-relaxed">{phase.description}</p>
                  <ul className="space-y-3 pt-6 border-t border-white/5">
                    {phase.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-xs text-gray-500 italic">
                        <CheckCircle className="h-3 w-3 text-emerald-500/50" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ACCESS POINTS */}
        <section className="py-20 bg-black/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-8">Campaign Entry Points</h2>
                <div className="space-y-4">
                  {[
                    { title: "Human Purpose Architecture", kind: "Volume Zero", href: "/blog/ultimate-purpose-of-man", icon: Layers },
                    { title: "The Canon Library", kind: "Full Collection", href: "/canon", icon: BookOpen },
                    { title: "Chatham Rooms", kind: "Interactive", href: "/chatham-rooms", icon: Users }
                  ].map((entry, i) => (
                    <Link key={i} href={entry.href} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-gold/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-gold/10 p-3 text-gold"><entry.icon size={24} /></div>
                        <div>
                          <h3 className="font-serif text-xl font-semibold group-hover:text-gold transition-colors">{entry.title}</h3>
                          <p className="text-xs text-gray-500 uppercase tracking-widest">{entry.kind}</p>
                        </div>
                      </div>
                      <ArrowRight className="text-gray-600 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* SIDEBAR: INNER CIRCLE */}
              <aside className="p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
                <Crown className="h-8 w-8 text-amber-500 mb-6" />
                <h3 className="font-serif text-2xl font-bold mb-4">Join the Inner Circle</h3>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed">
                  Some campaign materials remain restricted. Serious work requires a closed room and a verified mandate.
                </p>
                <div className="space-y-3">
                  <Link href="/inner-circle" className="block w-full py-4 rounded-xl bg-amber-500 text-black text-center font-bold uppercase tracking-widest text-xs hover:bg-amber-400 transition-all">
                    Request Access Key
                  </Link>
                  <Link href="/content" className="block w-full py-4 rounded-xl border border-white/20 text-white text-center font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all">
                    Browse the Vault
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-20 border-t border-white/10">
          <div className="mx-auto max-w-4xl px-4 text-center">
             <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 text-gold mb-8">
                <Award size={32} />
             </div>
             <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Join the Build</h2>
             <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
               The Canon is written with and for builders. Share your insights, test frameworks, and help shape the architecture that outlasts us all.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="rounded-xl bg-gold px-10 py-4 text-black font-bold uppercase tracking-widest hover:bg-gold/80 transition-all">Share Insight</Link>
                <Link href="/canon" className="rounded-xl border border-white/20 px-10 py-4 text-white font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Start Reading</Link>
             </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonCampaignPage;