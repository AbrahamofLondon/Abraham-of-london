// pages/downloads/index.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import DownloadCard from "@/components/downloads/DownloadCard";

import {
  assertContentlayerHasDocs,
  getAllDownloads,
  normalizeSlug,
  resolveDocCoverImage,
  resolveDocDownloadHref,
  resolveDocDownloadUrl,
  publicFileSizeBytes,
  formatBytes,
} from "@/lib/contentlayer-helper";

type NormalisedDownload = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  category: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  featured?: boolean;
};

export const getStaticProps: GetStaticProps<{
  downloads: NormalisedDownload[];
}> = async () => {
  assertContentlayerHasDocs("pages/downloads/index.tsx");

  const raw = getAllDownloads();

  const downloads: NormalisedDownload[] = raw.map((d: any) => {
    const slug = normalizeSlug(d);
    const title = d.title ?? "Untitled download";

    const excerpt =
      (typeof d.excerpt === "string" && d.excerpt.trim()
        ? d.excerpt
        : typeof d.description === "string" && d.description.trim()
        ? d.description
        : null);

    const coverImage = resolveDocCoverImage(d);
    const fileHref = resolveDocDownloadHref(d);
    const directUrl = resolveDocDownloadUrl(d);

    let size: string | null =
      typeof d.fileSize === "string" && d.fileSize.trim()
        ? d.fileSize
        : null;

    // Deterministic auto-size (ONLY for verified local assets)
    if (!size && directUrl?.startsWith("/assets/downloads/")) {
      const bytes = publicFileSizeBytes(directUrl);
      if (typeof bytes === "number") {
        size = formatBytes(bytes);
      }
    }

    return {
      slug,
      title,
      excerpt,
      coverImage,
      fileHref,
      category:
        typeof d.category === "string" && d.category.trim()
          ? d.category
          : typeof d.type === "string"
          ? d.type
          : null,
      size,
      tags: Array.isArray(d.tags) ? d.tags.filter(Boolean) : [],
      date: typeof d.date === "string" ? d.date : null,
      featured: Boolean(d.featured),
    };
  });

  downloads.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    );
  });

  return { props: { downloads }, revalidate: 3600 };
};

export default function DownloadsIndexPage({
  downloads,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const title = "Curated Resources";
  const description =
    "Essential tools and strategic assets for visionary leaders.";

  const featured = downloads.filter((d) => d.featured);
  const regular = downloads.filter((d) => !d.featured);

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <header className="mb-16 text-center">
            <h1 className="font-serif text-5xl text-slate-900">
              Strategic Assets
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              {description}
            </p>
          </header>

          {downloads.length === 0 ? (
            <section className="rounded-xl border bg-white p-12 text-center">
              <p className="text-slate-600">
                Resources are being prepared.
              </p>
            </section>
          ) : (
            <>
              {featured.length > 0 && (
                <section className="mb-16">
                  <h2 className="mb-6 font-serif text-3xl">
                    Featured Assets
                  </h2>
                  <div className="grid gap-8 lg:grid-cols-2">
                    {featured.map((d) => (
                      <DownloadCard key={d.slug} {...d} featured />
                    ))}
                  </div>
                </section>
              )}

              {regular.length > 0 && (
                <section>
                  <h2 className="mb-6 font-serif text-3xl">
                    Complete Collection
                  </h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regular.map((d) => (
                      <DownloadCard key={d.slug} {...d} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}