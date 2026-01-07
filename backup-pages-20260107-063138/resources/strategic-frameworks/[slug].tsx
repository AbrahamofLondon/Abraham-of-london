// pages/resources/strategic-frameworks/[slug].tsx
import * as React from "react";
import { useEffect, useState } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { Lock, Shield, Users, Zap } from "lucide-react";

import Layout from "@/components/Layout";
import {
  getFrameworkBySlug,
  getAllFrameworkSlugs,
  type Framework,
  type FrameworkTier,
} from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess, type AccessState } from "@/lib/inner-circle/access";

function normalizeFrameworkSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.filter(Boolean).join("/") : String(input ?? "");
  // Framework slugs should be single segment; enforce that.
  const last = raw.trim().toLowerCase().split("/").filter(Boolean).pop() || "";
  return last;
}

type PageProps = {
  framework: Framework;
  isPreview?: boolean;
};

const tierIcon: Record<FrameworkTier, React.ReactNode> = {
  Board: <Shield className="h-4 w-4" />,
  Founder: <Zap className="h-4 w-4" />,
  Household: <Users className="h-4 w-4" />,
};

const accentBg: Record<Framework["accent"], string> = {
  gold: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  rose: "bg-rose-500/10 border-rose-500/30 text-rose-400",
  indigo: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
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

  const requestUnlock = () => {
    router.push(`/inner-circle/locked?returnTo=${encodeURIComponent(router.asPath)}`);
  };

  return (
    <Layout title={`${framework.title} | Strategic Framework`} description={framework.oneLiner}>
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link href="/resources/strategic-frameworks" className="text-sm text-gray-400 hover:text-white">
              ← Back to frameworks
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${accentBg[framework.accent]}`}>
                {tierIcon[framework.tier]}
                {framework.tag}
              </span>

              <h1 className="mt-4 font-serif text-5xl font-bold">{framework.title}</h1>
              <p className="mt-4 text-xl text-gray-300">{framework.oneLiner}</p>
            </div>
          </div>
        </section>

        <section id="full-dossier" className="border-t border-white/10 py-16">
          <div className="mx-auto max-w-7xl px-4">
            {!canViewFull ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-12 text-center">
                <Lock className="mx-auto mb-4 h-12 w-12" />
                <h3 className="text-xl font-bold">Dossier Locked</h3>
                <p className="mt-2 text-sm text-gray-400">
                  This framework is available inside the Inner Circle.
                </p>
                <button
                  onClick={requestUnlock}
                  className="mt-6 rounded-full bg-amber-500 px-8 py-3 font-bold text-black"
                >
                  Unlock Inner Circle
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 p-8">
                {/* Your dossier content blocks go here */}
                <p className="text-gray-300">Dossier content loaded.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allSlugs = getAllFrameworkSlugs();

  const unique = Array.from(
    new Set(
      (allSlugs || [])
        .map((s) => normalizeFrameworkSlug(s))
        .filter((s) => s && s !== "strategic-frameworks" && s !== "index" && !s.includes("replace"))
    )
  );

  return {
    paths: unique.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = normalizeFrameworkSlug((params as any)?.slug);

  if (!slug || slug === "strategic-frameworks" || slug === "index" || slug.includes("replace")) {
    return { notFound: true };
  }

  const framework = getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };

  return {
    props: { framework },
    revalidate: 3600,
  };
};

export default FrameworkDetailPage;