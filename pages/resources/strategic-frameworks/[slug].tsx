/* pages/resources/strategic-frameworks/[slug].tsx — PREMIUM DOSSIER (SSOT, SSG-SAFE) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Lock, Shield, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import PrivateFrameworkView from "@/components/Frameworks/PrivateFrameworkView";

import {
  LIBRARY_HREF,
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
} from "@/lib/resources/strategic-frameworks";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function canonicalFor(slug: string) {
  return `${SITE}/resources/strategic-frameworks/${encodeURIComponent(slug)}`;
}

function normalizeSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

/**
 * Strategic Frameworks are “above” Surrender.
 * Enforcement policy:
 * - Founder/Board => architect
 * - Inner Circle => inner-circle
 * - Member => member
 * - else => public
 *
 * This is deterministic and SSG-safe.
 */
function requiredTierFromFramework(fw: Framework): AccessTier {
  const labels = (fw?.tier || []).map((x) => String(x).toLowerCase().trim());
  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

type Props = {
  slug: string;
  framework: Framework;
  requiredTier: AccessTier;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllFrameworkSlugs();
  return {
    paths: slugs.map((s) => ({ params: { slug: String(s) } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(params?.slug);
  if (!slug) return { notFound: true, revalidate: 60 };

  const fw = getFrameworkBySlug(slug);
  if (!fw) return { notFound: true, revalidate: 60 };

  const requiredTier = tiers.normalizeRequired(requiredTierFromFramework(fw));

  return {
    props: {
      slug,
      framework: JSON.parse(JSON.stringify(fw)),
      requiredTier,
    },
    revalidate: 3600,
  };
};

const StrategicFrameworkSlugPage: NextPage<Props> = ({ slug, framework, requiredTier }) => {
  const { data: session, status } = useSession();

  const userTier = tiers.normalizeUser((session?.user as any)?.tier ?? "public");
  const required = tiers.normalizeRequired(requiredTier);

  const needsAuth = required !== "public";
  const userHasAccess = !needsAuth || (session?.user ? tiers.hasAccess(userTier, required) : false);

  const canonical = canonicalFor(slug);

  const subtitle =
    framework.oneLiner ||
    "Institutional-grade strategic framework — built for leaders who carry weight, not spectators who consume ideas.";

  if (needsAuth && status === "loading") {
    return (
      <Layout title={framework.title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${framework.title} | Strategic Framework`} description={subtitle} className="bg-black min-h-screen">
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      {/* Top bar */}
      <div className="border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <Link
            href={LIBRARY_HREF}
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Back to Strategic Frameworks</span>
          </Link>

          {required !== "public" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-amber-200 text-[10px] font-black uppercase tracking-[0.3em]">
              <Lock size={12} /> {tiers.getLabel(required)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-white/50 text-[10px] font-mono uppercase tracking-[0.3em]">
              public
            </div>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.06),transparent_55%)]" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          {required !== "public" && (
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2 text-amber-200 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">
              <Shield size={14} /> Classified Framework
            </div>
          )}

          <div className="inline-flex items-center justify-center mb-8">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/60">
              {framework.tag || "Protocol"} • {framework.canonRoot || "The Canon"}
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white uppercase tracking-tighter leading-[0.9]">
            {framework.title}
          </h1>

          <p className="mt-8 max-w-3xl mx-auto text-xl text-white/50 leading-relaxed">{subtitle}</p>

          <div className="mt-10 flex flex-col items-center gap-3">
            {session?.user ? (
              <div className="text-sm text-white/30">
                Your tier: <span className="text-amber-200/70">{tiers.getLabel(userTier)}</span>
              </div>
            ) : null}

            {!userHasAccess && (
              <div className="max-w-md w-full">
                <AccessGate
                  title={framework.title}
                  requiredTier={required}
                  userTier={userTier}
                  message="This framework is restricted. Authenticate or upgrade to unlock the classified layer."
                  onUnlocked={() =>
                    window.location.assign(
                      "/inner-circle/login?returnTo=" +
                        encodeURIComponent(`/resources/strategic-frameworks/${slug}`)
                    )
                  }
                  onGoToJoin={() => window.location.assign("/inner-circle")}
                />
              </div>
            )}

            {userHasAccess ? (
              <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/70">
                Classified layer available <ChevronRight className="h-3 w-3" />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Public/Teaser Sections (always safe to show) */}
      <section className="border-t border-white/5 py-16">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35 mb-6">
              Executive Summary
            </div>

            {framework.executiveSummary?.length ? (
              <ul className="space-y-4 text-white/70 leading-relaxed">
                {framework.executiveSummary.map((x, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-amber-500/70 font-mono text-xs mt-1">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-white/60">
                This dossier has been indexed. The classified layer contains operating logic, playbook, metrics, and
                board-grade interrogation.
              </p>
            )}
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
            <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35 mb-6">Metadata</div>

            <div className="space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/35">Required tier</div>
                <div className="mt-1 text-white font-semibold">{tiers.getLabel(required)}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/35">Audience</div>
                <div className="mt-1 text-white/70">{framework.tier?.join(" • ") || "Institutional"}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/35">Slug</div>
                <div className="mt-1 text-white/70 font-mono text-xs">{framework.slug}</div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Classified layer (strict) */}
      {userHasAccess ? (
        <PrivateFrameworkView
          framework={framework as any}
          user={session?.user as any}
          innerCircleAccess={{ hasAccess: true } as any}
        />
      ) : null}
    </Layout>
  );
};

export default StrategicFrameworkSlugPage;