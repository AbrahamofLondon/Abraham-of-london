import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

const PersianOrnament: React.FC<{ type: "header" | "divider"; color?: string }> = ({
  type,
  color = LIBRARY_AESTHETICS.colors.primary.saffron,
}) => {
  if (type === "header") {
    return (
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden opacity-30">
        <div
          className="h-full w-full"
          style={{
            background: `repeating-linear-gradient(90deg, transparent, transparent 10px, ${color} 10px, ${color} 20px)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="my-12 flex items-center justify-center">
      <div className="h-px flex-1" style={{ backgroundColor: `${color}30` }} />
      <div className="mx-6 text-2xl opacity-50" style={{ color }}>
        𓆓
      </div>
      <div className="h-px flex-1" style={{ backgroundColor: `${color}30` }} />
    </div>
  );
};

const PhilosophyPillar: React.FC<{
  number: string;
  title: string;
  description: string;
  color: string;
  icon: string;
}> = ({ number, title, description, color, icon }) => (
  <div
    className="relative overflow-hidden rounded-2xl border p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
    style={{
      borderColor: `${color}30`,
      backgroundColor: "rgba(15,23,42,0.7)",
      backdropFilter: "blur(10px)",
    }}
  >
    {/* Glow effect */}
    <div
      className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 blur-2xl"
      style={{ backgroundColor: color }}
    />

    <div className="relative">
      <div className="mb-6 flex items-start justify-between">
        <div
          className="rounded-xl p-4"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <div className="text-3xl">{icon}</div>
        </div>
        <div
          className="font-serif text-5xl font-light opacity-20"
          style={{ color }}
        >
          {number}
        </div>
      </div>

      <h3
        className="mb-4 font-serif text-2xl font-medium"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
      >
        {title}
      </h3>

      <p
        className="leading-relaxed opacity-80"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
      >
        {description}
      </p>
    </div>
  </div>
);

const CurationStandard: React.FC<{
  title: string;
  description: string;
  criteria: string[];
  color: string;
}> = ({ title, description, criteria, color }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-4">
      <div
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <h4
        className="font-serif text-xl font-medium"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
      >
        {title}
      </h4>
    </div>

    <p
      className="text-sm leading-relaxed opacity-80"
      style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
    >
      {description}
    </p>

    <ul className="space-y-2">
      {criteria.map((criterion, idx) => (
        <li key={idx} className="flex items-start gap-3">
          <div
            className="mt-1 h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span
            className="text-sm opacity-70"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {criterion}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const ChapterCard: React.FC<{
  chapter: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
}> = ({ chapter, title, description, duration, icon, color }) => (
  <div
    className="group relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
    style={{
      borderColor: `${color}30`,
      backgroundColor: `${color}05`,
    }}
  >
    {/* Decorative corner */}
    <div
      className="absolute -right-6 -top-6 h-16 w-16 rotate-45"
      style={{ backgroundColor: `${color}10` }}
    />

    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: `${color}15` }}
          >
            <div className="text-xl" style={{ color }}>
              {icon}
            </div>
          </div>
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color }}
          >
            {chapter}
          </span>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {duration}
        </div>
      </div>

      <h5
        className="mb-2 font-serif text-lg font-medium"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
      >
        {title}
      </h5>

      <p
        className="text-sm leading-relaxed opacity-80"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
      >
        {description}
      </p>
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
      description="The intellectual framework, curation standards, and philosophical pillars that govern this library of applied wisdom."
      metaImage="/og-context.png"
    >
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-black text-cream">
        {/* HERO ------------------------------------------------------------ */}
        <section
          className="relative overflow-hidden border-b py-24"
          style={{
            borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            background: `
              radial-gradient(circle at 20% 50%, rgba(250,204,21,0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(30,64,175,0.1) 0%, transparent 50%),
              linear-gradient(to bottom, rgba(15,23,42,1) 0%, #020617 100%)
            `,
          }}
        >
          <PersianOrnament type="header" />

          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div
                className="mb-8 inline-flex items-center gap-3 rounded-full px-6 py-3"
                style={{
                  backgroundColor: "rgba(234,179,8,0.08)",
                  border: "1px solid rgba(234,179,8,0.35)",
                }}
              >
                <div className="text-2xl">𓆓</div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.saffron,
                  }}
                >
                  {SEASONAL_CURATIONS.wisdomTheme}
                </span>
              </div>

              <h1 className="mb-6 font-serif text-6xl font-light tracking-tight sm:text-7xl">
                The Context
              </h1>

              <p className="mx-auto mb-8 max-w-3xl text-xl leading-relaxed text-cream/80">
                This is not merely a collection of content. It is a{" "}
                <span
                  className="italic"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.saffron,
                  }}
                >
                  curated ecosystem
                </span>{" "}
                of applied wisdom, governed by specific philosophical pillars and
                curation standards.
              </p>

              <div className="mx-auto max-w-2xl">
                <div
                  className="rounded-2xl border p-8 text-left"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                    backgroundColor: "rgba(15,23,42,0.5)",
                  }}
                >
                  <p className="mb-4 font-serif text-lg italic text-cream/90">
                    "The difference between information and wisdom is curation.
                    The difference between wisdom and power is application."
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-px flex-1"
                      style={{
                        backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                      }}
                    />
                    <span
                      className="text-sm"
                      style={{
                        color: LIBRARY_AESTHETICS.colors.primary.saffron,
                      }}
                    >
                      The Archivist
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHICAL PILLARS ------------------------------------------- */}
        <section className="relative py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-4xl font-light text-cream">
                The Three Pillars
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-cream/70">
                Every piece of content in this library is evaluated against these
                philosophical foundations.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <PhilosophyPillar
                number="I"
                title="Applied Over Theoretical"
                description="Knowledge must transform into action. Every concept, framework, or insight is judged by its practical utility and real-world application potential."
                color={LIBRARY_AESTHETICS.colors.primary.saffron}
                icon="⚔"
              />

              <PhilosophyPillar
                number="II"
                title="Timeless Over Trendy"
                description="We filter out noise to preserve signal. Content must demonstrate lasting value that transcends current trends and maintains relevance across seasons."
                color={LIBRARY_AESTHETICS.colors.primary.lapis}
                icon="⏳"
              />

              <PhilosophyPillar
                number="III"
                title="Depth Over Volume"
                description="One profound insight outweighs a thousand superficial tips. We prioritize thorough exploration over superficial coverage, depth over breadth."
                color="#B45309" // Amber 800 for contrast
                icon="🔍"
              />
            </div>
          </div>
        </section>

        <PersianOrnament type="divider" />

        {/* CURATION STANDARDS ----------------------------------------------- */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-4xl font-light text-cream">
                Curation Standards
              </h2>
              <p className="max-w-2xl text-lg text-cream/70">
                The meticulous criteria governing what enters this collection.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2">
              <CurationStandard
                title="Intellectual Rigor"
                description="Every piece must withstand critical examination and logical scrutiny."
                criteria={[
                  "Clear, logical progression of ideas",
                  "Evidence-based claims where applicable",
                  "Acknowledgement of counterarguments",
                  "Original insights beyond surface-level observations",
                ]}
                color={LIBRARY_AESTHETICS.colors.primary.saffron}
              />

              <CurationStandard
                title="Aesthetic Excellence"
                description="Form matters as much as function. Presentation elevates understanding."
                criteria={[
                  "Thoughtful organization and structure",
                  "Attention to typography and visual hierarchy",
                  "Consistent tone and voice",
                  "Quality of language and expression",
                ]}
                color={LIBRARY_AESTHETICS.colors.primary.lapis}
              />

              <CurationStandard
                title="Transformative Potential"
                description="Content must enable meaningful change in perspective or action."
                criteria={[
                  "Clear application pathways",
                  "Actionable frameworks or methods",
                  "Measurable impact potential",
                  "Empowerment over mere information",
                ]}
                color="#B45309"
              />

              <CurationStandard
                title="Integrity & Authenticity"
                description="Truthfulness and genuine insight are non-negotiable."
                criteria={[
                  "Transparent about limitations",
                  "Original thought over regurgitation",
                  "Ethical considerations addressed",
                  "Author's genuine expertise evident",
                ]}
                color="#059669" // Emerald 600
              />
            </div>
          </div>
        </section>

        {/* THE ARCHIVE'S PURPOSE -------------------------------------------- */}
        <section
          className="py-16"
          style={{
            background: `
              radial-gradient(circle at 30% 50%, rgba(30,64,175,0.1) 0%, transparent 50%),
              linear-gradient(to bottom, transparent, rgba(15,23,42,0.8))
            `,
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-4xl font-light text-cream">
                The Archive's Purpose
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-cream/70">
                Why this collection exists, and who it serves.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div
                className="rounded-2xl border p-8"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                  backgroundColor: "rgba(15,23,42,0.5)",
                }}
              >
                <h3
                  className="mb-6 font-serif text-2xl font-medium"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  For Seekers of Substance
                </h3>
                <ul className="space-y-4">
                  {[
                    "Men building legacies, not just careers",
                    "Architects of systems and institutions",
                    "Those who value wisdom over information",
                    "Builders frustrated by shallow advice",
                    "Leaders seeking timeless principles",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className="mt-2 h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            LIBRARY_AESTHETICS.colors.primary.saffron,
                        }}
                      />
                      <span
                        className="text-lg leading-relaxed"
                        style={{
                          color:
                            LIBRARY_AESTHETICS.colors.primary.parchment,
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="rounded-2xl border p-8"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.lapis}30`,
                  backgroundColor: "rgba(15,23,42,0.5)",
                }}
              >
                <h3
                  className="mb-6 font-serif text-2xl font-medium"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  The Intended Impact
                </h3>
                <ul className="space-y-4">
                  {[
                    "Transform insight into tangible action",
                    "Build systems that outlast individual effort",
                    "Develop judgment that improves with time",
                    "Create work that matters beyond metrics",
                    "Cultivate wisdom that compounds across domains",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div
                        className="mt-2 h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            LIBRARY_AESTHETICS.colors.primary.lapis,
                        }}
                      />
                      <span
                        className="text-lg leading-relaxed"
                        style={{
                          color:
                            LIBRARY_AESTHETICS.colors.primary.parchment,
                        }}
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

        <PersianOrnament type="divider" />

        {/* THE JOURNEY THROUGH THE LIBRARY ---------------------------------- */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 font-serif text-4xl font-light text-cream">
                The Journey Through the Library
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-cream/70">
                How to navigate this collection for maximum impact.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <ChapterCard
                chapter="Chapter I"
                title="Foundation"
                description="Begin with canonical works that establish first principles and core frameworks."
                duration="1-2 weeks"
                icon="📜"
                color={CONTENT_CATEGORIES.CANON.color}
              />

              <ChapterCard
                chapter="Chapter II"
                title="Application"
                description="Move to strategic essays that apply principles to real-world scenarios."
                duration="2-3 weeks"
                icon="⚔"
                color={CONTENT_CATEGORIES.POSTS.color}
              />

              <ChapterCard
                chapter="Chapter III"
                title="Tools"
                description="Implement with practical resources, templates, and execution frameworks."
                duration="Ongoing"
                icon="⚙"
                color={CONTENT_CATEGORIES.RESOURCES.color}
              />

              <ChapterCard
                chapter="Chapter IV"
                title="Integration"
                description="Synthesize learning through live sessions and community engagement."
                duration="Continuous"
                icon="🕯"
                color={CONTENT_CATEGORIES.EVENTS.color}
              />
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/content"
                className="group inline-flex items-center gap-3 rounded-full px-8 py-4 text-lg font-medium transition-all hover:gap-4 hover:shadow-2xl"
                style={{
                  backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron,
                  color: "#0f172a",
                }}
              >
                <span>Enter the Library</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER ----------------------------------------------------------- */}
        <footer className="border-t border-slate-800 bg-slate-950 py-12">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="mb-6">
              <div className="text-3xl opacity-30">𓆓</div>
            </div>
            <p className="mb-4 text-sm italic text-cream/60">
              "A library is not a luxury but one of the necessities of life."
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xs text-cream/40">
              {Object.values(SEASONAL_CURATIONS.tactileSignals).map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="mt-8 border-t border-slate-800 pt-8">
              <Link
                href="/content"
                className="text-sm text-cream/60 transition-colors hover:text-cream"
              >
                Return to Library →
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
};

export default ContextPage;