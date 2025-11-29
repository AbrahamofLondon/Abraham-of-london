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
    .filter(doc => doc.volumeNumber && !doc.draft)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function getFeaturedCanon(): Canon[] {
  return allCanons.filter(doc => doc.featured && !doc.draft);
}

function getCanonCampaign(): Canon | null {
  return allCanons.find(doc => doc.slug === "canon-campaign") || null;
}

function getCanonMasterIndex(): Canon | null {
  return allCanons.find(doc => doc.slug === "canon-master-index-preview") || null;
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
        border border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900
        p-5 shadow-sm transition-all duration-200
        hover:-translate-y-1 hover:border-softGold/70 hover:shadow-lg
      "
    >
      <div className="mb-2 flex items-center gap-2">
        {label && (
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-softGold">
            {label}
          </p>
        )}

        {isInnerCircle && (
          <span className="
            ml-auto inline-flex items-center rounded-full border border-softGold/70
            bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase 
            tracking-[0.12em] text-softGold
          ">
            Inner Circle
          </span>
        )}
      </div>

      <h3 className="mb-2 font-serif text-lg text-gray-900 dark:text-gray-100">
        {doc.title}
      </h3>

      {doc.description && (
        <p className="mb-4 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
          {doc.description}
        </p>
      )}

      <span className="mt-auto text-xs font-semibold text-softGold group-hover:underline">
        Open
      </span>
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
      <div className="mx-auto max-w-5xl px-4 py-12">
        {/* HEADER */}
        <header className="mb-10 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-softGold">
            THE CANON
          </p>

          <h1 className="font-serif text-3xl text-gray-900 dark:text-gray-100 md:text-4xl">
            Purpose · Order · Civilisation · Destiny
          </h1>

          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 md:text-base">
            A ten-volume operating system for those who still carry
            responsibility — at home, in institutions, and across nations.
          </p>
        </header>

        {/* SECTION: CAMPAIGN + MASTER INDEX */}
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

        {/* FEATURED */}
        {featured.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl text-gray-900 dark:text-gray-100 md:text-2xl">
              Featured Canon Documents
            </h2>

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
        <section>
          <h2 className="mb-4 font-serif text-xl text-gray-900 dark:text-gray-100 md:text-2xl">
            Canon Volumes
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {volumes.map((doc) => (
              <CanonCard
                key={doc.slug}
                doc={doc}
                label={doc.volumeNumber ? `Volume ${doc.volumeNumber}` : ""}
                href={`/canon/${doc.slug}`}
              />
            ))}
          </div>
        </section>
      </div>

      {/* INNER CIRCLE CTA */}
      <section className="mt-20 bg-deepCharcoal/95 py-16 text-center text-gray-100">
        <h2 className="font-serif text-3xl text-softGold">
          Join the Founding Readers Circle
        </h2>

        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-300">
          Private previews. Executive briefings. Strategy sessions.
          Early-access manuscripts.  
          Reserved for those shaping the next generation of builders.
        </p>

        <Link
          href="/inner-circle"
          className="
            mx-auto mt-6 inline-flex items-center rounded-full
            bg-softGold px-8 py-3
            text-sm font-semibold text-black
            hover:bg-softGold/90 transition
          "
        >
          Enter the Inner Circle
        </Link>
      </section>
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