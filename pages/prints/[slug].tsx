/* Institutional Print Collection Detail - FUNCTIONAL ACCESS EXPERIENCE */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";
import { 
  getContentlayerData, 
  isDraftContent, 
  normalizeSlug, 
} from "@/lib/contentlayer-compat";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { 
  Download, 
  Share2, 
  Eye, 
  Printer,
  Bookmark,
  Calendar,
  FileText,
  ExternalLink
} from "lucide-react";

// Enhanced components
const BackToTop = dynamic(
  () => import("@/components/enhanced/BackToTop"),
  { ssr: false }
);

type Props = {
  print: {
    title: string;
    excerpt: string | null;
    description: string | null;
    dimensions: string | null;
    coverImage: string | null;
    pdfUrl: string | null;
    highResUrl: string | null;
    slug: string;
    downloadCount: number | null;
    viewCount: number | null;
    createdAt: string | null;
    tags: string[];
    fileSize: string | null;
    printInstructions: string | null;
  };
  source: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { allPrints } = await getContentlayerData();

  const paths = (allPrints ?? [])
    .filter((p: any) => p && !isDraftContent(p))
    .map((p: any) => {
      const slug = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

function resolvePrintCoverImage(doc: any): string | null {
  return (
    doc?.coverImage ??
    doc?.coverimage ??
    doc?.image ??
    doc?.thumbnail ??
    null
  );
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug ?? ""));
  if (!slug) return { notFound: true };

  const { allPrints } = await getContentlayerData();

  const doc =
    (allPrints ?? []).find((p: any) => {
      const s = normalizeSlug(p?.slug ?? p?._raw?.flattenedPath ?? "");
      return s === slug;
    }) ?? null;

  if (!doc || isDraftContent(doc)) return { notFound: true };

  const mdxContent = (doc as any)?.body?.raw ?? (doc as any)?.content ?? " ";

  const print = {
    title: (doc as any).title || "Print Resource",
    excerpt: (doc as any).excerpt ?? null,
    description: (doc as any).description ?? (doc as any).excerpt ?? null,
    dimensions: (doc as any).dimensions ?? null,
    coverImage: resolvePrintCoverImage(doc),
    pdfUrl: (doc as any).pdfUrl ?? (doc as any).downloadUrl ?? null,
    highResUrl: (doc as any).highResUrl ?? null,
    slug,
    downloadCount: (doc as any).downloadCount ?? 0,
    viewCount: (doc as any).viewCount ?? 0,
    createdAt: (doc as any).date ?? (doc as any).createdAt ?? null,
    tags: (doc as any).tags ?? [],
    fileSize: (doc as any).fileSize ?? null,
    printInstructions: (doc as any).printInstructions ?? null,
  };

  const source = await serialize(mdxContent, {
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  });

  return { props: { print, source }, revalidate: 3600 };
};

const PrintDetailPage: NextPage<Props> = ({ print, source }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [viewCount, setViewCount] = React.useState(print.viewCount || 0);
  const [downloadCount, setDownloadCount] = React.useState(print.downloadCount || 0);

  // Real view tracking (client-side only)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Simple view count increment
      const views = parseInt(localStorage.getItem(`print-views-${print.slug}`) || '0');
      const newViews = views + 1;
      setViewCount(prev => prev + 1);
      localStorage.setItem(`print-views-${print.slug}`, newViews.toString());

      // Check bookmarks
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPrints') || '[]');
      setIsBookmarked(bookmarks.includes(print.slug));
    }
  }, [print.slug]);

  // REAL FUNCTION: Download PDF
  const handleDownload = async (urlType: 'pdf' | 'highres') => {
    const url = urlType === 'pdf' ? print.pdfUrl : print.highResUrl;
    
    if (!url) {
      alert('Download URL not available');
      return;
    }

    setIsDownloading(true);

    try {
      // Track download
      setDownloadCount(prev => prev + 1);
      
      // Open in new tab for PDFs
      if (url.endsWith('.pdf')) {
        window.open(url, '_blank');
      } else {
        // For images, create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `${print.slug}-${urlType === 'highres' ? 'high-res' : 'print'}.${url.split('.').pop()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Track in localStorage
      const downloads = JSON.parse(localStorage.getItem(`print-downloads`) || '{}');
      downloads[print.slug] = (downloads[print.slug] || 0) + 1;
      localStorage.setItem(`print-downloads`, JSON.stringify(downloads));

      // Optional: Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'download', {
          event_category: 'Print',
          event_label: print.title,
          value: 1
        });
      }

    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // REAL FUNCTION: Share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: print.title,
          text: print.excerpt || '',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Sharing cancelled', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // REAL FUNCTION: Bookmark
  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPrints') || '[]');
      
      if (isBookmarked) {
        const updated = bookmarks.filter((slug: string) => slug !== print.slug);
        localStorage.setItem('bookmarkedPrints', JSON.stringify(updated));
        setIsBookmarked(false);
      } else {
        bookmarks.push(print.slug);
        localStorage.setItem('bookmarkedPrints', JSON.stringify(bookmarks));
        setIsBookmarked(true);
      }
    }
  };

  // REAL FUNCTION: Print this page
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout
      title={`${print.title} - Print Resource`}
      description={print.description || print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/prints/${print.slug}`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Breadcrumb */}
          <nav className="mb-8 text-sm text-slate-600">
            <a href="/" className="hover:text-amber-600 transition-colors">
              Home
            </a>
            <span className="mx-2">/</span>
            <a href="/resources" className="hover:text-amber-600 transition-colors">
              Resources
            </a>
            <span className="mx-2">/</span>
            <span className="text-amber-700 font-medium">{print.title}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column: Preview */}
            <div className="space-y-6">
              {/* Main preview */}
              <div className="border-2 border-slate-200 bg-white rounded-xl shadow-lg overflow-hidden">
                {print.coverImage ? (
                  <img
                    src={print.coverImage}
                    alt={print.title}
                    className="w-full h-auto max-h-[500px] object-contain p-4"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-slate-100">
                    <div className="text-4xl text-slate-300">🖼️</div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">{viewCount}</div>
                  <div className="text-xs text-slate-600 mt-1">Views</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700">{downloadCount}</div>
                  <div className="text-xs text-amber-600 mt-1">Downloads</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-800">
                    {print.createdAt ? new Date(print.createdAt).getFullYear() : '—'}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Published</div>
                </div>
              </div>

              {/* Tags */}
              {print.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {print.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full border border-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Details & Actions */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                  {print.title}
                </h1>
                
                {print.excerpt && (
                  <p className="text-lg text-slate-700 mb-6 leading-relaxed">
                    {print.excerpt}
                  </p>
                )}
              </div>

              {/* Action Cards */}
              <div className="space-y-4">
                {/* Download Card */}
                {print.pdfUrl && (
                  <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">
                          Download Print-Ready PDF
                        </h3>
                        <p className="text-slate-700 text-sm">
                          High-quality PDF optimized for professional printing
                        </p>
                      </div>
                      <div className="text-3xl">📄</div>
                    </div>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all ${
                          isDownloading
                            ? 'bg-amber-200 text-amber-800 cursor-not-allowed'
                            : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]'
                        }`}
                      >
                        {isDownloading ? (
                          <>
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Preparing Download...
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Download PDF
                            {print.fileSize && (
                              <span className="text-sm opacity-90">({print.fileSize})</span>
                            )}
                          </>
                        )}
                      </button>
                      
                      <div className="text-xs text-slate-600 text-center">
                        Free download • No signup required
                      </div>
                    </div>
                  </div>
                )}

                {/* High-Res Option */}
                {print.highResUrl && (
                  <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">
                          High-Resolution Source File
                        </h3>
                        <p className="text-slate-700 text-sm">
                          Maximum quality for large-format printing
                        </p>
                      </div>
                      <div className="text-3xl">🎨</div>
                    </div>
                    
                    <button
                      onClick={() => handleDownload('highres')}
                      className="w-full py-3 px-4 border-2 border-blue-400 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      Download High-Res
                      <span className="text-sm opacity-90">(.TIFF/.PSD)</span>
                    </button>
                  </div>
                )}

                {/* Utility Actions */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleBookmark}
                    className={`p-4 rounded-lg border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                      isBookmarked
                        ? 'border-amber-400 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    <span className="text-xs font-medium">
                      {isBookmarked ? 'Saved' : 'Save'}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-4 rounded-lg border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-xs font-medium">Share</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="p-4 rounded-lg border-2 border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col items-center justify-center gap-2"
                  >
                    <Printer className="w-5 h-5" />
                    <span className="text-xs font-medium">Print</span>
                  </button>
                </div>

                {/* Printing Instructions */}
                {print.printInstructions && (
                  <div className="border-2 border-emerald-200 bg-emerald-50 rounded-xl p-6">
                    <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
                      <Printer className="w-5 h-5 text-emerald-600" />
                      Professional Printing Tips
                    </h3>
                    <p className="text-slate-700 text-sm">
                      {print.printInstructions}
                    </p>
                    {print.dimensions && (
                      <div className="mt-3 text-sm text-slate-600">
                        <strong>Recommended size:</strong> {print.dimensions}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="prose prose-slate max-w-none bg-white border border-slate-200 rounded-xl p-6">
                <MDXRemote {...source} components={mdxComponents} />
              </div>

              {/* Metadata */}
              <div className="border-t border-slate-200 pt-6 text-sm text-slate-600">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-slate-700 mb-1">Technical Details</div>
                    <ul className="space-y-1">
                      {print.dimensions && (
                        <li className="flex items-center gap-2">
                          <span>• Dimensions: {print.dimensions}</span>
                        </li>
                      )}
                      {print.fileSize && (
                        <li className="flex items-center gap-2">
                          <span>• File size: {print.fileSize}</span>
                        </li>
                      )}
                      {print.createdAt && (
                        <li className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>Published: {new Date(print.createdAt).toLocaleDateString()}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-slate-700 mb-1">Usage Rights</div>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2">
                        <span>• Personal use permitted</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>• Commercial use requires attribution</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span>• Modification allowed</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Related Content */}
              <div className="border-2 border-slate-200 bg-slate-50 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 text-lg mb-4">Related Resources</h3>
                <div className="space-y-3">
                  <a href="/canon" className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📚</div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-amber-700">
                          Full Canon Collection
                        </div>
                        <div className="text-sm text-slate-600">All institutional prints</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                  </a>
                  <a href="/resources/framing-guide" className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🖼️</div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-blue-700">
                          Framing Guide
                        </div>
                        <div className="text-sm text-slate-600">How to frame prints professionally</div>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BackToTop />

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav, button, .no-print {
            display: none !important;
          }
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          
          .prose {
            max-width: 100% !important;
            padding: 0 !important;
            border: none !important;
          }
          
          .grid {
            display: block !important;
          }
          
          h1 {
            font-size: 24pt !important;
            color: black !important;
          }
          
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </Layout>
  );
};

export default PrintDetailPage;