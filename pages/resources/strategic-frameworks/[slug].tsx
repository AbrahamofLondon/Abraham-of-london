/* pages/resources/strategic-frameworks/[slug].tsx — FIXED */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ArrowLeft, Lock, Key, Eye, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";

// ✅ REMOVED: MDX imports since this page doesn't use MDX
// No need for mdxComponents or useSafeMdxComponents

// Types
type Framework = {
  title: string;
  oneLiner: string;
  slug: string;
  tag: string;
  accent: "gold" | "emerald" | "blue" | "purple";
  tier: string[];
  canonRoot?: string;
  executiveSummary?: string[];
  operatingLogic?: Array<{ title: string; body: string }>;
  artifactHref?: string;
  [key: string]: any;
};

// Types for auth-injected props
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
};

/* -------------------------------------------------------------------------- */
/* MOCK DATA / LOCAL IMPLEMENTATION                                           */
/* -------------------------------------------------------------------------- */

const FRAMEWORKS_MOCK: Framework[] = [
  {
    title: "Digital Transformation Framework",
    oneLiner: "A comprehensive approach to digital transformation",
    slug: "digital-transformation",
    tag: "Enterprise",
    accent: "blue",
    tier: ["inner-circle", "Board"],
    canonRoot: "Digital Transformation Principles",
    executiveSummary: ["First paragraph", "Second paragraph"],
    operatingLogic: [{ title: "Phase 1", body: "Assessment phase" }],
    artifactHref: "/downloads/digital-transformation-pack.pdf"
  },
];

function getAllFrameworkSlugs(): string[] {
  return FRAMEWORKS_MOCK.map(f => f.slug);
}

function getFrameworkBySlug(slug: string): Framework | null {
  return FRAMEWORKS_MOCK.find(f => f.slug === slug) || null;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC VIEW (always safe)                                                  */
/* -------------------------------------------------------------------------- */

const PublicFrameworkView: React.FC<{ framework: Framework }> = ({ framework }) => {
  return (
    <Layout
      title={`${framework.title} | Strategic Framework`}
      description={framework.oneLiner}
      className="bg-black min-h-screen"
    >
      <Head>
        <meta property="og:type" content="article" />
        <link
          rel="canonical"
          href={`https://www.abrahamoflondon.org/resources/strategic-frameworks/${framework.slug}`}
        />
      </Head>

      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Link
            href="/resources/strategic-frameworks"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Link>
        </div>
      </div>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-purple-900/20" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-200 text-xs font-black uppercase tracking-widest">
              <Eye className="h-4 w-4" />
              Preview Mode — Authentication Required
            </div>

            <div className="mb-6">
              <span
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-bold
                ${
                  framework.accent === "gold"
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-200"
                    : framework.accent === "emerald"
                      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                      : framework.accent === "blue"
                        ? "border-blue-500/25 bg-blue-500/10 text-blue-200"
                        : "border-purple-500/25 bg-purple-500/10 text-purple-200"
                }`}
              >
                {framework.tag}
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              {framework.title}
            </h1>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              {framework.oneLiner}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {framework.tier.map((tier) => (
                <span
                  key={tier}
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-3 py-1 text-sm text-white/80"
                >
                  {tier === "Board" && <Shield className="h-3 w-3 mr-2" />}
                  {tier}
                </span>
              ))}
            </div>

            {framework.canonRoot && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-2">Canon Foundation</h3>
                <p className="text-white/60 italic">"{framework.canonRoot}"</p>
              </div>
            )}

            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-amber-400" />
                Preview Content
              </h3>
              <p className="text-white/70 mb-4">
                This is a public preview. Full framework includes operating logic, decision matrices, artifacts,
                and governance protocols.
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
              Tiered as: <span className="font-semibold text-amber-300">{framework.tier.join(", ")}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/inner-circle/join?framework=${encodeURIComponent(framework.slug)}&tier=${encodeURIComponent(
                  framework.tier[0] || "inner-circle"
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 text-sm font-bold text-white hover:shadow-lg hover:shadow-amber-500/25 transition-all hover:scale-[1.02]"
              >
                <Key className="h-4 w-4" />
                Join Inner Circle
              </Link>

              <Link
                href={`/login?redirect=${encodeURIComponent(
                  `/resources/strategic-frameworks/${framework.slug}`
                )}&tier=${encodeURIComponent(framework.tier[0] || "inner-circle")}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-500/30 px-8 py-3 text-sm font-bold text-amber-400 hover:bg-amber-500/10 transition-all"
              >
                Sign In
              </Link>
            </div>

            <p className="text-white/40 text-sm mt-6">Already have access? Sign in to view the complete framework.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* PRIVATE VIEW (only for authorized users)                                   */
/* -------------------------------------------------------------------------- */

const PrivateFrameworkView: React.FC<PrivatePageProps> = ({ framework, user, innerCircleAccess }) => {
  // ✅ FIXED: Removed useSafeMdxComponents since this page doesn't use MDX
  // This page uses structured data, not MDX content

  const hasAccess =
    Boolean(innerCircleAccess?.hasAccess) || user?.role === "admin" || user?.role === "editor";

  if (!hasAccess) return <PublicFrameworkView framework={framework} />;

  return (
    <Layout
      title={`${framework.title} | Strategic Framework`}
      description={framework.oneLiner}
      className="bg-black min-h-screen"
    >
      <Head>
        <meta property="og:type" content="article" />
        <meta name="robots" content="noindex,nofollow" />
        <link
          rel="canonical"
          href={`https://www.abrahamoflondon.org/resources/strategic-frameworks/${framework.slug}`}
        />
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
              <span className="text-sm text-white/60">{user?.name || "Authenticated User"}</span>
            </div>

            <Link href="/resources/strategic-frameworks" className="text-white/60 hover:text-white text-sm">
              ← Back to Library
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              {framework.title}
            </h1>
            <p className="text-xl text-white/80 mb-8">{framework.oneLiner}</p>

            {framework.executiveSummary?.length ? (
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
            ) : null}

            {framework.operatingLogic?.length ? (
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
            ) : null}

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
                    className="inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-amber-500/25 transition-all"
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
                <div>
                  <p className="text-sm text-white/60">Canon Foundation</p>
                  <p className="text-white font-medium">"{framework.canonRoot}"</p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Access Level</p>
                  <p className="text-amber-300 font-medium">{framework.tier.join(" + ")}</p>
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
/* ACCESS DENIED FALLBACK                                                     */
/* -------------------------------------------------------------------------- */

const AccessDeniedFallback: React.FC<{ requiredRole?: string }> = ({ requiredRole }) => {
  return (
    <Layout title="Access Required" className="bg-black min-h-screen">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 mb-6">
            <Lock className="w-12 h-12 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{(requiredRole || "inner-circle").toUpperCase()} Access Required</h1>
          <p className="text-slate-300 mb-6">
            This content requires {requiredRole || "inner-circle"} membership or higher authorization.
          </p>
          <div className="space-y-4">
            <Link
              href="/inner-circle/join"
              className="block w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all text-center"
            >
              <Key className="inline h-4 w-4 mr-2" />
              Join Inner Circle
            </Link>
            <Link href="/login" className="text-amber-400 hover:text-amber-300 underline transition-colors">
              Already have access? Sign in
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* RUNTIME AUTH WRAPPER                                                       */
/* -------------------------------------------------------------------------- */

const ProtectedShell = dynamic(
  async () => {
    const Protected: React.FC<PrivatePageProps> = (props) => {
      const ProtectedComponent = withUnifiedAuth(PrivateFrameworkView, {
        requiredRole: "inner-circle",
        fallbackComponent: AccessDeniedFallback,
        publicFallback: true,
      });
      return <ProtectedComponent {...props} />;
    };
    return Protected;
  },
  { ssr: false }
);

const FrameworkDetailPage: NextPage<PublicPageProps> = (props) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading…" className="bg-black min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-24 text-white/70">Loading framework…</div>
      </Layout>
    );
  }

  return (
    <>
      <PublicFrameworkView framework={props.framework} />
      <ProtectedShell {...(props as PrivatePageProps)} />
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