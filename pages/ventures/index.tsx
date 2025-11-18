// pages/ventures/index.tsx

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import { pickEnvUrl, ENV_KEYS } from "@/lib/utils";

type VentureStatus = "Active" | "Emerging" | "In development";

interface Venture {
  name: string;
  slug?: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
  status: VentureStatus | string;
  focus: string;
  externalLabel?: string;
}

// Resolve external URLs safely with env overrides
const ALOMARADA_URL = pickEnvUrl(
  [ENV_KEYS.ALOMARADA_URL],
  "https://alomarada.com/",
);

const ENDURELUXE_URL = pickEnvUrl(
  [ENV_KEYS.ENDURELUXE_URL],
  "https://alomarada.com/endureluxe",
);

// Branded InnovateHub URL by default, with env overrides
const INNOVATEHUB_URL = pickEnvUrl(
  [ENV_KEYS.INNOVATEHUB_URL, ENV_KEYS.INNOVATEHUB_ALT_URL],
  "https://innovatehub.abrahamoflondon.org",
);

const ventures: Venture[] = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    description:
      "Board-level advisory, operating systems, and market-entry strategy for founders, boards, and institutions who take Africa seriously.",
    icon: Building2,
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategic advisory · Market systems · Deal architecture",
    externalLabel: "Visit Alomarada.com",
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    description:
      "Community-driven fitness and performance gear for people who train, build, and endure – designed to survive real life, not just product shoots.",
    icon: PackageCheck,
    href: ENDURELUXE_URL,
    status: "Active",
    focus: "Fitness community · Performance gear · Everyday durability",
    externalLabel: "Explore Endureluxe",
  },
  {
    name: "InnovateHub",
    slug: "innovatehub",
    description:
      "Strategy, playbooks, and hands-on support to help founders test ideas, ship durable products, and build operating rhythms that actually hold.",
    icon: Lightbulb,
    href: INNOVATEHUB_URL,
    status: "In development",
    focus: "Innovation engine · Capability building · Venture design",
    externalLabel: "Visit InnovateHub",
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const VenturesPage: NextPage = () => {
  return (
    <Layout title="Ventures">
      <Head>
        <title>Strategic Ventures | Abraham of London</title>
        <meta
          name="description"
          content="The venture portfolio connected to Abraham of London — Alomarada, Endureluxe, and InnovateHub — built around one mindset: truth, responsibility, and multi-generational legacy."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
        {/* HERO */}
        <section className="border-b border-white/10 bg-gradient-to-b from-black/80 via-deepCharcoal/80 to-black/90">
          <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-20 md:flex-row md:items-center md:justify-between md:pt-24">
            <div className="max-w-xl">
              <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
                Abraham of London · Ventures
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-cream sm:text-4xl md:text-5xl">
                Ventures that move in the{" "}
                <span className="text-softGold">same direction</span>.
              </h1>
              <p className="mt-5 max-w-xl text-sm text-gray-200 md:text-base">
                The writing, fatherhood work, and strategy conversations live at
                the centre. These ventures carry that same spine into boardrooms,
                gyms, communities, and build rooms across markets.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 text-xs md:text-sm">
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  From the house of{" "}
                  <span className="font-semibold text-softGold">
                    Abraham of London
                  </span>
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  Strategy · Product · Ecosystems
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  Built for kings, builders &amp; boards
                </div>
              </div>
            </div>

            <div className="mt-10 w-full max-w-md md:mt-0">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                  <span>Abraham of London · House View</span>
                  <span className="rounded-full bg-softGold/10 px-2 py-1 text-[0.65rem] text-softGold">
                    Aligned ventures
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm text-gray-100">
                  <div>
                    <dt className="text-xs text-gray-400">Core narrative</dt>
                    <dd className="mt-1 font-serif text-lg text-softGold">
                      Abraham of London
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Advisory &amp; systems</dt>
                    <dd className="mt-1 font-serif text-lg">Alomarada</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">
                      Fitness &amp; performance culture
                    </dt>
                    <dd className="mt-1 font-serif text-lg">Endureluxe</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Innovation engine</dt>
                    <dd className="mt-1 font-serif text-lg">InnovateHub</dd>
                  </div>
                </dl>
                <div className="mt-6 rounded-2xl bg-black/40 p-3 text-[0.8rem] text-gray-200">
                  One standard. Different expressions. The details shift from
                  venture to venture; the underlying convictions do not.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VENTURES GRID */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-12">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-cream md:text-3xl">
                Venture portfolio
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
                Each venture has a distinct personality, but they share the same
                backbone: clear thinking, hard work, and an unapologetic respect
                for legacy.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
              CURRENT LINES · STRATEGY · FITNESS · INNOVATION
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {ventures.map((venture) => (
              <motion.article
                key={venture.slug ?? venture.name}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-softGold/40 hover:bg-white/10"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-softGold/10 p-3">
                    <venture.icon className="h-7 w-7 text-softGold" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${
                      venture.status === "Active"
                        ? "bg-green-100/10 text-emerald-200"
                        : venture.status === "Emerging"
                        ? "bg-blue-100/10 text-sky-200"
                        : "bg-amber-100/10 text-amber-200"
                    }`}
                  >
                    {venture.status}
                  </span>
                </div>

                <h3 className="mb-2 font-serif text-xl font-semibold text-cream">
                  {venture.name}
                </h3>
                <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-softGold/80">
                  {venture.focus}
                </p>

                <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-200">
                  {venture.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-300">
                    External ·{" "}
                    <span className="font-medium text-softGold">
                      {venture.href.replace(/^https?:\/\//, "")}
                    </span>
                  </span>
                  <Link
                    href={venture.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center text-xs font-semibold uppercase tracking-wide text-softGold hover:text-softGold/80"
                  >
                    {venture.externalLabel ?? "Visit site"}
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* BUILD PHILOSOPHY */}
        <section className="border-t border-white/10 bg-gradient-to-br from-deepCharcoal via-black to-forest/30">
          <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="mb-10 text-center">
              <h2 className="font-serif text-2xl font-semibold text-cream md:text-3xl">
                How we choose what deserves a logo
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300 md:text-base">
                Not every good idea becomes a venture. There is a quiet filter in
                the background that every initiative has to pass before it earns
                the Abraham of London mark.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/15">
                  <Target className="h-6 w-6 text-softGold" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Clear assignment
                </h3>
                <p className="text-sm text-gray-300">
                  The work must serve a real person with a real problem, not just
                  a vanity metric or a trend. If it doesn&apos;t serve, it
                  doesn&apos;t ship.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest/20">
                  <TrendingUp className="h-6 w-6 text-forest/90" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Substance over spin
                </h3>
                <p className="text-sm text-gray-300">
                  The numbers matter, but not on their own. The venture has to
                  make sense when an investor, a father, and a pastor all ask
                  hard questions.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/15">
                  <Users className="h-6 w-6 text-softGold" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Built with people in mind
                </h3>
                <p className="text-sm text-gray-300">
                  Community, brotherhood, and accountability sit in the design,
                  not as decoration. We don&apos;t build things that require men
                  to lose themselves to succeed.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-black/50 px-5 py-6 text-center text-sm text-gray-200 md:px-8">
              If you&apos;re exploring aligned capital, strategic partnership, or
              ecosystem collaboration around these ventures,{" "}
              <Link
                href="/contact"
                className="font-semibold text-softGold underline-offset-4 hover:underline"
              >
                start a strategic conversation
              </Link>
              . Straight talk, clear terms, and no smoke.
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturesPage;