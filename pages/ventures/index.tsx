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
  superbrandTag?: string;
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
    superbrandTag: "Superbrand innovation lab",
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
          content="The venture portfolio of Abraham of London — Alomarada, Endureluxe, and InnovateHub — built around one mandate: kingship, stewardship, and multi-generational legacy."
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
        {/* HERO */}
        <section className="border-b border-white/10 bg-gradient-to-b from-black/80 via-deepCharcoal/80 to-black/90">
          <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-20 md:flex-row md:items-center md:justify-between md:pt-24">
            <div className="max-w-xl">
              <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
                Abraham of London · Venture Portfolio
              </p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-cream sm:text-4xl md:text-5xl">
                One superbrand.{" "}
                <span className="text-softGold">Three strategic engines.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm text-gray-200 md:text-base">
                Abraham of London is the superbrand — the worldview, the voice,
                and the standard. These ventures are how that standard shows up
                in boardrooms, gyms, communities, and build rooms across markets.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 text-xs md:text-sm">
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  <span className="font-semibold text-softGold">Superbrand:</span>{" "}
                  Abraham of London
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  Strategy · Product · Ecosystems
                </div>
                <div className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-gray-100">
                  Kings, builders &amp; boards in view
                </div>
              </div>
            </div>

            <div className="mt-10 w-full max-w-md md:mt-0">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
                  <span>Abraham of London · Superbrand Map</span>
                  <span className="rounded-full bg-softGold/10 px-2 py-1 text-[0.65rem] text-softGold">
                    Leader
                  </span>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm text-gray-100">
                  <div>
                    <dt className="text-xs text-gray-400">Narrative &amp; lens</dt>
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
                  The homepage, the writing, and the fatherhood work set the
                  bar. These ventures are how that standard gets translated into
                  deals, products, cohorts, and communities that can survive
                  real pressure.
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
                Portfolio under the superbrand
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-300 md:text-base">
                Each venture is accountable to the same spine: kingdom ethics,
                disciplined execution, and a commitment to build work that your
                sons and investors can both respect.
              </p>
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
              CURRENT FOCUS · STRATEGY · PRODUCT · CAPABILITY
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
                  <div className="text-right">
                    <span
                      className={`mb-1 inline-block rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${
                        venture.status === "Active"
                          ? "bg-green-100/10 text-emerald-200"
                          : venture.status === "Emerging"
                          ? "bg-blue-100/10 text-sky-200"
                          : "bg-amber-100/10 text-amber-200"
                      }`}
                    >
                      {venture.status}
                    </span>
                    {venture.superbrandTag && (
                      <div className="text-[0.65rem] uppercase tracking-[0.18em] text-softGold/80">
                        {venture.superbrandTag}
                      </div>
                    )}
                  </div>
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
                The superbrand filter for every venture
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-300 md:text-base">
                If a venture doesn’t pass this filter, it doesn’t get built
                under Abraham of London — no matter how attractive the numbers
                look on paper.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/15">
                  <Target className="h-6 w-6 text-softGold" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Alignment with mandate
                </h3>
                <p className="text-sm text-gray-300">
                  The work must strengthen fathers, founders, and stewards — not
                  just produce revenue. If it fights the core mandate, it’s a
                  distraction, not a venture.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest/20">
                  <TrendingUp className="h-6 w-6 text-forest/90" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Sustainable, honest impact
                </h3>
                <p className="text-sm text-gray-300">
                  We don’t build what needs spin to survive. Ventures must be
                  defensible in due diligence, in prayer, and in front of the
                  next generation.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/15">
                  <Users className="h-6 w-6 text-softGold" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-cream">
                  Brotherhood & accountability
                </h3>
                <p className="text-sm text-gray-300">
                  Everything sits inside community and accountability — not
                  celebrity. Circles, cohorts, and boards that keep the work
                  submitted to something bigger than ego.
                </p>
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-black/50 px-5 py-6 text-center text-sm text-gray-200 md:px-8">
              If you&apos;re exploring aligned capital, strategic partnership, or
              ecosystem collaboration under the Abraham of London superbrand,{" "}
              <Link
                href="/contact"
                className="font-semibold text-softGold underline-offset-4 hover:underline"
              >
                start a strategic conversation
              </Link>
              . No pitches, no fluff — just clarity, truth, and a plan.
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturesPage;