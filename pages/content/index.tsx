import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

/* -------------------------------------------------------------------------- */
/* LUXURY LONDON DESIGN COMPONENTS                                            */
/* -------------------------------------------------------------------------- */

const MayfairDivider: React.FC<{ variant: "gold" | "subtle" }> = ({ variant }) => {
  if (variant === "gold") {
    return (
      <div className="relative h-px my-8">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-pulse" />
      </div>
    );
  }
  
  return (
    <div className="my-12 flex items-center justify-center">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
      <div className="mx-6 text-xl opacity-30 text-cream">·</div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cream/20 to-transparent" />
    </div>
  );
};

const HarrodsCard: React.FC<{
  title: string;
  description: string;
  accent: "gold" | "green" | "blue";
  icon: string;
}> = ({ title, description, accent, icon }) => {
  const accentColor = {
    gold: LIBRARY_AESTHETICS.colors.primary.saffron,
    green: "#065f46", // Deep emerald
    blue: "#1e40af", // Royal blue
  }[accent];

  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl"
      style={{
        borderColor: `${accentColor}30`,
        backgroundColor: "rgba(15,23,42,0.8)",
        backgroundImage: `
          linear-gradient(135deg, ${accentColor}08 0%, transparent 40%),
          radial-gradient(circle at 20% 80%, ${accentColor}12 0%, transparent 50%)
        `,
      }}
    >
      {/* Luxury corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 -translate-y-1/2 translate-x-1/2 rotate-45 opacity-10 group-hover:opacity-20 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="rounded-lg p-3"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <div className="text-2xl" style={{ color: accentColor }}>
              {icon}
            </div>
          </div>
          <div className="flex-1">
            <h3
              className="font-serif text-xl font-medium"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              {title}
            </h3>
          </div>
        </div>
        
        <p
          className="text-sm leading-relaxed opacity-80"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

const SavileRowBadge: React.FC<{
  text: string;
  variant: "standard" | "premium" | "exclusive";
}> = ({ text, variant }) => {
  const styles = {
    standard: {
      bg: "rgba(212, 175, 55, 0.1)",
      border: "rgba(212, 175, 55, 0.3)",
      color: LIBRARY_AESTHETICS.colors.primary.saffron,
    },
    premium: {
      bg: "rgba(30, 64, 175, 0.1)",
      border: "rgba(30, 64, 175, 0.3)",
      color: LIBRARY_AESTHETICS.colors.primary.lapis,
    },
    exclusive: {
      bg: "rgba(101, 163, 13, 0.1)",
      border: "rgba(101, 163, 13, 0.3)",
      color: "#65a30d",
    },
  }[variant];

  return (
    <span
      className="inline-block rounded-full border px-3 py-1 text-xs font-medium tracking-wider"
      style={{
        backgroundColor: styles.bg,
        borderColor: styles.border,
        color: styles.color,
      }}
    >
      {text}
    </span>
  );
};

const RoyalWarrantSeal: React.FC = () => (
  <div className="relative mx-auto h-16 w-16">
    <div className="absolute inset-0 rounded-full border-2 border-amber-400/30" />
    <div className="absolute inset-3 rounded-full border border-amber-400/20" />
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-2xl text-amber-400/60">♔</div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

const ContextPage: NextPage = () => {
  return (
    <Layout
      title="The Context & Philosophy"
      pageTitle=""
      description="The intellectual framework, curation standards, and philosophical pillars that govern Abraham of London's work."
      metaImage="/og-context.png"
    >
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-cream">
        {/* HERO SECTION - LONDON LUXURY */}
        <section className="relative overflow-hidden border-b border-amber-400/20">
          {/* Regal background */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(212, 175, 55, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(30, 64, 175, 0.05) 0%, transparent 50%),
                linear-gradient(to bottom, rgba(15,23,42,0.98) 0%, #020617 100%)
              `,
            }}
          />
          
          {/* Subtle pattern - reminiscent of Savile Row tailoring */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm40 40h40v40H40V40zm0-40h2l-2 2V0zm0 4l4-4h2l-6 6V4zm0 4l8-8h2L40 10V8zm0 4L52 0h2L40 14v-2zm0 4L56 0h2L40 18v-2zm0 4L60 0h2L40 22v-2zm0 4L64 0h2L40 26v-2zm0 4L68 0h2L40 30v-2zm0 4L72 0h2L40 34v-2zm0 4L76 0h2L40 38v-2zm0 4L80 0v2L42 40h-2zm4 0L80 4v2L46 40h-2zm4 0L80 8v2L50 40h-2zm4 0L80 12v2L54 40h-2zm4 0L80 16v2L58 40h-2zm4 0L80 20v2L62 40h-2zm4 0L80 24v2L66 40h-2zm4 0L80 28v2L70 40h-2zm4 0L80 32v2L74 40h-2zm4 0L80 36v2L78 40h-2zM0 40h2L0 42v-2zm4 0h2L4 44v-4zm4 0h2L8 48v-8zm4 0h2L12 52v-12zm4 0h2L16 56v-16zm4 0h2L20 60v-20zm4 0h2L24 64v-24zm4 0h2L28 68v-28zm4 0h2L32 72v-32zm4 0h2L36 76v-36zm4 0h2L40 80v-40z' fill='%23D4AF37' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Gold border accent */}
          <MayfairDivider variant="gold" />

          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Season indicator - like a club badge */}
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2">
                <RoyalWarrantSeal />
                <span
                  className="text-sm font-medium tracking-wider"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                >
                  {SEASONAL_CURATIONS.wisdomTheme}
                </span>
              </div>

              {/* Main title - Regal but understated */}
              <h1 className="mb-6 font-serif text-5xl font-light tracking-tight text-cream sm:text-6xl lg:text-7xl">
                The Context
                <span className="block mt-4 text-lg sm:text-xl lg:text-2xl font-normal tracking-wider text-amber-300/70">
                  Philosophy · Standards · Architecture
                </span>
              </h1>

              <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-cream/80">
                Abraham of London is not a blog or a business. It is a{" "}
                <span className="italic font-medium" style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}>
                  curated ecosystem
                </span>{" "}
                of applied wisdom, governed by specific philosophical pillars and
                curation standards.
              </p>

              {/* London luxury badges */}
              <div className="flex flex-wrap justify-center gap-3 mb-12">
                <SavileRowBadge text="By Appointment" variant="exclusive" />
                <SavileRowBadge text="Applied Wisdom" variant="standard" />
                <SavileRowBadge text="Structural Thinking" variant="premium" />
              </div>

              {/* Regal quote block */}
              <div className="mx-auto max-w-2xl">
                <div
                  className="rounded-xl border p-6 text-left"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                    backgroundColor: "rgba(15,23,42,0.6)",
                  }}
                >
                  <p className="mb-4 font-serif text-lg italic text-cream/90">
                    "The difference between information and wisdom is curation.
                    The difference between wisdom and power is application."
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-px flex-1"
                      style={{ backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30` }}
                    />
                    <span
                      className="text-sm tracking-wider"
                      style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                    >
                      Abraham of London
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHICAL PILLARS - REGAL FRAMEWORK */}
        <section className="relative py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-light text-cream sm:text-4xl">
                The Three Pillars
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-cream/70">
                Every piece of content is evaluated against these foundational principles.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <HarrodsCard
                title="Applied Over Theoretical"
                description="Knowledge must transform into action. Every concept, framework, or insight is judged by its practical utility and real-world application potential."
                accent="gold"
                icon="⚔"
              />
              
              <HarrodsCard
                title="Timeless Over Trendy"
                description="We filter out noise to preserve signal. Content must demonstrate lasting value that transcends current trends and maintains relevance across seasons."
                accent="blue"
                icon="⏳"
              />
              
              <HarrodsCard
                title="Depth Over Volume"
                description="One profound insight outweighs a thousand superficial tips. We prioritize thorough exploration over superficial coverage, depth over breadth."
                accent="green"
                icon="🔍"
              />
            </div>
          </div>
        </section>

        <MayfairDivider variant="subtle" />

        {/* CURATION STANDARDS - LONDON EXCELLENCE */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-3xl font-light text-cream sm:text-4xl">
                Curation Standards
              </h2>
              <p className="max-w-2xl text-lg text-cream/70">
                The exacting criteria governing what earns the Abraham of London seal.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {[
                {
                  title: "Intellectual Rigor",
                  description: "Every piece must withstand critical examination and logical scrutiny.",
                  criteria: [
                    "Clear, logical progression of ideas",
                    "Evidence-based claims where applicable",
                    "Acknowledgement of counterarguments",
                    "Original insights beyond surface-level observations"
                  ],
                  color: LIBRARY_AESTHETICS.colors.primary.saffron,
                  icon: "🎯"
                },
                {
                  title: "Aesthetic Excellence",
                  description: "Form matters as much as function. Presentation elevates understanding.",
                  criteria: [
                    "Thoughtful organization and structure",
                    "Attention to typography and visual hierarchy",
                    "Consistent tone and voice",
                    "Quality of language and expression"
                  ],
                  color: LIBRARY_AESTHETICS.colors.primary.lapis,
                  icon: "✨"
                },
                {
                  title: "Transformative Potential",
                  description: "Content must enable meaningful change in perspective or action.",
                  criteria: [
                    "Clear application pathways",
                    "Actionable frameworks or methods",
                    "Measurable impact potential",
                    "Empowerment over mere information"
                  ],
                  color: "#065f46",
                  icon: "⚡"
                },
                {
                  title: "Integrity & Authenticity",
                  description: "Truthfulness and genuine insight are non-negotiable.",
                  criteria: [
                    "Transparent about limitations",
                    "Original thought over regurgitation",
                    "Ethical considerations addressed",
                    "Author's genuine expertise evident"
                  ],
                  color: "#7c3aed",
                  icon: "🛡️"
                },
              ].map((standard, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-lg p-2"
                      style={{ backgroundColor: `${standard.color}15` }}
                    >
                      <div className="text-xl" style={{ color: standard.color }}>
                        {standard.icon}
                      </div>
                    </div>
                    <h4
                      className="font-serif text-xl font-medium"
                      style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                    >
                      {standard.title}
                    </h4>
                  </div>
                  
                  <p
                    className="text-sm leading-relaxed opacity-80"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                  >
                    {standard.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {standard.criteria.map((criterion, cIdx) => (
                      <li key={cIdx} className="flex items-start gap-3">
                        <div
                          className="mt-1.5 h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: standard.color }}
                        />
                        <span
                          className="text-sm opacity-80"
                          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                        >
                          {criterion}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THE ARCHIVE'S PURPOSE - CLARENDON HOUSE VIBE */}
        <section className="py-16 border-y border-amber-400/10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-light text-cream sm:text-4xl">
                The Purpose
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-cream/70">
                Why this collection exists, and who it serves.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* For Seekers of Substance */}
              <div
                className="rounded-xl border p-6"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                  backgroundColor: "rgba(15,23,42,0.6)",
                  backgroundImage: `
                    linear-gradient(135deg, rgba(212,175,55,0.05) 0%, transparent 40%)
                  `,
                }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15` }}
                  >
                    <div className="text-xl" style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}>
                      👑
                    </div>
                  </div>
                  <h3
                    className="font-serif text-2xl font-medium"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                  >
                    For Seekers of Substance
                  </h3>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Men building legacies, not just careers",
                    "Architects of systems and institutions",
                    "Those who value wisdom over information",
                    "Builders frustrated by shallow advice",
                    "Leaders seeking timeless principles"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className="mt-2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
                      />
                      <span
                        className="text-lg leading-relaxed"
                        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* The Intended Impact */}
              <div
                className="rounded-xl border p-6"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.lapis}30`,
                  backgroundColor: "rgba(15,23,42,0.6)",
                  backgroundImage: `
                    linear-gradient(135deg, rgba(30,64,175,0.05) 0%, transparent 40%)
                  `,
                }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.lapis}15` }}
                  >
                    <div className="text-xl" style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                      🏛️
                    </div>
                  </div>
                  <h3
                    className="font-serif text-2xl font-medium"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                  >
                    The Intended Impact
                  </h3>
                </div>
                
                <ul className="space-y-4">
                  {[
                    "Transform insight into tangible action",
                    "Build systems that outlast individual effort",
                    "Develop judgment that improves with time",
                    "Create work that matters beyond metrics",
                    "Cultivate wisdom that compounds across domains"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className="mt-2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.lapis }}
                      />
                      <span
                        className="text-lg leading-relaxed"
                        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* JOURNEY THROUGH THE WORK - LONDON CLUB PROGRESSION */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-3xl font-light text-cream sm:text-4xl">
                The Progression
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-cream/70">
                How to engage with the work for maximum impact.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  chapter: "Foundation",
                  title: "Canon & Principles",
                  description: "Begin with canonical works that establish first principles and core frameworks.",
                  duration: "First Principles",
                  icon: "📜",
                  color: CONTENT_CATEGORIES.CANON.color,
                },
                {
                  chapter: "Application",
                  title: "Strategic Essays",
                  description: "Move to strategic essays that apply principles to real-world scenarios.",
                  duration: "Real World",
                  icon: "⚔",
                  color: CONTENT_CATEGORIES.POSTS.color,
                },
                {
                  chapter: "Execution",
                  title: "Tools & Frameworks",
                  description: "Implement with practical resources, templates, and execution frameworks.",
                  duration: "Applied",
                  icon: "⚙",
                  color: CONTENT_CATEGORIES.RESOURCES.color,
                },
                {
                  chapter: "Integration",
                  title: "Gatherings & Rooms",
                  description: "Synthesize learning through live sessions and community engagement.",
                  duration: "Community",
                  icon: "🕯",
                  color: CONTENT_CATEGORIES.EVENTS.color,
                },
              ].map((chapter, idx) => (
                <div
                  key={idx}
                  className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: `${chapter.color}30`,
                    backgroundColor: "rgba(15,23,42,0.7)",
                    backgroundImage: `
                      linear-gradient(135deg, ${chapter.color}08 0%, transparent 40%)
                    `,
                  }}
                >
                  <div className="relative">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="rounded-lg p-2"
                          style={{ backgroundColor: `${chapter.color}15` }}
                        >
                          <div className="text-lg" style={{ color: chapter.color }}>
                            {chapter.icon}
                          </div>
                        </div>
                        <span
                          className="text-xs font-medium uppercase tracking-wider"
                          style={{ color: chapter.color }}
                        >
                          {chapter.chapter}
                        </span>
                      </div>
                      <div
                        className="rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: `${chapter.color}15`,
                          color: chapter.color,
                        }}
                      >
                        {chapter.duration}
                      </div>
                    </div>
                    
                    <h5
                      className="mb-2 font-serif text-lg font-medium"
                      style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                    >
                      {chapter.title}
                    </h5>
                    
                    <p
                      className="text-sm leading-relaxed opacity-80"
                      style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                    >
                      {chapter.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/content"
                className="group inline-flex items-center gap-3 rounded-full border px-8 py-3 text-sm font-medium transition-all hover:gap-4 hover:shadow-lg"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                  backgroundColor: "rgba(15,23,42,0.8)",
                  color: LIBRARY_AESTHETICS.colors.primary.saffron,
                }}
              >
                <span>Explore the Work</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* LUXURY FOOTER - LONDON BRAND */}
        <footer className="border-t border-amber-400/10 bg-slate-950 py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            {/* London brand mark */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2">
                <div className="text-lg text-amber-400/60">A</div>
                <div className="h-px w-8 bg-amber-400/30"></div>
                <div className="text-lg text-amber-400/60">L</div>
              </div>
            </div>
            
            <p className="mb-4 text-sm italic text-cream/60">
              Abraham of London — Canon, ventures, and structural tools for builders of legacy.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-xs text-cream/40">
              {Object.values(SEASONAL_CURATIONS.tactileSignals).map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            
            <div className="mt-8 border-t border-slate-800 pt-8">
              <Link
                href="/content"
                className="text-sm text-cream/60 transition-colors hover:text-cream"
              >
                Return to the Work →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default ContextPage;