/* pages/resources/strategic-frameworks/[slug].tsx — INSTITUTIONAL REWRITE (NO MOCK, NO DOUBLE RENDER) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ArrowLeft, Lock, Key, Eye, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";

import {
  LIBRARY_HREF,
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
} from "@/lib/resources/strategic-frameworks";

import type { User } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type PublicPageProps = {
  framework: Framework;
};

type PrivatePageProps = PublicPageProps & {
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  requiredRole?: string;
  onPrivateReady?: () => void; // used to hide public shell when private mounts
};

/* -------------------------------------------------------------------------- */
/* UTIL                                                                       */
/* -------------------------------------------------------------------------- */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function canonicalFor(slug: string) {
  return `${SITE}/resources/strategic-frameworks/${slug}`;
}

function accentClass(accent: Framework["accent"]) {
  switch (accent) {
    case "gold":
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
    case "emerald":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    case "blue":
      return "border-sky-500/25 bg-sky-500/10 text-sky-200";
    case "rose":
      return "border-rose-500/25 bg-rose-500/10 text-rose-200";
    case "indigo":
      return "border-indigo-500/25 bg-indigo-500/10 text-indigo-200";
    default:
      return "border-amber-500/25 bg-amber-500/10 text-amber-200";
  }
}

function tierChipIcon(tier: string) {
  if (tier === "Board") return <Shield className="h-3 w-3 mr-2" />;
  return null;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC VIEW (SSR/SEO SAFE)                                                 */
/* -------------------------------------------------------------------------- */

const PublicFrameworkView: React.FC<{ framework: Framework; hidden?: boolean }> = ({
  framework,
  hidden,
}) => {
  return (
    <div className={hidden ? "hidden" : "block"}>
      <Layout
        title={`${framework.title} | Strategic Framework`}
        description={framework.oneLiner}
        className="bg-black min-h-screen"
      >
        <Head>
          <meta property="og:type" content="article" />
          <link rel="canonical" href={canonicalFor(framework.slug)} />
        </Head>

        <div className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <Link
              href={LIBRARY_HREF}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Library
            </Link>
          </div>
        </div>

        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-rose-900/20" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-200 text-xs font-black uppercase tracking-widest">
                <Eye className="h-4 w-4" />
                Preview Mode — Full Access Requires Inner Circle
              </div>

              <div className="mb-6">
                <span
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${accentClass(
                    framework.accent
                  )}`}
                >
                  {framework.tag || "Framework"}
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
                {framework.title}
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                {framework.oneLiner}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {(framework.tier || []).map((tier) => (
                  <span
                    key={tier}
                    className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-3 py-1 text-sm text-white/80"
                  >
                    {tierChipIcon(tier)}
                    {tier}
                  </span>
                ))}
              </div>

              {framework.canonRoot && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-white mb-2">Canon Foundation</h3>
                  <p className="text-white/60 italic">“{framework.canonRoot}”</p>
                </div>
              )}

              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-amber-400" />
                  What you’re seeing
                </h3>
                <p className="text-white/70">
                  This is a public preview. The complete framework includes operating logic, playbook steps, metrics,
                  board questions, failure modes, and downloadable artifacts where available.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5 p-8 text-center">
              <Lock className="mx-auto h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Inner Circle Access Required</h3>

              <p className="text-white/70 mb-6">
                Tiered for:{" "}
                <span className="font-semibold text-amber-300">
                  {(framework.tier || []).join(", ")}
                </span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/inner-circle/join?framework=${encodeURIComponent(framework.slug)}&tier=${encodeURIComponent(
                    (framework.tier && framework.tier[0]) || "Founder"
                  )}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-bold text-black hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-[1.02]"
                >
                  <Key className="h-4 w-4" />
                  Join Inner Circle
                </Link>

                <Link
                  href={`/login?redirect=${encodeURIComponent(
                    `/resources/strategic-frameworks/${framework.slug}`
                  )}`}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 px-8 py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/10 transition-all"
                >
                  Sign In
                </Link>
              </div>

              <p className="text-white/40 text-sm mt-6">
                Already have access? Sign in to view the complete framework.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PRIVATE VIEW (client-only, replaces public when available)                 */
/* -------------------------------------------------------------------------- */

const PrivateFrameworkView: React.FC<PrivatePageProps> = ({
  framework,
  user,
  innerCircleAccess,
  onPrivateReady,
}) => {
  const hasAccess =
    Boolean(innerCircleAccess?.hasAccess) ||
    user?.role === "admin" ||
    user?.role === "editor";

  React.useEffect(() => {
    if (hasAccess) onPrivateReady?.();
  }, [hasAccess, onPrivateReady]);

  if (!hasAccess) return null;

  return (
    <Layout
      title={`${framework.title} | Strategic Framework`}
      description={framework.oneLiner}
      className="bg-black min-h-screen"
    >
      <Head>
        <meta property="og:type" content="article" />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href={canonicalFor(framework.slug)} />
      </Head>

      <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                <Key className="h-3 w-3 text-amber-300" />
                <span className="text-xs font-bold text-amber-300">
                  {user?.role === "admin" ? "ADMIN ACCESS" : "INNER CIRCLE ACCESS"}
                </span>
              </div>
              <span className="text-sm text-white/60">{user?.name || "Authenticated"}</span>
            </div>

            <Link href={LIBRARY_HREF} className="text-white/60 hover:text-white text-sm">
              ← Back to Library
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold ${accentClass(
                  framework.accent
                )}`}
              >
                {framework.tag || "Framework"}
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              {framework.title}
            </h1>
            <p className="text-xl text-white/80 mb-10">{framework.oneLiner}</p>

            {!!framework.executiveSummary?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Executive Summary
                </h2>
                <div className="space-y-4">
                  {framework.executiveSummary.map((p, idx) => (
                    <p key={idx} className="text-white/80 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {!!framework.operatingLogic?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Operating Logic
                </h2>
                <div className="space-y-8">
                  {framework.operatingLogic.map((logic, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-3">{logic.title}</h3>
                      <p className="text-white/70">{logic.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!framework.applicationPlaybook?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Application Playbook
                </h2>
                <div className="space-y-4">
                  {framework.applicationPlaybook.map((s, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-6">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-amber-300 mb-2">
                        Step {s.step}
                      </div>
                      <div className="text-white/90 font-semibold mb-2">{s.detail}</div>
                      <div className="text-white/60 text-sm">Deliverable: {s.deliverable}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!framework.metrics?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Metrics & Cadence
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {framework.metrics.map((m, idx) => (
                    <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-6">
                      <div className="text-white font-semibold mb-2">{m.metric}</div>
                      <div className="text-white/70 text-sm mb-3">{m.whyItMatters}</div>
                      <div className="text-white/50 text-xs">Review cadence: {m.reviewCadence}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!!framework.boardQuestions?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Board Questions
                </h2>
                <ul className="space-y-3">
                  {framework.boardQuestions.map((q, idx) => (
                    <li key={idx} className="rounded-xl border border-white/10 bg-white/5 p-5 text-white/80">
                      {q}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!!framework.failureModes?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Failure Modes
                </h2>
                <ul className="space-y-3">
                  {framework.failureModes.map((x, idx) => (
                    <li key={idx} className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-5 text-white/80">
                      {x}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {!!framework.whatToDoNext?.length && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  What to Do Next
                </h2>
                <ul className="space-y-3">
                  {framework.whatToDoNext.map((x, idx) => (
                    <li key={idx} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 text-white/80">
                      {x}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {framework.artifactHref ? (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 pb-2 border-b border-white/10">
                  Artifacts & Templates
                </h2>
                <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-xl p-6">
                  <a
                    href={framework.artifactHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                  >
                    <Key className="h-5 w-5" />
                    Download Complete Package
                  </a>
                  <p className="text-white/60 text-sm mt-3">
                    Includes templates, worksheets, and implementation guides.
                  </p>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Framework Details</h3>
              <div className="space-y-3">
                {framework.canonRoot && (
                  <div>
                    <p className="text-sm text-white/60">Canon Foundation</p>
                    <p className="text-white font-medium">“{framework.canonRoot}”</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-white/60">Tier</p>
                  <p className="text-amber-300 font-medium">{(framework.tier || []).join(" + ")}</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* CLIENT AUTH SHELL (renders Private if authorized; otherwise renders null)  */
/* -------------------------------------------------------------------------- */

const ProtectedShell = dynamic(
  async () => {
    const Protected: React.FC<PrivatePageProps> = (props) => {
      const ProtectedComponent = withUnifiedAuth(PrivateFrameworkView, {
        requiredRole: "inner-circle",
        // IMPORTANT: do NOT replace public SSR with an “access denied page”.
        // If not authorized, we render null so the public SSR stays visible.
        fallbackComponent: () => null,
        publicFallback: true,
      });

      return <ProtectedComponent {...props} />;
    };
    return Protected;
  },
  { ssr: false }
);

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

const FrameworkDetailPage: NextPage<PublicPageProps> = (props) => {
  const router = useRouter();
  const [privateReady, setPrivateReady] = React.useState(false);

  if (router.isFallback) {
    return (
      <Layout title="Loading…" className="bg-black min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-24 text-white/70">Loading framework…</div>
      </Layout>
    );
  }

  return (
    <>
      {/* SSR-first public page for SEO; hidden once private mounts successfully */}
      <PublicFrameworkView framework={props.framework} hidden={privateReady} />

      {/* Client-only private shell. If authorized, it renders and signals the swap. */}
      <ProtectedShell
        {...(props as PrivatePageProps)}
        onPrivateReady={() => setPrivateReady(true)}
      />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* SSG                                                                        */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllFrameworkSlugs();

  return {
    paths: slugs
      .map((slug) => String(slug || "").trim())
      .filter(Boolean)
      .map((slug) => ({ params: { slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<PublicPageProps> = async ({ params }) => {
  const slug = String(params?.slug || "").trim();
  if (!slug) return { notFound: true };

  const framework = getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };

  return {
    props: {
      framework: JSON.parse(JSON.stringify(framework)),
    },
    revalidate: 3600,
  };
};

export default FrameworkDetailPage;