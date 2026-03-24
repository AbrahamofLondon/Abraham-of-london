import * as React from "react";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { 
  Clock, 
  User, 
  Calendar, 
  Tag, 
  BookOpen,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Shield,
  Award,
  Target,
  FileText,
  Download,
  Share2,
  Bookmark,
  Eye
} from "lucide-react";

import Layout from "@/components/Layout";
import { getPageTitle, siteConfig } from "@/lib/imports";
import { safeCapitalize } from "@/lib/utils/safe";

// ----- Types ------------------------------------------------------

type CoverImage = string | { src?: string } | null | undefined;

type Frontmatter = {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  coverImage?: CoverImage;
  url?: string;
  subtitle?: string;
  volumeNumber?: string;
  featured?: boolean;
  tier?: 'architect' | 'inner-circle' | 'member' | 'public';
  readingLevel?: 'foundational' | 'intermediate' | 'advanced' | 'institutional';
};

export type ContentPageProps = {
  frontmatter: Frontmatter;
  mdxSource: string;
  contentType?: string;
  children?: React.ReactNode;
};

// ----- Tier Configuration (Harrods meets BlackRock) -----

const tierConfig = {
  architect: {
    primary: 'from-amber-800 to-amber-950',
    secondary: 'from-amber-50 to-amber-100/50',
    accent: 'amber-900',
    text: 'text-amber-900',
    light: 'text-amber-600',
    border: 'border-amber-200',
    glow: 'group-hover:shadow-amber-500/20',
    badge: 'bg-gradient-to-r from-amber-900 to-amber-700 text-white',
    statBg: 'bg-gradient-to-br from-amber-50 to-amber-100/30',
    icon: 'text-amber-600',
    hover: 'hover:bg-amber-50 hover:border-amber-300',
    button: 'bg-gradient-to-r from-amber-900 to-amber-800 hover:from-amber-800 hover:to-amber-700',
  },
  'inner-circle': {
    primary: 'from-purple-800 to-purple-950',
    secondary: 'from-purple-50 to-purple-100/50',
    accent: 'purple-900',
    text: 'text-purple-900',
    light: 'text-purple-600',
    border: 'border-purple-200',
    glow: 'group-hover:shadow-purple-500/20',
    badge: 'bg-gradient-to-r from-purple-900 to-purple-700 text-white',
    statBg: 'bg-gradient-to-br from-purple-50 to-purple-100/30',
    icon: 'text-purple-600',
    hover: 'hover:bg-purple-50 hover:border-purple-300',
    button: 'bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700',
  },
  member: {
    primary: 'from-blue-800 to-blue-950',
    secondary: 'from-blue-50 to-blue-100/50',
    accent: 'blue-900',
    text: 'text-blue-900',
    light: 'text-blue-600',
    border: 'border-blue-200',
    glow: 'group-hover:shadow-blue-500/20',
    badge: 'bg-gradient-to-r from-blue-900 to-blue-700 text-white',
    statBg: 'bg-gradient-to-br from-blue-50 to-blue-100/30',
    icon: 'text-blue-600',
    hover: 'hover:bg-blue-50 hover:border-blue-300',
    button: 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700',
  },
  public: {
    primary: 'from-slate-800 to-slate-950',
    secondary: 'from-slate-50 to-slate-100/50',
    accent: 'slate-900',
    text: 'text-slate-900',
    light: 'text-slate-600',
    border: 'border-slate-200',
    glow: 'group-hover:shadow-slate-500/20',
    badge: 'bg-gradient-to-r from-slate-900 to-slate-700 text-white',
    statBg: 'bg-gradient-to-br from-slate-50 to-slate-100/30',
    icon: 'text-slate-600',
    hover: 'hover:bg-slate-50 hover:border-slate-300',
    button: 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700',
  },
};

const readingLevelConfig = {
  foundational: { label: 'Foundation', icon: BookOpen, color: 'text-emerald-600' },
  intermediate: { label: 'Intermediate', icon: TrendingUp, color: 'text-blue-600' },
  advanced: { label: 'Advanced', icon: Award, color: 'text-purple-600' },
  institutional: { label: 'Institutional', icon: Shield, color: 'text-amber-600' },
};

// ----- Helpers -----------------------------------------------------

function coerceOgImage(coverImage: CoverImage): string {
  if (!coverImage) return "";
  if (typeof coverImage === "string") return coverImage;
  if (typeof coverImage === "object" && typeof coverImage.src === "string")
    return coverImage.src;
  return "";
}

function normalizeReadTime(input?: string): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (/min/i.test(s)) return s;
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} min read`;
  return s;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

// ----- Component ---------------------------------------------------

export default function ContentLayout({
  frontmatter,
  mdxSource,
  contentType = "content",
  children,
}: ContentPageProps) {
  const MDXContent = useMDXComponent(mdxSource);
  
  // Base values
  const title = frontmatter.title || `${safeCapitalize(contentType)}`;
  const pageTitle = getPageTitle ? getPageTitle(title) : title;
  const description =
    frontmatter.excerpt || frontmatter.description || `Read about ${title}`;

  const url = frontmatter.url || `/${contentType}/${frontmatter.slug}`;
  const fullUrl = `${siteConfig.url}${url}`;

  const ogImage = coerceOgImage(frontmatter.coverImage);
  const readTime = normalizeReadTime(frontmatter.readTime);
  const formattedDate = formatDate(frontmatter.date);

  // Keywords as a comma‑separated string
  const keywords = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.join(", ")
    : "";

  // Tier and reading level
  const tier = frontmatter.tier || 'public';
  const config = tierConfig[tier];
  const ReadingLevelIcon = readingLevelConfig[frontmatter.readingLevel || 'foundational'].icon;

  return (
    <>
      {/* Head metadata – handled here, not passed to Layout */}
      <Head>
        {/* Standard meta */}
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}

        {/* Open Graph / Social */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}

        {/* Article specific */}
        {frontmatter.date && (
          <meta
            property="article:published_time"
            content={new Date(frontmatter.date).toISOString()}
          />
        )}
        {frontmatter.author && (
          <meta property="article:author" content={frontmatter.author} />
        )}
        {frontmatter.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Canonical */}
        <link rel="canonical" href={fullUrl} />
      </Head>

      {/* Layout with institutional styling */}
      <Layout className={`bg-slate-50 content-${contentType}`}>
        <div className="relative min-h-screen">
          {/* Background Pattern - Harrods meets BlackRock */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-slate-900 to-slate-700 rounded-full blur-3xl" />
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-full blur-3xl" />
            </div>
            {/* Grid Pattern - Institutional */}
            <div className="absolute inset-0" style={{
              backgroundImage: `linear-gradient(to right, ${config.light}10 1px, transparent 1px),
                                linear-gradient(to bottom, ${config.light}10 1px, transparent 1px)`,
              backgroundSize: '4rem 4rem'
            }} />
          </div>

          {/* Main Content Container */}
          <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
            {/* Header Section - Harrods Luxury */}
            <div className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-1 h-12 bg-gradient-to-b ${config.primary} rounded-full`} />
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className={`text-xs font-mono uppercase tracking-[0.3em] ${config.light}`}>
                      {contentType.toUpperCase()}
                    </span>
                    {frontmatter.volumeNumber && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-mono text-slate-400">
                          Vol. {frontmatter.volumeNumber}
                        </span>
                      </>
                    )}
                  </div>
                  <h1 className="font-serif text-5xl lg:text-6xl font-light tracking-tight text-slate-900 leading-tight">
                    {title}
                  </h1>
                  {frontmatter.subtitle && (
                    <p className="mt-4 text-xl text-slate-500 font-light italic border-l-4 border-slate-200 pl-6">
                      {frontmatter.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadata Bar - BlackRock Analytics */}
              <div className="flex flex-wrap items-center gap-6 mt-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                {frontmatter.author && (
                  <div className="flex items-center gap-2">
                    <User className={`w-4 h-4 ${config.light}`} />
                    <span className="text-sm text-slate-600">{frontmatter.author}</span>
                  </div>
                )}
                {formattedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className={`w-4 h-4 ${config.light}`} />
                    <span className="text-sm text-slate-600">{formattedDate}</span>
                  </div>
                )}
                {readTime && (
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${config.light}`} />
                    <span className="text-sm text-slate-600">{readTime}</span>
                  </div>
                )}
                {frontmatter.readingLevel && (
                  <div className="flex items-center gap-2">
                    <ReadingLevelIcon className={`w-4 h-4 ${readingLevelConfig[frontmatter.readingLevel].color}`} />
                    <span className={`text-sm ${readingLevelConfig[frontmatter.readingLevel].color}`}>
                      {readingLevelConfig[frontmatter.readingLevel].label}
                    </span>
                  </div>
                )}
                {frontmatter.tags && frontmatter.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className={`w-4 h-4 ${config.light}`} />
                    <div className="flex gap-2">
                      {frontmatter.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Grid - Institutional Layout */}
            <div className="grid lg:grid-cols-12 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                  {/* Content Header - Harrods Touch */}
                  <div className={`h-1 w-full bg-gradient-to-r ${config.primary}`} />
                  
                  <div className="p-8 lg:p-10">
                    {/* MDX Content */}
                    <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-light prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-a:text-slate-900 prose-a:border-b prose-a:border-slate-200 hover:prose-a:border-slate-400 prose-blockquote:border-l-4 prose-blockquote:border-slate-200 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-slate-600 prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-600 prose-hr:border-slate-200">
                      {children ? children : (MDXContent ? <MDXContent /> : null)}
                    </article>
                  </div>
                </div>
              </div>

              {/* Sidebar - BlackRock Dashboard */}
              <div className="lg:col-span-4 space-y-6">
                {/* Quick Stats */}
                <div className={`bg-gradient-to-br ${config.secondary} rounded-2xl border ${config.border} p-6`}>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4">
                    Document Intelligence
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Reading Level</span>
                      <span className={`text-sm font-medium ${config.text}`}>
                        {readingLevelConfig[frontmatter.readingLevel || 'foundational'].label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Clearance</span>
                      <span className={`text-sm font-mono uppercase ${config.text}`}>
                        {tier}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Words</span>
                      <span className="text-sm text-slate-900 font-medium">
                        {mdxSource.split(/\s+/).length.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    <button className={`w-full flex items-center justify-between p-3 border ${config.border} rounded-xl text-left transition-all ${config.hover} group`}>
                      <div className="flex items-center gap-3">
                        <Download className={`w-4 h-4 ${config.light}`} />
                        <span className="text-sm text-slate-700">Download PDF</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${config.light} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </button>
                    <button className={`w-full flex items-center justify-between p-3 border ${config.border} rounded-xl text-left transition-all ${config.hover} group`}>
                      <div className="flex items-center gap-3">
                        <Bookmark className={`w-4 h-4 ${config.light}`} />
                        <span className="text-sm text-slate-700">Save for Later</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${config.light} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </button>
                    <button className={`w-full flex items-center justify-between p-3 border ${config.border} rounded-xl text-left transition-all ${config.hover} group`}>
                      <div className="flex items-center gap-3">
                        <Share2 className={`w-4 h-4 ${config.light}`} />
                        <span className="text-sm text-slate-700">Share</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${config.light} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </button>
                  </div>
                </div>

                {/* Related Tags */}
                {frontmatter.tags && frontmatter.tags.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-4">
                      Related Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {frontmatter.tags.map(tag => (
                        <span
                          key={tag}
                          className={`px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full text-slate-600 hover:${config.border} hover:bg-white transition-colors cursor-default`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer - Institutional Signature */}
            <div className="mt-16 pt-8 border-t border-slate-200">
              <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">Institutional Grade</span>
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500">1,234 views</span>
                  </div>
                </div>
                <div className="text-[8px] font-mono uppercase tracking-widest text-slate-400">
                  ABRAHAM OF LONDON • INSTITUTIONAL INTELLIGENCE • {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}