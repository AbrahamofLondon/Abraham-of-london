// pages/strategy/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  BookOpen,
  FileSpreadsheet,
  Presentation,
  ClipboardCheck,
  Target,
  ShieldCheck,
  Workflow,
  Landmark,
  Users,
  ArrowRight,
  Lock,
  Download,
  Calendar,
  MessageSquare,
} from "lucide-react";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

import {
  getContentlayerData,
  isDraftContent,
  normalizeSlug,
  getAccessLevel,
} from "@/lib/contentlayer-compat";

import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

type Props = {
  strategy: any;
  source: any;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { allStrategies } = await getContentlayerData();

  const paths = (allStrategies ?? [])
    .filter((d: any) => d && !isDraftContent(d))
    .map((d: any) => {
      const slug = normalizeSlug(d?.slug ?? d?._raw?.flattenedPath ?? "");
      return slug ? { params: { slug } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug ?? ""));
  if (!slug) return { notFound: true };

  const { allStrategies } = await getContentlayerData();

  const strategy =
    (allStrategies ?? []).find((d: any) => {
      const s = normalizeSlug(d?.slug ?? d?._raw?.flattenedPath ?? "");
      return s === slug;
    }) ?? null;

  if (!strategy || isDraftContent(strategy)) return { notFound: true };

  const raw = strategy?.body?.raw ?? "";
  let source: any;

  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch (err) {
    console.error(`[Strategy Serialize Error] ${slug}:`, err);
    source = await serialize("This strategy framework is currently being updated.");
  }

  return { props: { strategy, source }, revalidate: 1800 };
};

const StrategyDetailPage: NextPage<Props> = ({ strategy, source }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("");
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    setIsVisible(true);

    const handleScrollSpy = () => {
      const sections = document.querySelectorAll("h2[id], h3[id]");
      const scrollPos = window.scrollY + 120;

      let current = "";
      sections.forEach((section) => {
        const el = section as HTMLElement;
        const top = el.offsetTop;
        const height = el.offsetHeight || 1;
        if (scrollPos >= top && scrollPos < top + height) current = el.id;
      });

      setActiveSection(current);
    };

    const calcProgress = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const scrollHeight = doc.scrollHeight - window.innerHeight;
      const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    const onScroll = () => {
      handleScrollSpy();
      calcProgress();
    };

    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const title = strategy?.title || "Strategic Framework";
  const excerpt = strategy?.excerpt || strategy?.description || "";
  const category = strategy?.category || "Framework";
  const date = strategy?.date;
  const coverImage = strategy?.coverImage || strategy?.image;
  const frameworkType = strategy?.frameworkType || "general";
  const tools = strategy?.tools || [];
  const applications = strategy?.applications || [];
  const expectedOutcomes = strategy?.expectedOutcomes || [];

  const canonical = `https://www.abrahamoflondon.org/strategy/${encodeURIComponent(
    strategy?.slug || normalizeSlug(strategy?._raw?.flattenedPath || "")
  )}`;

  const access = getAccessLevel(strategy);

  // Related tools based on framework type
  const relatedTools = {
    "decision-framework": [
      {
        title: "Board Decision Log Template",
        description: "Excel template for documenting board-level decisions",
        href: "/resources/board-decision-log-template",
        icon: FileSpreadsheet,
        format: "Excel"
      },
      {
        title: "Canon Council Table Agenda",
        description: "Structured agenda for strategic conversations",
        href: "/resources/canon-council-table-agenda",
        icon: ClipboardCheck,
        format: "Agenda template"
      }
    ],
    "legacy-framework": [
      {
        title: "Multi-Generational Legacy Ledger",
        description: "Framework for legacy mapping across domains",
        href: "/resources/multi-generational-legacy-ledger",
        icon: Landmark,
        format: "Planning tool"
      },
      {
        title: "Canon Household Charter",
        description: "Template for family governance",
        href: "/resources/canon-household-charter",
        icon: BookOpen,
        format: "Charter template"
      }
    ],
    "governance-framework": [
      {
        title: "Operating Cadence Pack",
        description: "Complete presentation deck for meeting design",
        href: "/resources/operating-cadence-pack",
        icon: Presentation,
        format: "PowerPoint"
      },
      {
        title: "Institutional Health Scorecard",
        description: "Diagnostic tool for organizational health",
        href: "/resources/institutional-health-scorecard",
        icon: ShieldCheck,
        format: "Assessment tool"
      }
    ],
    "general": [
      {
        title: "Strategic Frameworks",
        description: "Complete collection of decision and governance tools",
        href: "/resources/strategic-frameworks",
        icon: Workflow,
        format: "Toolkit"
      },
      {
        title: "Leadership Standards Blueprint",
        description: "Framework for defining leadership performance",
        href: "/resources/leadership-standards-blueprint",
        icon: Target,
        format: "Development framework"
      }
    ]
  }[frameworkType] || relatedTools.general;

  return (
    <Layout title={title} description={excerpt} ogImage={coverImage} ogType="article">
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />
        {access === "inner-circle" && (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </Head>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-br from-black via-zinc-950 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1),transparent_50%)]" />

        <div className="container relative mx-auto px-4 pt-24 pb-16">
          <div
            className={`transition-all duration-1000 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-gold">
                {category}
              </span>
              
              {access && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] ${
                  access === 'inner-circle' 
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'bg-green-500/10 text-green-400 border border-green-500/30'
                }`}>
                  {access === 'inner-circle' ? 'Inner Circle' : 'Public'}
                </span>
              )}
              
              {date && (
                <span className="text-xs text-zinc-500">
                  {new Date(date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            {excerpt && (
              <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-400 sm:text-xl">
                {excerpt}
              </p>
            )}

            {/* Framework Metadata */}
            <div className="mt-8 flex flex-wrap gap-6">
              {applications.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Applications</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {applications.slice(0, 3).map((app: string, idx: number) => (
                      <span key={idx} className="rounded-full border border-zinc-700 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-300">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {expectedOutcomes.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Expected Outcomes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {expectedOutcomes.slice(0, 2).map((outcome: string, idx: number) => (
                      <span key={idx} className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-sm text-gold">
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap gap-4">
              {access === 'public' ? (
                <Link
                  href="#download"
                  className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                >
                  <Download className="h-4 w-4" />
                  Download Framework
                </Link>
              ) : (
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-6 py-3 text-sm font-bold uppercase tracking-widest text-gold transition hover:bg-gold/15"
                >
                  <Lock className="h-4 w-4" />
                  Unlock in Inner Circle
                </Link>
              )}
              
              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold uppercase tracking-widest text-cream transition hover:bg-white/10"
              >
                <Calendar className="h-4 w-4" />
                Strategy Room Session
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Sidebar - Table of Contents & Related */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-8">
              {/* Table of Contents */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                  Framework Sections
                </h3>
                <nav className="space-y-2">
                  {[
                    { id: "overview", label: "Overview & Purpose" },
                    { id: "principles", label: "Core Principles" },
                    { id: "implementation", label: "Implementation Steps" },
                    { id: "case-studies", label: "Application Examples" },
                    { id: "tools", label: "Required Tools" },
                    { id: "outcomes", label: "Expected Outcomes" },
                  ].map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        activeSection === item.id
                          ? "border-l-4 border-gold bg-gold/10 text-gold"
                          : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Related Tools */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
                  Implementation Tools
                </h3>
                <div className="space-y-4">
                  {relatedTools.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.title}
                        href={tool.href}
                        className="group flex items-start gap-3 rounded-lg p-3 transition-all hover:bg-white/[0.05]"
                      >
                        <div className="rounded-lg border border-gold/25 bg-gold/10 p-2">
                          <Icon className="h-4 w-4 text-gold" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white group-hover:text-gold">{tool.title}</p>
                          <p className="mt-1 text-xs text-zinc-400">{tool.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Quick Access */}
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-6">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gold">
                  Quick Access
                </h3>
                <div className="space-y-3">
                  <Link
                    href="/resources/strategic-frameworks"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
                  >
                    <ArrowRight className="h-3 w-3" />
                    View All Frameworks
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Join Inner Circle
                  </Link>
                  <Link
                    href="/consulting"
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Book Strategy Session
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div
              className={`transition-all duration-1000 delay-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Framework Content */}
              <div
                className="prose prose-invert max-w-none
                prose-headings:font-serif prose-headings:font-bold
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-white
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-white
                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-4
                prose-ul:my-6 prose-li:my-2 prose-li:text-zinc-300
                prose-blockquote:border-l-gold prose-blockquote:border-l-4
                prose-blockquote:bg-gold/5 prose-blockquote:px-8 prose-blockquote:py-6
                prose-blockquote:italic prose-blockquote:text-zinc-300 prose-blockquote:rounded-r-lg
                prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800
                prose-pre:overflow-x-auto prose-pre:rounded-xl
                prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:border prose-img:border-zinc-800
                prose-table:border prose-table:border-zinc-800 prose-table:rounded-lg
                prose-th:bg-zinc-900 prose-th:text-zinc-300 prose-th:border-b prose-th:border-zinc-700
                prose-td:border-t prose-td:border-zinc-800 prose-td:p-4
                prose-strong:text-white prose-strong:font-semibold"
              >
                <SafeMDXRemote {...source} components={mdxComponents} />
              </div>

              {/* Download Section */}
              <div id="download" className="mt-16">
                <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-black via-zinc-950 to-black p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-6 rounded-full border border-gold/30 bg-gold/10 p-6">
                      <Download className="h-10 w-10 text-gold" />
                    </div>
                    <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                      {access === 'public' ? 'Download Complete Framework' : 'Unlock Full Framework'}
                    </h3>
                    <p className="mb-8 max-w-2xl text-zinc-400">
                      {access === 'public' 
                        ? 'Get the complete framework including templates, worksheets, and implementation guides.'
                        : 'This framework is exclusive to Inner Circle members. Join to access the complete toolkit.'
                      }
                    </p>
                    {access === 'public' ? (
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                          href="/download/strategy-framework"
                          className="rounded-xl bg-gold px-8 py-3 font-bold text-black transition-all hover:bg-gold/80"
                        >
                          Download PDF Package
                        </Link>
                        <Link
                          href="/inner-circle"
                          className="rounded-xl border border-gold/50 bg-transparent px-8 py-3 font-bold text-gold transition-all hover:bg-gold hover:text-black"
                        >
                          Upgrade to Inner Circle
                        </Link>
                      </div>
                    ) : (
                      <Link
                        href="/inner-circle"
                        className="rounded-xl bg-gold px-8 py-3 font-bold text-black transition-all hover:bg-gold/80"
                      >
                        Join Inner Circle for Access
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Consultation CTA */}
              <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <div className="rounded-full border border-zinc-700 bg-zinc-800 p-4">
                    <MessageSquare className="h-8 w-8 text-gold" />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-serif text-xl font-bold text-white">Need Implementation Support?</h3>
                    <p className="mb-4 text-zinc-400">
                      Book a Strategy Room session for personalized implementation guidance and support.
                    </p>
                    <Link
                      href="/consulting/strategy-room"
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold transition hover:text-gold/80"
                    >
                      Schedule Strategy Room
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Frameworks Section */}
      <div className="border-t border-zinc-800 bg-zinc-950 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 font-serif text-3xl font-bold text-white">Related Strategic Frameworks</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Board Decision Architecture",
                description: "Framework for high-stakes board-level decisions",
                href: "/strategy/board-decision-architecture",
                category: "Governance"
              },
              {
                title: "Legacy Planning Framework",
                description: "Multi-generational stewardship and legacy architecture",
                href: "/strategy/legacy-planning-framework",
                category: "Stewardship"
              },
              {
                title: "Household Governance Model",
                description: "Family governance and household operating principles",
                href: "/strategy/household-governance",
                category: "Family"
              }
            ].map((framework) => (
              <Link
                key={framework.title}
                href={framework.href}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-gold/30 hover:bg-zinc-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                    {framework.category}
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-gold" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-bold text-white group-hover:text-gold">
                  {framework.title}
                </h3>
                <p className="text-sm text-zinc-400">{framework.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Reading Progress */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-1 bg-zinc-900">
        <div
          className="h-full bg-gradient-to-r from-gold to-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Layout>
  );
};

export default StrategyDetailPage;