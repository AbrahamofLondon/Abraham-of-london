// pages/speaking/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  BookOpen,
  ShieldCheck,
  Building2,
  Landmark,
  ArrowRight,
  FileText,
  Calendar,
  Lock,
  GraduationCap,
  Workflow,
  Compass,
  Hammer,
  Layers,
  Clock,
  Award,
  Sparkles,
  MessageSquare,
  Mic,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

const SpeakingPage: NextPage = () => {
  // Speaking Formats & Topics
  const speakingFormats = [
    {
      format: "Keynote Addresses",
      description: "Strategic frameworks for leadership retreats and away days",
      duration: "45-90 minutes",
      audience: "Boards, executives, leadership teams",
      icon: Mic,
      topics: [
        "Ultimate Purpose of Man: The seven domains",
        "Leadership that survives headlines",
        "Building institutions that survive founders",
        "The Canon as operating system"
      ],
      preparation: "Custom research on organization + tailored frameworks"
    },
    {
      format: "Chatham Rooms",
      description: "Private, off-record conversations under Chatham House Rule",
      duration: "2-3 hours",
      audience: "6-12 curated leaders",
      icon: Users,
      topics: [
        "Fatherhood without disappearing",
        "Founder legitimacy and governance",
        "Legacy planning across generations",
        "Decision-making under uncertainty"
      ],
      preparation: "Pre-reading from Canon + tailored discussion frameworks"
    },
    {
      format: "Strategy Salons",
      description: "Closed-room intensives on specific strategic challenges",
      duration: "Half-day to full-day",
      audience: "Founders, board members, senior leaders",
      icon: Target,
      topics: [
        "Board-level decision architecture",
        "Institutional health diagnostics",
        "Multi-generational stewardship",
        "Frontier market strategy"
      ],
      preparation: "Strategic frameworks + implementation toolkits"
    },
    {
      format: "Formation Workshops",
      description: "Deep dives into canonical doctrine and practical application",
      duration: "3-4 hours",
      audience: "Serious builders and leaders",
      icon: GraduationCap,
      topics: [
        "Builder's Catechism implementation",
        "Canon Volume I-IV application",
        "Household charter development",
        "Brotherhood formation"
      ],
      preparation: "Canon volumes + worksheets + implementation guides"
    }
  ];

  // Sample Speaking Materials
  const speakingMaterials = [
    {
      title: "Ultimate Purpose of Man Framework",
      description: "Complete framework for human purpose across seven domains",
      href: "/blog/ultimate-purpose-of-man",
      status: 'public' as const,
      icon: Layers,
      format: "Foundation for keynotes",
      useCase: "Purpose and meaning keynotes"
    },
    {
      title: "Strategic Frameworks",
      description: "Decision matrices, prioritization logic, governance templates",
      href: "/resources/strategic-frameworks",
      status: 'public' as const,
      icon: Workflow,
      format: "Board-ready tooling",
      useCase: "Strategy and governance sessions"
    },
    {
      title: "Builder's Catechism",
      description: "Authoritative question-set for founder legitimacy",
      href: "/canon/builders-catechism",
      status: 'inner-circle' as const,
      icon: Hammer,
      format: "Question-based framework",
      useCase: "Founder and leadership intensives"
    },
    {
      title: "Canon Volumes I-IV",
      description: "Complete doctrinal architecture for institutional leadership",
      href: "/canon",
      status: 'inner-circle' as const,
      icon: BookOpen,
      format: "Teaching editions",
      useCase: "Deep formation workshops"
    }
  ];

  // Past Speaking Engagements (sample)
  const sampleEngagements = [
    {
      audience: "Private Equity Partners",
      topic: "Legacy architecture for financial stewards",
      format: "Chatham Room",
      focus: "Multi-generational stewardship beyond wealth transfer"
    },
    {
      audience: "Tech Founder Cohort",
      topic: "Building institutions that survive founders",
      format: "Strategy Salon",
      focus: "Governance, succession, and institutional resilience"
    },
    {
      audience: "Family Office Principals",
      topic: "Purpose-driven wealth stewardship",
      format: "Keynote + Workshop",
      focus: "Integrating faith, family, and finance"
    },
    {
      audience: "Church Leadership Team",
      topic: "Leadership that survives headlines",
      format: "Retreat Keynote",
      focus: "Institutional health and governance in religious contexts"
    }
  ];

  return (
    <Layout
      title="Speaking & Rooms"
      description="Keynotes, Chatham Rooms, and strategic salons built on canonical doctrine, strategic frameworks, and implementation tooling."
      className="bg-black text-cream"
    >
      {/* HERO - Substance Over Performance */}
      <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
        
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Speaking · Rooms · Strategy
            </p>
            
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Speaking without theatrics
            </h1>
            
            <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
              Keynotes, Chatham Rooms, and salons built on canonical doctrine and strategic frameworks — 
              designed for leaders who want depth, not performance.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="#formats"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                View Speaking Formats
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              
              <Link
                href="/contact?source=speaking"
                className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
              >
                Discuss a Room
                <MessageSquare className="ml-2 h-4 w-4" />
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

      {/* SPEAKING FORMATS */}
      <section id="formats" className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Formats
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Substance Over Performance
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Each format is built on specific canonical doctrine and strategic frameworks — 
              no generic content, no motivational noise.
            </p>
          </div>

          <div className="space-y-8">
            {speakingFormats.map((format, index) => {
              const Icon = format.icon;
              return (
                <motion.div
                  key={format.format}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-8 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <Icon className="h-6 w-6 text-gold/60" />
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
                          {format.duration}
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-white group-hover:text-gold">
                        {format.format}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        {format.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
                      {format.audience}
                    </span>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Topics Include
                      </p>
                      <ul className="space-y-2">
                        {format.topics.map((topic) => (
                          <li key={topic} className="flex items-start gap-2 text-sm text-gray-300">
                            <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold/60" />
                            {topic}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Preparation Includes
                      </p>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {format.preparation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SPEAKING MATERIALS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              The Foundation
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Built on the Work
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Every speaking engagement draws from developed doctrine, tested frameworks, 
              and implementation tooling — not improvised content.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {speakingMaterials.map((material) => {
              const Icon = material.icon;
              return (
                <div
                  key={material.title}
                  className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.3em] ${
                      material.status === 'public' 
                        ? 'bg-green-500/10 text-green-400' 
                        : material.status === 'inner-circle'
                        ? 'bg-gold/10 text-gold'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {material.status}
                    </span>
                  </div>

                  <h3 className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold">
                    {material.title}
                  </h3>

                  <p className="mb-3 text-sm leading-relaxed text-gray-400">
                    {material.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Format:</span>
                      <span className="font-medium text-gray-300">{material.format}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Use case:</span>
                      <span className="font-medium text-gray-300">{material.useCase}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={material.href}
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-gold transition hover:text-gold/80"
                    >
                      {material.status === 'public' ? 'View content' : 'Preview'}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SAMPLE ENGAGEMENTS */}
      <section className="bg-zinc-950 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
              Sample Engagements
            </p>
            <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
              Where the Work Lands
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
              Real conversations with real leaders facing real gravity.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {sampleEngagements.map((engagement, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-white/8 bg-white/[0.02] p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                    {engagement.format}
                  </span>
                  <span className="text-xs text-gray-500">{engagement.audience}</span>
                </div>

                <h3 className="mb-3 font-serif text-lg font-semibold text-white group-hover:text-gold">
                  {engagement.topic}
                </h3>

                <p className="text-sm leading-relaxed text-gray-400">
                  {engagement.focus}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS & NEXT STEPS */}
      <section className="bg-black py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">The Process</h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-white">Discovery Call</p>
                      <p className="mt-1 text-sm text-gray-400">45 minutes to understand context, audience, and desired outcomes.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-white">Custom Framework Design</p>
                      <p className="mt-1 text-sm text-gray-400">Selection and adaptation of relevant Canon volumes and strategic frameworks.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-white">Preparation & Materials</p>
                      <p className="mt-1 text-sm text-gray-400">Development of tailored content, pre-reading, and implementation tools.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                      4
                    </div>
                    <div>
                      <p className="font-semibold text-white">Engagement & Follow-up</p>
                      <p className="mt-1 text-sm text-gray-400">Session delivery plus follow-up resources for implementation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-serif text-2xl font-semibold text-white">Next Steps</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">
                  Begin by exploring the materials that form the foundation of the work. 
                  Then reach out to discuss how these frameworks can serve your specific context.
                </p>

                <div className="mt-8 space-y-4">
                  <Link
                    href="/blog/ultimate-purpose-of-man"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                  >
                    Read Sample Content
                    <BookOpen className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/contact?source=speaking"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                  >
                    Discuss a Room
                    <Calendar className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/resources/strategic-frameworks"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
                  >
                    View Strategic Frameworks
                    <Workflow className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <h3 className="font-serif text-2xl font-semibold text-white">
              Substance Over Performance
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-400">
              No motivational noise. No generic content. Just canonical doctrine, 
              strategic frameworks, and implementation tooling for serious leaders.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="mailto:info@abrahamoflondon.org?subject=Speaking%20Engagement"
                className="rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
              >
                Email to Discuss
              </Link>
              <Link
                href="/chatham-rooms"
                className="rounded-xl border border-gold/60 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-all hover:border-gold hover:bg-gold/10"
              >
                Learn About Chatham Rooms
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SpeakingPage;