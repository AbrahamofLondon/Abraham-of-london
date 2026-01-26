/* pages/prints/[slug].tsx — Institutional Print Collection Detail (Integrity Mode) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

import { withInnerCircleAuth } from "@/lib/auth/withInnerCircleAuth";

// ✅ Server-safe content access (SSG)
import {
  getAllContentlayerDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  sanitizeData,
} from "@/lib/content/server";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import mdxComponents from "@/components/mdx-components";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

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

import type { User } from "@/types/auth";

// ------------------------------------------------------------
// Role hierarchy
// ------------------------------------------------------------
const ROLE_HIERARCHY: Record<string, number> = {
  public: 0,
  member: 1,
  patron: 2,
  "inner-circle": 3,
  founder: 4,
};

// ------------------------------------------------------------
// Client-only enhancements
// ------------------------------------------------------------
const BackToTop = dynamic(() => import("@/components/enhanced/BackToTop"), { ssr: false });

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------
type AccessLevel = "public" | "member" | "patron" | "inner-circle" | "founder";

type PrintDoc = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  dimensions?: string | null;
  coverImage?: string | null;
  pdfUrl?: string | null;
  downloadUrl?: string | null;
  highResUrl?: string | null;
  slug?: string;
  date?: string | null;
  createdAt?: string | null;
  tags?: string[];
  fileSize?: string | null;
  printInstructions?: string | null;
  accessLevel?: AccessLevel | string | null;
  paperType?: string;
  inkType?: string;
  orientation?: "portrait" | "landscape";
  downloadCount?: number | null;
  viewCount?: number | null;
  body?: { raw?: string };
  bodyRaw?: string;
  _raw?: { flattenedPath?: string; sourceFileDir?: string };
  kind?: string;
  type?: string;
  [k: string]: any;
};

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
    accessLevel: AccessLevel;
    paperType?: string;
    inkType?: string;
    orientation?: "portrait" | "landscape";
  };
  source: MDXRemoteSerializeResult;
  user?: User; // injected by HOC
  requiredRole?: string; // injected by HOC
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function toAccessLevel(v: unknown): AccessLevel {
  const n = String(v || "").toLowerCase().trim();
  if (n === "founder") return "founder";
  if (n === "inner-circle" || n === "inner circle") return "inner-circle";
  if (n === "patron") return "patron";
  if (n === "member") return "member";
  return "public";
}

function isPrintDoc(d: any): boolean {
  const kind = String(d?.kind || d?.type || "").toLowerCase();
  if (kind === "print") return true;

  const dir = String(d?._raw?.sourceFileDir || "").toLowerCase();
  const flat = String(d?._raw?.flattenedPath || "").toLowerCase();
  return dir.includes("prints") || flat.startsWith("prints/");
}

function stripMdxExt(s: string): string {
  return s.replace(/\.(md|mdx)$/, "");
}

function printSlugFromDoc(d: PrintDoc): string {
  const raw =
    normalizeSlug(String(d.slug || "")) ||
    normalizeSlug(String(d._raw?.flattenedPath || "")) ||
    "";

  const noExt = stripMdxExt(raw);
  return noExt.replace(/^prints\//, "");
}

function resolveCoverImageLocal(d: PrintDoc): string | null {
  const cover = String(d.coverImage || "").trim();
  if (cover) return cover;

  const alt1 = String((d as any).image || "").trim();
  if (alt1) return alt1;

  const alt2 = String((d as any).ogImage || (d as any).thumbnail || "").trim();
  return alt2 || null;
}

function getRawBody(d: PrintDoc): string {
  return d?.body?.raw || (typeof d?.bodyRaw === "string" ? d.bodyRaw : "") || " ";
}

function safeDateLabel(input: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ------------------------------------------------------------
// SSG
// ------------------------------------------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const docs = getAllContentlayerDocs();
    const prints = docs.filter(isPrintDoc).filter((p: any) => !isDraftContent(p));

    const paths = prints
      .map((p: any) => printSlugFromDoc(p))
      .filter(Boolean)
      .map((slug: string) => ({ params: { slug } }));

    return { paths, fallback: "blocking" };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating static paths:", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Omit<Props, "user" | "requiredRole">> = async ({ params }) => {
  try {
    const rawSlug = (params as any)?.slug;
    const slug =
      typeof rawSlug === "string"
        ? normalizeSlug(rawSlug)
        : Array.isArray(rawSlug) && typeof rawSlug[0] === "string"
          ? normalizeSlug(rawSlug[0])
          : "";

    if (!slug) return { notFound: true };

    const doc =
      (getDocBySlug(`prints/${slug}`) as PrintDoc | null) ||
      (getDocBySlug(slug) as PrintDoc | null);

    if (!doc || !isPrintDoc(doc) || isDraftContent(doc)) return { notFound: true };

    const mdxContent = getRawBody(doc);

    const print = {
      title: doc.title || "Print Resource",
      excerpt: doc.excerpt ?? null,
      description: (doc.description ?? doc.excerpt ?? null) as string | null,
      dimensions: (doc.dimensions ?? null) as string | null,
      coverImage: resolveCoverImageLocal(doc),
      pdfUrl: (doc.pdfUrl ?? doc.downloadUrl ?? null) as string | null,
      highResUrl: (doc.highResUrl ?? null) as string | null,
      slug,
      downloadCount: (doc.downloadCount ?? 0) as number,
      viewCount: (doc.viewCount ?? 0) as number,
      createdAt: (doc.date ?? doc.createdAt ?? null) as string | null,
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      fileSize: (doc.fileSize ?? null) as string | null,
      printInstructions: (doc.printInstructions ?? null) as string | null,
      accessLevel: toAccessLevel(doc.accessLevel),
      paperType: doc.paperType,
      inkType: doc.inkType,
      orientation: doc.orientation,
    };

    const source = await serialize(mdxContent, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });

    return {
      props: { print: sanitizeData(print), source },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating static props:", error);
    return { notFound: true };
  }
};

// ------------------------------------------------------------
// Access denied
// ------------------------------------------------------------
const AccessDeniedComponent: React.FC<{ print: Props["print"]; requiredRole?: string }> = ({
  print,
  requiredRole,
}) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white py-16 px-4">
      <div className="max-w-md w-full mx-auto p-8 text-center bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-amber-100 mb-6">
          <Lock className="w-12 h-12 text-amber-600" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {(requiredRole || "protected").replace("-", " ").toUpperCase()} Content
        </h1>

        <p className="text-slate-700 mb-6">
          “{print.title}” requires <span className="font-semibold">{requiredRole}</span> access.
        </p>

        <div className="space-y-4">
          <button
            onClick={() =>
              router.push(
                `/login?redirect=${encodeURIComponent(router.asPath)}&tier=${encodeURIComponent(
                  requiredRole || ""
                )}`
              )
            }
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
              onClick={() => router.push("/access/request")}
              className="text-amber-600 hover:text-amber-700 underline"
            >
              Request {requiredRole} membership
            </button>
          </div>

          <button onClick={() => router.back()} className="w-full py-2 text-slate-600 hover:text-slate-800 text-sm">
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Main page component
// ------------------------------------------------------------
const PrintDetailPageComponent: NextPage<Props> = ({ print, source, user }) => {
  const router = useRouter();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [viewCount, setViewCount] = React.useState<number>(print.viewCount || 0);
  const [downloadCount, setDownloadCount] = React.useState<number>(print.downloadCount || 0);

  const hasAccessToThisContent =
    print.accessLevel === "public" ||
    (user && ROLE_HIERARCHY[String((user as any).role || "public")] >= ROLE_HIERARCHY[print.accessLevel]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasAccessToThisContent) return;

    // track views
    const key = `print-views-${print.slug}`;
    const views = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, String(views + 1));
    setViewCount((v) => v + 1);

    // bookmarks
    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarkedPrints") || "[]");
      setIsBookmarked(Array.isArray(bookmarks) && bookmarks.includes(print.slug));
    } catch {
      localStorage.setItem("bookmarkedPrints", "[]");
      setIsBookmarked(false);
    }
  }, [print.slug, hasAccessToThisContent]);

  const handleDownload = async (urlType: "pdf" | "highres") => {
    if (!hasAccessToThisContent) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${encodeURIComponent(print.accessLevel)}`);
      return;
    }

    const url = urlType === "pdf" ? print.pdfUrl : print.highResUrl;
    if (!url) {
      alert("Download URL not available");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      const ext = url.split(".").pop() || (urlType === "pdf" ? "pdf" : "bin");
      link.download = `${print.slug}-${urlType === "highres" ? "high-res" : "print"}.${ext}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadCount((v) => v + 1);

      try {
        const downloads = JSON.parse(localStorage.getItem("print-downloads") || "{}");
        downloads[print.slug] = (downloads[print.slug] || 0) + 1;
        localStorage.setItem("print-downloads", JSON.stringify(downloads));
      } catch {
        // ignore
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBookmarkToggle = () => {
    if (typeof window === "undefined") return;

    try {
      const bookmarks = JSON.parse(localStorage.getItem("bookmarkedPrints") || "[]");
      const arr = Array.isArray(bookmarks) ? bookmarks : [];

      if (isBookmarked) {
        const updated = arr.filter((s: string) => s !== print.slug);
        localStorage.setItem("bookmarkedPrints", JSON.stringify(updated));
        setIsBookmarked(false);
      } else {
        const updated = Array.from(new Set([...arr, print.slug]));
        localStorage.setItem("bookmarkedPrints", JSON.stringify(updated));
        setIsBookmarked(true);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating bookmarks:", error);
    }
  };

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: print.title, text: print.excerpt || "", url });
        return;
      }
    } catch {
      // fall through
    }

    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      alert("Could not copy link. Please copy from the address bar.");
    }
  };

  if (!hasAccessToThisContent) {
    return <AccessDeniedComponent print={print} requiredRole={print.accessLevel} />;
  }

  const formattedDate = safeDateLabel(print.createdAt);

  return (
    <Layout
      title={`${print.title}${print.accessLevel !== "public" ? ` [${print.accessLevel.toUpperCase()}]` : ""}`}
      description={print.description || print.excerpt || ""}
      ogImage={print.coverImage || undefined}
    >
      <Head>
        <meta name="robots" content={print.accessLevel === "public" ? "index, follow" : "noindex, nofollow"} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/prints/${print.slug}`} />
      </Head>

      {/* Nav */}
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

      {/* Access strip */}
      {print.accessLevel !== "public" && user ? (
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-l-4 border-amber-500 p-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="font-semibold text-amber-800">{print.accessLevel.replace("-", " ").toUpperCase()} ACCESS</div>
                  <div className="text-sm text-amber-700">Welcome, {(user as any).name || "Member"}</div>
                </div>
              </div>
              <div className="text-sm text-amber-600">
                {(user as any).membershipDate
                  ? `Member since ${new Date((user as any).membershipDate).getFullYear()}`
                  : "Exclusive Access"}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main */}
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-amber-600">
                <FileText className="w-4 h-4" />
                {print.accessLevel.replace("-", " ").toUpperCase()} PRINT
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">{print.title}</h1>

            {print.excerpt ? <p className="text-lg text-slate-600 max-w-3xl">{print.excerpt}</p> : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main column */}
            <div className="lg:col-span-2">
              {print.coverImage ? (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-white">
                  <img src={print.coverImage} alt={print.title} className="w-full h-auto object-cover" />
                </div>
              ) : null}

              <div className="prose prose-slate max-w-none bg-white rounded-2xl p-6 md:p-8 border border-slate-200">
                <MDXRemote {...source} components={mdxComponents} />
              </div>

              {print.printInstructions ? (
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Printer className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">Print Instructions</h3>
                  </div>
                  <div className="prose prose-blue max-w-none">{print.printInstructions}</div>
                </div>
              ) : null}

              {print.tags.length ? (
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
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Details */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Print Details</h3>

                  <div className="space-y-4">
                    {print.dimensions ? (
                      <div className="flex items-center gap-3">
                        <Ruler className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Dimensions</div>
                          <div className="font-medium text-slate-900">{print.dimensions}</div>
                        </div>
                      </div>
                    ) : null}

                    {formattedDate ? (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Added</div>
                          <div className="font-medium text-slate-900">{formattedDate}</div>
                        </div>
                      </div>
                    ) : null}

                    {print.paperType ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-600">Paper Type</div>
                          <div className="font-medium text-slate-900">{print.paperType}</div>
                        </div>
                      </div>
                    ) : null}

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

                {/* Downloads */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Download Options</h3>

                  <div className="space-y-3">
                    {print.pdfUrl ? (
                      <button
                        onClick={() => handleDownload("pdf")}
                        disabled={isDownloading}
                        className="w-full py-3 px-4 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                      >
                        <Download className="w-5 h-5" />
                        {isDownloading ? "Downloading..." : "Download PDF"}
                        {print.fileSize ? <span className="text-sm opacity-75">{print.fileSize}</span> : null}
                      </button>
                    ) : null}

                    {print.highResUrl ? (
                      <button
                        onClick={() => handleDownload("highres")}
                        disabled={isDownloading}
                        className="w-full py-3 px-4 bg-white border border-amber-500 text-amber-600 rounded-lg font-semibold hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                      >
                        <Maximize2 className="w-5 h-5" />
                        High Resolution
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="space-y-3">
                    <button
                      onClick={handleBookmarkToggle}
                      className={`w-full py-3 px-4 rounded-lg border flex items-center justify-center gap-3 transition-colors ${
                        isBookmarked
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-white border-slate-200 text-slate-700 hover:border-amber-300"
                      }`}
                    >
                      <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-amber-500" : ""}`} />
                      {isBookmarked ? "Saved to Library" : "Save to Library"}
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

                {/* Requirements */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Print Requirements</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-700">High-quality printer recommended</span>
                    </li>

                    {print.paperType ? (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{print.paperType} paper recommended</span>
                      </li>
                    ) : null}

                    {print.inkType ? (
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{print.inkType} ink compatible</span>
                      </li>
                    ) : null}

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

// ------------------------------------------------------------
// Export wrapper (module-scope, build-safe)
// ------------------------------------------------------------
const Page: NextPage<any> = (props: any) => <PrintDetailPageComponent {...props} />;

const PrintDetailPage = withInnerCircleAuth(Page, {
  requiredRole: "public" as any,
  fallbackComponent: (p: any) => <AccessDeniedComponent print={p.print} requiredRole={p?.print?.accessLevel} />,
});

export default PrintDetailPage;