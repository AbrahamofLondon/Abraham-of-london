// pages/prints/[slug].tsx — HARDENED (Bare Slug + Seeded Proxy)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  Download,
  Share2,
  Printer,
  Bookmark,
  Calendar,
  Lock,
  Users,
  ChevronLeft,
  FileText,
  Maximize2,
  CheckCircle,
  Tag,
  Ruler,
} from "lucide-react";

import Layout from "@/components/Layout";
import { withInnerCircleAuth } from "@/lib/auth/withInnerCircleAuth";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import mdxComponents from "@/components/mdx-components";
import {
  getAllContentlayerDocs,
  getDocBySlug,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";
import type { User } from "@/types/auth";

/* -----------------------------------------------------------------------------
  CONSTANTS & TYPES
----------------------------------------------------------------------------- */
const ROLE_HIERARCHY: Record<string, number> = {
  public: 0,
  member: 1,
  patron: 2,
  "inner-circle": 3,
  founder: 4,
};

type AccessLevel = "public" | "member" | "patron" | "inner-circle" | "founder";

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
  accessLevel: AccessLevel;
  paperType: string | null;
  inkType: string | null;
  orientation: "portrait" | "landscape" | null;
}

interface Props {
  print: PrintDTO;
  source: MDXRemoteSerializeResult;
  mdxRaw: string;
  user?: User;
}

const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

/* -----------------------------------------------------------------------------
  DEFENSIVE HELPERS
----------------------------------------------------------------------------- */
const stripPrefix = (s: string) => normalizeSlug(s).replace(/^prints\//, "");

function isPrintDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  return kind === "print" || dir.includes("prints");
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const PrintDetailPageComponent: NextPage<Props> = ({ print, source, mdxRaw, user }) => {
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // ✅ SEED + PROXY Governance
  const safeComponents = React.useMemo(() => 
    createSeededSafeMdxComponents(mdxComponents, mdxRaw), [mdxRaw]
  );

  React.useEffect(() => { setIsClient(true); }, []);

  const hasAccess = React.useMemo(() => {
    if (print.accessLevel === "public") return true;
    if (!user) return false;
    return ROLE_HIERARCHY[String(user.role || "public")] >= ROLE_HIERARCHY[print.accessLevel];
  }, [user, print.accessLevel]);

  if (router.isFallback) return <Layout title="Loading Asset...">...</Layout>;
  if (!hasAccess && isClient) return <AccessDeniedComponent print={print} />;

  return (
    <Layout 
      title={print.title} 
      description={print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org/prints/${print.slug}`} />
        <meta name="robots" content={print.accessLevel === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <div className="bg-slate-50 min-h-screen">
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
          <button onClick={() => router.push('/prints')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-amber-600 transition-colors">
            <ChevronLeft size={16} /> Back to Prints
          </button>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Asset Visual & Content */}
            <div className="lg:col-span-8 space-y-12">
              <header>
                <div className="flex items-center gap-3 text-amber-600 font-mono text-[10px] uppercase tracking-[0.2em] mb-4">
                  <FileText size={14} /> {print.accessLevel} Grade Asset
                </div>
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 leading-tight">
                  {print.title}
                </h1>
              </header>

              {print.coverImage && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white">
                  <img src={print.coverImage} alt={print.title} className="w-full h-auto" />
                </div>
              )}

              <article className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
                <MDXRemote {...source} components={safeComponents as any} />
              </article>
            </div>

            {/* Sidebar Controls */}
            <div className="lg:col-span-4">
              <aside className="sticky top-28 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Specifications</h3>
                    <div className="space-y-4">
                      {print.dimensions && <div className="flex justify-between text-sm"><span className="text-slate-500">Scale</span><span className="font-medium">{print.dimensions}</span></div>}
                      {print.paperType && <div className="flex justify-between text-sm"><span className="text-slate-500">Stock</span><span className="font-medium">{print.paperType}</span></div>}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-3">
                    {print.pdfUrl && (
                      <button 
                        onClick={() => window.open(print.pdfUrl!, '_blank')}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-3"
                      >
                        <Download size={18} /> Download PDF
                      </button>
                    )}
                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:border-amber-600 hover:text-amber-600 transition-all flex items-center justify-center gap-3">
                      <Share2 size={18} /> Share Resource
                    </button>
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

    const mdxRaw = doc.body?.raw || doc.content || "";
    const source = await serialize(mdxRaw || " ", {
      mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
    });

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
      accessLevel: (doc.accessLevel || "public") as AccessLevel,
      paperType: doc.paperType || null,
      inkType: doc.inkType || null,
      orientation: doc.orientation || null,
    };

    return {
      props: sanitizeData({ print, source, mdxRaw }),
      revalidate: 3600,
    };
  } catch (err) {
    return { notFound: true };
  }
};

/* -----------------------------------------------------------------------------
  ACCESS CONTROL UI
----------------------------------------------------------------------------- */
const AccessDeniedComponent = ({ print }: { print: PrintDTO }) => (
  <Layout title="Access Restricted">
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-8 bg-white p-12 rounded-3xl border border-slate-200 shadow-xl">
        <div className="inline-flex p-5 bg-amber-50 rounded-full text-amber-600">
          <Lock size={48} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-slate-900">Restricted Asset</h2>
        <p className="text-slate-500"> The <strong>{print.title}</strong> requires {print.accessLevel} clearance.</p>
        <button className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold">Request Access</button>
      </div>
    </div>
  </Layout>
);

const Page: NextPage<any> = (props) => <PrintDetailPageComponent {...props} />;
export default withInnerCircleAuth(Page, { requiredRole: "public" as any });