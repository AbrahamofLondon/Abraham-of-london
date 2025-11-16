// pages/books/[slug].tsx

import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import {
  MDXRemote,
  type MDXRemoteSerializeResult,
} from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getPageBySlug, getPageSlugs } from "@/lib/server/pages-data";
import type { PageMeta } from "@/types/page";
import {
  getDownloadsBySlugs,
  type DownloadMeta,
} from "@/lib/server/downloads-data";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PageProps = {
  page: PageMeta;
  contentSource: MDXRemoteSerializeResult;
  resourcesMeta: DownloadMeta[];
};

type _RelatedResource = {
  slug: string;
  title?: string;
  description?: string | null;
  coverImage?: string | null;
  href?: string;
  excerpt?: string | null;
  pdfPath?: string | null;
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

function DynamicPage({ page, contentSource, resourcesMeta }: PageProps) {
  if (!page) return <div>Page not found.</div>;

  const {
    slug,
    title,
    description,
    excerpt,
    heroImage,
    coverImage,
    date,
    author,
    tags,
    category,
  } = page;

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.abrahamoflondon.org";

  const pathSegment = slug ? `books/${slug}` : "books";
  const url = `${site.replace(/\/+$/, "")}/${pathSegment}`;

  const relImage = coverImage ?? heroImage;
  const absImage = relImage
    ? new URL(relImage, site).toString()
    : undefined;

  const displayDescription = description || excerpt || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    description: displayDescription,
    url,
    ...(author
      ? {
          author: {
            "@type": "Person",
            name: author,
          },
        }
      : {}),
    ...(date ? { datePublished: date } : {}),
    ...(absImage ? { image: [absImage] } : {}),
    ...(category ? { about: category } : {}),
  };

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
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

      <article className="dynamic-page mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 text-center">
          {heroImage && (
            <div className="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-xl">
              <Image
                src={heroImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
            </div>
          )}

          <h1 className="mb-4 font-serif text-4xl font-semibold text-deepCharcoal md:text-5xl">
            {title}
          </h1>

          {displayDescription && (
            <p className="mx-auto mb-6 max-w-3xl text-xl leading-relaxed text-gray-600">
              {displayDescription}
            </p>
          )}

          <div className="mb-8 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            {author && (
              <div className="flex items-center gap-1">
                <span className="font-medium">By:</span>
                <span>{author}</span>
              </div>
            )}
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
        </header>

        <section className="prose prose-lg mb-12 max-w-none">
          <MDXRemote {...contentSource} components={mdxComponents} />
        </section>

        {resourcesMeta && resourcesMeta.length > 0 && (
          <section className="mt-12 border-t border-lightGrey pt-8">
            <h2 className="mb-6 font-serif text-2xl font-semibold text-deepCharcoal">
              Related Resources
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resourcesMeta.map((resource) => {
                // FIX: Safely handle coverImage with proper type checking
                const coverImage =
                  typeof resource.coverImage === "string" &&
                  resource.coverImage.trim().length > 0
                    ? resource.coverImage
                    : null;

                // FIX: Safely handle pdfPath with type checking
                const pdfPath =
                  typeof (resource as any).pdfPath === "string" &&
                  (resource as any).pdfPath.trim().length > 0
                    ? (resource as any).pdfPath
                    : null;

                return (
                  <div
                    key={resource.slug}
                    className="group overflow-hidden rounded-xl border border-lightGrey bg-white shadow-sm transition hover:shadow-md"
                  >
                    {coverImage ? (
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={coverImage}
                          alt={resource.title || resource.slug || "Resource image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                    ) : null}
                    
                    <div className="p-4">
                      <h3 className="mb-2 text-lg font-semibold text-deepCharcoal">
                        <Link
                          href={`/downloads/${resource.slug}`}
                          className="transition-colors hover:text-forest"
                        >
                          {resource.title}
                        </Link>
                      </h3>

                      {resource.excerpt && (
                        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                          {String(resource.excerpt)}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Link
                          href={`/downloads/${resource.slug}`}
                          className="inline-flex items-center rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-forest/90"
                        >
                          View Details
                        </Link>
                        
                        {pdfPath && (
                          <a
                            href={pdfPath}
                            download
                            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-12 rounded-2xl bg-gradient-to-r from-forest to-softGold p-8 text-center text-white">
          <h2 className="mb-4 font-serif text-2xl font-semibold">
            Ready to take the next step?
          </h2>
          <p className="mb-6 text-lg opacity-90">
            Explore more resources or get in touch to discuss your project.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/print"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-deepCharcoal transition-colors hover:bg-gray-100"
            >
              Browse Print Materials
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-white px-6 py-3 font-medium text-white transition-colors hover:bg-white hover:text-deepCharcoal"
            >
              Get In Touch
            </Link>
          </div>
        </section>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const slugs = getPageSlugs();
    const paths =
      slugs?.map((slug: string) => ({
        params: { slug: String(slug) },
      })) ?? [];

    return { paths, fallback: false };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating page paths:", error);
    return { paths: [], fallback: false };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string | undefined;
    if (!slug) return { notFound: true };

    const pageData = getPageBySlug(slug, [
      "slug",
      "title",
      "description",
      "excerpt",
      "heroImage",
      "coverImage",
      "date",
      "author",
      "tags",
      "category",
      "resources",
      "content",
    ]);

    if (!pageData || !pageData.title) return { notFound: true };

    const { content, ...page } = pageData;

    const jsonSafePage: PageMeta = JSON.parse(JSON.stringify(page));

    const contentSource = await serialize(content || "", {
      scope: jsonSafePage as unknown as Record<string, unknown>,
    });

    const resourceSlugs: string[] = [];

    if (jsonSafePage.resources?.downloads) {
      jsonSafePage.resources.downloads.forEach((r: any) => {
        const s = r?.href?.split("/").pop();
        if (s) resourceSlugs.push(s);
      });
    }

    if (jsonSafePage.resources?.reads) {
      jsonSafePage.resources.reads.forEach((r: any) => {
        const s = r?.href?.split("/").pop();
        if (s) resourceSlugs.push(s);
      });
    }

    const resourcesMeta: DownloadMeta[] =
      resourceSlugs.length > 0
        ? JSON.parse(
            JSON.stringify(getDownloadsBySlugs(resourceSlugs))
          )
        : [];

    return {
      props: {
        page: jsonSafePage,
        contentSource,
        resourcesMeta,
      },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in getStaticProps for /books/[slug]:", error);
    return { notFound: true };
  }
};

export default DynamicPage;