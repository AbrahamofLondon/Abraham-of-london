// pages/canon/index.tsx

import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import * as React from "react";

import SiteLayout from "@/components/SiteLayout";
import { allCanons, type Canon } from ".contentlayer/generated";

interface CanonIndexItem {
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  volumeNumber?: string | null;
  order?: number | null;
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
  tags?: string[];
}

interface CanonIndexProps {
  featured?: CanonIndexItem | null;
  campaign?: CanonIndexItem | null;
  volumes: CanonIndexItem[];
}

const CanonIndexPage: NextPage<CanonIndexProps> = ({
  featured,
  campaign,
  volumes,
}) => {
  return (
    <SiteLayout
      pageTitle="The Canon — Architecture of Human Purpose"
      metaDescription="Explore the Canon: a ten-volume architecture of human purpose, civilisation, governance, and destiny."
    >
      <div className="mx-auto max-w-5xl px-4 py-10 text-gray-100">
        {/* HERO */}
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
            The Canon
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-gray-50 sm:text-4xl">
            The Canon — Architecture of Human Purpose
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
            A multi-volume work for builders, fathers, mothers, reformers and
            nation-shapers. This is not casual reading. It is an operating
            architecture for civilisation, responsibility, and destiny.
          </p>
        </header>

        {/* CAMPAIGN CARD */}
        {campaign && (
          <section className="mb-10">
            <div className="rounded-3xl border border-softGold/40 bg-black/70 p-6 backdrop-blur-xl">
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold">
                Campaign Prelude
              </p>
              <h2 className="font-serif text-xl font-semibold text-gray-50 sm:text-2xl">
                {campaign.title}
              </h2>
              {campaign.subtitle && (
                <p className="mt-1 text-sm text-gray-300">
                  {campaign.subtitle}
                </p>
              )}
              {(campaign.description || campaign.excerpt) && (
                <p className="mt-3 text-sm leading-relaxed text-gray-300">
                  {campaign.description || campaign.excerpt}
                </p>
              )}
              <div className="mt-4">
                <Link
                  href={`/canon/${campaign.slug}`}
                  className="inline-flex items-center rounded-full bg-softGold px-5 py-2 text-xs font-semibold text-deepCharcoal underline-offset-4 hover:bg-softGold/90"
                >
                  Read the Canon Campaign
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FEATURED VOLUME */}
        {featured && (
          <section className="mb-10">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold/70">
              Featured Volume
            </h2>
            <CanonCard item={featured} />
          </section>
        )}

        {/* ALL VOLUMES */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">
              All Canon Volumes
            </h2>
          </div>

          {volumes.length === 0 ? (
            <p className="text-sm text-gray-400">
              Canon volumes will appear here as they are released.
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {volumes.map((item) => (
                <CanonCard key={item.slug} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
};

export default CanonIndexPage;

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

interface CanonCardProps {
  item: CanonIndexItem;
}

const CanonCard: React.FC<CanonCardProps> = ({ item }) => {
  const {
    slug,
    title,
    subtitle,
    excerpt,
    description,
    volumeNumber,
    accessLevel = "public",
    tags,
  } = item;

  const isInnerCircle = accessLevel !== "public";

  return (
    <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-black/70 p-5 backdrop-blur-lg transition-transform duration-300 hover:-translate-y-1 hover:border-softGold/50">
      <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-400">
        <div className="inline-flex items-center gap-2">
          {volumeNumber && (
            <span className="rounded-full border border-white/20 px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em]">
              Volume {volumeNumber}
            </span>
          )}
        </div>
        {isInnerCircle && (
          <span className="rounded-full border border-softGold/60 bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-softGold">
            Inner Circle
          </span>
        )}
      </div>

      <h3 className="font-serif text-lg font-semibold text-gray-50 sm:text-xl">
        {title}
      </h3>

      {subtitle && (
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-softGold/80">
          {subtitle}
        </p>
      )}

      {(description || excerpt) && (
        <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-300">
          {description || excerpt}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-[0.7rem] text-gray-400">
          {tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/15 px-2 py-0.5 uppercase tracking-[0.16em]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Link
          href={`/canon/${slug}`}
          className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-softGold hover:text-amber-200"
        >
          {isInnerCircle ? "View Locked Volume" : "Read Volume"}
          <span className="ml-2 inline-block">↗</span>
        </Link>
      </div>
    </article>
  );
};

// ----------------------------------------------------------------------
// Static props
// ----------------------------------------------------------------------

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  // filter out drafts from index
  const publishedCanons = allCanons.filter((c: Canon) => !c.draft);

  const campaign = publishedCanons.find(
    (c) => c.slug === "canon-campaign",
  );

  const featured = publishedCanons.find((c) => c.featured) ?? null;

  const volumes = publishedCanons
    .filter((c) => c.slug !== "canon-campaign")
    .sort((a, b) => {
      const aOrder = a.order ?? 999;
      const bOrder = b.order ?? 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.title || "").localeCompare(b.title || "");
    })
    .map<CanonIndexItem>((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle ?? null,
      description: c.description ?? null,
      excerpt: c.excerpt ?? null,
      coverImage: c.coverImage ?? null,
      volumeNumber: c.volumeNumber ?? null,
      order: c.order ?? null,
      featured: !!c.featured,
      accessLevel: (c as Canon & { accessLevel?: string }).accessLevel ?? "public",
      lockMessage: (c as Canon & { lockMessage?: string }).lockMessage ?? null,
      tags: c.tags ?? [],
    }));

  return {
    props: {
      featured: featured
        ? {
            slug: featured.slug,
            title: featured.title,
            subtitle: featured.subtitle ?? null,
            description: featured.description ?? null,
            excerpt: featured.excerpt ?? null,
            coverImage: featured.coverImage ?? null,
            volumeNumber: featured.volumeNumber ?? null,
            order: featured.order ?? null,
            featured: !!featured.featured,
            accessLevel:
              (featured as Canon & { accessLevel?: string }).accessLevel ??
              "public",
            lockMessage:
              (featured as Canon & { lockMessage?: string }).lockMessage ??
              null,
            tags: featured.tags ?? [],
          }
        : null,
      campaign: campaign
        ? {
            slug: campaign.slug,
            title: campaign.title,
            subtitle: campaign.subtitle ?? null,
            description: campaign.description ?? null,
            excerpt: campaign.excerpt ?? null,
            coverImage: campaign.coverImage ?? null,
            volumeNumber: campaign.volumeNumber ?? null,
            order: campaign.order ?? null,
            featured: !!campaign.featured,
            accessLevel:
              (campaign as Canon & { accessLevel?: string }).accessLevel ??
              "public",
            lockMessage:
              (campaign as Canon & { lockMessage?: string }).lockMessage ??
              null,
            tags: campaign.tags ?? [],
          }
        : null,
      volumes,
    },
  };
};