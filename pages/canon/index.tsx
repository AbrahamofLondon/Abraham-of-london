// pages/canon/index.tsx
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import SiteLayout from "@/components/SiteLayout";
import {
  getCanonCampaign,
  getCanonMasterIndex,
  getCanonVolumes,
  getFeaturedCanon,
  type CanonDoc,
} from "@/lib/server/canon-data";

interface CanonIndexProps {
  campaign: CanonDoc | null;
  masterIndex: CanonDoc | null;
  volumes: CanonDoc[];
  featured: CanonDoc[];
}

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
        <header className="mb-10 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.26em] text-softGold">
            THE CANON
          </p>
          <h1 className="font-serif text-3xl text-soft-charcoal md:text-4xl">
            Purpose · Order · Civilisation · Destiny
          </h1>
          <p className="mt-3 text-sm text-gray-600 md:text-base">
            A ten-volume civilisational operating system for those who still
            carry responsibility — at home, in institutions, and across nations.
          </p>
        </header>

        {/* Campaign / Intro */}
        <section className="mb-10 grid gap-6 md:grid-cols-2">
          {campaign && (
            <CanonCard
              doc={campaign}
              label="Marketing Prelude"
              href={`/resources/${campaign.slug}`}
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

        {/* Volumes */}
        <section className="mb-10">
          <h2 className="mb-4 font-serif text-xl text-soft-charcoal md:text-2xl">
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
    </SiteLayout>
  );
};

function CanonCard({
  doc,
  label,
  href,
}: {
  doc: CanonDoc;
  label?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-softGold/70 hover:shadow-lg"
      prefetch
    >
      {label && (
        <p className="mb-1 text-[0.65rem] uppercase tracking-[0.22em] text-softGold">
          {label}
        </p>
      )}
      <h3 className="mb-2 font-serif text-lg text-soft-charcoal">
        {doc.title}
      </h3>
      {doc.description && (
        <p className="mb-3 text-sm text-gray-600 line-clamp-3">
          {doc.description}
        </p>
      )}
      <span className="mt-auto text-xs font-semibold text-softGold group-hover:underline">
        Open
      </span>
    </Link>
  );
}

export const getStaticProps: GetStaticProps<CanonIndexProps> = async () => {
  const campaign = getCanonCampaign();
  const masterIndex = getCanonMasterIndex();
  const volumes = getCanonVolumes();
  const featured = getFeaturedCanon();

  return {
    props: {
      campaign,
      masterIndex,
      volumes,
      featured,
    },
    revalidate: 3600,
  };
};

export default CanonIndexPage;