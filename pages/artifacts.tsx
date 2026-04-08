import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {
  Sparkles,
  LibraryBig,
  ShieldCheck,
  ScrollText,
  TrendingUp,
  Lock,
  Globe,
  ArrowRight,
  Scale,
} from "lucide-react";

import Layout from "@/components/Layout";
import PremiumAssetCard from "@/components/premium/PremiumAssetCard";
import PremiumAssetLaunchButton from "@/components/premium/PremiumAssetLaunchButton";
import {
  getPremiumContentList,
  type PremiumContentItem,
} from "@/lib/premium/content-registry";

type ArtifactsPageProps = {
  items: PremiumContentItem[];
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeDateValue(value: unknown): number {
  const raw = safeStr(value);
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function getCoverImage(item: PremiumContentItem): string | undefined {
  const cover = safeStr(item.metadata?.coverImage);
  if (cover) return cover;

  if (item.id === "global-market-intelligence-report-q1-2026") {
    return "/assets/images/artifacts/global-market-intelligence-q1-2026-cover.jpg";
  }

  if (item.id === "ultimate-purpose-of-man-editorial") {
    return "/assets/images/social/og-image.jpg";
  }

  return undefined;
}

function isMarketIntelligenceItem(item: PremiumContentItem): boolean {
  const id = item.id.toLowerCase();
  const title = item.title.toLowerCase();
  const category = String(item.categorySlug || item.category || "").toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.join(" ").toLowerCase() : "";

  return (
    id.includes("global-market-intelligence") ||
    id.includes("market-outlook") ||
    title.includes("market intelligence") ||
    title.includes("market outlook") ||
    category.includes("market") ||
    tags.includes("macro")
  );
}

function sortPremiumItems(items: PremiumContentItem[]): PremiumContentItem[] {
  return [...items].sort((a, b) => {
    const marketA = isMarketIntelligenceItem(a) ? 1 : 0;
    const marketB = isMarketIntelligenceItem(b) ? 1 : 0;
    if (marketA !== marketB) return marketB - marketA;

    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;

    const aDate = safeDateValue(a.metadata?.createdAt || a.metadata?.date);
    const bDate = safeDateValue(b.metadata?.createdAt || b.metadata?.date);
    return bDate - aDate;
  });
}

export const getServerSideProps: GetServerSideProps<
  ArtifactsPageProps
> = async () => {
  const items = sortPremiumItems(getPremiumContentList());

  return {
    props: {
      items,
    },
  };
};

export default function ArtifactsPage({
  items,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const marketFlagship =
    items.find((item) => item.id === "global-market-intelligence-report-q1-2026") ||
    items.find((item) => isMarketIntelligenceItem(item)) ||
    items.find((item) => item.featured) ||
    null;

  const shelf = marketFlagship
    ? items.filter((item) => item.id !== marketFlagship.id)
    : items;

  return (
    <Layout>
      <Head>
        <title>Artifacts | Abraham of London</title>
        <meta
          name="description"
          content="A governed shelf of strategic artifacts, market intelligence, flagship editorials, frameworks, and institutional-grade assets from Abraham of London."
        />
      </Head>

      <main className="min-h-screen bg-[#050609] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_26%)]" />
          <div className="absolute inset-0 opacity-[0.06] aol-grain" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-20 md:px-10 md:pb-20 md:pt-28">
            <div className="max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90">
                <LibraryBig className="h-3.5 w-3.5" />
                Abraham of London • Artifacts
              </div>

              <h1 className="mt-7 max-w-4xl font-serif text-4xl tracking-tight text-white/95 md:text-6xl">
                A governed shelf of strategic artifacts.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
                This is a curated shelf of flagship intelligence products,
                editorials, strategic frameworks, and high-trust assets built for
                readers who intend to act, govern, and build.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/58">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300/80" />
                  Flagship Positioning
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/58">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" />
                  Controlled Distribution
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/58">
                  <ScrollText className="h-3.5 w-3.5 text-white/60" />
                  Editorial + Institutional Assets
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-14">
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[#07101a] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0" />
            <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative border-b border-white/10 p-8 md:p-10 lg:border-b-0 lg:border-r">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/25 bg-[#C9A96A]/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[#C9A96A]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Market Intelligence
                </div>

                <h2 className="mt-6 max-w-3xl font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                  A disciplined reading of a harder market.
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-8 text-white/68 md:text-base">
                  Two reading layers. One standard of seriousness. The public brief
                  orients serious readers. The institutional edition supports board
                  review, strategic interpretation, and stronger decision quality.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/artifacts/global-market-outlook-q1-2026-public"
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  >
                    Read public brief
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/intelligence/global-market-intelligence-q1-2026"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                  >
                    Open intelligence surface
                    <Globe className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>

                  <Link
                    href="/artifacts/global-market-intelligence-report-q1-2026"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#C9A96A]/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                  >
                    Institutional edition
                    <Lock className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>

                  <Link
                    href="/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
                  >
                    Boardroom PDF
                    <Scale className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>
                </div>
              </div>

              <div className="relative p-8 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]/85">
                  Quiet Utility
                </div>

                <h3 className="mt-4 font-serif text-2xl text-white/95 md:text-3xl">
                  Built to be discovered, revisited, and trusted.
                </h3>

                <div className="mt-8 space-y-4">
                  {[
                    "Public orientation without leaking edge",
                    "Institutional edition for deeper reading",
                    "Boardroom PDF for premium utility",
                    "Quiet positioning instead of loud marketing",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-white/74"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="mt-8 text-sm leading-7 text-white/58">
                  The best product does not beg for attention. It earns affection
                  through consistency, clarity, and standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {marketFlagship ? (
          <section className="relative mx-auto max-w-7xl px-6 py-6 md:px-10 md:py-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px w-12 bg-amber-500/40" />
              <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/75">
                Featured Flagship
              </span>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#070a11] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_24%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

              <div className="relative grid lg:grid-cols-12">
                <div className="relative min-h-[420px] lg:col-span-7">
                  {getCoverImage(marketFlagship) ? (
                    <img
                      src={getCoverImage(marketFlagship)}
                      alt={marketFlagship.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#0a0d14] via-[#10141d] to-[#050609]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/24 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />

                  <div className="absolute left-7 top-7 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300">
                      <TrendingUp className="h-3 w-3" />
                      Flagship Intelligence
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/65">
                      {marketFlagship.metadata?.classification || "PUBLIC"}
                    </span>
                  </div>

                  <div className="absolute bottom-7 left-7 right-7">
                    <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
                      {marketFlagship.metadata?.productLine || "Market Intelligence"}
                    </div>

                    <h2 className="max-w-3xl font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                      {marketFlagship.title}
                    </h2>

                    {marketFlagship.subtitle ? (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
                        {marketFlagship.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="relative flex lg:col-span-5">
                  <div className="flex w-full flex-col justify-between p-8 md:p-10">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/55">
                        {marketFlagship.category}
                      </div>

                      <p className="mt-6 text-[15px] leading-7 text-white/70">
                        {marketFlagship.description}
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/8 bg-white/5">
                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Document ID
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {marketFlagship.metadata?.docId || "—"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Revision
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {marketFlagship.metadata?.version || "—"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Classification
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {marketFlagship.metadata?.classification || "PUBLIC"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            File Size
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {marketFlagship.fileSize || "—"}
                          </div>
                        </div>
                      </div>

                      {marketFlagship.tags.length > 0 ||
                      typeof marketFlagship.asset.pageCount === "number" ? (
                        <div className="mt-5">
                          <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                            Asset Markers
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {typeof marketFlagship.asset.pageCount === "number" ? (
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55">
                                {marketFlagship.asset.pageCount} pages
                              </span>
                            ) : null}

                            {marketFlagship.tags.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                      <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.24em] text-amber-300/75">
                        Launch Asset
                      </div>

                      <p className="mb-5 text-sm leading-relaxed text-white/58">
                        Open the current flagship edition through the proper access
                        layer and reach the distribution-ready intelligence surface.
                      </p>

                      <div className="flex flex-col gap-4">
                        <PremiumAssetLaunchButton
                          contentId={marketFlagship.id}
                          fallbackHref={`/artifacts/${marketFlagship.id}`}
                          variant="primary"
                          className="w-full justify-center"
                        >
                          Open Flagship Asset
                        </PremiumAssetLaunchButton>

                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                          {marketFlagship.metadata?.watermarkRequired ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-amber-300/70" />
                              Traceable distribution
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300/70" />
                              Open circulation
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 md:px-10 md:pb-24">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-amber-300/65">
                Artifact Shelf
              </div>
              <h2 className="mt-3 font-serif text-2xl text-white/95 md:text-3xl">
                Institutional assets positioned as products.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
                Each item below is surfaced as a governed artifact with metadata,
                access context, and proper presentation.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">
              {items.length} asset{items.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {shelf.map((item) => (
              <PremiumAssetCard
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                description={item.description}
                category={item.category}
                categorySlug={item.categorySlug}
                classification={item.metadata?.classification || "PUBLIC"}
                tier={item.metadata?.allowedTiers?.[0] || "public"}
                docId={item.metadata?.docId}
                version={item.metadata?.version}
                fileSize={item.fileSize}
                pageCount={item.asset.pageCount}
                href={`/artifacts/${item.id}`}
                coverImage={getCoverImage(item)}
                tags={item.tags}
                featured={Boolean(item.featured)}
                watermarkRequired={Boolean(item.metadata?.watermarkRequired)}
              />
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}