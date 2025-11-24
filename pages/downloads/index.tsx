// pages/downloads/index.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import DownloadCard from "@/components/downloads/DownloadCard";
import { getAllDownloads } from "@/lib/downloads";

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

type DownloadsIndexProps = {
  downloads: NormalisedDownload[];
};

interface RawDownload {
  slug?: unknown;
  title?: unknown;
  excerpt?: unknown;
  description?: unknown;
  coverImage?: unknown;
  downloadFile?: unknown;
  fileUrl?: unknown;
  fileSize?: unknown;
  category?: unknown;
  type?: unknown;
  tags?: unknown;
  date?: unknown;
  featured?: unknown;
}

function normaliseDownload(raw: RawDownload): NormalisedDownload {
  const slug = String(raw?.slug ?? "").trim() || "untitled";
  const title = String(raw?.title ?? "Untitled download");

  const excerpt =
    typeof raw?.excerpt === "string" && raw.excerpt.trim().length
      ? raw.excerpt
      : typeof raw?.description === "string" && raw.description.trim().length
      ? raw.description
      : null;

  const coverImage =
    typeof raw?.coverImage === "string" && raw.coverImage.trim().length
      ? raw.coverImage
      : null;

  const fileHrefCandidate =
    typeof raw?.downloadFile === "string" && raw.downloadFile.trim().length
      ? raw.downloadFile
      : typeof raw?.fileUrl === "string" && raw.fileUrl.trim().length
      ? raw.fileUrl
      : null;

  const fileHref =
    fileHrefCandidate && fileHrefCandidate.startsWith("/")
      ? fileHrefCandidate
      : fileHrefCandidate;

  const size =
    typeof raw?.fileSize === "string" && raw.fileSize.trim().length
      ? raw.fileSize
      : null;

  const category =
    typeof raw?.category === "string" && raw.category.trim().length
      ? raw.category
      : typeof raw?.type === "string" && raw.type.trim().length
      ? raw.type
      : null;

  const tags = Array.isArray(raw?.tags)
    ? raw.tags.filter((t: unknown) => typeof t === "string" && t.trim().length)
    : [];

  const date =
    typeof raw?.date === "string" && raw.date.trim().length
      ? raw.date
      : null;

  const featured = Boolean(raw?.featured);

  return {
    slug,
    title,
    excerpt,
    coverImage,
    fileHref,
    category,
    size,
    tags,
    date,
    featured,
  };
}

export const getStaticProps: GetStaticProps<DownloadsIndexProps> = async () => {
  try {
    const all = getAllDownloads();
    const downloads = all.map((d) => normaliseDownload(d));

    return {
      props: {
        downloads,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /downloads:", error);
    return {
      props: {
        downloads: [],
      },
      revalidate: 3600,
    };
  }
};

export default function DownloadsIndexPage(
  props: InferGetStaticPropsType<typeof getStaticProps>,
) {
  const title = "Curated Resources";
  const description = "Essential tools and strategic assets for visionary leaders.";

  const featuredDownloads = props.downloads.filter(d => d.featured);
  const regularDownloads = props.downloads.filter(d => !d.featured);

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
          {/* Enhanced Header */}
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
              Each asset is crafted for immediate impact and lasting value.
            </p>
          </header>

          {props.downloads.length === 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white/60 p-8 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 p-2.5">
                  <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="mb-3 text-xl font-semibold text-slate-900">
                  Access Premium Resources
                </h2>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Our curated assets are integrated throughout the site. Explore blog posts and book pages to discover relevant resources.
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
              {/* Featured Downloads Section */}
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
                    <div className="hidden sm:block">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                        Premium
                      </span>
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

              {/* All Downloads Section */}
              {regularDownloads.length > 0 && (
                <section>
                  <div className="mb-8">
                    <h2 className="font-serif text-3xl font-light text-slate-900">
                      Complete Collection
                    </h2>
                    <p className="mt-2 text-slate-600">
                      All strategic tools and resources
                    </p>
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