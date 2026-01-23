/* Institutional Print Collection Detail - USING YOUR EXISTING HOC */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { withInnerCircleAuth } from "@/lib/auth/withInnerCircleAuth";
import { 
  getContentlayerData, 
  isDraftContent,
  resolveDocCoverImage
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
  ExternalLink,
  Lock,
  Users,
  AlertCircle,
  ChevronLeft,
  FileText,
  Maximize2,
  CheckCircle,
  Tag,
  Ruler
} from "lucide-react";
import type { User } from '@/types/auth';

// Define role hierarchy
const ROLE_HIERARCHY: Record<string, number> = {
  'public': 0,
  'member': 1,
  'patron': 2,
  'inner-circle': 3,
  'founder': 4
};

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
    accessLevel: 'public' | 'member' | 'patron' | 'inner-circle' | 'founder';
    paperType?: string;
    inkType?: string;
    orientation?: 'portrait' | 'landscape';
  };
  source: MDXRemoteSerializeResult;
  user?: User; // Injected by HOC
  requiredRole?: string; // Injected by HOC
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { allPrints } = await getContentlayerData();

    const paths = (allPrints ?? [])
      .filter((p: any) => p && !isDraftContent(p))
      .map((p: any) => {
        // Try multiple possible slug properties
        const slug = p?.slug || p?._raw?.flattenedPath || "";
        // Ensure slug is a string and normalize it
        if (typeof slug === 'string' && slug.trim()) {
          // Remove any trailing .md or .mdx extensions
          const normalized = slug.replace(/\.(md|mdx)$/, '');
          return normalized;
        }
        return "";
      })
      .filter((slug: string) => slug && slug.trim() !== '')
      .map((slug: string) => ({ 
        params: { slug } 
      }));

    return { 
      paths, 
      fallback: "blocking" 
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<Omit<Props, 'user' | 'requiredRole'>> = async ({ params }) => {
  try {
    const rawSlug = params?.slug;
    const slug = 
      typeof rawSlug === "string"
        ? rawSlug
        : Array.isArray(rawSlug) && typeof rawSlug[0] === "string"
          ? rawSlug[0]
          : "";

    if (!slug) return { notFound: true };

    const { allPrints } = await getContentlayerData();

    const doc = (allPrints ?? []).find((p: any) => {
      // Try multiple slug properties for matching
      const pSlug = p?.slug || p?._raw?.flattenedPath || "";
      const normalizedPSlug = typeof pSlug === 'string' ? pSlug.replace(/\.(md|mdx)$/, '') : "";
      return normalizedPSlug === slug;
    }) ?? null;

    if (!doc || isDraftContent(doc)) return { notFound: true };

    const mdxContent = (doc as any)?.body?.raw ?? (doc as any)?.content ?? " ";

    const print = {
      title: (doc as any).title || "Print Resource",
      excerpt: (doc as any).excerpt ?? null,
      description: (doc as any).description ?? (doc as any).excerpt ?? null,
      dimensions: (doc as any).dimensions ?? null,
      coverImage: resolveDocCoverImage(doc) || null,
      pdfUrl: (doc as any).pdfUrl ?? (doc as any).downloadUrl ?? null,
      highResUrl: (doc as any).highResUrl ?? null,
      slug,
      downloadCount: (doc as any).downloadCount ?? 0,
      viewCount: (doc as any).viewCount ?? 0,
      createdAt: (doc as any).date ?? (doc as any).createdAt ?? null,
      tags: Array.isArray((doc as any).tags) ? (doc as any).tags : [],
      fileSize: (doc as any).fileSize ?? null,
      printInstructions: (doc as any).printInstructions ?? null,
      accessLevel: ((doc as any).accessLevel ?? 'public') as 'public' | 'member' | 'patron' | 'inner-circle' | 'founder',
      paperType: (doc as any).paperType,
      inkType: (doc as any).inkType,
      orientation: (doc as any).orientation,
    };

    const source = await serialize(mdxContent, {
      mdxOptions: { 
        remarkPlugins: [remarkGfm], 
        rehypePlugins: [rehypeSlug] 
      },
    });

    return { 
      props: { print, source }, 
      revalidate: 3600 
    };
  } catch (error) {
    console.error('Error generating static props:', error);
    return {
      notFound: true
    };
  }
};

// Access Denied Component
const AccessDeniedComponent: React.FC<{ print: Props['print']; requiredRole?: string }> = ({ print, requiredRole }) => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white py-16 px-4">
      <div className="max-w-md w-full mx-auto p-8 text-center bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-100 mb-6">
          <Lock className="w-12 h-12 text-amber-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {requiredRole?.replace('-', ' ').toUpperCase()} Content
        </h1>
        
        <p className="text-slate-700 mb-6">
          "{print.title}" requires <span className="font-semibold">{requiredRole}</span> access.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${requiredRole}`)}
            className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors"
          >
            Sign In to Access
          </button>
          
          <div className="text-sm text-slate-600">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-4 h-4" />
              <span>Need access?</span>
            </div>
            <button
              onClick={() => router.push('/access/request')}
              className="text-amber-600 hover:text-amber-700 underline"
            >
              Request {requiredRole} membership
            </button>
          </div>
          
          <button
            onClick={() => router.back()}
            className="w-full py-2 text-slate-600 hover:text-slate-800 text-sm"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component (not wrapped yet)
const PrintDetailPageComponent: NextPage<Props> = ({ print, source, user, requiredRole }) => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [viewCount, setViewCount] = React.useState(print.viewCount || 0);
  const [downloadCount, setDownloadCount] = React.useState(print.downloadCount || 0);

  // Check if user has access to this specific content
  const hasAccessToThisContent = print.accessLevel === 'public' || 
    (user && ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[print.accessLevel]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && hasAccessToThisContent) {
      // Track views only if user has access
      const views = parseInt(localStorage.getItem(`print-views-${print.slug}`) || '0', 10);
      const newViews = views + 1;
      setViewCount(prev => prev + 1);
      localStorage.setItem(`print-views-${print.slug}`, newViews.toString());

      // Check bookmarks
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedPrints') || '[]');
        setIsBookmarked(bookmarks.includes(print.slug));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
        localStorage.setItem('bookmarkedPrints', '[]');
      }
    }
  }, [print.slug, hasAccessToThisContent]);

  // Secure download handler
  const handleDownload = async (urlType: 'pdf' | 'highres') => {
    if (!hasAccessToThisContent) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${print.accessLevel}`);
      return;
    }

    const url = urlType === 'pdf' ? print.pdfUrl : print.highResUrl;
    
    if (!url) {
      alert('Download URL not available');
      return;
    }

    setIsDownloading(true);

    try {
      // Use your existing session for authentication
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${print.slug}-${urlType === 'highres' ? 'high-res' : 'print'}.${url.split('.').pop()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Track download
      setDownloadCount(prev => prev + 1);
      try {
        const downloads = JSON.parse(localStorage.getItem(`print-downloads`) || '{}');
        downloads[print.slug] = (downloads[print.slug] || 0) + 1;
        localStorage.setItem(`print-downloads`, JSON.stringify(downloads));
      } catch (error) {
        console.error('Error tracking download:', error);
      }

    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookmarkToggle = () => {
    try {
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
    } catch (error) {
      console.error('Error updating bookmarks:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: print.title,
        text: print.excerpt || '',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Render access denied if no access (should be caught by HOC, but fallback)
  if (!hasAccessToThisContent) {
    return <AccessDeniedComponent print={print} requiredRole={print.accessLevel} />;
  }

  const formattedDate = print.createdAt ? new Date(print.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Layout
      title={`${print.title}${print.accessLevel !== 'public' ? ` [${print.accessLevel.toUpperCase()}]` : ''}`}
      description={print.description || print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <meta name="robots" content={print.accessLevel === 'public' ? 'index, follow' : 'noindex, nofollow'} />
        <link rel="canonical" href={`https://abrahamoflondon.com/prints/${print.slug}`} />
      </Head>

      {/* Navigation */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Prints
          </button>
        </div>
      </div>

      {/* Access indicator */}
      {print.accessLevel !== 'public' && user && (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-l-4 border-amber-500 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-amber-800">
                    {print.accessLevel.replace('-', ' ').toUpperCase()} ACCESS
                  </div>
                  <div className="text-sm text-amber-700">
                    Welcome, {user.name || 'Member'}
                  </div>
                </div>
              </div>
              <div className="text-sm text-amber-600">
                {user.membershipDate ? `Member since ${new Date(user.membershipDate).getFullYear()}` : 'Exclusive Access'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-600">
                <FileText className="w-4 h-4" />
                {print.accessLevel.replace('-', ' ').toUpperCase()} PRINT
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              {print.title}
            </h1>
            {print.excerpt && (
              <p className="text-lg text-slate-600 max-w-3xl">
                {print.excerpt}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              {print.coverImage && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <img 
                    src={print.coverImage} 
                    alt={print.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* MDX Content */}
              <div className="prose prose-slate max-w-none bg-white rounded-2xl p-6 md:p-8 border border-slate-200">
                <MDXRemote {...source} components={mdxComponents} />
              </div>

              {/* Print Instructions */}
              {print.printInstructions && (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Printer className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">Print Instructions</h3>
                  </div>
                  <div className="prose prose-blue max-w-none">
                    {print.printInstructions}
                  </div>
                </div>
              )}

              {/* Tags */}
              {print.tags.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-700">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {print.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-full border border-slate-200 hover:border-amber-300 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Stats Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Print Details</h3>
                  <div className="space-y-4">
                    {print.dimensions && (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Dimensions</div>
                          <div className="font-medium text-slate-900">{print.dimensions}</div>
                        </div>
                      </div>
                    )}
                    {formattedDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Added</div>
                          <div className="font-medium text-slate-900">{formattedDate}</div>
                        </div>
                      </div>
                    )}
                    {print.paperType && (
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Paper Type</div>
                          <div className="font-medium text-slate-900">{print.paperType}</div>
                        </div>
                      </div>
                    )}
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Views</span>
                        <span className="font-medium text-slate-900">{viewCount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-2">
                        <span className="text-slate-600">Downloads</span>
                        <span className="font-medium text-slate-900">{downloadCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Download Options</h3>
                  <div className="space-y-3">
                    {print.pdfUrl && (
                      <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloading}
                        className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                      >
                        <Download className="w-5 h-5" />
                        {isDownloading ? 'Downloading...' : 'Download PDF'}
                        {print.fileSize && (
                          <span className="text-sm opacity-75">{print.fileSize}</span>
                        )}
                      </button>
                    )}
                    {print.highResUrl && (
                      <button
                        onClick={() => handleDownload('highres')}
                        disabled={isDownloading}
                        className="w-full py-3 px-4 bg-white border border-amber-500 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                      >
                        <Maximize2 className="w-5 h-5" />
                        High Resolution
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="space-y-3">
                    <button
                      onClick={handleBookmarkToggle}
                      className={`w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-3 transition-colors ${
                        isBookmarked 
                          ? 'bg-amber-50 border-amber-200 text-amber-700' 
                          : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300'
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      {isBookmarked ? 'Saved to Library' : 'Save to Library'}
                    </button>
                    <button
                      onClick={handleShare}
                      className="w-full py-3 px-4 rounded-lg border border-slate-200 text-slate-700 hover:border-amber-300 transition-colors flex items-center justify-center gap-3"
                    >
                      <Share2 className="w-5 h-5" />
                      Share Print
                    </button>
                  </div>
                </div>

                {/* Requirements Card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Print Requirements</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">High-quality printer recommended</span>
                    </li>
                    {print.paperType && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{print.paperType} paper recommended</span>
                      </li>
                    )}
                    {print.inkType && (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{print.inkType} ink compatible</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Use borderless printing if available</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BackToTop />
    </Layout>
  );
};

// Wrap the component with appropriate auth based on content accessLevel
const PrintDetailPage: NextPage<Omit<Props, 'user' | 'requiredRole'>> = (props) => {
  // Determine required role from content
  const requiredRole = props.print.accessLevel;
  
  if (requiredRole === 'public') {
    // Public content, no auth required
    return <PrintDetailPageComponent {...props as Props} />;
  }
  
  // Protected content, wrap with HOC
  const ProtectedComponent = withInnerCircleAuth(PrintDetailPageComponent, {
    requiredRole: requiredRole as any,
    fallbackComponent: () => <AccessDeniedComponent print={props.print} requiredRole={requiredRole} />
  });
  
  return <ProtectedComponent {...props as any} />;
};

export default PrintDetailPage;