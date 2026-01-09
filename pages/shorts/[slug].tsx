/* pages/shorts/[slug].tsx — FULL FIXED VERSION */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import {
  getServerAllShorts,
  getServerShortBySlug,
  normalizeSlug,
} from "@/lib/contentlayer-compat";
import { prepareMDX, mdxComponents, sanitizeData } from "@/lib/server/md-utils";

import ShortHero from "@/components/shorts/ShortHero";
import ShortContent from "@/components/shorts/ShortContent";
import ShortNavigation from "@/components/shorts/ShortNavigation";
import ShortActions from "@/components/shorts/ShortActions";
import ShortMetadata from "@/components/shorts/ShortMetadata";
import ShortComments from "@/components/shorts/ShortComments";

import { Bookmark, Heart, MessageCircle, Eye, Clock, Zap } from "lucide-react";

interface Short {
  title: string;
  excerpt: string | null;
  description: string | null;
  date: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  url: string;
  slugPath: string;
  readTime: string | null;
  theme: string | null;
  views: number | null;
  likes: number | null;
}

interface Props {
  short: Short;
  source: MDXRemoteSerializeResult;
}

const ShortPage: NextPage<Props> = ({ short, source }) => {
  const [likes, setLikes] = React.useState(short.likes || 0);
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);

  const metaDescription =
    short.excerpt ||
    short.description ||
    "A short insight from Abraham of London";

  const formattedDate = short.date
    ? new Date(short.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleLike = () => {
    if (!isLiked) {
      setLikes((v) => v + 1);
      setIsLiked(true);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{short.title} | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={short.title} />
        <meta
          property="og:image"
          content={short.coverImage || "/assets/images/short-default.jpg"}
        />
      </Head>

      <div className="min-h-screen bg-[#050505] selection:bg-amber-500 selection:text-black">
        <ShortHero
          title={short.title}
          excerpt={short.excerpt}
          theme={short.theme}
          coverImage={short.coverImage}
          author={short.author}
          date={formattedDate}
          readTime={short.readTime}
        />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-10 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-8">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-amber-500/50" />
                <span>{short.views || 0} views</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500/50" />
                <span>{short.readTime || "2 min"} read</span>
              </div>
              {short.theme ? (
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-500">{short.theme}</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors ${
                  isLiked ? "text-rose-500" : "hover:text-rose-400"
                }`}
                type="button"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{likes}</span>
              </button>

              <button
                onClick={() => setShowComments((v) => !v)}
                className="flex items-center space-x-2 hover:text-amber-400 transition-colors"
                type="button"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsBookmarked((v) => !v)}
                className={`flex items-center space-x-2 transition-colors ${
                  isBookmarked ? "text-amber-500" : "hover:text-amber-400"
                }`}
                type="button"
              >
                <Bookmark
                  className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/30 border border-white/5 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-2xl">
                <div className="prose prose-invert prose-amber max-w-none">
                  <ShortContent>
                    <MDXRemote {...source} components={mdxComponents} />
                  </ShortContent>
                </div>

                {short.tags.length > 0 ? (
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {short.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-white/5 text-zinc-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-12 border-t border-white/10 pt-8">
                  <ShortActions
                    title={short.title}
                    url={`https://www.abrahamoflondon.org${short.url}`}
                    onLike={handleLike}
                    isLiked={isLiked}
                    onBookmark={() => setIsBookmarked((v) => !v)}
                    isBookmarked={isBookmarked}
                    likes={likes}
                  />
                </div>
              </div>

              <div className="mt-12">
                <ShortComments
                  showComments={showComments}
                  shortId={short.slugPath}
                  onToggleComments={() => setShowComments((v) => !v)}
                />
              </div>
            </main>

            <aside className="lg:col-span-4 self-start sticky top-8">
              <div className="space-y-8">
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <ShortMetadata
                    author={short.author}
                    date={formattedDate}
                    readTime={short.readTime}
                    theme={short.theme}
                    views={short.views}
                  />
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                    Continuity
                  </h3>
                  <ShortNavigation currentSlug={short.slugPath} />
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-8">
                  <h3 className="text-lg font-serif font-bold text-white mb-2">
                    Daily Field Notes
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6">
                    Strategic insights dispatched to your node.
                  </p>
                  <button
                    className="w-full bg-amber-500 text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all"
                    type="button"
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShortPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = await getServerAllShorts();

  const paths = (shorts || [])
    .filter((x: any) => x && !(x as any).draft)
    .map((s: any) => normalizeSlug(s?.slug ?? s?._raw?.flattenedPath ?? ""))
    .filter(Boolean)
    .filter((slug: string) => !slug.includes("replace"))
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "").trim();
  if (!slug) return { notFound: true };

  const data = await getServerShortBySlug(slug);
  if (!data) return { notFound: true };

  const rawMdx = (data as any)?.body?.raw ?? (data as any)?.body ?? "";
  const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

  const short: Short = {
    title: data.title || "Field Note",
    excerpt: data.excerpt || null,
    description: data.description || null,
    date: data.date || null,
    coverImage: data.coverImage || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || "Abraham of London",
    url: `/shorts/${normalizeSlug(data.slug || slug)}`,
    slugPath: normalizeSlug(data.slug || slug),
    readTime: data.readTime || (data as any).readingTime || null,
    theme: (data as any).theme || null,
    views: (data as any).views || 0,
    likes: (data as any).likes || 0,
  };

  return {
    props: { short: sanitizeData(short), source },
    revalidate: 3600,
  };
};