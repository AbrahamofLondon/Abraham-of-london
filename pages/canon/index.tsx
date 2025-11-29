// pages/canon/index.tsx

import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { allCanons, type Canon } from "contentlayer/generated";
import SiteLayout from "@/components/SiteLayout";

interface CanonIndexProps {
  campaign: Canon | null;
  masterIndex: Canon | null;
  volumes: Canon[];
  featured: Canon[];
}

// Contentlayer-based data functions
function getCanonVolumes(): Canon[] {
  return allCanons
    .filter((doc) => !!doc.volumeNumber && !doc.draft)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getFeaturedCanon(): Canon[] {
  return allCanons.filter((doc) => doc.featured && !doc.draft);
}

function getCanonCampaign(): Canon | null {
  return (
    allCanons.find(
      (doc) => doc.slug === "canon-campaign" && !doc.draft,
    ) || null
  );
}

function getCanonMasterIndex(): Canon | null {
  return (
    allCanons.find(
      (doc) => doc.slug === "canon-master-index-preview" && !doc.draft,
    ) || null
  );
}

// CanonCard Component
function CanonCard({
  doc,
  label,
  href,
}: {
  doc: Canon;
  label?: string;
  href: string;
}) {
  const isInnerCircle = doc.accessLevel === "inner-circle";

  return (
    <Link
      href={href}
      prefetch
      className="
        group flex h-full flex-col overflow-hidden rounded-3xl
        border border-gray-200/80 dark:border-gray-800
        bg-white/95 dark:bg-deepCharcoal
        p-5 shadow-sm transition-all duration-200
        hover:-translate-y-1 hover:border-softGold/70 hover:shadow-xl
      "
    >
      <div className="mb-2 flex items-center gap-2">
        {label && (
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-softGold">
            {label}
          </p>
        )}

        {isInnerCircle && (
          <span
            className="
              ml-auto inline-flex items-center rounded-full border border-softGold/70
              bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase 
              tracking-[0.12em] text-softGold
            "
          >
            Inner Circle
          </span>
        )}
      </div>

      <h3 className="mb-1 font-serif text-lg text-gray-900 dark:text-gray-50">
        {doc.title}
      </h3>

      {doc.subtitle && (
        <p className="mb-1 text-[0.7rem] uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
          {doc.subtitle}
        </p>
      )}

      {doc.description && (
        <p className="mb-4 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
          {doc.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between text-xs">
        {doc.readTime && (
          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.16em] text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {doc.readTime}
          </span>
        )}

        <span className="ml-auto text-[0.7rem] font-semibold text-softGold group-hover:underline">
          Open
        </span>
      </div>
    </Link>
  );
}

// Page Component
const CanonIndexPage: NextPage<CanonIndexProps> = ({
  campaign,
  masterIndex,
  volumes,
  featured,
}) => {
  return (
    <SiteLayout
      pageTitle="The Canon"
      metaDescription="Ten-volume Canon on purpose, order, civilisation and destiny — for builders, fathers, mothers, reformers and nation-shapers."
      canonicalUrl="/canon"
    >
      <div className="bg-gradient-to-b from-black via-deepCharcoal to-black">
        {/* HERO */}
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-10 sm:pb-14 sm:pt-14">
          <header className="mb-10 text-center text-gray-100">
            <p className="mb-3 text-xs uppercase tracking-[0.26em] text-softGold">
              THE CANON
            </p>

            <h1 className="font-serif text-3xl text-cream md:text-4xl">
              Purpose · Order · Civilisation · Destiny
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm text-gray-300 md:text-[0.95rem]">
              A ten-volume operating system for those who still carry
              responsibility — at home, in institutions, and across nations.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-gray-300">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Builders &amp; fathers
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Governance &amp; formation
              </span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                Civilisational design
              </span>
            </div>
          </header>

          {/* CAMPAIGN + MASTER INDEX */}
          {(campaign || masterIndex) && (
            <section className="mb-12 grid gap-6 md:grid-cols-2">
              {campaign && (
                <CanonCard
                  doc={campaign}
                  label="Marketing Prelude"
                  href={`/canon/${campaign.slug}`}
                />
              )}

              {masterIndex && (
                <CanonCard
                  doc={masterIndex}
                  label="Master Index Preview"
                  href={`/canon/${masterIndex.slug}`}
                />
              )}
            </section>
          )}

          {/* FEATURED */}
          {featured.length > 0 && (
            <section className="mb-12">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-serif text-xl text-cream md:text-2xl">
                  Featured Canon Documents
                </h2>
                <span className="text-[0.7rem] uppercase tracking-[0.18em] text-softGold/80">
                  Curated for immediate impact
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {featured.map((doc) => (
                  <CanonCard
                    key={doc.slug}
                    doc={doc}
                    label="Featured"
                    href={`/canon/${doc.slug}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* VOLUMES */}
          {volumes.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="font-serif text-xl text-cream md:text-2xl">
                  Canon Volumes
                </h2>
                <span className="text-[0.7rem] uppercase tracking-[0.18em] text-gray-400">
                  Ten volumes · One architecture
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {volumes.map((doc) => (
                  <CanonCard
                    key={doc.slug}
                    doc={doc}
                    label={
                      doc.volumeNumber ? `Volume ${doc.volumeNumber}` : "Volume"
                    }
                    href={`/canon/${doc.slug}`}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* INNER CIRCLE CTA */}
        <section className="border-t border-softGold/20 bg-black/90 py-16 text-center text-gray-100">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-serif text-3xl text-softGold">
              Join the Founding Readers Circle
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-300">
              Private previews. Executive briefings. Strategy sessions.
              Early-access manuscripts. Reserved for those shaping the next
              generation of builders.
            </p>

            <Link
              href="/inner-circle"
              className="
                mx-auto mt-7 inline-flex items-center justify-center rounded-full
                bg-softGold px-10 py-3.5
                text-sm font-semibold text-black
                shadow-lg shadow-black/40
                transition hover:bg-softGold/90
              "
            >
              Enter the Inner Circle
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
};

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  const campaign = getCanonCampaign();
  const masterIndex = getCanonMasterIndex();
  const volumes = getCanonVolumes();
  const featured = getFeaturedCanon();

  return {
    props: { campaign, masterIndex, volumes, featured },
    revalidate: 3600,
  };
};

export default CanonIndexPage;