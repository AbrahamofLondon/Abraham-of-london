import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Layout from "@/components/Layout";
import PremiumAssetCard from "@/components/premium/PremiumAssetCard";
import PremiumAssetLaunchButton from "@/components/premium/PremiumAssetLaunchButton";
import {
  getPremiumContentList,
  type PremiumContentItem,
} from "@/lib/premium/content-registry";
import { Sparkles, LibraryBig, ShieldCheck, ScrollText } from "lucide-react";

type ArtifactsPageProps = {
  items: PremiumContentItem[];
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getCoverImage(item: PremiumContentItem): string | undefined {
  const cover = safeStr(item.metadata?.coverImage);
  if (cover) return cover;

  if (item.id === "ultimate-purpose-of-man-editorial") {
    return "/assets/images/social/og-image.jpg";
  }

  return undefined;
}

function sortPremiumItems(items: PremiumContentItem[]): PremiumContentItem[] {
  return [...items].sort((a, b) => {
    const aFeatured = a.featured ? 1 : 0;
    const bFeatured = b.featured ? 1 : 0;

    if (aFeatured !== bFeatured) return bFeatured - aFeatured;

    const aDate = a.metadata?.createdAt
      ? new Date(a.metadata.createdAt).getTime()
      : 0;
    const bDate = b.metadata?.createdAt
      ? new Date(b.metadata.createdAt).getTime()
      : 0;

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
  const featured = items.find((item) => item.featured) || null;
  const shelf = featured ? items.filter((item) => item.id !== featured.id) : items;

  return (
    <Layout>
      <Head>
        <title>Artifacts | Abraham of London</title>
        <meta
          name="description"
          content="A premium shelf of flagship editorials, strategic frameworks, protected artifacts, and institutional-grade intellectual assets from Abraham of London."
        />
      </Head>

      <main className="min-h-screen bg-[#050609] text-white">
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.10),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_26%)]" />
          <div className="absolute inset-0 opacity-[0.06] aol-grain" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-20 md:px-10 md:pb-20 md:pt-28">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90">
                <LibraryBig className="h-3.5 w-3.5" />
                Abraham of London • Artifacts
              </div>

              <h1 className="mt-7 font-serif text-4xl tracking-tight text-white/95 md:text-6xl">
                A governed shelf of strategic artifacts.
              </h1>

              <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/62 md:text-lg">
                This is not your public library. It is a curated shelf of flagship
                editorials, institutional frameworks, intelligence products, and
                high-trust assets built for readers who intend to act, govern, and build.
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

        {featured ? (
          <section className="relative mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
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
                  {getCoverImage(featured) ? (
                    <img
                      src={getCoverImage(featured)}
                      alt={featured.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[#0a0d14] via-[#10141d] to-[#050609]" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/72 via-black/24 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/85 to-transparent" />

                  <div className="absolute left-7 top-7 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300">
                      <Sparkles className="h-3 w-3" />
                      Flagship Editorial
                    </span>

                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/65">
                      {featured.metadata?.classification || "PUBLIC"}
                    </span>
                  </div>

                  <div className="absolute bottom-7 left-7 right-7">
                    <div className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/50">
                      {featured.metadata?.productLine || "Flagship Editorials"}
                    </div>

                    <h2 className="max-w-3xl font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                      {featured.title}
                    </h2>

                    {featured.subtitle ? (
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68 md:text-base">
                        {featured.subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="relative flex lg:col-span-5">
                  <div className="flex w-full flex-col justify-between p-8 md:p-10">
                    <div>
                      <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-white/55">
                        {featured.category}
                      </div>

                      <p className="mt-6 text-[15px] leading-7 text-white/70">
                        {featured.description}
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/8 bg-white/5">
                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Document ID
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {featured.metadata?.docId || "—"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Revision
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {featured.metadata?.version || "—"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            Classification
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {featured.metadata?.classification || "PUBLIC"}
                          </div>
                        </div>

                        <div className="bg-white/[0.025] p-4">
                          <div className="text-[9px] font-mono uppercase tracking-[0.24em] text-white/35">
                            File Size
                          </div>
                          <div className="mt-2 text-sm text-white/82">
                            {featured.fileSize || "—"}
                          </div>
                        </div>
                      </div>

                      {featured.tags.length > 0 ||
                      typeof featured.asset.pageCount === "number" ? (
                        <div className="mt-5">
                          <div className="mb-3 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
                            Asset Markers
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {typeof featured.asset.pageCount === "number" ? (
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/55">
                                {featured.asset.pageCount} pages
                              </span>
                            ) : null}

                            {featured.tags.slice(0, 4).map((tag) => (
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
                        Open the flagship artifact through the secured delivery layer
                        and access the current distribution-ready edition.
                      </p>

                      <div className="flex flex-col gap-4">
                        <PremiumAssetLaunchButton
                          contentId={featured.id}
                          fallbackHref={`/artifacts/${featured.id}`}
                          variant="primary"
                          className="w-full justify-center"
                        >
                          Open Flagship Asset
                        </PremiumAssetLaunchButton>

                        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
                          {featured.metadata?.watermarkRequired ? (
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

        <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10 md:pb-24">
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