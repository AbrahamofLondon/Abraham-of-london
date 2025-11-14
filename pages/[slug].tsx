// pages/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getPageBySlug, getPageSlugs } from "@/lib/server/pages-data";
import type { PageMeta } from "@/types/page";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
import mdxComponents from "@/components/mdx-components";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";

const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);
function formatPretty(isoish: string | null | undefined, tz = "Europe/London"): string {
  if (!isoish || typeof isoish !== "string") return "";
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric" }).format(d);
  }
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return isoish;
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${date}, ${time}`;
}

type PageProps = {
  page: PageMeta;
  contentSource: MDXRemoteSerializeResult;
  resourcesMeta: DownloadMeta[];
};

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

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/${slug}`;
  const relImage = coverImage ?? heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;
  const displayDescription = description || excerpt || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: displayDescription,
    url,
    ...(author ? { author: { "@type": "Person", name: author } } : {}),
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <article className="dynamic-page px-4 py-10 mx-auto max-w-4xl">
        <header className="mb-8 text-center">
          {heroImage && (
            <div className="relative aspect-[21/9] w-full mb-6 rounded-xl overflow-hidden">
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

          <h1 className="text-4xl md:text-5xl font-serif font-semibold mb-4 text-deepCharcoal">
            {title}
          </h1>

          {displayDescription && (
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              {displayDescription}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mb-8">
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
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {String(tag)}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="prose prose-lg max-w-none mb-12">
          <MDXRemote {...contentSource} components={mdxComponents} />
        </section>

        {resourcesMeta?.length > 0 && (
          <section className="mt-12 border-t border-lightGrey pt-8">
            <h2 className="font-serif text-2xl font-semibold text-deepCharcoal mb-6">
              Related Resources
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resourcesMeta.map((resource) => (
                <div
                  key={resource.slug}
                  className="group overflow-hidden rounded-xl border border-lightGrey bg-white shadow-sm transition hover:shadow-md"
                >
                  {resource.coverImage && (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={String(resource.coverImage)}
                        alt={resource.title || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-deepCharcoal mb-2">
                      <Link
                        href={`/downloads/${resource.slug}`}
                        className="hover:text-forest transition-colors"
                      >
                        {resource.title}
                      </Link>
                    </h3>
                    {resource.excerpt && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {String(resource.excerpt)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link
                        href={`/downloads/${resource.slug}`}
                        className="inline-flex items-center rounded-lg bg-forest px-3 py-1.5 text-sm font-medium text-white hover:bg-forest/90 transition-colors"
                      >
                        View Details
                      </Link>
                      {(resource as any).pdfPath && (
                        <a
                          href={String((resource as any).pdfPath)}
                          download
                          className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-12 bg-gradient-to-r from-forest to-softGold rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-serif font-semibold mb-4">Ready to take the next step?</h2>
          <p className="text-lg mb-6 opacity-90">
            Explore more resources or get in touch to discuss your project.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/print"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-medium text-deepCharcoal hover:bg-gray-100 transition-colors"
            >
              Browse Print Materials
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-white px-6 py-3 font-medium text-white hover:bg-white hover:text-deepCharcoal transition-colors"
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
    const paths = slugs.map((slug: string) => ({ params: { slug } }));
    return { paths, fallback: "blocking" };
  } catch (error) {
    console.error("Error generating page paths:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
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
    const jsonSafePage = JSON.parse(JSON.stringify(page));

    let contentSource: MDXRemoteSerializeResult | null = null;
    if (content) {
      contentSource = await serialize(content, { 
        scope: jsonSafePage as Record<string, unknown> 
      });
    }

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

    const resourcesMeta =
      resourceSlugs.length > 0 ? getDownloadsBySlugs(resourceSlugs) : [];

    return {
      props: {
        page: jsonSafePage,
        contentSource: (contentSource || {}) as MDXRemoteSerializeResult,
        resourcesMeta: JSON.parse(JSON.stringify(resourcesMeta)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for page:", error);
    return { notFound: true };
  }
};

export default DynamicPage;