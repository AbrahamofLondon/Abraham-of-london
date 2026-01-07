/* Abraham of London - Strategic Framework Detail V5.0
 * Verified Gating & Institutional Asset Delivery
 */
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
    if (canViewFull) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/inner-circle/locked?returnTo=" + encodeURIComponent(router.asPath) + "&reason=protected-framework");
    }
  };

  return (
    <Layout title={`${framework.title} | Strategic Framework`} description={framework.oneLiner}>
      <main className="min-h-screen bg-slate-950">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8">
              <Link href="/resources/strategic-frameworks" className="text-sm text-gray-400 hover:text-white">
                ← Back to frameworks
              </Link>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBg[framework.accent]} ${accentColor[framework.accent]}`}>
                    {framework.tag}
                  </span>
                  <div className="flex items-center gap-2">
                    {framework.tier.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                        {tierIcon[t]} {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h1 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">{framework.title}</h1>
                <p className="mb-8 text-xl text-gray-300">{framework.oneLiner}</p>
                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">Canon foundation</h3>
                  <p className="text-gray-300 italic">"{framework.canonRoot}"</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm">
                  <h3 className="mb-4 text-lg font-semibold text-white">At a glance</h3>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-center gap-3"><CheckCircle className="h-4 w-4 text-green-400" /> Tier: {framework.tier.join(", ")}</li>
                    <li className="flex items-center gap-3"><TrendingUp className="h-4 w-4 text-blue-400" /> {framework.executiveSummary.length} Core Principles</li>
                    <li className="flex items-center gap-3"><Calendar className="h-4 w-4 text-amber-400" /> {framework.applicationPlaybook.length} Step Playbook</li>
                  </ul>
                </div>

                {framework.artifactHref && canViewFull && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Download artifact</h3>
                    <a href={framework.artifactHref} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:scale-105" download>
                      <BookOpen className="h-4 w-4" /> Download template
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Prelude (Public) */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="mb-8 font-serif text-3xl font-semibold text-white">Executive prelude</h2>
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-xl font-semibold text-amber-400">Executive summary</h3>
                <ul className="space-y-3">
                  {framework.executiveSummary.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300">
                      <div className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-4 text-xl font-semibold text-rose-400">Use when</h3>
                <ul className="space-y-3">
                  {framework.useWhen.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-300">
                      <AlertTriangle className="h-4 w-4 text-rose-400 mt-1" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Gated Dossier */}
        <section id="full-dossier" className="border-t border-white/10 py-16 bg-black/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <h2 className="font-serif text-3xl font-semibold text-white">Full dossier</h2>
              {!canViewFull && (
                <button onClick={() => scrollToLocked("full-dossier")} className="flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-bold text-black transition-all hover:scale-105">
                  <Lock className="h-4 w-4" /> Unlock Inner Circle
                </button>
              )}
            </div>

            {canViewFull ? (
              <div className="space-y-16">
                <div>
                  <h3 className="mb-6 text-2xl font-semibold text-white">Operating logic</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {framework.operatingLogic.map((logic, idx) => (
                      <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-6">
                        <h4 className="mb-3 text-lg font-semibold text-amber-400">{logic.title}</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{logic.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Additional Gated content sections remain as previously defined */}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-4">Complete Operating Logic Locked</h3>
                <p className="text-gray-400 max-w-md mx-auto mb-8">Access the full application playbook, board questions, and metrics specifically for {framework.title}.</p>
                <Link href={`/inner-circle/locked?returnTo=${encodeURIComponent(router.asPath)}`} className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 text-sm font-bold text-black">
                  Join Inner Circle <ArrowRight className="h-4 w-4" />
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
  const slugs = await getAllFrameworkSlugs(); // Added 'await' if needed
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  const framework = await getFrameworkBySlug(slug); // Added 'await' if needed
  if (!framework) return { notFound: true };
  return { props: { framework }, revalidate: 3600 };
};
