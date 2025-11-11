// pages/print/[slug].tsx
import type { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from '...';
import Error from "next/error";
import Head from "next/head";
import * as React from "react";
import Link from "next/link";
import { toJSONSafe } from '...';
import SiteLayout from "@/components/SiteLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingFallback from "@/components/LoadingFallback";

// Contentlayer imports
import { allPosts, allResources, allBooks } from '...';
import { something } from '...';

// Types
type PrintProps = {
  content: unknown;
  printData: string;
  frontmatter: Record<string, any>;
  printConfig: {
    showHeader: boolean;
    showFooter: boolean;
    showPageNumbers: boolean;
    format: "A4" | "letter" | "booklet";
  };
  performanceMetrics?: {
    renderTime: number;
    contentSize: number;
  };
};

type Params = {
  slug: string;
};

// Utility functions
const findPrintContentBySlug = (slug: string) => {
  const allContent = [...allPosts, ...allBooks, ...allEvents];
  return allContent.find((item) => item.slug === slug);
};

const processPrintContent = (content: unknown) => {
  if (!content) return null;
  
  return {
    ...content,
    body: content.body || content.content || "",
    title: content.title || "Untitled",
    description: content.description || content.excerpt || "",
    date: content.date ? new Date(content.date).toISOString() : new Date().toISOString(),
    printReady: true,
  };
};

const generatePrintStyles = (config: PrintProps['printConfig']) => {
  return `
    @media print {
      @page {
        size: ${config.format};
        margin: 1in;
      }
      
      body {
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
        background: #fff;
      }
      
      h1, h2, h3, h4, h5, h6 {
        color: #000;
        page-break-after: avoid;
      }
      
      p, li {
        orphans: 3;
        widows: 3;
      }
      
      pre, blockquote {
        page-break-inside: avoid;
      }
      
      img {
        max-width: 100% !important;
        page-break-inside: avoid;
      }
      
      ${config.showPageNumbers ? `
        @page {
          @bottom-center {
            content: counter(page);
            font-size: 10pt;
          }
        }
      ` : ''}
      
      ${!config.showHeader ? `
        header { display: none !important; }
      ` : ''}
      
      ${!config.showFooter ? `
        footer { display: none !important; }
      ` : ''}
      
      .no-print { display: none !important; }
      .print-only { display: block !important; }
    }
    
    .print-only { display: none; }
  `;
};

export default function PrintPage({
  content,
  printData,
  frontmatter,
  printConfig,
  performanceMetrics
}: PrintProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPrinting, setIsPrinting] = React.useState(false);

  React.useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleDownloadPDF = () => {
    // PDF generation logic would go here
    console.log('Generating PDF for:', frontmatter.title);
  };

  if (router.isFallback || isLoading) {
    return (
      <SiteLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingFallback type="print" />
        </div>
      </SiteLayout>
    );
  }

  if (!content) {
    return (
      <SiteLayout>
        <Error statusCode={404} title="Print content not found" />
      </SiteLayout>
    );
  }

  const PrintContent = getMDXComponent(printData);

  return (
    <SiteLayout
      pageTitle={`Print: ${frontmatter.title} - Abraham of London`}
      metaDescription={`Printable version: ${frontmatter.description}`}
      canonicalUrl={`https://abrahamoflondon.com/print/${content.slug}`}
      noIndex={true} // Don't index print pages
    >
      <Head>
        <style>{generatePrintStyles(printConfig)}</style>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <ErrorBoundary fallback={<div className="container mx-auto px-4 py-8">Error loading print content</div>}>
        <div className="min-h-screen bg-white">
          {/* Print Controls */}
          <div className="no-print bg-deepCharcoal text-cream p-4 sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto max-w-6xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Link href={`/${content.slug}`} className="hover:text-softGold transition-colors flex items-center gap-2">
                    ← Back to Original
                  </Link>
                  <span className="text-cream/70">|</span>
                  <span className="font-semibold">Print Preview: {frontmatter.title}</span>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handlePrint}
                    disabled={isPrinting}
                    className="bg-forest hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPrinting ? '🖨️ Printing...' : '🖨️ Print'}
                  </button>
                  
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    📥 Download PDF
                  </button>
                  
                  <select 
                    className="bg-white text-deepCharcoal px-3 py-2 rounded border border-lightGrey"
                    onChange={(e) => console.log('Format changed:', e.target.value)}
                  >
                    <option value="A4">A4 Format</option>
                    <option value="letter">Letter Format</option>
                    <option value="booklet">Booklet Format</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Print Content */}
          <article className="print-content bg-white py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              {/* Print Header */}
              <header className="text-center mb-12 print-only border-b border-deepCharcoal/20 pb-8">
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-deepCharcoal mb-4">
                  {frontmatter.title}
                </h1>
                
                {frontmatter.description && (
                  <p className="text-lg text-deepCharcoal/70 max-w-3xl mx-auto leading-relaxed">
                    {frontmatter.description}
                  </p>
                )}
                
                <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-deepCharcoal/60">
                  {frontmatter.author && (
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>By {frontmatter.author}</span>
                    </div>
                  )}
                  
                  {frontmatter.date && (
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Published {new Date(frontmatter.date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {frontmatter.readTime && (
                    <div className="flex items-center gap-2">
                      <span>⏱️</span>
                      <span>{frontmatter.readTime} read</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-8 text-xs text-deepCharcoal/40">
                  Source: Abraham of London • https://abrahamoflondon.com/{content.slug}
                </div>
              </header>

              {/* Main Content */}
              <div className="prose prose-lg max-w-none print:prose-sm">
                <PrintContent />
              </div>

              {/* Print Footer */}
              <footer className="print-only mt-16 pt-8 border-t border-deepCharcoal/20 text-center text-sm text-deepCharcoal/60">
                <p>Printed from Abraham of London • https://abrahamoflondon.com</p>
                <p className="mt-2">© {new Date().getFullYear()} Abraham of London. All rights reserved.</p>
                <div className="mt-4 text-xs text-deepCharcoal/40">
                  Printed on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                </div>
              </footer>
            </div>
          </article>

          {/* Print Tips */}
          <div className="no-print bg-warmWhite border-t border-lightGrey py-8">
            <div className="container mx-auto px-4 max-w-4xl">
              <h3 className="font-serif text-xl font-bold text-deepCharcoal mb-4">Printing Tips</h3>
              <div className="grid gap-4 md:grid-cols-2 text-sm text-deepCharcoal/70">
                <div className="flex items-start gap-3">
                  <span className="text-forest text-lg">🖨️</span>
                  <div>
                    <strong>Best Results:</strong> Use "Save as PDF" for digital copies
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-forest text-lg">📄</span>
                  <div>
                    <strong>Paper:</strong> Recommended 80-100gsm for best readability
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-forest text-lg">🎨</span>
                  <div>
                    <strong>Color:</strong> Black and white printing recommended for text
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-forest text-lg">📏</span>
                  <div>
                    <strong>Margins:</strong> Default margins work well for most printers
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics (Development only) */}
          {process.env.NODE_ENV === 'development' && performanceMetrics && (
            <div className="no-print fixed bottom-4 right-4 bg-deepCharcoal text-cream px-3 py-2 rounded text-xs">
              Render: {performanceMetrics.renderTime}ms
            </div>
          )}
        </div>
      </ErrorBoundary>
    </SiteLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const startTime = Date.now();
  
  try {
    const allContent = [...allPosts, ...allBooks, ...allEvents];
    
    const paths = allContent
      .filter((item) => item.slug && !item.draft && item.printable !== false)
      .map((item) => ({
        params: { slug: item.slug },
      }));

    console.log(`Generated ${paths.length} print paths in ${Date.now() - startTime}ms`);
    
    return {
      paths,
      fallback: true,
    };
  } catch (error) {
    console.error('Error generating print static paths:', error);
    return {
      paths: [],
      fallback: true,
    };
  }
};

export const getStaticProps: GetStaticProps<PrintProps, Params> = async (ctx) => {
  const startTime = Date.now();
  const { params } = ctx;

  if (!params?.slug) {
    return {
      notFound: true,
    };
  }

  try {
    const content = findPrintContentBySlug(params.slug);
    
    if (!content) {
      return {
        notFound: true,
      };
    }

    const processedContent = processPrintContent(content);
    
    if (!processedContent) {
      return {
        notFound: true,
      };
    }

    const printConfig = {
      showHeader: content.printHeader !== false,
      showFooter: content.printFooter !== false,
      showPageNumbers: content.pageNumbers !== false,
      format: content.printFormat || "A4",
    };

    const performanceMetrics = {
      renderTime: Date.now() - startTime,
      contentSize: processedContent.body?.length || 0,
    };

    return {
      props: toJSONSafe({
        content: processedContent,
        printData: processedContent.body,
        frontmatter: {
          title: processedContent.title,
          description: processedContent.description,
          date: processedContent.date,
          author: processedContent.author,
          readTime: processedContent.readTime,
          category: processedContent.category,
        },
        printConfig,
        performanceMetrics,
      }),
      revalidate: 3600, // 1 hour
    };
  } catch (error) {
    console.error('Error in getStaticProps for print:', params.slug, error);
    
    return {
      notFound: true,
    };
  }
};
