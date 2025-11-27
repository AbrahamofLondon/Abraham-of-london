// pages/canon/index.tsx
import type { GetStaticProps } from "next";
import * as React from "react";
import Link from "next/link";

import SiteLayout from "@/components/SiteLayout";
import {
  getAllCanon,
  getFeaturedCanon,
  getCanonCampaign,
  getCanonMasterIndex,
  getCanonVolumes,
  type CanonDoc,
} from "@/lib/canon";

interface CanonIndexProps {
  featured: CanonDoc[];
  campaign: CanonDoc | null;
  masterIndex: CanonDoc | null;
  volumes: CanonDoc[];
  others: CanonDoc[];
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  const all = getAllCanon();
  const featured = getFeaturedCanon();
  const campaign = getCanonCampaign();
  const masterIndex = getCanonMasterIndex();
  const volumes = getCanonVolumes();

  const excludeSlugs = new Set<string>([
    ...(campaign ? [campaign.slug] : []),
    ...(masterIndex ? [masterIndex.slug] : []),
    ...volumes.map((v) => v.slug),
  ]);

  const others = all.filter((c) => !excludeSlugs.has(c.slug));

  return {
    props: {
      featured,
      campaign,
      masterIndex,
      volumes,
      others,
    },
  };
};

export default function CanonIndexPage({
  featured,
  campaign,
  masterIndex,
  volumes,
  others,
}: CanonIndexProps): JSX.Element {
  const pageTitle = "The Canon — Architecture of Human Purpose";
  const metaDescription =
    "Explore the Canon — ten volumes and companion papers on purpose, governance, civilisation and destiny.";

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={metaDescription}>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-0">
        {/* Header */}
        <header className="mb-10 space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
            Canon Series
          </p>
          <h1 className="font-serif text-3xl font-semibold text-gray-50 sm:text-4xl">
            The Canon — Architecture of Human Purpose
          </h1>
          <p className="max-w-3xl text-sm text-gray-300 sm:text-base">
            Ten volumes. One architecture. A civilisational operating system
            for builders, fathers, mothers, reformers and institutional
            architects.
          </p>
        </header>

        {/* Campaign hero */}
        {campaign && (
          <section className="mb-10 rounded-3xl border border-softGold/40 bg-black/70 p-6 sm:p-8">
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
              Marketing Prelude
            </p>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-50 sm:text-3xl">
              {campaign.title}
            </h2>
            {campaign.subtitle && (
              <p className="mt-1 text-sm text-gray-300">{campaign.subtitle}</p>
            )}
            {campaign.description && (
              <p className="mt-4 text-sm text-gray-200">
                {campaign.description}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={campaign.url ?? `/canon/${campaign.slug}`}
                className="inline-flex items-center rounded-full bg-softGold px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-deepCharcoal transition hover:bg-softGold/90 hover:shadow-lg hover:shadow-softGold/30"
              >
                Read the Canon Campaign
              </Link>
              {masterIndex && (
                <Link
                  href={masterIndex.url ?? `/canon/${masterIndex.slug}`}
                  className="inline-flex items-center text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-softGold/80 hover:text-softGold"
                >
                  View Master Index
                </Link>
              )}
            </div>
          </section>
        )}

        {/* Featured volumes (e.g. Volume X) */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/90">
                Featured Volumes
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {featured.map((canon) => (
                <CanonCard key={canon.slug} doc={canon} />
              ))}
            </div>
          </section>
        )}

        {/* Numbered volumes grid */}
        {volumes.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-softGold/90">
              Canon Volumes
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {volumes.map((canon) => (
                <CanonCard key={canon.slug} doc={canon} />
              ))}
            </div>
          </section>
        )}

        {/* Other Canon docs (catechism, letters, notes, etc.) */}
        {others.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-softGold/70">
              Companion Papers & Notes
            </h2>
            <div className="space-y-3">
              {others.map((canon) => (
                <CompanionRow key={canon.slug} doc={canon} />
              ))}
            </div>
          </section>
        )}
      </main>
    </SiteLayout>
  );
}

function CanonCard({ doc }: { doc: CanonDoc }) {
  const {
    title,
    subtitle,
    excerpt,
    description,
    coverImage,
    slug,
    volumeNumber,
    accessLevel = "public",
  } = doc;

  const label =
    volumeNumber && volumeNumber.trim()
      ? `Volume ${volumeNumber}`
      : "Canon Volume";

  const locked = accessLevel !== "public";

  return (
    <Link
      href={doc.url ?? `/canon/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/60 p-5 transition hover:border-softGold/60 hover:bg-black/80"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
          {label}
        </span>
        {locked && (
          <span className="rounded-full border border-softGold/60 bg-softGold/10 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-softGold">
            Inner Circle
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-semibold text-gray-50 group-hover:text-softGold">
        {title}
      </h3>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-300">{subtitle}</p>
      )}
      <p className="mt-3 line-clamp-3 text-xs text-gray-400">
        {excerpt || description}
      </p>
      {coverImage && (
        <p className="mt-3 text-[0.65rem] text-gray-500">
          Cover: <span className="italic">{coverImage}</span>
        </p>
      )}
    </Link>
  );
}

function CompanionRow({ doc }: { doc: CanonDoc }) {
  const { title, subtitle, slug } = doc;

  return (
    <Link
      href={doc.url ?? `/canon/${slug}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/40 px-4 py-3 text-sm text-gray-200 transition hover:border-softGold/50 hover:bg-black/70 hover:text-softGold"
    >
      <div className="flex flex-col">
        <span className="font-medium">{title}</span>
        {subtitle && (
          <span className="text-[0.75rem] text-gray-400">
            {subtitle}
          </span>
        )}
      </div>
      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
        Open
      </span>
    </Link>
  );
}