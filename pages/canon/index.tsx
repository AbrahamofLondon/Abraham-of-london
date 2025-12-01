// pages/canon/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import CanonCard from "@/components/CanonCard";
import {
  allCanons,
  type CanonDocument,
} from "@/lib/contentlayer-helper";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CanonIndexItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  volumeNumber?: number | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
};

type PageProps = {
  items: CanonIndexItem[];
  maxVolume: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function sortCanon(a: CanonIndexItem, b: CanonIndexItem): number {
  // Featured first
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;

  const aVol = a.volumeNumber ?? null;
  const bVol = b.volumeNumber ?? null;

  if (aVol !== null && bVol !== null && aVol !== bVol) {
    return aVol - bVol;
  }

  if (aVol !== null && bVol === null) return -1;
  if (aVol === null && bVol !== null) return 1;

  // Fallback to date (newest first)
  const aTime = a.date ? Date.parse(a.date) : 0;
  const bTime = b.date ? Date.parse(b.date) : 0;
  if (aTime !== bTime) return bTime - aTime;

  // Finally by title
  return (a.title || "").localeCompare(b.title || "");
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const CanonIndexPage: NextPage<PageProps> = ({ items, maxVolume }) => {
  const hasItems = items.length > 0;

  // Progress: 1–5 soft segments, lit up to min(maxVolume, 5)
  const totalSegments = 5;
  const activeSegments = Math.max(
    0,
    Math.min(totalSegments, maxVolume || items.length || 0)
  );
  const segments = Array.from({ length: totalSegments }, (_, i) => i + 1);

  return (
    <Layout title="The Canon">
      <Head>
        <title>The Canon | Abraham of London</title>
        <meta
          name="description"
          content="A curated canon of strategic, theological, and civilisational volumes — catalogued for serious builders and fathers who think in generations, not news cycles."
        />
        <link
          rel="canonical"
          href="https://www.abrahamoflondon.org/canon"
        />
        <meta property="og:title" content="The Canon | Abraham of London" />
        <meta
          property="og:description"
          content="Harrods-library atmosphere. Ancient Near Eastern gravitas. Modern strategic intelligence. A living canon for men who build."
        />
        <meta
          property="og:url"
          content="https://www.abrahamoflondon.org/canon"
        />
        <meta property="og:type" content="website" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-[#020617] to-charcoal">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          {/* Subtle background texture / glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,_rgba(226,197,120,0.18),_transparent_65%)]" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-softGold/60 via-softGold/0 to-transparent opacity-70" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-softGold/0 to-softGold/40 opacity-40" />
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10 pt-16 md:flex-row md:items-end md:pb-16 md:pt-20">
            {/* Left: Copy */}
            <div className="flex-1 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-softGold/80">
                Canon · Catalogue
              </p>

              <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
                The Canon of
                <span className="block text-softGold">
                  Purpose, Power & Stewardship
                </span>
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
                This is not a blog roll. It is a living library — volumes
                that sit at the intersection of{" "}
                <span className="font-medium text-softGold">
                  theology, strategy, civilisation, and human destiny
                </span>
                . Each entry is catalogued, not casually posted.
              </p>

              <p className="max-w-xl text-xs leading-relaxed text-gray-400 sm:text-sm">
                Think of it as **Harrods Library** meets **Ancient Near Eastern
                gravitas**, wrapped in **modern strategic intelligence**. It’s
                built for men who lead, fathers who refuse to disappear, and
                builders who understand that ideas outlive news cycles.
              </p>
            </div>

            {/* Right: “Volumes” progress motif */}
            <div className="w-full max-w-xs rounded-3xl border border-white/10 bg-black/40 px-4 py-5 shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-sm">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
                Canon Progress
              </p>

              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-300">
                    Catalogued Volumes
                  </p>
                  <p className="text-2xl font-semibold text-cream">
                    {items.length.toString().padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-[0.7rem] text-gray-400">
                    Inner Circle entries are marked discreetly.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5">
                    {segments.map((seg) => {
                      const active = seg <= activeSegments;
                      return (
                        <div
                          key={seg}
                          className={`h-7 w-2 rounded-full border border-softGold/25 transition-all duration-200 ${
                            active
                              ? "bg-gradient-to-b from-softGold to-amber-700 shadow-[0_0_16px_rgba(226,197,120,0.8)]"
                              : "bg-gradient-to-b from-slate-800 to-charcoal"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[0.65rem] text-gray-400">
                    Volumes <span className="text-softGold">1–5</span>{" "}
                    as foundational pillars.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-10">
          {!hasItems ? (
            <div className="mx-auto max-w-md rounded-3xl border border-dashed border-white/15 bg-black/40 px-6 py-10 text-center text-sm text-gray-300">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
                Catalogue Initialising
              </p>
              <p className="mt-3 text-base text-cream">
                No Canon volumes are publicly catalogued yet.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Entries are added deliberately, not reactively. Check back, or
                join the Inner Circle to be notified when new volumes are
                released.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Section header */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold/70">
                    Library · Canon Entries
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-cream sm:text-2xl">
                    Catalogued Volumes
                  </h2>
                </div>

                <p className="max-w-md text-xs text-gray-400 sm:text-[0.8rem]">
                  Ordered first by{" "}
                  <span className="text-softGold">featured importance</span>,
                  then by volume number and catalogue date. Inner Circle
                  volumes are marked with a subtle lock.
                </p>
              </div>

              {/* Cards grid */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <CanonCard key={item.slug} canon={item} />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default CanonIndexPage;

// ---------------------------------------------------------------------------
// Static Generation
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    // Use contentlayer-helper, not raw contentlayer
    const docs: CanonDocument[] = Array.isArray(allCanons) ? allCanons : [];

    const items: CanonIndexItem[] = docs
      .filter((doc) => !doc.draft) // hide draft by default
      .map((doc) => {
        const vol = toNumberOrNull(
          (doc as { volumeNumber?: unknown }).volumeNumber
        );

        const safeTitle =
          (doc as { title?: string }).title ?? "Untitled Canon Volume";
        const safeSlug = (doc as { slug?: string }).slug ?? "";

        return {
          slug: safeSlug,
          title: safeTitle,
          subtitle: (doc as { subtitle?: string }).subtitle ?? null,
          excerpt: doc.excerpt ?? null,
          description: doc.description ?? null,
          coverImage: doc.coverImage ?? null,
          volumeNumber: vol,
          date: doc.date ?? null,
          tags: Array.isArray(doc.tags) ? doc.tags : [],
          featured: Boolean((doc as { featured?: boolean }).featured),
          accessLevel:
            (doc as { accessLevel?: string | null }).accessLevel ?? null,
          lockMessage:
            (doc as { lockMessage?: string | null }).lockMessage ?? null,
        };
      })
      .sort((a, b) => {
        // featured first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        // then by volume number if both present
        if (a.volumeNumber != null && b.volumeNumber != null) {
          return a.volumeNumber - b.volumeNumber;
        }

        // then by date (newest first)
        if (a.date && b.date) {
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }

        return 0;
      });

    // 🔢 Compute max volume for progress UI / nav – always return a number
    const volumeNumbers = items
      .map((item) => item.volumeNumber)
      .filter((v): v is number => typeof v === "number");

    const maxVolume: number =
      volumeNumbers.length > 0 ? Math.max(...volumeNumbers) : 0;

    return {
      props: {
        items,
        maxVolume,
      },
      revalidate: 3600, // 1 hour
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /canon:", err);
    return {
      props: {
        items: [],
        maxVolume: 0,
      },
      revalidate: 600,
    };
  }
};