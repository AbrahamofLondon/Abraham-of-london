import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Lock,
  Shield,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  AlertTriangle,
  Calendar,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getFrameworkBySlug,
  getAllFrameworkSlugs,
  type Framework,
  type FrameworkTier,
} from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess, type AccessState } from "@/lib/inner-circle/access";

type PageProps = {
  framework: Framework;
  isPreview?: boolean;
};

const tierIcon: Record<FrameworkTier, React.ReactNode> = {
  Board: <Shield className="h-4 w-4" aria-hidden="true" />,
  Founder: <Zap className="h-4 w-4" aria-hidden="true" />,
  Household: <Users className="h-4 w-4" aria-hidden="true" />,
};

const accentColor: Record<Framework["accent"], string> = {
  gold: "text-amber-400",
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  rose: "text-rose-400",
  indigo: "text-indigo-400",
};

const accentBg: Record<Framework["accent"], string> = {
  gold: "bg-amber-500/10 border-amber-500/30",
  emerald: "bg-emerald-500/10 border-emerald-500/30",
  blue: "bg-blue-500/10 border-blue-500/30",
  rose: "bg-rose-500/10 border-rose-500/30",
  indigo: "bg-indigo-500/10 border-indigo-500/30",
};

const FrameworkDetailPage: NextPage<PageProps> = ({ framework, isPreview = false }) => {
  const router = useRouter();

  // FIX: Initialize checkedAt with new Date() because the interface strictly requires a Date object, not null.
  const [access, setAccess] = useState<AccessState>(() => ({
    hasAccess: false,
    ok: false,
    reason: "missing",
    token: null,
    checkedAt: new Date(), 
  }));

  useEffect(() => {
    setAccess(getInnerCircleAccess());
  }, []);

  const canViewFull = access.hasAccess || isPreview;

  const scrollToLocked = (id: string) => {
    const el = document.getElementById(id);
    if (el && canViewFull) {
      el.scrollIntoView({ behavior: "smooth" });
      return;
    }
    router.push("/inner-circle?returnTo=" + encodeURIComponent(router.asPath));
  };

  return (
    <Layout title={`${framework.title} | Strategic Framework`} description={framework.oneLiner}>
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-gradient-to-r from-amber-500/10 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-gradient-to-r from-blue-500/10 to-transparent blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link
                href="/resources/strategic-frameworks"
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
              >
                ← Back to all frameworks
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBg[framework.accent]} ${accentColor[framework.accent]}`}
                  >
                    {framework.tag}
                  </span>

                  <div className="flex items-center gap-2">
                    {framework.tier.map((t) => (
                      <span
                        key={t}
                        className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300"
                      >
                        {tierIcon[t]}
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h1 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">
                  {framework.title}
                </h1>
                <p className="mb-8 text-xl text-gray-300">{framework.oneLiner}</p>

                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Canon foundation</h3>
                  <p className="text-gray-300">{framework.canonRoot}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">At a glance</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-400" aria-hidden="true" />
                      <span className="text-sm text-gray-300">Tier: {framework.tier.join(", ")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 flex-shrink-0 text-blue-400" aria-hidden="true" />
                      <span className="text-sm text-gray-300">
                        {framework.executiveSummary.length} core principles
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 flex-shrink-0 text-amber-400" aria-hidden="true" />
                      <span className="text-sm text-gray-300">
                        {framework.applicationPlaybook.length}-step playbook
                      </span>
                    </li>
                  </ul>
                </div>

                {framework.artifactHref && (
                  <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-semibold text-white">Download artifact</h3>
                    <a
                      href={framework.artifactHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-black transition-all hover:scale-105"
                      download
                    >
                      <BookOpen className="h-4 w-4" aria-hidden="true" />
                      Download template
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Prelude Section (Always Visible) */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-3xl font-semibold text-white">Executive prelude</h2>
              <p className="text-gray-400">Public overview—full dossier available to Inner Circle members.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl font-semibold text-white">Executive summary</h3>
                <ul className="space-y-3">
                  {framework.executiveSummary.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-gray-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold text-white">Use when</h3>
                <ul className="space-y-3">
                  {framework.useWhen.map((item, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden="true" />
                      <span className="text-gray-300">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl font-semibold text-white">Inputs</h3>
                <ul className="space-y-2">
                  {framework.inputs.map((item, idx) => (
                    <li key={idx} className="text-gray-300">• {item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xl font-semibold text-white">Outputs</h3>
                <ul className="space-y-2">
                  {framework.outputs.map((item, idx) => (
                    <li key={idx} className="text-gray-300">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Full Dossier Section (Gated) */}
        <section id="full-dossier" className="border-t border-white/10 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="mb-2 font-serif text-3xl font-semibold text-white">Full dossier</h2>
                <p className="text-gray-400">
                  Inner Circle content—operating logic, playbook, metrics, board questions.
                </p>
              </div>

              {!canViewFull && (
                <button
                  onClick={() => scrollToLocked("full-dossier")}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-105"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Unlock Inner Circle
                </button>
              )}
            </div>

            {canViewFull ? (
              <div className="space-y-16">
                {/* Operating Logic */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Operating logic</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {framework.operatingLogic.map((logic, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm"
                      >
                        <h4 className="mb-3 text-lg font-semibold text-white">{logic.title}</h4>
                        <p className="text-gray-300">{logic.body}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Application Playbook */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Application playbook</h3>
                  <div className="space-y-6">
                    {framework.applicationPlaybook.map((step, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm"
                      >
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                            {idx + 1}
                          </div>
                          <h4 className="text-lg font-semibold text-white">{step.step}</h4>
                        </div>

                        <p className="mb-4 text-gray-300">{step.detail}</p>

                        <div className="rounded-lg bg-white/5 p-4">
                          <p className="text-sm font-semibold text-amber-400">Deliverable</p>
                          <p className="mt-1 text-gray-300">{step.deliverable}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Metrics &amp; review</h3>
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    <table className="w-full">
                      <thead className="border-b border-white/10 bg-black/40">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Metric</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Why it matters</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-white">Review cadence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {framework.metrics.map((metric, idx) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-6 py-4 text-sm text-gray-300">{metric.metric}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{metric.whyItMatters}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{metric.reviewCadence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Board Questions */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Board questions</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {framework.boardQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm"
                      >
                        <p className="text-gray-300">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Failure Modes */}
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Failure modes</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {framework.failureModes.map((mode, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm"
                      >
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-500" aria-hidden="true" />
                        <p className="text-gray-300">{mode}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Next */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent p-8">
                  <h3 className="mb-4 text-2xl font-semibold text-white">What to do next</h3>
                  <ul className="space-y-4">
                    {framework.whatToDoNext.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 flex-shrink-0 text-amber-500" aria-hidden="true" />
                        <span className="text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-12 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 text-gray-500" aria-hidden="true" />
                <h3 className="mb-2 text-xl font-semibold text-white">Full dossier locked</h3>
                <p className="mb-6 text-gray-400">
                  Join the Inner Circle to access the complete dossier: operating logic, playbook, metrics, board questions.
                </p>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-semibold text-black transition-all hover:scale-105"
                >
                  Join Inner Circle <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default FrameworkDetailPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllFrameworkSlugs();
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const framework = getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };

  return { props: { framework }, revalidate: 3600 };
};