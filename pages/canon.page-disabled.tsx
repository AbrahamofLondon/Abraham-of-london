import type { NextPage } from "next";
import Head from "next/head";
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";

const CanonLandingPage: NextPage = () => {
  return (
    <Layout title="The Canon - Civilisational Operating System">
      <Head>
        <meta
          name="description"
          content="Ten volumes mapping the architecture of purpose, identity, family, culture, institutions, nations, power, governance, civilisation, and destiny."
        />
        <meta
          property="og:title"
          content="The Canon - Civilisational Operating System"
        />
        <meta
          property="og:description"
          content="For builders, leaders, and nation-shapers who refuse the drift of modern culture."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-charcoal text-cream">
        {/* Hero Section */}
        <section className="relative border-b border-softGold/20">
          <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
            <div className="text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-softGold">
                  A Civilisational Operating System for Builders, Leaders &amp;
                  Nation-Shapers
                </span>
              </div>

              <div className="mb-6">
                <span className="text-sm text-gray-400">
                  By Abraham of London
                </span>
              </div>

              <h1 className="mb-8 font-serif text-5xl font-bold tracking-tight lg:text-7xl">
                THE CANON
              </h1>

              <p className="mx-auto mb-12 max-w-3xl text-xl leading-relaxed text-gray-300 lg:text-2xl">
                <span className="text-softGold">
                  Ten Volumes. One Architecture.
                </span>
                <br />A Blueprint Older Than Empires.
              </p>

              <div className="mx-auto max-w-2xl space-y-6 text-lg leading-relaxed text-gray-300">
                <p>
                  There are books you read for inspiration.
                  <br />
                  There are books you read for knowledge.
                </p>
                <p>
                  Then there are rare works
                  <br />
                  written to reshape the imagination of an age -
                  <br />
                  to rebuild what has been broken,
                  <br />
                  restore what has been lost,
                  <br />
                  and prepare a generation to stand firm
                  <br />
                  when the world shakes.
                </p>
                <p className="font-serif text-2xl font-bold text-cream">
                  The Canon is that work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What The Canon Is */}
        <section className="border-b border-softGold/20 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid items-start gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-8 font-serif text-3xl font-bold">
                  WHAT THE CANON IS NOT
                </h2>
                <ul className="space-y-4 text-lg text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">×</span>
                    <span>It is not a motivational series.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">×</span>
                    <span>It is not a theology manual.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">×</span>
                    <span>It is not a political manifesto.</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="mb-8 font-serif text-3xl font-bold">
                  WHAT THE CANON IS
                </h2>
                <p className="mb-6 font-serif text-2xl font-bold text-softGold">
                  A civilisational operating system -
                </p>
                <p className="text-lg leading-relaxed text-gray-300">
                  ten volumes mapping the architecture of purpose, identity,
                  family, culture, institutions, nations, power, governance,
                  civilisation, and destiny.
                </p>
                <p className="mt-6 text-xl font-bold text-cream">
                  This is not content.
                  <br />
                  This is construction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* For Those Who Refuse The Drift */}
        <section className="border-b border-softGold/20 bg-black/30 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-16 text-center font-serif text-4xl font-bold">
              FOR THOSE WHO REFUSE THE DRIFT
            </h2>

            <div className="grid gap-12 text-lg md:grid-cols-2">
              <div className="space-y-6">
                <p className="leading-relaxed text-gray-300">
                  Modern culture is collapsing into noise, confusion, and
                  self-worship.
                  <br />
                  <br />
                  But decay is not destiny.
                  <br />
                  And chaos is not inevitable.
                </p>

                <div className="border-l-2 border-softGold py-2 pl-6">
                  <p className="text-cream font-semibold">
                    The Canon does not flatter.
                    <br />
                    The Canon does not compromise.
                    <br />
                    The Canon does not bend to the spirit of the age.
                  </p>
                </div>

                <p className="font-bold text-cream">
                  It restores order.
                  <br />
                  It restores structure.
                  <br />
                  It restores purpose.
                </p>
              </div>

              <div>
                <h3 className="mb-6 font-serif text-xl font-bold text-softGold">
                  ACROSS THESE VOLUMES YOU WILL LEARN:
                </h3>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how people are formed,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how families shape history,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how cultures rise and fall,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how nations stand or collapse,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how institutions succeed or rot,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how leaders carry weight,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how civilisations are built,</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>how destiny is stewarded across generations.</span>
                  </li>
                </ul>

                <p className="mt-8 border-t border-gray-600 pt-6 text-center font-bold text-cream">
                  This is a work for the builders,
                  <br />
                  not the spectators.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED CANON MATERIALS (IMAGES + ROUTES) */}
        <section className="border-b border-softGold/20 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 text-center">
              <h2 className="mb-3 font-serif text-3xl font-bold">
                Featured Canon Artefacts
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 md:text-base">
                Three anchor texts introducing the Canon: the public letter, the
                doctrinal backbone, and the campaign declaration for a new era
                of builders.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* 1. Canon Introduction Letter */}
              <div className="flex flex-col rounded-3xl border border-softGold/25 bg-black/40 p-4">
                <Link
                  href="/canon/canon-introduction-letter"
                  className="group flex flex-1 flex-col"
                >
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-softGold/20">
                    <Image
                      src="/assets/images/canon/canon-intro-letter-cover.jpg"
                      alt="The Canon: A Letter from the Author - cover"
                      width={400}
                      height={600}
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-cream">
                    The Canon: A Letter from the Author
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-gray-300">
                    A formal public letter setting the assignment, tone, and
                    demand of the Canon for builders, fathers, mothers, leaders,
                    and reformers.
                  </p>
                  <p className="mb-4 text-xs uppercase tracking-[0.18em] text-softGold/80">
                    FOUNDATIONAL ORIENTATION
                  </p>
                </Link>
                <div className="mt-2">
                  <Link
                    href="/canon/canon-introduction-letter"
                    className="inline-block rounded-full bg-softGold px-5 py-2 text-xs font-semibold text-deepCharcoal transition hover:bg-softGold/90"
                  >
                    Read Letter →
                  </Link>
                </div>
              </div>

              {/* 2. The Builder's Catechism */}
              <div className="flex flex-col rounded-3xl border border-softGold/25 bg-black/40 p-4">
                <Link
                  href="/canon/builders-catechism"
                  className="group flex flex-1 flex-col"
                >
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-softGold/20">
                    <Image
                      src="/assets/images/canon/builders-catechism-cover.jpg"
                      alt="The Builder's Catechism - cover"
                      width={400}
                      height={600}
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-cream">
                    The Builder&apos;s Catechism
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-gray-300">
                    A systematic Q&amp;A for builders, fathers, and
                    civilisation-carriers - short, sharp, doctrinal, and
                    uncompromising.
                  </p>
                  <p className="mb-4 text-xs uppercase tracking-[0.18em] text-softGold/80">
                    DOCTRINAL SPINE
                  </p>
                </Link>
                <div className="mt-2">
                  <Link
                    href="/canon/builders-catechism"
                    className="inline-block rounded-full bg-softGold px-5 py-2 text-xs font-semibold text-deepCharcoal transition hover:bg-softGold/90"
                  >
                    Read Catechism →
                  </Link>
                </div>
              </div>

              {/* 3. Campaign / New Era of Builders */}
              <div className="flex flex-col rounded-3xl border border-softGold/25 bg-black/40 p-4">
                <Link
                  href="/canon/canon-campaign"
                  className="group flex flex-1 flex-col"
                >
                  <div className="relative mb-4 overflow-hidden rounded-2xl border border-softGold/20">
                    <Image
                      src="/assets/images/canon/canon-campaign-cover.jpg"
                      alt="The Canon - A New Era of Builders - campaign cover"
                      width={400}
                      height={600}
                      className="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-cream">
                    The Canon - A New Era of Builders
                  </h3>
                  <p className="mb-3 text-sm leading-relaxed text-gray-300">
                    A cinematic declaration announcing the rise of a disciplined
                    remnant of builders who will rebuild from the foundations
                    up.
                  </p>
                  <p className="mb-4 text-xs uppercase tracking-[0.18em] text-softGold/80">
                    CAMPAIGN STANDARD
                  </p>
                </Link>
                <div className="mt-2">
                  <Link
                    href="/canon/canon-campaign"
                    className="inline-block rounded-full bg-softGold px-5 py-2 text-xs font-semibold text-deepCharcoal transition hover:bg-softGold/90"
                  >
                    Read Campaign →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Ten Volumes */}
        <section className="border-b border-softGold/20 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-4 text-center font-serif text-4xl font-bold">
              THE TEN VOLUMES
            </h2>
            <p className="mx-auto mb-16 max-w-2xl text-center text-gray-400">
              Together, these ten volumes form a single architectural body for
              those who intend to build what outlives them.
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  number: "I",
                  title: "The Person",
                  subtitle: "Identity, Character & the Architecture of Self",
                },
                {
                  number: "II",
                  title: "The Person in Motion",
                  subtitle: "Discipline, Agency & Will",
                },
                {
                  number: "III",
                  title: "The Family",
                  subtitle: "The First Institution of Civilisation",
                },
                {
                  number: "IV",
                  title: "Formation",
                  subtitle: "Culture, Memory & Multigenerational Transfer",
                },
                {
                  number: "V",
                  title: "The Nation",
                  subtitle: "People, Borders & Identity",
                },
                {
                  number: "VI",
                  title: "Power",
                  subtitle: "Authority, Justice & the Stewardship of Order",
                },
                {
                  number: "VII",
                  title: "Institutions",
                  subtitle: "Systems, Structure & Continuity",
                },
                {
                  number: "VIII",
                  title: "Governance",
                  subtitle: "Law, Order & the Management of Society",
                },
                {
                  number: "IX",
                  title: "Civilisation",
                  subtitle: "Rise, Peak, Decay & Renewal",
                },
                {
                  number: "X",
                  title: "The Arc of Future Civilisation",
                  subtitle: "The Consolidated Master Edition",
                },
              ].map((volume) => (
                <div
                  key={volume.number}
                  className="rounded-lg border border-softGold/20 bg-black/20 p-6 transition-all duration-300 hover:bg-black/40"
                >
                  <div className="mb-2 font-mono text-sm text-softGold">
                    {volume.number}
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-bold text-cream">
                    {volume.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-300">
                    {volume.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who The Canon Is For */}
        <section className="border-b border-softGold/20 bg-black/30 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <h2 className="mb-8 font-serif text-4xl font-bold">
                  WHO THE CANON IS FOR
                </h2>

                <div className="space-y-8">
                  {[
                    {
                      title: "The Builder",
                      description:
                        "The one who creates systems, structures, institutions, and legacy.",
                    },
                    {
                      title: "The Father & Mother",
                      description:
                        "The ones who shape identity, destiny, and culture in their home.",
                    },
                    {
                      title: "The Founder & Leader",
                      description:
                        "Those responsible for teams, organisations, communities.",
                    },
                    {
                      title: "The Statesman & Nation-Shaper",
                      description:
                        "Those who carry the burden of people and policy.",
                    },
                    {
                      title: "The Student of History & Destiny",
                      description:
                        "Those who understand civilisation is not an accident.",
                    },
                  ].map((person) => (
                    <div
                      key={person.title}
                      className="border-l-2 border-softGold py-2 pl-6"
                    >
                      <h3 className="mb-2 font-serif text-xl font-bold text-cream">
                        {person.title}
                      </h3>
                      <p className="text-gray-300">{person.description}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-8 border-t border-gray-600 pt-6 text-lg font-bold text-cream">
                  If you feel the weight of responsibility on your life,
                  <br />
                  you are the audience for this Canon.
                </p>
              </div>

              <div>
                <h2 className="mb-8 font-serif text-4xl font-bold text-softGold">
                  THE CANON IS NOT FOR EVERYONE
                </h2>

                <div className="space-y-6 text-lg">
                  <p className="leading-relaxed text-gray-300">
                    The Canon is for those who understand:
                  </p>

                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-softGold">•</span>
                      <span>that meaning requires discipline,</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-softGold">•</span>
                      <span>that freedom requires boundaries,</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-softGold">•</span>
                      <span>that leadership requires sacrifice,</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-softGold">•</span>
                      <span>that civilisation requires builders,</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 text-softGold">•</span>
                      <span>that destiny requires obedience.</span>
                    </li>
                  </ul>

                  <div className="mt-8 border border-softGold/30 p-6">
                    <p className="text-center font-bold text-cream">
                      It is not for the unteachable.
                      <br />
                      It is not for the unserious.
                      <br />
                      It is not for spectators.
                    </p>
                  </div>

                  <p className="mt-6 text-center font-serif text-xl font-bold text-cream">
                    This is the manual for people who intend to carry weight.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Readers Circle CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="mb-6 font-serif text-4xl font-bold">
              JOIN THE FOUNDING READERS CIRCLE
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-xl text-gray-300">
              Limited to 1,000. Uncompromising depth. Legacy-focused.
            </p>

            <div className="mb-16 grid gap-12 text-left md:grid-cols-2">
              <div className="space-y-6">
                <h3 className="mb-6 font-serif text-2xl font-bold text-softGold">
                  FOUNDING READERS RECEIVE:
                </h3>
                <ul className="space-y-4 text-lg text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>Private early access to chapters</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>Roundtable intelligence briefings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>
                      Masterclasses on purpose &amp; civilisational design
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>Priority access to releases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>Invitations to strategic gatherings</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 text-softGold">•</span>
                    <span>Founder status recorded in Volume X</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-softGold/20 bg-black/40 p-8">
                <p className="mb-6 font-serif text-2xl font-bold text-cream">
                  This is the only time in history you can join at the
                  foundation.
                </p>

                <Link
                  href="/subscribe"
                  className="mb-6 inline-block rounded-full bg-softGold px-12 py-4 text-lg font-bold text-black shadow-lg transition-all duration-300 hover:bg-softGold/90 hover:shadow-xl"
                >
                  → Join the Founding Circle
                </Link>

                <p className="text-sm text-gray-400">
                  Limited to first 1,000 members • Founder status in perpetuity
                </p>
              </div>
            </div>

            {/* Final Prophetic Statement */}
            <div className="mt-16 border-t border-gray-600 pt-16">
              <h2 className="mb-4 font-serif text-3xl font-bold text-softGold">
                THE CANON IS NOT A BOOK.
              </h2>
              <h2 className="mb-12 font-serif text-3xl font-bold">
                IT IS AN ASSIGNMENT.
              </h2>

              <div className="mx-auto max-w-2xl space-y-6 text-lg leading-relaxed text-gray-300">
                <p>
                  You were not born to drift.
                  <br />
                  You were not born to drown in noise.
                  <br />
                  You were not born to surrender your mind to a culture without
                  truth.
                </p>

                <p className="font-serif text-2xl font-bold text-cream">
                  You were made to build.
                </p>

                <p className="text-xl font-bold text-softGold">
                  The Canon is your blueprint.
                </p>

                <p className="mt-12 font-serif text-3xl font-bold text-cream">
                  Build what time cannot break.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonLandingPage;