// pages/prints/[slug].tsx — PREMIUM PRODUCTION (FIXED TIER NORMALIZATION + SAFEMDX)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import {
  Download,
  Share2,
  Calendar,
  Lock,
  Users,
  ChevronLeft,
  FileText,
  Tag,
  Ruler,
} from "lucide-react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer"; // ✅ Use SafeMDXRenderer
import AccessGate from "@/components/AccessGate";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";
import {
  getAllContentlayerDocs,
  getDocBySlug,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

/* -----------------------------------------------------------------------------
  CONSTANTS & TYPES
----------------------------------------------------------------------------- */

interface PrintDTO {
  title: string;
  excerpt: string | null;
  description: string | null;
  dimensions: string | null;
  coverImage: string | null;
  pdfUrl: string | null;
  highResUrl: string | null;
  slug: string;
  downloadCount: number;
  viewCount: number;
  createdAt: string | null;
  tags: string[];
  fileSize: string | null;
  printInstructions: string | null;
  accessLevel: AccessTier;
  paperType: string | null;
  inkType: string | null;
  orientation: "portrait" | "landscape" | null;
}

interface Props {
  print: PrintDTO;
  initialBodyCode: string | null; // ✅ Pre-compiled MDX code, not raw
  requiredTier: AccessTier;
}

const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

/* -----------------------------------------------------------------------------
  DEFENSIVE HELPERS
----------------------------------------------------------------------------- */
const stripPrefix = (s: string) => {
  const normalized = normalizeSlug(s).replace(/^prints\//, "");
  // ✅ Prevent path traversal
  if (normalized.includes('..') || normalized.includes('\\') || normalized.includes('//')) {
    return '';
  }
  return normalized;
};

function isPrintDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  return kind === "print" || dir.includes("prints");
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const PrintDetailPageComponent: NextPage<Props> = ({ print, initialBodyCode, requiredTier }) => {
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  const { data: session, status } = useSession();

  const [isClient, setIsClient] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [bodyCode, setBodyCode] = React.useState<string | null>(initialBodyCode);
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  React.useEffect(() => { setIsClient(true); }, []);

  // ✅ Use correct normalizers
  const required = tiers.normalizeRequired(requiredTier);
  const user = tiers.normalizeUser(session?.user?.tier ?? "public");

  const needsAuth = required !== "public";
  const canAccess = tiers.hasAccess(user, required);

  // ✅ UNLOCK FLOW: Fetch content when access granted
  const handleUnlock = async () => {
    setLoading(true);
    setUnlockError(null);
    
    try {
      const res = await fetch(`/api/prints/${encodeURIComponent(print.slug)}`);
      const data = await res.json();
      
      if (data.ok && data.bodyCode) {
        // ✅ Set state with compiled code - no re-serialization
        setBodyCode(data.bodyCode);
      } else {
        setUnlockError(data.reason || "Failed to unlock content");
      }
    } catch (err) {
      setUnlockError("Network error during unlock");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Early return during SSR/prerender
  if (!router || !isClient) {
    return (
      <Layout title={print.title}>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" />
      </Layout>
    );
  }

  // ✅ GATE: Show AccessGate for unauthorized users
  if (needsAuth && (!session?.user || !canAccess)) {
    return (
      <Layout title={print.title}>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
          <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
            <Link 
              href="/prints" 
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 transition-colors group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-medium">Back to Prints</span>
            </Link>
          </nav>
          
          <div className="max-w-7xl mx-auto px-6 py-20">
            <AccessGate
              title={print.title}
              requiredTier={required}
              message={`This print requires ${required} clearance. Verify credentials to access the full specifications.`}
              onUnlocked={handleUnlock}
              onGoToJoin={() => router.push("/inner-circle")}
            />
          </div>
        </div>
      </Layout>
    );
  }

  const handleDownload = async () => {
    if (!print.pdfUrl) return;
    setIsDownloading(true);
    try {
      window.open(print.pdfUrl, '_blank');
      await fetch(`/api/prints/${print.slug}/download`, { method: 'POST' });
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  return (
    <Layout 
      title={print.title} 
      description={print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/prints/${print.slug}`} />
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 shadow-sm">
          <Link 
            href="/prints" 
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            <span className="font-medium">Back to Prints</span>
          </Link>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Asset Visual & Content */}
            <div className="lg:col-span-8 space-y-12">
              <header>
                <div className="flex items-center gap-3 text-amber-600 font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
                  <FileText size={14} /> 
                  <span>{required} Grade Asset</span>
                  <span className="w-12 h-px bg-amber-600/20" />
                  <span className="text-slate-400">ID: {print.slug.slice(-8)}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-tight tracking-tight">
                  {print.title}
                </h1>
                {print.excerpt && (
                  <p className="mt-6 text-lg text-slate-600 max-w-3xl leading-relaxed border-l-4 border-amber-500 pl-6">
                    {print.excerpt}
                  </p>
                )}
              </header>

              {print.coverImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white transform hover:scale-[1.02] transition-transform duration-500">
                  <img 
                    src={print.coverImage} 
                    alt={print.title} 
                    className="w-full h-auto"
                  />
                </div>
              )}

              <article className="prose prose-lg prose-slate max-w-none bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-2xl border border-slate-200 shadow-xl">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                
                {unlockError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                    {unlockError}
                  </div>
                )}
                
                {bodyCode ? (
                  <SafeMDXRenderer code={bodyCode} />
                ) : needsAuth ? (
                  <AccessGate
                    title={print.title}
                    requiredTier={required}
                    message={`This print requires ${required} clearance. Verify credentials to access the full specifications.`}
                    onUnlocked={handleUnlock}
                    onGoToJoin={() => router.push("/inner-circle")}
                  />
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    No content available.
                  </div>
                )}
              </article>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4">
              <aside className="sticky top-28 space-y-6">
                {/* Primary Actions */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <Ruler size={14} /> Specifications
                    </h3>
                    <div className="space-y-4">
                      {print.dimensions && (
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500">Scale</span>
                          <span className="font-medium text-slate-900">{print.dimensions}</span>
                        </div>
                      )}
                      {print.paperType && (
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500">Stock</span>
                          <span className="font-medium text-slate-900">{print.paperType}</span>
                        </div>
                      )}
                      {print.inkType && (
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500">Ink</span>
                          <span className="font-medium text-slate-900">{print.inkType}</span>
                        </div>
                      )}
                      {print.fileSize && (
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                          <span className="text-slate-500">File Size</span>
                          <span className="font-medium text-slate-900">{print.fileSize}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-3">
                    {print.pdfUrl && (
                      <button 
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold hover:from-amber-600 hover:to-amber-500 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={18} />
                        )}
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </button>
                    )}
                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:border-amber-600 hover:text-amber-600 hover:bg-amber-50 transition-all flex items-center justify-center gap-3">
                      <Share2 size={18} /> Share Resource
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200 shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Asset Info</h3>
                  <div className="space-y-3 text-sm">
                    {print.createdAt && (
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        <span>Added {new Date(print.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-600">
                      <Users size={16} className="text-slate-400" />
                      <span>{print.downloadCount} downloads</span>
                    </div>
                    {print.tags.length > 0 && (
                      <div className="pt-3 mt-3 border-t border-slate-100">
                        <div className="flex flex-wrap gap-2">
                          {print.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>
      {isClient && <BackToTop />}
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  BUILD LOGIC
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs() || [];
  const paths = docs
    .filter(isPrintDoc)
    .filter((d: any) => !d.draft)
    .map((d: any) => ({ params: { slug: stripPrefix(d.slug || d._raw?.flattenedPath || "") } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = stripPrefix(String(params?.slug || ""));
    const doc = getDocBySlug(`prints/${slug}`) || getDocBySlug(slug);

    if (!doc || doc.draft) return { notFound: true };

    // ✅ Use SSOT normalizeRequired
    const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
    const isPublic = requiredTier === "public";

    const print: PrintDTO = {
      title: doc.title || "Untitled Print",
      excerpt: doc.excerpt || null,
      description: doc.description || null,
      dimensions: doc.dimensions || null,
      coverImage: doc.coverImage || null,
      pdfUrl: doc.pdfUrl || doc.downloadUrl || null,
      highResUrl: doc.highResUrl || null,
      slug,
      downloadCount: Number(doc.downloadCount || 0),
      viewCount: Number(doc.viewCount || 0),
      createdAt: doc.date || doc.createdAt || null,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      fileSize: doc.fileSize || null,
      printInstructions: doc.printInstructions || null,
      accessLevel: requiredTier,
      paperType: doc.paperType || null,
      inkType: doc.inkType || null,
      orientation: doc.orientation || null,
    };

    // ✅ Only ship pre-compiled code for public content
    const initialBodyCode = isPublic ? (doc.body?.code || doc.bodyCode || null) : null;

    return {
      props: sanitizeData({ 
        print, 
        initialBodyCode,
        requiredTier
      }),
      revalidate: 3600,
    };
  } catch (err) {
    return { notFound: true };
  }
};

const Page: NextPage<any> = (props) => <PrintDetailPageComponent {...props} />;
export default Page;