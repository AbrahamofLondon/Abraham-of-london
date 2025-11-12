// app/print/[slug]/page.tsx
import { MDXRemote } from 'next-mdx-remote';
import mdxComponents from '@/components/mdx-components';
import BrandFrame from '@/components/print/BrandFrame';
import { getAllPrintSlugs, getPrintDocumentBySlug } from '@/lib/server/print-utils';
import { serialize } from 'next-mdx-remote/serialize';
import type { PrintMeta } from '@/types/print';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Generate static params for all print slugs 
export async function generateStaticParams() {
  try {
    const slugs = getAllPrintSlugs(); // Array<{ slug: string; type: string; source: string }>
    
    // Apply the same robust deduplication logic
    const uniqueSlugs = Array.from(new Set(
      slugs.map(item => toCanonicalSlug(item.slug)).filter(Boolean)
    ));
    
    // Log for debugging (only in build time)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🖨️ Generated ${uniqueSlugs.length} print paths`);
    }
    
    return uniqueSlugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Canonical slug helper function (same as before)
function toCanonicalSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[\/\s-]+|[\/\s-]+$/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/-+/g, "-");
  return s || "untitled";
}

// Date formatting helper (same as before)
function formatPretty(isoish?: string | null, tz = "Europe/London"): string {
  if (!isoish || typeof isoish !== "string") return "Date TBC";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoish)) {
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
  } catch {
    return isoish;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = getPrintDocumentBySlug(slug);
  
  if (!doc) {
    return {
      title: 'Print Not Found',
      description: 'The requested print document was not found.',
    };
  }
  
  const title = doc.title || 'Untitled Print';
  const description = doc.description || doc.excerpt || 'Printable document from Abraham of London';
  
  return {
    title: `${title} | Print`,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      url: `/print/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: false, // Don't index print pages
      follow: true,
    },
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PrintPage({ params }: PageProps) {
  const { slug } = await params;
  const doc = getPrintDocumentBySlug(slug);
  
  // Handle not found
  if (!doc) {
    notFound();
  }

  // Prepare metadata
  const meta: PrintMeta = {
    slug,
    title: doc.title || "Untitled Print",
    description: doc.description ?? null,
    excerpt: doc.excerpt ?? null,
    author: doc.author ?? "Abraham of London",
    date: doc.date ?? null,
    category: (doc as any).category ?? null,
    tags: (doc as any).tags ?? [],
    coverImage: (doc as any).coverImage ?? null,
    heroImage: (doc as any).heroImage ?? null,
    isChathamRoom: (doc as any).isChathamRoom ?? false,
    source: doc.source ?? "mdx",
    kind: doc.type === "book" ? "book" : doc.type === "download" ? "download" : "print",
    content: doc.content ?? "",
    published: true,
  };

  // Serialize MDX content
  let mdx: MDXRemoteSerializeResult | null = null;
  if (meta.content && meta.content.trim()) {
    try {
      mdx = await serialize(meta.content, { 
        scope: meta,
        mdxOptions: {
          development: process.env.NODE_ENV === 'development',
        }
      });
    } catch (error) {
      console.error('Error serializing MDX:', error);
    }
  }

  // Structured data for SEO
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/print/${slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: meta.title,
    description: meta.description || meta.excerpt || "",
    url,
    ...(meta.author ? { author: { "@type": "Person", name: meta.author } } : {}),
    ...(meta.date ? { datePublished: meta.date } : {}),
    ...(meta.tags && meta.tags.length > 0 ? { keywords: meta.tags.join(', ') } : {}),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Print Content */}
      <BrandFrame
        title={meta.title}
        subtitle={meta.description || meta.excerpt || ''}
        author={meta.author}
        date={meta.date}
        pageSize="A4"
        marginsMm={18}
        category={meta.category}
        tags={meta.tags}
      >
        <article className="prose prose-lg mx-auto max-w-none print:prose-sm">
          <header className="border-b border-gray-200 pb-6 mb-8 print:border-b print:pb-4 print:mb-6">
            <h1 className="font-serif text-3xl print:text-2xl mb-4 text-deepCharcoal">
              {meta.title}
            </h1>
            
            {(meta.description || meta.excerpt) && (
              <p className="text-lg text-gray-600 print:text-base leading-relaxed">
                {meta.description || meta.excerpt}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500 print:text-xs">
              {meta.author && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">By:</span>
                  <span>{meta.author}</span>
                </div>
              )}
              {meta.date && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Date:</span>
                  <time dateTime={meta.date}>{formatPretty(meta.date)}</time>
                </div>
              )}
              {meta.category && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Category:</span>
                  <span>{meta.category}</span>
                </div>
              )}
            </div>
            
            {meta.tags && meta.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {meta.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded print:bg-transparent print:border print:border-gray-300"
                  >
                    {String(tag)}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Main Content */}
          <div className="print-content">
            {mdx ? (
              <MDXRemote 
                {...mdx} 
                components={mdxComponents}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">Content not available for printing</p>
                <p className="text-sm">Please check back later or contact support.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500 print:mt-8 print:pt-4">
            <p>Generated by Abraham of London • Printed on {new Date().toLocaleDateString('en-GB')}</p>
            <p className="mt-1 text-xs">
              {url}
            </p>
          </footer>
        </article>
      </BrandFrame>

      {/* Back Navigation (Hidden in print) */}
      <div className="fixed bottom-4 left-4 print:hidden">
        <Link 
          href="/print" 
          className="bg-white shadow-lg rounded-full p-3 text-gray-600 hover:text-deepCharcoal transition-colors border border-gray-200"
          title="Back to Print Materials"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
      </div>
    </>
  );
}

// ISR Configuration - 1 hour revalidation
export const revalidate = 3600;