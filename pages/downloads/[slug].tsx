// pages/downloads/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import {
  getDownloadBySlug,
  getDownloadSlugs,
  type DownloadMeta,
} from "@/lib/server/downloads-data";

const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);

function formatPretty(
  isoish: string | null | undefined,
  tz = "Europe/London"
): string {
  if (!isoish || typeof isoish !== "string") return "";
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  }
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return isoish;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date}, ${time}`;
}

/**
 * Resolve the actual download URL for a given download meta.
 * - Prefer explicit fields: pdfPath, fileUrl, downloadUrl
 * - Fallback: /downloads/[slug].pdf
 * - Normalise leading slash
 * - Allow absolute URLs
 */
function resolveDownloadUrl(download: DownloadMeta & { slug?: string }) {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org";
  const siteBase = site.replace(/\/+$/, "");

  const raw =
    (download as any).pdfPath ||
    (download as any).fileUrl ||
    (download as any).downloadUrl ||
    (download.slug ? `/downloads/${download.slug}.pdf` : null);

  if (!raw) return { relative: null as string | null, absolute: null as string | null };

  const str = String(raw).trim();
  if (!str) return { relative: null, absolute: null };

  // Absolute URL already
  if (/^https?:\/\//i.test(str)) {
    return { relative: str, absolute: str };
  }

  // Ensure leading slash and strip any leading "./"
  const normalised =
    str.startsWith("/") ? str.replace(/^\/+/, "/") : `/${str.replace(/^\/+/, "")}`;

  const absolute = new URL(normalised, siteBase).toString();
  return { relative: normalised, absolute };
}

type DownloadPageProps = {
  download: DownloadMeta;
  contentSource: MDXRemoteSerializeResult;
};

function DownloadPage({ download, contentSource }: DownloadPageProps) {
  if (!download) return <div>Download not found.</div>;

  const {
    slug,
    title,
    description,
    excerpt,
    coverImage,
    heroImage,
    date,
    tags,
    category,
  } = download as DownloadMeta & {
    heroImage?: string;
  };

  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const siteBase = site.replace(/\/+$/, "");
  const pathSegment = slug ? `downloads/${slug}` : "downloads";
  const url = `${siteBase}/${pathSegment}`;

  const relImage = coverImage ?? heroImage;
  const absImage = relImage
    ? new URL(String(relImage), siteBase).toString()
    : undefined;
  const displayDescription = description || excerpt || "";

  const { relative: downloadUrl, absolute: downloadAbsUrl } =
    resolveDownloadUrl(download as DownloadMeta & { slug?: string });

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: title,
    description: displayDescription,
    url,
    ...(date ? { datePublished: date } : {}),
    ...(absImage ? { image: [absImage] } : {}),
    ...(category ? { about: category } : {}),
    ...(downloadAbsUrl ? { contentUrl: downloadAbsUrl } : {}),
  };

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Downloads | Abraham of London</title>
        <meta name="description" content={displayDescription} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={displayDescription} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <article className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 text-center">
          {(heroImage || coverImage) && (
            <div className="relative mb-6 w-full overflow-hidden rounded-xl aspect-[21/9]">
              <Image
                src={String(heroImage || coverImage)}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>
          )}

          <h1 className="mb-4 text-4xl font-serif font-semibold text-deepCharcoal md:text-5xl">
            {title}
          </h1>

          {displayDescription && (
            <p className="mx-auto mb-6 max-w-3xl text-xl leading-relaxed text-gray-600">
              {displayDescription}
            </p>
          )}

          <div className="mb-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            {date && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Published:</span>
                <time dateTime={date}>{formatPretty(date)}</time>
              </div>
            )}
            {category && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Category:</span>
                <span>{category}</span>
              </div>
            )}
          </div>

          {tags && tags.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {String(tag)}
                </span>
              ))}
            </div>
          )}

          {downloadUrl ? (
            <div className="mb-8 flex justify-center">
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center rounded-lg bg-forest px-6 py-3 font-medium text-white transition-colors hover:bg-forest/90"
              >
                Download
              </a>
            </div>
          ) : (
            <div className="mb-8 text-sm text-red-600">
              Download link is not configured for this resource. Please contact
              Abraham if you believe this is an error.
            </div>
          )}
        </header>

        <section className="prose prose-lg mb-12 max-w-none">
          <MDXRemote {...contentSource} components={mdxComponents} />
        </section>

        <section className="mt-12 rounded-2xl bg-gradient-to-r from-forest to-softGold p-8 text-center text-white">
          <h2 className="mb-4 text-2xl font-serif font-semibold">
            Explore more resources
          </h2>
          <p className="mb-6 text-lg opacity-90">
            Browse the full downloads library or get in touch if you need
            something tailored.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/downloads"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-deepCharcoal transition-colors hover:bg-gray-100"
            >
              Back to Downloads
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-white px-6 py-3 font-medium text-white transition-colors hover:bg-white hover:text-deepCharcoal"
            >
              Contact Abraham
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const slugs = getDownloadSlugs?.() ?? [];
    const paths = slugs.map((slug: string) => ({
      params: { slug: String(slug) },
    }));
    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating download paths:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<DownloadPageProps> = async ({
  params,
}) => {
  try {
    const slug = params?.slug as string | undefined;
    if (!slug) return { notFound: true };

    const downloadData = getDownloadBySlug(slug, [
      "slug",
      "title",
      "description",
      "excerpt",
      "coverImage",
      "heroImage",
      "date",
      "tags",
      "category",
      "content",
      "pdfPath",
      "fileUrl",
      "downloadUrl",
    ]);

    if (!downloadData || !downloadData.title) {
      return { notFound: true };
    }

    const { content, ...download } = downloadData as DownloadMeta & {
      content?: string;
    };

    const jsonSafeDownload = JSON.parse(
      JSON.stringify(download)
    ) as DownloadMeta;

    const contentSource = await serialize(content || "", {
      scope: jsonSafeDownload as unknown as Record<string, unknown>,
    });

    return {
      props: {
        download: jsonSafeDownload,
        contentSource,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /downloads/[slug]:", error);
    return { notFound: true };
  }
};

export default DownloadPage;