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
  resolveDocDownloadUrl,
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

export const getStaticProps: GetStaticProps<{ downloads: NormalisedDownload[] }> = async () => {
  assertContentlayerHasDocs("pages/downloads/index.tsx getStaticProps");

  const all = getAllDownloads();

  const downloads: NormalisedDownload[] = all.map((d: any) => {
    const slug = normalizeSlug(d);
    const title = d.title ?? "Untitled download";

    const excerpt =
      (typeof d.excerpt === "string" && d.excerpt.trim().length ? d.excerpt : null) ??
      (typeof d.description === "string" && d.description.trim().length ? d.description : null);

    const coverImage = resolveDocCoverImage(d) || null;
    const fileHref = resolveDocDownloadUrl(d);

    const category =
      (typeof d.category === "string" && d.category.trim().length ? d.category : null) ??
      (typeof d.type === "string" && d.type.trim().length ? d.type : null);

    const size = typeof d.fileSize === "string" && d.fileSize.trim().length ? d.fileSize : null;

    const tags = Array.isArray(d.tags) ? d.tags.filter((t: any) => typeof t === "string") : [];
    const date = typeof d.date === "string" ? d.date : null;
    const featured = Boolean(d.featured);

    return {
      slug,
      title,
      excerpt: excerpt ?? null,
      coverImage,
      fileHref,
      category,
      size,
      tags,
      date,
      featured,
    };
  });

  downloads.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  return { props: { downloads }, revalidate: 3600 };
};

export default function DownloadsIndexPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const title = "Curated Resources";
  const description = "Essential tools and strategic assets for visionary leaders.";

  const featuredDownloads = props.downloads.filter((d) => d.featured);
  const regularDownloads = props.downloads.filter((d) => !d.featured);

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <header className="mb-16 text-center">
            <div className="mb-6">
              <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800">
                Premium Resources
              </span>
            </div>
            <h1 className="mb-6 font-serif text-5xl font-light tracking-tight text-slate-900 md:text-6xl">
              Strategic Assets
            </h1>
            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">
              Curated tools, frameworks, and resources designed for exceptional leaders.
            </p>
          </header>

          {props.downloads.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white/60 p-8 backdrop-blur-sm">
              <div className="text-center">
                <h2 className="mb-3 text-xl font-semibold text-slate-900">
                  Access Premium Resources
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Resources are being prepared for publication.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/content"
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-slate-800 hover:scale-105"
                  >
                    Explore Insights
                  </Link>
                  <Link
                    href="/books"
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-all hover:border-slate-400 hover:scale-105"
                  >
                    Browse Books
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <div className="space-y-16">
              {featuredDownloads.length > 0 && (
                <section>
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-3xl font-light text-slate-900">
                        Featured Assets
                      </h2>
                      <p className="mt-2 text-slate-600">
                        Hand-selected resources of exceptional quality
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-8 lg:grid-cols-2">
                    {featuredDownloads.map((dl) => (
                      <DownloadCard
                        key={dl.slug}
                        slug={dl.slug}
                        title={dl.title}
                        excerpt={dl.excerpt}
                        coverImage={dl.coverImage}
                        fileHref={dl.fileHref}
                        category={dl.category}
                        size={dl.size ?? undefined}
                        featured={true}
                      />
                    ))}
                  </div>
                </section>
              )}

              {regularDownloads.length > 0 && (
                <section>
                  <div className="mb-8">
                    <h2 className="font-serif text-3xl font-light text-slate-900">
                      Complete Collection
                    </h2>
                    <p className="mt-2 text-slate-600">All strategic tools and resources</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularDownloads.map((dl) => (
                      <DownloadCard
                        key={dl.slug}
                        slug={dl.slug}
                        title={dl.title}
                        excerpt={dl.excerpt}
                        coverImage={dl.coverImage}
                        fileHref={dl.fileHref}
                        category={dl.category}
                        size={dl.size ?? undefined}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}