import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  getContentlayerData, 
  isDraftContent, 
  normalizeSlug, 
  getDocHref, 
  getAccessLevel 
} from "@/lib/contentlayer-compat";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { 
  strategy: any; 
  source: any;
};

// KEEP ONLY ONE getStaticPaths - remove the duplicate
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
  let source;

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
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsVisible(true);
    
    // Simple scroll spy for sections
    const handleScroll = () => {
      const sections = document.querySelectorAll('h2[id], h3[id]');
      const scrollPos = window.scrollY + 100;
      
      let current = '';
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        const sectionHeight = (section as HTMLElement).offsetHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          current = section.id;
        }
      });
      
      setActiveSection(current);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const title = strategy?.title || "Architectural Strategy";
  const excerpt = strategy?.excerpt || strategy?.description || "";
  const category = strategy?.category || "Framework";
  const date = strategy?.date;
  const coverImage = strategy?.coverImage || strategy?.image;

  return (
    <Layout
      title={title}
      description={excerpt}
      ogImage={coverImage}
      ogType="article"
    >
      <Head>
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://www.abrahamoflondon.org/strategies/${strategy?.slug || ''}`} />
      </Head>

      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-zinc-800 bg-gradient-to-br from-black via-zinc-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1),transparent_50%)]" />
        
        <div className="container relative mx-auto px-4 py-24">
          <div className={`transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="mb-6 inline-flex items-center gap-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="text-xs font-bold uppercase tracking-[0.35em] text-amber-500">
                {category}
              </span>
              {date && (
                <span className="text-xs text-zinc-500">
                  {new Date(date).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
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

            {/* Author & Meta Info */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                <div>
                  <div className="text-sm font-medium text-white">Abraham of London</div>
                  <div className="text-xs text-zinc-500">Architectural Strategist</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                {strategy?.readTime && (
                  <span>⌛ {strategy.readTime}</span>
                )}
                {strategy?.difficulty && (
                  <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300">
                    {strategy.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
                Framework Sections
              </h3>
              
              <nav className="space-y-2">
                {source?.compiledSource && (
                  // This would require parsing headings from the MDX source
                  // For now, showing placeholder sections
                  <>
                    <a
                      href="#overview"
                      className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                        activeSection === 'overview'
                          ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Overview
                    </a>
                    <a
                      href="#principles"
                      className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                        activeSection === 'principles'
                          ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('principles')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Core Principles
                    </a>
                    <a
                      href="#implementation"
                      className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                        activeSection === 'implementation'
                          ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('implementation')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Implementation
                    </a>
                    <a
                      href="#case-studies"
                      className={`block rounded-lg px-4 py-2 text-sm transition-colors ${
                        activeSection === 'case-studies'
                          ? 'bg-amber-500/10 text-amber-500 border-l-4 border-amber-500'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById('case-studies')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Case Studies
                    </a>
                  </>
                )}
              </nav>

              {/* Access Level Badge */}
              {getAccessLevel(strategy) === 'inner-circle' && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                      Inner Circle
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-amber-500/80">
                    This strategic framework is exclusive to the Inner Circle
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className={`transition-all duration-1000 delay-500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              <div className="prose prose-invert max-w-none 
                prose-headings:font-serif prose-headings:font-bold
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-4
                prose-ul:my-6 prose-li:my-2
                prose-blockquote:border-l-amber-500 prose-blockquote:border-l-4 
                prose-blockquote:bg-zinc-900/50 prose-blockquote:px-8 prose-blockquote:py-6
                prose-blockquote:italic prose-blockquote:text-zinc-300
                prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800
                prose-pre:overflow-x-auto
                prose-a:text-amber-500 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:border prose-img:border-zinc-800
                prose-table:border prose-table:border-zinc-800
                prose-th:bg-zinc-900 prose-th:text-zinc-300
                prose-td:border-t prose-td:border-zinc-800`}>
                
                <SafeMDXRemote {...source} components={mdxComponents} />
              </div>

              {/* Call to Action */}
              <div className="mt-16 rounded-2xl border border-zinc-800 bg-gradient-to-r from-black to-zinc-900 p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 text-6xl opacity-20">𓃲</div>
                  <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                    Master Architectural Strategy
                  </h3>
                  <p className="mb-8 max-w-2xl text-zinc-400">
                    Join the Inner Circle for exclusive access to complete strategic frameworks, 
                    private consultations, and advanced implementation guides.
                  </p>
                  <a
                    href="/inner-circle"
                    className="rounded-xl bg-amber-500 px-8 py-3 font-bold text-black transition-all hover:scale-105 hover:bg-amber-400"
                  >
                    Access Complete Framework ↠
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reading Progress */}
      <div className="fixed bottom-0 left-0 right-0 h-1 bg-zinc-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
          style={{
            width: `${Math.min(100, (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)}%`
          }}
        />
      </div>
    </Layout>
  );
};

export default StrategyDetailPage;