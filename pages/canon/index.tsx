// pages/canon/index.tsx
import type { GetStaticProps } from "next";
import * as React from "react";
import Link from "next/link";

import SiteLayout from "@/components/SiteLayout";
import { allCanons } from ".contentlayer/generated";

type CanonAccessLevel = "public" | "inner-circle" | "private" | (string & {});

interface CanonListItem {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  volumeNumber?: string | null;
  order?: number | null;
  featured?: boolean;
  draft?: boolean;
  tags?: string[];
  accessLevel?: CanonAccessLevel | null;
}

interface CanonIndexProps {
  canons: CanonListItem[];
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  const docs: CanonListItem[] = allCanons
    .filter((c) => !c.draft)
    .map((c) => ({
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle ?? null,
      excerpt: c.excerpt ?? c.description ?? null,
      description: c.description ?? null,
      coverImage: c.coverImage ?? null,
      volumeNumber: c.volumeNumber ?? null,
      order: c.order ?? null,
      featured: Boolean(c.featured),
      draft: Boolean(c.draft),
      tags: c.tags ?? [],
      accessLevel: (c.accessLevel as CanonAccessLevel | null) ?? "public",
    }));

  // Sort: campaign first (slug), then by explicit order, then by volume number, then title
  const sorted = [...docs].sort((a, b) => {
    // Pin the marketing campaign near the top
    if (a.slug === "canon-campaign") return -1;
    if (b.slug === "canon-campaign") return 1;

    const orderA = a.order ?? 999;
    const orderB = b.order ?? 999;
    if (orderA !== orderB) return orderA - orderB;

    // If both have volume numbers like "X", we can still fall back to title
    return (a.title || "").localeCompare(b.title || "", "en");
  });

  return {
    props: {
      canons: sorted,
    },
  };
};

export default function CanonIndexPage({ canons }: CanonIndexProps): JSX.Element {
  const campaign = canons.find((c) => c.slug === "canon-campaign") ?? null;
  const volumes = canons.filter((c) => c.volumeNumber);
  const others = canons.filter(
    (c) => c.slug !== "canon-campaign" && !c.volumeNumber,
  );

  return (
    <SiteLayout
      pageTitle="The Canon — A New Era of Builders"
      metaDescription="Campaign hub and volume index for the ten-volume Canon on purpose, governance, civilisation and human destiny."
    >
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-0">
        {/* Page heading */}
        <header className="mb-10 space-y-3">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
            The Canon
          </p>
          <h1 className="font-serif text-3xl font-semibold text-gray-50 sm:text-4xl">
            A New Era of Builders
          </h1>
          <p className="max-w-2xl text-sm text-gray-300 sm:text-base">
            Ten volumes. One architecture. Purpose, order, identity, governance,
            civilisation, and destiny — written for fathers, mothers, builders
            and reformers who refuse drift.
          </p>
        </header>

        {/* Marketing Campaign / Landing block */}
        {campaign && (
          <section className="mb-12 rounded-3xl border border-softGold/40 bg-black/60 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-softGold/70">
                  Campaign Prelude
                </p>
                <h2 className="font-serif text-2xl font-semibold text-gray-50 sm:text-3xl">
                  {campaign.title}
                </h2>
                {campaign.subtitle && (
                  <p className="text-sm text-gray-300">{campaign.subtitle}</p>
                )}
                {campaign.excerpt && (
                  <p className="text-sm text-gray-300">
                    {campaign.excerpt}
                  </p>
                )}
                <div className="pt-1">
                  <Link
                    href={`/canon/${campaign.slug}`}
                    className="inline-flex items-center rounded-full bg-softGold px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-deepCharcoal transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/25"
                  >
                    Read the Canon Campaign
                  </Link>
                </div>
              </div>

              {campaign.coverImage && (
                <div className="relative h-40 w-full flex-shrink-0 overflow-hidden rounded-2xl border border-softGold/30 bg-gradient-to-br from-black/60 to-softGold/10 sm:h-44 sm:w-52">
                  {/* You can swap this for next/image if you like */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={campaign.coverImage}
                    alt={campaign.title}
                    className="h-full w-full object-cover opacity-90"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Volumes grid */}
        {volumes.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl font-semibold text-gray-50 sm:text-2xl">
                Canon Volumes
              </h2>
              <p className="text-xs text-gray-400">
                Frameworks ▸ Diagrams ▸ Models ▸ Matrices ▸ Toolkits
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {volumes.map((vol) => {
                const isRestricted = vol.accessLevel && vol.accessLevel !== "public";
                return (
                  <Link
                    key={vol.slug}
                    href={`/canon/${vol.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-white/10 bg-black/60 p-5 transition-all duration-300 hover:border-softGold/80 hover:bg-black/80 hover:shadow-xl hover:shadow-softGold/20"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
                        Volume {vol.volumeNumber ?? ""}
                      </span>
                      {isRestricted && (
                        <span className="rounded-full border border-softGold/60 bg-softGold/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-softGold">
                          Inner Circle
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-gray-50 group-hover:text-softGold sm:text-xl">
                      {vol.title}
                    </h3>
                    {vol.subtitle && (
                      <p className="mt-1 text-xs text-gray-300">
                        {vol.subtitle}
                      </p>
                    )}
                    {vol.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm text-gray-300">
                        {vol.excerpt}
                      </p>
                    )}
                    <div className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                      View Volume
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Other Canon texts (catechism, index preview, etc.) */}
        {others.length > 0 && (
          <section className="mt-4 border-t border-white/10 pt-6">
            <h2 className="mb-4 font-serif text-lg font-semibold text-gray-50 sm:text-xl">
              Canon Companion Texts
            </h2>
            <ul className="space-y-3">
              {others.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={`/canon/${doc.slug}`}
                    className="group block rounded-xl border border-white/5 bg-black/40 px-4 py-3 transition-all duration-200 hover:border-softGold/60 hover:bg-black/70"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-50 group-hover:text-softGold">
                          {doc.title}
                        </p>
                        {doc.subtitle && (
                          <p className="text-xs text-gray-300">
                            {doc.subtitle}
                          </p>
                        )}
                        {doc.excerpt && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-400">
                            {doc.excerpt}
                          </p>
                        )}
                      </div>
                      <span className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-softGold/70 sm:mt-0">
                        Read Canon Text
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </SiteLayout>
  );
}