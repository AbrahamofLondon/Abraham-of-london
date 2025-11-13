// pages/books/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getBookBySlug, getBookSlugs } from "@/lib/server/books-data";
import type { BookMeta } from "@/types/book";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
import mdxComponents from "@/components/mdx-components";
import { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";

// Date formatting utility
const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);
function formatPretty(isoish: string | null | undefined, tz = "Europe/London"): string {
  if (!isoish || typeof isoish !== 'string') return '';
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

type BookPageProps = {
  book: BookMeta;
  contentSource: MDXRemoteSerializeResult;
  resourcesMeta: DownloadMeta[];
};

function BookPage({ book, contentSource, resourcesMeta }: BookPageProps) {
  if (!book) return <div>Book not found.</div>;

  const { 
    slug, 
    title, 
    description, 
    summary, 
    author, 
    publisher, 
    publishedDate, 
    isbn, 
    coverImage, 
    heroImage, 
    tags, 
    category,
    rating,
    pages,
    language,
    format,
    purchaseLinks
  } = book;
  
  const prettyDate = formatPretty(publishedDate);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/books/${slug}`;
  const relImage = coverImage ?? heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;
  const displayDescription = description || summary || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: title,
    author: author ? {
      "@type": "Person",
      name: author
    } : undefined,
    publisher: publisher ? {
      "@type": "Organization",
      name: publisher
    } : undefined,
    datePublished: publishedDate,
    isbn: isbn,
    numberOfPages: pages,
    inLanguage: language,
    bookFormat: format ? `https://schema.org/${format.charAt(0).toUpperCase() + format.slice(1)}Format` : undefined,
    ...(absImage ? { image: [absImage] } : {}),
    description: displayDescription,
    url,
  };

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={displayDescription} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="book" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={displayDescription} />
        {isbn && <meta property="book:isbn" content={isbn} />}
        {author && <meta property="book:author" content={author} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <article className="book-page px-4 py-10 mx-auto max-w-6xl">
        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Book Cover */}
            {coverImage && (
              <div className="lg:w-2/5">
                <div className="relative aspect-[3/4] w-full max-w-[400px] mx-auto lg:mx-0">
                  <Image
                    src={coverImage}
                    alt={`Cover of ${title}`}
                    fill
                    className="object-cover rounded-xl shadow-2xl"
                    sizes="(max-width: 1024px) 400px, 300px"
                    priority
                  />
                </div>
              </div>
            )}
            
            {/* Book Info */}
            <div className="lg:w-3/5">
              <div className="mb-6">
                {category && (
                  <span className="inline-block bg-forest text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                    {category}
                  </span>
                )}
                <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 text-deepCharcoal leading-tight">
                  {title}
                </h1>
                
                {author && (
                  <p className="text-2xl text-forest mb-6 font-light">
                    by <span className="font-semibold">{author}</span>
                  </p>
                )}
              </div>
              
              {/* Book Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {publisher && (
                  <div>
                    <span className="font-semibold text-gray-700">Publisher:</span>
                    <p className="text-gray-600">{publisher}</p>
                  </div>
                )}
                {publishedDate && (
                  <div>
                    <span className="font-semibold text-gray-700">Published:</span>
                    <p className="text-gray-600">{prettyDate}</p>
                  </div>
                )}
                {isbn && (
                  <div>
                    <span className="font-semibold text-gray-700">ISBN:</span>
                    <p className="text-gray-600 font-mono">{isbn}</p>
                  </div>
                )}
                {pages && (
                  <div>
                    <span className="font-semibold text-gray-700">Pages:</span>
                    <p className="text-gray-600">{pages}</p>
                  </div>
                )}
                {language && (
                  <div>
                    <span className="font-semibold text-gray-700">Language:</span>
                    <p className="text-gray-600">{language}</p>
                  </div>
                )}
                {format && (
                  <div>
                    <span className="font-semibold text-gray-700">Format:</span>
                    <p className="text-gray-600 capitalize">{format}</p>
                  </div>
                )}
                {rating && (
                  <div>
                    <span className="font-semibold text-gray-700">Rating:</span>
                    <p className="text-gray-600">{rating}/5 ⭐</p>
                  </div>
                )}
              </div>

              {/* Book Description */}
              {displayDescription && (
                <div className="mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {displayDescription}
                  </p>
                </div>
              )}

              {/* Purchase Links */}
              {purchaseLinks && purchaseLinks.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4 text-deepCharcoal">Where to Buy</h3>
                  <div className="flex flex-wrap gap-3">
                    {purchaseLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-forest text-white px-6 py-3 rounded-lg font-medium hover:bg-forest/90 transition-colors"
                      >
                        {link.platform}
                        {link.price && <span className="ml-2 text-sm opacity-90">({link.price})</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200"
                    >
                      {String(tag)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Book Content */}
        {contentSource && (
          <section className="prose prose-lg max-w-none mb-16 bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <MDXRemote {...contentSource} components={mdxComponents} />
          </section>
        )}

        {/* Resources Section */}
        {resourcesMeta?.length > 0 && (
          <section className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal mb-8 text-center">
              Related Resources
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {resourcesMeta.map((resource) => (
                <div key={resource.slug} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
                  {resource.coverImage && (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={String(resource.coverImage)}
                        alt={resource.title || ''}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-deepCharcoal mb-3">
                      <Link href={`/downloads/${resource.slug}`} className="hover:text-forest transition-colors">
                        {resource.title}
                      </Link>
                    </h3>
                    {resource.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {String(resource.excerpt)}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Link
                        href={`/downloads/${resource.slug}`}
                        className="inline-flex items-center rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest/90 transition-colors"
                      >
                        View Details
                      </Link>
                      {(resource as any).pdfPath && (
                        <a
                          href={String((resource as any).pdfPath)}
                          download
                          className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Navigation */}
        <footer className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
          <Link
            href="/books"
            className="inline-flex items-center text-forest hover:text-forest/80 transition-colors font-medium"
          >
            ← Back to All Books
          </Link>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-GB')}
          </div>
        </footer>
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const slugs = getBookSlugs();
    const paths = slugs.map((slug: string) => ({ params: { slug } }));
    
    return {
      paths,
      fallback: 'blocking'
    };
  } catch (error) {
    console.error('Error generating book paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    
    if (!slug) {
      return { notFound: true };
    }

    const bookData = getBookBySlug(slug, [
      "slug", "title", "author", "publisher", "publishedDate", "isbn", 
      "description", "summary", "coverImage", "heroImage", "tags", "category",
      "resources", "content", "rating", "pages", "language", "format", "purchaseLinks"
    ]);

    if (!bookData || !bookData.title) {
      return { notFound: true };
    }

    const { content, ...book } = bookData;
    const jsonSafeBook = JSON.parse(JSON.stringify(book));
    
    let contentSource: MDXRemoteSerializeResult | null = null;
    if (content) {
      contentSource = await serialize(content, { scope: jsonSafeBook });
    }

    // Extract resource slugs from book resources
    const resourceSlugs: string[] = [];
    if (jsonSafeBook.resources?.downloads) {
      jsonSafeBook.resources.downloads.forEach((resource: any) => {
        if (resource.href) {
          const slug = resource.href.split('/').pop();
          if (slug) resourceSlugs.push(slug);
        }
      });
    }

    if (jsonSafeBook.resources?.reads) {
      jsonSafeBook.resources.reads.forEach((resource: any) => {
        if (resource.href) {
          const slug = resource.href.split('/').pop();
          if (slug) resourceSlugs.push(slug);
        }
      });
    }

    const resourcesMeta = resourceSlugs.length > 0 ? getDownloadsBySlugs(resourceSlugs) : [];

    return {
      props: {
        book: jsonSafeBook,
        contentSource: contentSource || {} as MDXRemoteSerializeResult,
        resourcesMeta: JSON.parse(JSON.stringify(resourcesMeta))
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error in getStaticProps for book:', error);
    return { notFound: true };
  }
};

export default BookPage;