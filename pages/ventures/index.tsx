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
  "https://alomarada.com/"
);

const ENDURELUXE_URL = pickEnvUrl(
  [ENV_KEYS.ENDURELUXE_URL],
  // For now, treat as a sub-path or adjust when Endureluxe has its own domain
  "https://alomarada.com/endureluxe"
);

const INNOVATEHUB_URL = pickEnvUrl(
  [ENV_KEYS.INNOVATEHUB_URL, ENV_KEYS.INNOVATEHUB_ALT_URL],
  "https://alomarada.com/hub"
);

const ventures: Venture[] = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    description:
      "Board-level advisory, operating systems, and market-entry strategy for Africa-focused founders, boards, and institutions.",
    icon: Building2,
    href: ALOMARADA_URL,
    status: "Active",
    focus: "Strategic Advisory & Market Systems",
    externalLabel: "Visit Alomarada.com",
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    description:
      "Durable luxury performance gear for people who train, build, and endure – without compromising on quality or aesthetics.",
    icon: PackageCheck,
    href: ENDURELUXE_URL,
    status: "In development",
    focus: "Performance & Durable Luxury",
    externalLabel: "Explore Endureluxe",
  },
  {
    name: "Innovative Hub",
    slug: "innovative-hub",
    description:
      "A practical innovation lab – content, cohorts, and tools for builders who want to test ideas, ship value, and stay accountable.",
    icon: Lightbulb,
    href: INNOVATEHUB_URL,
    status: "Emerging",
    focus: "Innovation & Capability Building",
    externalLabel: "Enter the Hub",
  },
];

const VenturesPage: NextPage = () => {
  return (
    <Layout title="Ventures">
      <Head>
        <title>Strategic Ventures | Abraham of London</title>
        <meta
          name="description"
          content="Explore the strategic ventures and business initiatives under Abraham of London – Alomarada Ltd, Endureluxe, and the Innovative Hub."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-20 dark:from-slate-900 dark:to-slate-800">
        <div className="mx-auto max-w-6xl px-4">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 font-serif text-4xl font-semibold text-deepCharcoal dark:text-cream md:text-5xl">
              Strategic Ventures
            </h1>
            <p className="mx-auto max-w-3xl text-xl text-slate-600 dark:text-slate-300">
              Disciplined, faith-rooted initiatives built to create sustainable
              impact, not just headlines. Each venture is a focused expression
              of the same core conviction: truth, responsibility, and legacy.
            </p>
          </div>

          {/* Ventures Grid */}
          <div className="mb-16 grid gap-8 md:grid-cols-2">
            {ventures.map((venture) => (
              <div
                key={venture.slug ?? venture.name}
                className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="rounded-xl bg-forest/10 p-3 dark:bg-forest/20">
                    <venture.icon className="h-8 w-8 text-forest" />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      venture.status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : venture.status === "Emerging"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                    }`}
                  >
                    {venture.status}
                  </span>
                </div>

                <h3 className="mb-4 font-serif text-2xl font-semibold text-deepCharcoal dark:text-white">
                  {venture.name}
                </h3>

                <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-300">
                  {venture.description}
                </p>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm font-medium text-forest dark:text-forest/80">
                    {venture.focus}
                  </span>
                  <Link
                    href={venture.href}
                    className="group inline-flex items-center font-semibold text-forest transition-colors hover:text-forest/80"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {venture.externalLabel ?? "Visit site"}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Investment Philosophy */}
          <div className="rounded-2xl bg-slate-100 p-8 md:p-12 dark:bg-slate-700">
            <h2 className="mb-8 text-center font-serif text-3xl font-semibold text-deepCharcoal dark:text-white md:text-4xl">
              Our Investment Philosophy
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest/20">
                  <Target className="h-6 w-6 text-forest" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-deepCharcoal dark:text-white">
                  Strategic Alignment
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Every venture must align with our core mission: faith-rooted
                  leadership, disciplined strategy, and legacy building across
                  generations.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/20">
                  <TrendingUp className="h-6 w-6 text-softGold" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-deepCharcoal dark:text-white">
                  Sustainable Impact
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  We prioritise long-term value creation over quick wins. Each
                  venture is designed to be cashflow-aware, scalable, and
                  principled.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-forest/20">
                  <Users className="h-6 w-6 text-forest" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-deepCharcoal dark:text-white">
                  Community Focus
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  We build ecosystems, not celebrity brands – brotherhoods,
                  advisory circles, and operating systems that outlast any one
                  individual.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VenturesPage;