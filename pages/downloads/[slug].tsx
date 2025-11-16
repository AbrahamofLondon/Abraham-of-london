// pages/downloads/[slug].tsx

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import {
  getDownloadSlugs,
  getDownloadBySlug,
} from "@/lib/downloads";

/* -------------------------------------------------------------------------- */
/* Types – keep this JSON-safe and defensive                                  */
/* -------------------------------------------------------------------------- */

type DownloadPageProps = {
  download: DownloadMetaSerialized;
};

type DownloadMetaSerialized = {
  slug: string;
  title?: string;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  file?: string | null;       // generic file URL
  pdfUrl?: string | null;     // explicit PDF if present
  epubUrl?: string | null;    // explicit EPUB if present
  category?: string | null;
  tags?: string[] | null;
  kind?: string | null;
};

/* -------------------------------------------------------------------------- */
/* Normalisers                                                                 */
/* -------------------------------------------------------------------------- */

function toSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function serialiseDownload(raw: any): DownloadMetaSerialized {
  if (!raw || typeof raw !== "object") {
    return {
      slug: "",
      title: "Download",
      description: null,
      excerpt: null,
      coverImage: null,
      file: null,
      pdfUrl: null,
      epubUrl: null,
      category: null,
      tags: null,
      kind: null,
    };
  }

  const baseSlug = String(raw.slug ?? "").trim();

  const coverImage =
    typeof raw.coverImage === "string" && raw.coverImage.trim().length
      ? raw.coverImage
      : typeof raw.heroImage === "string" && raw.heroImage.trim().length
      ? raw.heroImage
      : null;

  // Try to locate any obvious file/pdf/epub URLs
  const pdfUrl =
    typeof raw.pdfUrl === "string" && raw.pdfUrl.trim().length
      ? raw.pdfUrl
      : typeof raw.pdf === "string" && raw.pdf.trim().length
      ? raw.pdf
      : null;

  const epubUrl =
    typeof raw.epubUrl === "string" && raw.epubUrl.trim().length
      ? raw.epubUrl
      : typeof raw.epub === "string" && raw.epub.trim().length
      ? raw.epub
      : null;

  const file =
    typeof raw.file === "string" && raw.file.trim().length
      ? raw.file
      : pdfUrl || epubUrl || null;

  const tags =
    Array.isArray(raw.tags) && raw.tags.length
      ? raw.tags.map((t: any) => String(t))
      : null;

  return {
    slug: baseSlug,
    title: raw.title ?? raw.name ?? "Download",
    description: raw.description ?? raw.body ?? raw.excerpt ?? null,
    excerpt: raw.excerpt ?? null,
    coverImage,
    file,
    pdfUrl,
    epubUrl,
    category: raw.category ?? raw.section ?? null,
    tags,
    kind: raw.kind ?? raw.type ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* getStaticPaths                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const slugsMaybe = await Promise.resolve(getDownloadSlugs());

  const slugs = Array.isArray(slugsMaybe) ? slugsMaybe : [];

  const paths =
    slugs.length > 0
      ? slugs
          .filter(
            (s): s is string =>
              typeof s === "string" && s.trim().length > 0,
          )
          .map((slug) => ({ params: { slug } }))
      : [];

  return {
    paths,
    fallback: "blocking",
  };
};

/* -------------------------------------------------------------------------- */
/* getStaticProps                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<DownloadPageProps> = async (
  ctx,
) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam ?? "";

  if (!slug) {
    return { notFound: true };
  }

  const raw = await Promise.resolve(getDownloadBySlug(slug));

  if (!raw) {
    return { notFound: true };
  }

  const download = toSerializable(serialiseDownload(raw));

  return {
    props: {
      download,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/* Page component                                                              */
/* -------------------------------------------------------------------------- */

export default function DownloadPage({
  download,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = download.title || "Download";
  const description =
    download.description ||
    download.excerpt ||
    "A strategic resource from Abraham of London.";

  const hasCover =
    typeof download.coverImage === "string" &&
    download.coverImage.trim().length > 0;

  const hasPdf =
    typeof download.pdfUrl === "string" && download.pdfUrl.trim().length > 0;
  const hasEpub =
    typeof download.epubUrl === "string" && download.epubUrl.trim().length > 0;
  const hasFile =
    typeof download.file === "string" && download.file.trim().length > 0;

  const primaryHref = download.pdfUrl || download.file || null;

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-gray-500">
          <Link
            href="/downloads"
            className="underline-offset-4 hover:text-forest hover:underline"
          >
            Downloads
          </Link>{" "}
          <span aria-hidden>›</span>{" "}
          <span className="text-gray-700">{pageTitle}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Text column */}
          <section>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
              Strategic Download
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
              {pageTitle}
            </h1>

            {download.category && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-forest">
                {download.category}
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-gray-800">
              {description}
            </p>

            {download.tags && download.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {download.tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    className="rounded-full border border-lightGrey px-3 py-1 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              {primaryHref && (
                <a
                  href={primaryHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-cream shadow-sm transition hover:bg-forest/90"
                >
                  Download resource
                </a>
              )}

              {hasPdf && download.pdfUrl && download.pdfUrl !== primaryHref && (
                <a
                  href={download.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-forest/40 bg-white px-4 py-2 text-xs font-semibold text-forest transition hover:bg-forest/5"
                >
                  PDF version
                </a>
              )}

              {hasEpub && (
                <a
                  href={download.epubUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-lightGrey bg-white px-4 py-2 text-xs font-semibold text-deepCharcoal transition hover:bg-gray-50"
                >
                  EPUB version
                </a>
              )}
            </div>

            {/* Small note since MDX body is temporarily disabled */}
            <p className="mt-6 text-xs text-gray-500">
              Detailed walkthrough and narrative will be available in the next
              content refresh. The core tool is ready to use now.
            </p>
          </section>

          {/* Cover / visual */}
          <aside className="md:pl-4">
            <div className="overflow-hidden rounded-2xl border border-lightGrey bg-gray-50">
              {hasCover ? (
                <div className="relative aspect-[4/5] w-full">
                  <Image
                    src={download.coverImage as string}
                    alt={pageTitle}
                    fill
                    sizes="(min-width: 768px) 320px, 100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center bg-gradient-to-br from-deepCharcoal via-black to-forest/70">
                  <p className="px-6 text-center text-sm font-medium text-cream/85">
                    Abraham of London strategic download
                  </p>
                </div>
              )}
            </div>

            <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-gray-400 text-center select-none">
              ABRAHAMOFLONDON
            </p>
          </aside>
        </div>

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/downloads"
            className="text-sm text-forest underline-offset-4 hover:underline"
          >
            Back to all downloads
          </Link>
        </div>
      </main>
    </Layout>
  );
}