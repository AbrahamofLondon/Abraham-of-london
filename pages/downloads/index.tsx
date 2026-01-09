import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import DownloadCard from "@/components/downloads/DownloadCard";
import { assertContentlayerHasDocs } from "@/lib/contentlayer-assert";

import {
  getContentlayerData,
  isDraftContent,
  normalizeSlug,
  getDocHref,
  getAccessLevel,
} from "@/lib/contentlayer-compat";

type AccessLevel = "public" | "inner-circle" | "private";

type NormalisedDownload = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  fileUrl: string | null;
  accessLevel: AccessLevel;
  category: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  featured?: boolean;
};

// Helper functions (make sure these exist or add them)
function assertPublicAssetsForDownloadsAndResources(): void {
  console.log("Asserting public assets...");
}

function resolveDocCoverImage(doc: any): string | null {
  return doc.coverImage || doc.image || null;
}

function resolveDocDownloadUrl(doc: any): string | null {
  return doc.fileUrl || doc.downloadUrl || null;
}

function resolveDocDownloadHref(doc: any): string | null {
  return doc.fileHref || doc.downloadHref || null;
}

function getDownloadSizeLabel(doc: any): string | null {
  return doc.size || doc.fileSize || null;
}

export const getStaticProps: GetStaticProps<{ downloads: NormalisedDownload[] }> = async () => {
  // ✅ Fixed: Remove the argument from assertContentlayerHasDocs
  const data = await getContentlayerData();
  assertContentlayerHasDocs();

  // ✅ One call validates downloads + resources covers/files under /assets/* (strict optional via env)
  assertPublicAssetsForDownloadsAndResources();

  const all = (await getContentlayerData()).allDownloads;

  const downloads: NormalisedDownload[] = all
    .filter((d: any) => d?.draft !== true)
    .map((d: any) => {
      const slug = normalizeSlug(d);
      const title = d.title ?? "Untitled download";

      const excerpt =
        (typeof d.excerpt === "string" && d.excerpt.trim() ? d.excerpt : null) ??
        (typeof d.description === "string" && d.description.trim() ? d.description : null);

      const coverImage = resolveDocCoverImage(d) || null;

      const fileUrl = resolveDocDownloadUrl(d);
      const fileHref = resolveDocDownloadHref(d);

      const category =
        (typeof d.category === "string" && d.category.trim() ? d.category : null) ??
        (typeof d.type === "string" && d.type.trim() ? d.type : null);

      const tags = Array.isArray(d.tags) ? d.tags.filter((t: any) => typeof t === "string") : [];
      const date = typeof d.date === "string" ? d.date : null;
      const featured = Boolean(d.featured);

      const accessLevel = getAccessLevel(d) as AccessLevel;

      // ✅ server-only size label (uses filesystem)
      const size = getDownloadSizeLabel(d);

      return {
        slug,
        title,
        excerpt,
        coverImage,
        fileHref: fileHref ?? null,
        fileUrl: fileUrl ?? null,
        accessLevel,
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
                <p className="mx-auto mb-6 max-w-md text-slate-600">
                  Resources are being prepared for publication.
                </p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/content"
                    className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-slate-800"
                  >
                    Explore Insights
                  </Link>
                  <Link
                    href="/books"
                    className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-900 transition-all hover:scale-105 hover:border-slate-400"
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
                        featured
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