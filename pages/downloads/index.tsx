// pages/downloads/index.tsx - DOWNLOADS INDEX PAGE
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  Download, 
  FileText, 
  FolderOpen, 
  Sparkles, 
  Clock, 
  Calendar,
  Tag,
  ArrowRight,
  Shield,
  CheckCircle,
  Users,
  Briefcase
} from "lucide-react";

import Layout from "@/components/Layout";
import DownloadCard from "@/components/downloads/DownloadCard";
import { 
  getContentlayerData,
  isDraftContent,
  normalizeSlug,
  getDocHref,
  getAccessLevel,
  getPublishedDocuments
} from "@/lib/contentlayer-compat";

type AccessLevel = "public" | "inner-circle" | "private";

type NormalisedDownload = {
  slug: string;
  title: string;
  excerpt: string | null;
  description?: string | null;
  coverImage: string | null;
  fileUrl: string | null;
  accessLevel: AccessLevel;
  category: string | null;
  type?: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  formattedDate?: string | null;
  readTime?: string | null;
  featured?: boolean;
  author?: string | null;
  downloadCount?: number;
};

// Helper function to determine access level
function toAccessLevel(value: unknown): AccessLevel {
  const str = String(value || "").trim().toLowerCase();
  if (str === "inner-circle" || str === "innercircle" || str === "members") return "inner-circle";
  if (str === "private" || str === "restricted" || str === "confidential") return "private";
  return "public";
}

// Helper function to get cover image
function resolveDocCoverImage(doc: any): string | null {
  return doc.coverImage || doc.image || doc.thumbnail || null;
}

// Helper function to get download URL
function resolveDocDownloadUrl(doc: any): string | null {
  return doc.fileUrl || doc.downloadUrl || doc.url || null;
}

// Helper function to get download size
function getDownloadSizeLabel(doc: any): string | null {
  if (doc.size) return doc.size;
  if (doc.fileSize) return doc.fileSize;
  
  // You could add logic here to check actual file sizes if needed
  return null;
}

// Helper function to get formatted date
function formatDownloadDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return null;
  }
}

export const getStaticProps: GetStaticProps<{ 
  downloads: NormalisedDownload[];
  featuredCount: number;
  categories: string[];
  totalSize?: string;
}> = async () => {
  try {
    // Load contentlayer data once
    await getContentlayerData();
    
    // Get all published documents and filter for downloads
    const allDocs = getPublishedDocuments();
    
    // Filter for downloads (adjust based on your content structure)
    const downloadDocs = allDocs.filter((doc: any) => {
      const kind = String(doc._raw?.sourceFileDir || doc.kind || "").toLowerCase();
      const tags = Array.isArray(doc.tags) ? doc.tags.map((t: string) => t.toLowerCase()) : [];
      
      return (
        kind.includes('download') || 
        kind.includes('resource') || 
        kind.includes('asset') ||
        tags.includes('download') ||
        tags.includes('resource') ||
        tags.includes('template') ||
        (doc.category && doc.category.toLowerCase().includes('download')) ||
        (doc.url && doc.url.includes('/downloads/'))
      );
    });

    const downloads: NormalisedDownload[] = downloadDocs
      .filter((d: any) => d && !isDraftContent(d))
      .map((d: any) => {
        const slug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
        const title = d.title || "Untitled Resource";
        
        const excerpt = 
          (typeof d.excerpt === "string" && d.excerpt.trim() ? d.excerpt : null) ||
          (typeof d.description === "string" && d.description.trim() ? d.description : null);
        
        const coverImage = resolveDocCoverImage(d);
        const fileUrl = resolveDocDownloadUrl(d);
        const size = getDownloadSizeLabel(d);
        
        const category = 
          (typeof d.category === "string" && d.category.trim() ? d.category : null) ||
          (typeof d.type === "string" && d.type.trim() ? d.type : null);
        
        const tags = Array.isArray(d.tags) ? 
          d.tags.filter((t: any) => typeof t === "string") : [];
        
        const date = typeof d.date === "string" ? d.date : null;
        const formattedDate = formatDownloadDate(date);
        const featured = Boolean(d.featured);
        
        const accessLevel = toAccessLevel(getAccessLevel(d));

        return {
          slug,
          title,
          excerpt,
          description: d.description || null,
          coverImage,
          fileUrl,
          accessLevel,
          category,
          type: d.type || null,
          size,
          tags,
          date,
          formattedDate,
          readTime: d.readTime || null,
          featured,
          author: d.author || null,
          downloadCount: d.downloadCount || 0,
        };
      })
      .sort((a, b) => {
        // Sort by featured first, then date, then title
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da || a.title.localeCompare(b.title);
      });

    // Calculate stats
    const featuredCount = downloads.filter(d => d.featured).length;
    const categories = [...new Set(downloads.map(d => d.category).filter(Boolean))] as string[];
    
    // Optional: Calculate total size (simplified example)
    const totalSize = downloads
      .filter(d => d.size)
      .reduce((total, d) => {
        const size = d.size || "0 MB";
        const match = size.match(/(\d+\.?\d*)/);
        if (match) {
          return total + parseFloat(match[1]);
        }
        return total;
      }, 0);

    console.log(`📥 Downloads index: Loaded ${downloads.length} resources, ${featuredCount} featured`);

    return { 
      props: { 
        downloads, 
        featuredCount,
        categories,
        totalSize: totalSize > 0 ? `${totalSize.toFixed(1)} MB` : undefined
      }, 
      revalidate: 3600 
    };
  } catch (error) {
    console.error("Error generating downloads index:", error);
    
    return {
      props: { 
        downloads: [], 
        featuredCount: 0,
        categories: []
      },
      revalidate: 3600,
    };
  }
};

export default function DownloadsIndexPage(
  props: InferGetStaticPropsType<typeof getStaticProps>
) {
  const title = "Strategic Assets & Resources";
  const description = "Premium tools, frameworks, and resources for visionary leaders and institutions.";

  const featuredDownloads = props.downloads.filter((d) => d.featured);
  const regularDownloads = props.downloads.filter((d) => !d.featured);
  
  // Group by category
  const downloadsByCategory = props.categories.reduce((acc, category) => {
    acc[category] = props.downloads.filter(d => d.category === category);
    return acc;
  }, {} as Record<string, NormalisedDownload[]>);

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com/downloads" />
        <meta property="og:image" content="/assets/images/downloads-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://abrahamoflondon.com/downloads" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">Premium Resources</span>
              </div>
              
              <h1 className="mb-6 font-serif text-5xl font-light tracking-tight text-white md:text-6xl lg:text-7xl">
                Strategic Assets
              </h1>
              
              <p className="mx-auto mb-10 max-w-2xl text-xl leading-8 text-slate-300">
                Curated tools, frameworks, and resources designed for exceptional leaders building institutions that last.
              </p>

              {/* Stats */}
              <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">{props.downloads.length}</div>
                  <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Assets</div>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-amber-200 mb-1">{props.featuredCount}</div>
                  <div className="text-xs font-medium text-amber-300 uppercase tracking-wider">Featured</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <div className="text-2xl font-bold text-white mb-1">{props.categories.length}</div>
                  <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Categories</div>
                </div>
                {props.totalSize && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="text-2xl font-bold text-white mb-1">{props.totalSize}</div>
                    <div className="text-xs font-medium text-slate-300 uppercase tracking-wider">Total Size</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="#featured"
                  className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105 hover:from-amber-400 hover:to-amber-500"
                >
                  <Download className="h-5 w-5" />
                  Browse Featured
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-3 rounded-xl border border-amber-400/40 bg-white/5 px-8 py-4 text-sm font-bold text-amber-100 transition-all hover:border-amber-400/60 hover:bg-white/10"
                >
                  <Users className="h-5 w-5" />
                  Member Resources
                </Link>
              </div>
            </div>
          </div>
        </section>

        {props.downloads.length === 0 ? (
          <section className="py-20">
            <div className="mx-auto max-w-2xl px-4 text-center">
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <FolderOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                Resources in Preparation
              </h2>
              <p className="mb-8 text-slate-400">
                Strategic assets are being curated and prepared for publication.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/content"
                  className="rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-white/15"
                >
                  Explore Insights
                </Link>
                <Link
                  href="/books"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:border-white/30"
                >
                  Browse Books
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <div className="space-y-20 py-16">
            {/* Featured Downloads */}
            {featuredDownloads.length > 0 && (
              <section id="featured" className="scroll-mt-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-amber-500/10 p-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="font-serif text-3xl font-light text-white">
                          Featured Assets
                        </h2>
                        <p className="mt-1 text-slate-400">
                          Hand-selected resources of exceptional strategic value
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
                      <CheckCircle className="h-4 w-4 text-amber-400" />
                      <span>Premium Quality</span>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    {featuredDownloads.map((dl) => (
                      <DownloadCard
                        key={dl.slug}
                        slug={dl.slug}
                        title={dl.title}
                        excerpt={dl.excerpt}
                        coverImage={dl.coverImage}
                        fileHref={dl.fileUrl || `/${dl.slug}`}
                        category={dl.category}
                        size={dl.size}
                        featured={true}
                        tags={dl.tags}
                        date={dl.formattedDate}
                        accessLevel={dl.accessLevel}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Categories Section */}
            {props.categories.length > 0 && (
              <section>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-10">
                    <h2 className="font-serif text-3xl font-light text-white mb-4">
                      Browse by Category
                    </h2>
                    <p className="text-slate-400">
                      Organized resources for specific strategic needs
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {props.categories.map((category) => {
                      const categoryDownloads = downloadsByCategory[category];
                      return (
                        <div
                          key={category}
                          className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-amber-500/30 hover:bg-white/10"
                        >
                          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                            <Briefcase className="h-6 w-6 text-amber-400" />
                          </div>
                          <h3 className="mb-3 text-xl font-semibold text-white">
                            {category}
                          </h3>
                          <p className="mb-4 text-sm text-slate-400">
                            {categoryDownloads.length} resource{categoryDownloads.length !== 1 ? 's' : ''} available
                          </p>
                          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-sm font-medium text-slate-300">
                              View all
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* All Downloads Grid */}
            {regularDownloads.length > 0 && (
              <section>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-10">
                    <h2 className="font-serif text-3xl font-light text-white">
                      Complete Collection
                    </h2>
                    <p className="mt-2 text-slate-400">
                      All strategic tools, frameworks, and resources
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularDownloads.map((dl) => (
                      <DownloadCard
                        key={dl.slug}
                        slug={dl.slug}
                        title={dl.title}
                        excerpt={dl.excerpt}
                        coverImage={dl.coverImage}
                        fileHref={dl.fileUrl || `/${dl.slug}`}
                        category={dl.category}
                        size={dl.size}
                        tags={dl.tags}
                        date={dl.formattedDate}
                        accessLevel={dl.accessLevel}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* CTA Section */}
            <section className="pt-8">
              <div className="mx-auto max-w-4xl px-4 text-center">
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-8 md:p-12">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                    <Users className="h-7 w-7 text-amber-400" />
                  </div>
                  <h3 className="mb-4 text-2xl font-semibold text-white">
                    Access Exclusive Resources
                  </h3>
                  <p className="mb-8 text-slate-300">
                    Join the Inner Circle for premium resources, including early access to 
                    new frameworks, member-only tools, and community discussions.
                  </p>
                  <div className="flex flex-col justify-center gap-4 sm:flex-row">
                    <Link
                      href="/inner-circle"
                      className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black transition-all hover:scale-105"
                    >
                      <Users className="h-5 w-5" />
                      Explore Inner Circle
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-white/10"
                    >
                      <FileText className="h-5 w-5" />
                      Request Custom Resources
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
}