// pages/books/the-architecture-of-human-purpose-landing.tsx

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

const PAGE_TITLE = "The Architecture of Human Purpose";
const PAGE_DESCRIPTION =
  "A strategic Prelude for fathers, founders, policymakers, and nation-shapers. Discover the architecture behind human purpose, identity, civilisation and destiny.";

const ArchitectureOfHumanPurposeLandingPage: NextPage = () => {
  return (
    <Layout title={PAGE_TITLE}>
      <Head>
        <title>{PAGE_TITLE} | Abraham of London</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta
          name="keywords"
          content="purpose, civilisation, governance, leadership, theology, strategic frameworks, institutional design, Abraham of London"
        />
      </Head>

      <div className="relative min-h-screen bg-black text-white">
        {/* Background wash */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-[#020617]" />
          <div className="absolute -top-32 left-0 h-80 w-80 rounded-full bg-softGold/10 blur-3xl" />
          <div className="absolute top-1/3 right-0 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        </div>

        {/* HERO */}
        <section className="relative px-4 pt-28 pb-20 md:pt-32 md:pb-28">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-center">
            {/* Hero text */}
            <div className="flex-1">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-softGold">
                PRELUDE MINIBOOK · LIMITED RELEASE
              </p>

              <h1 className="mb-5 font-serif text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
                The Architecture of{" "}
                <span className="bg-gradient-to-r from-softGold via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                  Human Purpose
                </span>
              </h1>

              <p className="mb-8 max-w-xl text-sm leading-relaxed text-gray-300 sm:text-base">
                Human flourishing is not random. It is{" "}
                <span className="font-semibold text-softGold">
                  architectural
                </span>
                . This limited-release Prelude introduces the hidden patterns
                that govern purpose, identity, civilisation, and destiny —
                drawn from the forthcoming multi-volume Canon by{" "}
                <span className="font-semibold">Abraham of London</span>.
              </p>

              <div className="mb-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-deepCharcoal shadow-2xl shadow-softGold/30 transition-transform duration-300 hover:scale-[1.03] hover:shadow-softGold/40 md:text-base"
                  prefetch
                >
                  Join the Founding Readers Circle
                </Link>

                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="inline-flex items-center justify-center rounded-full border border-softGold/70 bg-black/40 px-8 py-3 text-sm font-semibold text-softGold backdrop-blur-md transition-all duration-300 hover:border-softGold hover:bg-softGold/10 hover:scale-[1.02] md:text-base"
                  prefetch
                >
                  Read the Prelude Online
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
                  <span>Strategic Theology · Governance · Civilisation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-softGold/70" />
                  <span>Approx. 20 min read — digital first</span>
                </div>
              </div>
            </div>

            {/* Hero card */}
            <div className="flex-1">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-softGold/40 via-amber-500/20 to-sky-500/30 opacity-60 blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-6 backdrop-blur-2xl">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-softGold">
                    WHAT THIS PRELUDE IS
                  </p>
                  <p className="mb-4 text-sm leading-relaxed text-gray-200">
                    Not a motivational pamphlet. Not a self-help tract. A
                    deliberate <strong>entry point</strong> into a larger Canon
                    that unites theology, history, systems thinking, governance,
                    and institutional design for those who still carry
                    responsibility in an age of drift.
                  </p>
                  <div className="mt-4 rounded-2xl border border-softGold/30 bg-black/60 p-4 text-xs text-gray-300">
                    <p className="mb-1 font-semibold text-softGold">
                      In one line:
                    </p>
                    <p>
                      <span className="font-medium text-white">
                        Civilisation is human purpose,
                      </span>{" "}
                      structured and scaled across generations. This Prelude
                      hands you the language and the lens before the full
                      frameworks are released.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHO IT IS FOR */}
        <section className="relative border-t border-white/10 bg-black/80 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mb-2 font-serif text-2xl text-white md:text-3xl">
                  For Those Who Carry{" "}
                  <span className="text-softGold">Responsibility</span>
                </h2>
                <p className="max-w-xl text-sm leading-relaxed text-gray-300 md:text-base">
                  This work is written for those who quietly shoulder weight in
                  their homes, organisations, and nations — and refuse to
                  pretend that “business as usual” is working.
                </p>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.26em] text-softGold/80">
                FATHERS · FOUNDERS · REFORMERS
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Fathers & Mothers",
                  body: "Raising sons and daughters who understand calling, responsibility, and covenant — not just ambition.",
                },
                {
                  title: "Founders, Investors & Board Members",
                  body: "Building companies, funds, and institutions that are structurally aligned with purpose, not just valuation.",
                },
                {
                  title: "Policy-Makers & Civil Servants",
                  body: "Grappling with law, trade, security, and social order while still fearing God and honouring conscience.",
                },
                {
                  title: "Pastors, Elders & Cultural Architects",
                  body: "Shepherding people, churches, movements, and ideas through an age that has forgotten both Eden and judgment.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:border-softGold/50 hover:bg-white/10"
                >
                  <h3 className="mb-2 text-sm font-semibold text-softGold md:text-base">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT YOU WILL ENCOUNTER */}
        <section className="relative px-4 py-16 md:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-serif text-2xl text-white md:text-3xl">
                Inside the <span className="text-softGold">Prelude</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                Seven tightly written movements walk you through the structural
                logic of human purpose, institutional order, and civilisational
                destiny — without yet opening the full vault of frameworks.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Eden as Governance Blueprint",
                  body: "Not a children’s story, but the original constitution of work, boundaries, authority, relationship, and meaning.",
                },
                {
                  title: "The Problem Beneath Every Problem",
                  body: "Why our age excels at invention but collapses at alignment — and why unbounded autonomy always eats itself.",
                },
                {
                  title: "Why Some Lives Thrive",
                  body: "Structural distinctions between those who build generational impact and those who live on endless repeat.",
                },
                {
                  title: "Civilisation’s Rise & Fall",
                  body: "Egypt, Babylon, Rome, the West, and Africa read through alignment, moral gravity, and institutional decay.",
                },
                {
                  title: "The Convergence",
                  body: "How religion, state, markets, and algorithms are merging into a new governing architecture of formation.",
                },
                {
                  title: "The Human Question",
                  body: "A precise, worked-through answer to ‘Why am I here?’ that takes origin, morality, love, responsibility, and destiny seriously.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col rounded-3xl border border-white/10 bg-black/60 p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:border-softGold/50"
                >
                  <h3 className="mb-2 text-sm font-semibold text-softGold md:text-base">
                    {item.title}
                  </h3>
                  <p className="flex-1 text-sm leading-relaxed text-gray-300">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-3xl border border-softGold/30 bg-black/70 p-5 text-center text-sm text-gray-200 md:p-6 md:text-base">
              <p className="mb-2 font-serif text-lg text-softGold md:text-xl">
                “Civilisation is human purpose, structured and scaled across
                generations.”
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">
                EXCERPT · THE ARCHITECTURE OF HUMAN PURPOSE
              </p>
            </div>
          </div>
        </section>

        {/* FUTURE VOLUMES */}
        <section className="relative border-t border-white/10 bg-black/90 px-4 py-16 md:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="mb-3 font-serif text-2xl text-white md:text-3xl">
                Beyond the Prelude:{" "}
                <span className="text-softGold">Canon Volumes Ahead</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                The Prelude is the doorway. The Canon itself includes deeper
                volumes designed for those who will not simply consume ideas,
                but govern, build, and reform. Two of those pillars are{" "}
                <span className="font-semibold text-softGold">
                  the Architect’s Treasury
                </span>{" "}
                and{" "}
                <span className="font-semibold text-softGold">
                  the Master Edition
                </span>
                .
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Volume X — Architect's Treasury */}
              <div className="rounded-3xl border border-softGold/40 bg-black/70 p-6 backdrop-blur-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-softGold">
                  VOLUME X · THE ARCHITECT’S TREASURY
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-200">
                  Here ends the age of intuition. <br />
                  Here begins the age of intention.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  Here the blueprint is unveiled — clear, structured,
                  disciplined, complete.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  For those who will shape nations, command institutions, father
                  generations, and build what time cannot break.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  <span className="font-semibold text-softGold">
                    Volume X is the Architect’s Treasury.
                  </span>
                </p>
                <p className="mb-2 text-sm leading-relaxed text-gray-300">
                  The diagrams are not decoration. They are weapons.
                </p>
                <p className="mb-2 text-sm leading-relaxed text-gray-300">
                  The frameworks are not theories. They are engines.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  The models are not abstractions. They are anchors.
                </p>
                <p className="text-sm leading-relaxed text-gray-200">
                  The future belongs to those who understand the architecture
                  behind human destiny.
                </p>
              </div>

              {/* Master Edition — Inheritance */}
              <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-softGold">
                  MASTER EDITION · INHERITANCE VOLUME
                </p>
                <p className="mb-3 text-sm leading-relaxed text-gray-200">
                  Civilisation is not saved by the loud, but by the aligned.
                </p>
                <p className="mb-2 text-sm leading-relaxed text-gray-300">
                  Not by those who react, but by those who design.
                </p>
                <p className="mb-2 text-sm leading-relaxed text-gray-300">
                  Not by those who rage, but by those who build.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  <span className="font-semibold text-softGold">
                    This is your inheritance: the Master Edition.
                  </span>
                </p>
                <p className="mb-1 text-sm leading-relaxed text-gray-300">
                  Guard it.
                </p>
                <p className="mb-1 text-sm leading-relaxed text-gray-300">
                  Deploy it.
                </p>
                <p className="mb-1 text-sm leading-relaxed text-gray-300">
                  Teach it.
                </p>
                <p className="mb-4 text-sm leading-relaxed text-gray-300">
                  Strengthen it.
                </p>
                <p className="text-sm leading-relaxed text-gray-200">
                  For the age of chaos is loud, but the age of builders is
                  rising.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDING READERS CIRCLE */}
        <section className="relative border-t border-white/10 bg-gradient-to-b from-black via-black to-[#020617] px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <h2 className="mb-3 font-serif text-2xl text-white md:text-3xl">
                Join the{" "}
                <span className="text-softGold">Founding Readers Circle</span>
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                The Canon is entering final editorial review. A small circle
                will walk with it from the beginning — not as spectators, but as
                co-labourers in alignment and build-out.
              </p>
            </div>

            <div className="rounded-3xl border border-softGold/40 bg-black/70 p-6 backdrop-blur-2xl md:p-8">
              <ul className="mb-6 space-y-3 text-sm text-gray-200 md:text-base">
                <li>• Private chapter previews and working drafts</li>
                <li>
                  • Closed-door masterclasses on purpose, governance, and
                  civilisation
                </li>
                <li>• First-release digital editions before public launch</li>
                <li>
                  • Strategic roundtable invitations (online and in select
                  cities)
                </li>
                <li>
                  • Priority membership in the Abraham of London / Fathering
                  Without Fear ecosystem
                </li>
                <li>
                  • Name recorded in the Canon’s{" "}
                  <span className="font-semibold text-softGold">
                    Founding Registry
                  </span>
                </li>
              </ul>

              <div className="mb-6 rounded-2xl border border-softGold/40 bg-softGold/10 p-4 text-xs text-softGold md:text-sm">
                Membership is intentionally capped at{" "}
                <span className="font-semibold">1,000</span> for depth,
                relationship, and legacy impact — not volume.
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/subscribe"
                  className="inline-flex items-center justify-center rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-deepCharcoal shadow-2xl shadow-softGold/30 transition-transform duration-300 hover:scale-[1.03] hover:shadow-softGold/40 md:text-base"
                  prefetch
                >
                  Secure Your Place
                </Link>
                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="inline-flex items-center justify-center rounded-full border border-softGold/70 bg-transparent px-8 py-3 text-sm font-semibold text-softGold transition-all duration-300 hover:bg-softGold/10 hover:scale-[1.02] md:text-base"
                  prefetch
                >
                  Read the Prelude First
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL FRAMING */}
        <section className="relative px-4 pb-20 pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 font-serif text-2xl text-white md:text-3xl">
              If You’ve Read This Far, You Are Not Average
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-300 md:text-base">
              You were not born to numb yourself with distraction. You were not
              designed to drift through history as a spectator. You were not
              placed in this generation by accident.
            </p>
            <p className="mb-6 text-sm leading-relaxed text-gray-300 md:text-base">
              There is an architecture to purpose. There is an order beneath the
              noise. There is still time to build what outlasts you.
            </p>

            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-deepCharcoal shadow-xl shadow-softGold/30 transition-transform duration-300 hover:scale-[1.03] hover:shadow-softGold/40 md:text-base"
                prefetch
              >
                Get the Prelude & Join the Circle
              </Link>
              <Link
                href="/share/the-architecture-of-human-purpose"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-xs font-semibold text-gray-200 transition-all duration-300 hover:border-softGold/60 hover:bg-white/10 hover:scale-[1.02]"
                prefetch={false}
              >
                Share This With One Serious Friend
              </Link>
            </div>

            <p className="text-[0.75rem] uppercase tracking-[0.26em] text-softGold/70">
              The Canon is coming. It will not arrive quietly.
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ArchitectureOfHumanPurposeLandingPage;