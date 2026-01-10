import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Users as UsersIcon, // RENAMED
  Target as TargetIcon, // RENAMED
  BookOpen as BookOpenIcon, // RENAMED
  Hammer,
  Landmark,
  ScrollText,
  Shield,
  Home,
  TreePine,
  FileSpreadsheet,
  ClipboardCheck,
  Building2,
  ArrowRight,
  Library,
  Heart,
  Castle,
  Compass,
  FileText,
  CheckCircle,
  GraduationCap,
  Clock,
  Award,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const FatherhoodPage: NextPage = () => {
  // Fatherhood-focused blog articles - UPDATE ICON REFERENCES
  const fatherhoodEssays = [
    {
      title: "Fathering Without Fear",
      description: "Complete framework for courageous fatherhood beyond sentimentality",
      href: "/blog/fathering-without-fear",
      readTime: "18 min",
      icon: Shield,
      tags: ["courage", "framework", "practical"]
    },
    {
      title: "The Brotherhood Code",
      description: "Principles for building lasting brotherhood and accountability",
      href: "/blog/the-brotherhood-code",
      readTime: "25 min",
      icon: UsersIcon, // CHANGED
      tags: ["brotherhood", "accountability", "community"]
    },
    {
      title: "In My Father's House",
      description: "On inheritance, legacy, and building what lasts",
      href: "/blog/in-my-fathers-house",
      readTime: "15 min",
      icon: Castle,
      tags: ["legacy", "inheritance", "builders"]
    },
    {
      title: "Leadership Begins at Home",
      description: "How household governance shapes organizational leadership",
      href: "/blog/leadership-begins-at-home",
      readTime: "12 min",
      icon: Home,
      tags: ["leadership", "household", "governance"]
    },
    {
      title: "Principles for My Son",
      description: "Direct counsel for raising sons who can stand in the open",
      href: "/blog/principles-for-my-son",
      readTime: "10 min",
      icon: GraduationCap,
      tags: ["sons", "principles", "formation"]
    },
    {
      title: "When the Storm Finds You",
      description: "Field letter on delay, loss, and staying present as a father",
      href: "/blog/when-the-storm-finds-you",
      readTime: "8 min",
      icon: Compass,
      tags: ["resilience", "presence", "field-notes"]
    }
  ];

  // Implementation tools for fathers - UPDATE ICON REFERENCES
  const fatherhoodTools = [
    {
      title: "Canon Household Charter",
      description: "Template for family governance and household operating principles",
      href: "/resources/canon-household-charter",
      status: 'inner-circle' as const,
      icon: Home,
      type: "Charter template",
      purpose: "Family governance framework"
    },
    {
      title: "Fatherhood Impact Framework",
      description: "Measurement framework for fatherhood's long-term impact",
      href: "/resources/fatherhood-impact-framework",
      status: 'public' as const,
      icon: TargetIcon, // CHANGED
      type: "Framework",
      purpose: "Impact measurement"
    },
    {
      title: "Multi-Generational Legacy Ledger",
      description: "Framework for legacy mapping across financial, intellectual, relational domains",
      href: "/resources/multi-generational-legacy-ledger",
      status: 'inner-circle' as const,
      icon: Landmark,
      type: "Planning tool",
      purpose: "Legacy architecture"
    },
    {
      title: "Canon Reading Plan - Year One",
      description: "Structured reading curriculum for canonical doctrine",
      href: "/resources/canon-reading-plan-year-one",
      status: 'inner-circle' as const,
      icon: BookOpenIcon, // CHANGED
      type: "Curriculum",
      purpose: "Doctrinal formation"
    },
    {
      title: "Destiny Mapping Worksheet",
      description: "Tool for aligning personal calling with family responsibility",
      href: "/resources/destiny-mapping-worksheet",
      status: 'public' as const,
      icon: Compass,
      type: "Worksheet",
      purpose: "Calling alignment"
    },
    {
      title: "Brotherhood Starter Kit",
      description: "Framework for initiating and maintaining accountability groups",
      href: "/resources/brotherhood-starter-kit",
      status: 'public' as const,
      icon: UsersIcon, // CHANGED
      type: "Starter kit",
      purpose: "Community formation"
    }
  ];

  // Canon volumes that form the foundation
  const canonFoundation = [
    {
      title: "Ultimate Purpose of Man",
      description: "Complete framework for understanding human purpose across seven domains",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Award,
      focus: "Foundational doctrine"
    },
    {
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy and execution discipline",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      focus: "Practical application"
    },
    {
      title: "Canon Builder's Rule of Life",
      description: "Daily rhythms and disciplines for builders and fathers",
      href: "/resources/canon-builders-rule-of-life",
      status: 'inner-circle' as const,
      icon: Clock,
      focus: "Daily discipline"
    }
  ];

  return (
    <Layout
      title="Fatherhood"
      description="Practical frameworks and tools for men who carry the weight of family, legacy, and responsibility."
      className="bg-black text-cream"
    >
      {/* HERO SECTION - The heart of the movement */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Work That Matters
            </p>
            
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Fatherhood
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Not sentimentality. Not performance. The practical work of building men who build families that build futures.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#essays"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Read the Essays
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/resources/fatherhood-impact-framework"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                Fatherhood Impact Framework
                <TargetIcon className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MANDATE STATEMENT */}
      <section className="bg-black py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
      </section>

      {/* ESSAYS SECTION */}
      <section id="essays" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Work in Words
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Essays & Field Notes
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Direct counsel. No abstraction. Writing that meets fathers where they are and shows them where they could be.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {fatherhoodEssays.map((essay) => {
              const Icon = essay.icon;
              return (
                <Link
                  key={essay.title}
                  href={essay.href}
                  className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <Icon className="h-6 w-6 text-gold/60" />
                    <span className="text-xs text-gray-500">{essay.readTime}</span>
                  </div>
                  
                  <h3 className="mb-3 font-serif text-xl font-semibold text-white group-hover:text-gold">
                    {essay.title}
                  </h3>
                  
                  <p className="mb-4 text-sm leading-relaxed text-gray-400">
                    {essay.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {essay.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/content?tag=fatherhood"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
            >
              View all fatherhood content
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* IMPLEMENTATION TOOLS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Work in Practice
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Tools & Frameworks
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Not theory. Implementation tools that turn doctrine into daily action.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {fatherhoodTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                      tool.status === 'public' 
                        ? 'bg-green-500/10 text-green-400' 
                        : tool.status === 'inner-circle'
                        ? 'bg-gold/10 text-gold'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {tool.status}
                    </span>
                  </div>
                  
                  <h3 className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold">
                    {tool.title}
                  </h3>
                  
                  <p className="mb-3 text-sm leading-relaxed text-gray-400">
                    {tool.description}
                  </p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-300">{tool.type}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Purpose:</span>
                      <span className="font-medium text-gray-300">{tool.purpose}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Link
                      href={tool.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {tool.status === 'public' ? 'Download' : 'View preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CANON FOUNDATION */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Foundation
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Built on the Canon
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Fatherhood that lasts is built on doctrine that lasts. These form the intellectual foundation.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {canonFoundation.map((foundation) => {
              const Icon = foundation.icon;
              return (
                <div
                  key={foundation.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6">
                    <Icon className="h-10 w-10 text-gold/60" />
                  </div>
                  
                  <h3 className="mb-4 font-serif text-xl font-semibold text-white group-hover:text-gold">
                    {foundation.title}
                  </h3>
                  
                  <p className="mb-6 text-sm leading-relaxed text-gray-400">
                    {foundation.description}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-400">Focus: </span>
                      {foundation.focus}
                    </div>
                    
                    <Link
                      href={foundation.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {foundation.status === 'public' ? 'Read' : 'Inner Circle preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Brotherhood & Community */}
          <div className="mt-16 rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Brotherhood & Community</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  No father builds alone. The work happens in community — structured, accountable, purposeful community.
                </p>
                
                <div className="mt-8 space-y-4">
                  <Link
                    href="/resources/brotherhood-starter-kit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                  >
                    Brotherhood Starter Kit
                    <UsersIcon className="h-4 w-4" />
                  </Link>
                  
                  <Link
                    href="/events?category=fatherhood"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    View Fatherhood Events
                    <Calendar className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">The Work Ahead</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                    <div>
                      <p className="font-semibold text-white">Build your household</p>
                      <p className="mt-1 text-sm text-gray-400">Start with the Household Charter and Fatherhood Impact Framework.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                    <div>
                      <p className="font-semibold text-white">Form your brotherhood</p>
                      <p className="mt-1 text-sm text-gray-400">Implement the Brotherhood Starter Kit with men who share your convictions.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                    <div>
                      <p className="font-semibold text-white">Build for generations</p>
                      <p className="mt-1 text-sm text-gray-400">Use the Legacy Ledger to plan beyond your lifetime.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-white sm:text-4xl">
              Build what lasts
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400 sm:text-lg">
              The work of fatherhood is the work of civilization. Start with one tool. Build one habit. 
              Form one relationship. The future is built by men who show up.
            </p>
            
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/resources/canon-household-charter"
                className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Start with Household Charter
              </Link>
              <Link
                href="/inner-circle?source=fatherhood"
                className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10"
              >
                Join Inner Circle
              </Link>
            </div>
            
            <p className="mt-8 text-xs text-gray-500">
              No sentimentality. No performance. Just the work.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FatherhoodPage;