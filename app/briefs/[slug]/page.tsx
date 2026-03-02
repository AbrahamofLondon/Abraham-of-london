/* app/briefs/[slug]/page.tsx — BULLETPROOF (BUILD-SAFE, ACCESS-SAFE) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { getServerSession } from "next-auth/next";
import type { Metadata } from "next";

import { authOptions } from "@/lib/auth/auth-options";
import { allBriefs } from "@/lib/contentlayer";

import { BriefAccessGuard } from "@/components/BriefAccessGuard";
import BriefContent from "@/components/BriefContent";
import InteractionPanel from "@/components/ui/InteractionPanel";

import { getInteractionCounts, hasUserInteracted } from "@/lib/db/interactions";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";

interface PageProps {
  params: { slug: string };
}

/**
 * Robust slug lookup supporting flat and nested vault structures.
 */
function findBriefBySlug(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return undefined;

  return allBriefs.find((p: any) => {
    const fp = String(p?._raw?.flattenedPath || "");
    return fp === `briefs/${s}` || fp === `vault/briefs/${s}`;
  });
}

/**
 * Minimal, build-safe "not found" UI.
 * (Avoids notFound() to prevent unexpected behavior during export/build.)
 */
function NotFoundView() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-20">
      <div className="max-w-xl w-full border border-white/10 bg-white/[0.02] rounded-3xl p-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
          Intelligence Registry
        </div>
        <h1 className="mt-4 font-serif text-3xl text-white/90">Briefing Not Found</h1>
        <p className="mt-3 text-sm text-white/55">
          The requested intelligence brief could not be located. Verify the link or return to the index.
        </p>
        <div className="mt-8 text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-600">
          REF: NOT_FOUND
        </div>
      </div>
    </div>
  );
}

/**
 * SEO & Metadata Generation
 * Always safe and public (even if content is restricted).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const brief: any = findBriefBySlug(params.slug);

  if (!brief) {
    return {
      title: "Briefing Not Found",
      description: "The requested intelligence brief could not be located.",
    };
  }

  return {
    title: `${brief.title ?? "Brief"} | Abraham of London`,
    description: brief.excerpt || brief.description || "Institutional intelligence briefing",
    openGraph: {
      title: brief.title ?? "Brief",
      description: brief.excerpt || brief.description,
      type: "article",
      publishedTime: brief.date,
      modifiedTime: brief.lastUpdated,
      authors: brief.author ? [brief.author] : ["Abraham of London"],
      tags: brief.tags,
    },
  };
}

/**
 * Main Intelligence Brief Page
 * Guarantees:
 * - Public briefs never get blocked.
 * - Access checks use SSOT functions that exist: normalizeRequired + normalizeUser.
 * - DB interaction queries only run after access is confirmed.
 * - Never crashes build with notFound().
 */
export default async function BriefPage({ params }: PageProps) {
  const slug = String(params?.slug || "").trim();
  const brief: any = findBriefBySlug(slug);

  // Build-safe: show a stable not-found view instead of throwing.
  if (!brief) return <NotFoundView />;

  const session = await getServerSession(authOptions);

  // REQUIRED tier: canonicalize using the function your file ACTUALLY exports.
  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(brief));

  // USER tier: canonicalize using normalizeUser.
  const userTier = tiers.normalizeUser((session?.user as any)?.tier ?? "public");

  // Public bypass is absolute.
  const isPublic = requiredTier === "public";

  // If not public: require authenticated user + sufficient tier.
  const hasAccess =
    isPublic || (!!session?.user && tiers.hasAccess(userTier, requiredTier));

  // 📊 Interaction data only if server-side access is confirmed.
  const userEmail = session?.user?.email;
  const [counts, likeStatus, saveStatus] = hasAccess
    ? await Promise.all([
        getInteractionCounts(slug),
        userEmail ? hasUserInteracted(slug, userEmail, "like") : { interacted: false },
        userEmail ? hasUserInteracted(slug, userEmail, "save") : { interacted: false },
      ])
    : [{ likes: 0, saves: 0 }, { interacted: false }, { interacted: false }];

  const category = brief.category || "Intelligence";
  const status = brief.status || "ACTIVE";
  const institutionalId = brief.institutionalId || brief.briefId || String(slug).toUpperCase();
  const version = brief.version || "1.0.0";

  return (
    <BriefAccessGuard requiredTier={requiredTier} initialAccess={hasAccess}>
      <div className="relative min-h-screen bg-gradient-to-b from-[#050505] to-black pt-32 pb-20">
        <div className="absolute inset-0 aol-grid opacity-[0.03] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-6">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <span className="h-[1px] w-12 bg-amber-800/50" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-700/80">
                INTELLIGENCE BRIEF // {status}
              </span>
            </div>

            <div className="border-l-2 border-amber-900/30 pl-6">
              <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-wider mb-4">
                <span className="px-3 py-1.5 border border-amber-900/30 bg-amber-950/20 rounded-full text-amber-600/80">
                  {category}
                </span>
                <span className="px-3 py-1.5 border border-white/10 bg-black/40 rounded-full text-zinc-500">
                  REF: {institutionalId}
                </span>
                <span className="px-3 py-1.5 border border-white/10 bg-black/40 rounded-full text-zinc-500">
                  v{version}
                </span>

                {requiredTier !== "public" && (
                  <span className="px-3 py-1.5 border border-amber-900/30 bg-amber-950/10 rounded-full text-amber-400/70">
                    TIER: {tiers.getLabel(requiredTier)}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-4xl md:text-5xl text-white/95 leading-tight mb-4">
                {brief.title}
              </h1>

              {brief.subtitle && (
                <p className="text-lg text-amber-100/70 font-light italic border-l border-amber-900/40 pl-4">
                  {brief.subtitle}
                </p>
              )}
            </div>

            {(brief.date || brief.lastUpdated) && (
              <div className="mt-6 flex items-center gap-6 text-[10px] font-mono text-zinc-600">
                <span>ISSUED: {brief.date ? new Date(brief.date).toLocaleDateString() : "N/A"}</span>
                {brief.lastUpdated && (
                  <span>UPDATED: {new Date(brief.lastUpdated).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </header>

          <article className="prose prose-invert prose-amber max-w-none">
            <BriefContent brief={brief} />
          </article>

          <footer className="mt-20 pt-8 border-t border-white/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-[0.3em]">
                END OF BRIEFING // ABRAHAM OF LONDON INSTITUTIONAL VAULT
              </p>
              {brief.classification && (
                <span className="text-[8px] font-mono text-amber-900/60 border border-amber-900/30 px-3 py-1.5 rounded-full">
                  CLASSIFICATION: {String(brief.classification)}
                </span>
              )}
            </div>
          </footer>
        </div>

        <InteractionPanel
          slug={slug}
          initialLikes={counts.likes}
          initialSaves={counts.saves}
          isLiked={likeStatus.interacted}
          isSaved={saveStatus.interacted}
        />
      </div>
    </BriefAccessGuard>
  );
}

export const dynamic = "force-dynamic";