// pages/shorts/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer2/hooks";

import { getPublishedShorts, getShortBySlug } from "@/lib/contentlayer-helper";
import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

// Local, serialisable type instead of importing from contentlayer2
type ShortDoc = {
  _id: string;
  slug: string;
  title: string;
  body: { code: string };
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[];
  theme?: string | null;
};

type ShortPageProps = {
  short: ShortDoc;
};

// Simple interaction hook for this component
const useShortInteractions = (slug: string) => {
  const [state, setState] = React.useState({
    likes: 0,
    saves: 0,
    userLiked: false,
    userSaved: false,
  });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    // Fetch initial counts
    fetch(`/api/shorts/${slug}/interact`)
      .then(res => res.json())
      .then(data => {
        setState(prev => ({
          ...prev,
          likes: data.likes || 0,
          saves: data.saves || 0,
        }));
      })
      .catch(console.error);

    // Check localStorage for user's previous interactions
    if (typeof window !== 'undefined') {
      const userLiked = localStorage.getItem(`short_${slug}_liked`) === 'true';
      const userSaved = localStorage.getItem(`short_${slug}_saved`) === 'true';
      
      setState(prev => ({
        ...prev,
        userLiked,
        userSaved,
      }));
    }
  }, [slug]);

  const handleInteraction = async (action: 'like' | 'save') => {
    setLoading(true);
    const userId = localStorage.getItem('anon_id') || `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!localStorage.getItem('anon_id')) {
      localStorage.setItem('anon_id', userId);
    }

    try {
      const response = await fetch(`/api/shorts/${slug}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          [action]: data[action],
          [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: data.action === 'added',
        }));
        
        localStorage.setItem(
          `short_${slug}_${action}ed`,
          data.action === 'added' ? 'true' : 'false'
        );
      }
    } catch (error) {
      console.error('Interaction failed:', error);
      // Fallback to optimistic update
      setState(prev => {
        const newValue = !prev[`user${action.charAt(0).toUpperCase() + action.slice(1)}`];
        const countChange = newValue ? 1 : -1;
        
        localStorage.setItem(`short_${slug}_${action}ed`, newValue.toString());
        
        return {
          ...prev,
          [action]: Math.max(0, prev[action] + countChange),
          [`user${action.charAt(0).toUpperCase() + action.slice(1)}`]: newValue,
        };
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    ...state,
    loading,
    handleLike: () => handleInteraction('like'),
    handleSave: () => handleInteraction('save'),
  };
};

const ShortPage: NextPage<ShortPageProps> = ({ short }) => {
  const MDXContent = useMDXComponent(short.body.code);
  const {
    likes,
    saves,
    userLiked,
    userSaved,
    loading,
    handleLike,
    handleSave,
  } = useShortInteractions(short.slug);

  const title = `${short.title} · Short`;
  const description =
    short.excerpt ||
    "A short, high-protein reflection from the Abraham of London ecosystem.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="bg-white py-12 dark:bg-gray-950">
        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
              Short · High-Protein
            </p>
            <h1 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">
              {short.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {short.date && (
                <span>
                  {new Date(short.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                  })}
                </span>
              )}

              {short.readTime && (
                <>
                  <span className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700" />
                  <span>{short.readTime}</span>
                </>
              )}

              {short.theme && (
                <>
                  <span className="h-[1px] w-4 bg-gray-300 dark:bg-gray-700" />
                  <span>{short.theme}</span>
                </>
              )}
            </div>

            {short.excerpt && (
              <p className="max-w-2xl text-sm text-gray-700 dark:text-gray-300">
                {short.excerpt}
              </p>
            )}
          </header>

          {/* Interaction Bar */}
          <div className="sticky top-20 z-10 mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                disabled={loading}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                  userLiked
                    ? "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-label={userLiked ? "Unlike this short" : "Like this short"}
              >
                <svg
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    userLiked ? "fill-current" : "stroke-current"
                  }`}
                  fill={userLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={userLiked ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                <span className="font-medium">{likes}</span>
                <span className="sr-only">likes</span>
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className={`group flex items-center gap-2 rounded-lg px-4 py-2 transition-all duration-200 ${
                  userSaved
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-label={userSaved ? "Remove from saves" : "Save this short"}
              >
                <svg
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${
                    userSaved ? "fill-current" : "stroke-current"
                  }`}
                  fill={userSaved ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={userSaved ? 0 : 2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                  />
                </svg>
                <span className="font-medium">{saves}</span>
                <span className="sr-only">saves</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: short.title,
                      text: description,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                aria-label="Share this short"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-headings:text-gray-900 dark:prose-invert dark:text-gray-100">
            <MDXContent components={mdxComponents} />
          </div>

          {/* Tags */}
          {short.tags && short.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {short.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-10 border-t border-gray-200 pt-5 dark:border-gray-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If this helped you exhale even a little, the Canon goes further —
                into the structural patterns behind days like this.
              </p>
              
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span>{likes} liked this</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  <span>{saves} saved</span>
                </div>
              </div>
            </div>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const shorts = getPublishedShorts();

  return {
    paths: shorts.map((short) => ({
      params: { slug: short.slug },
    })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<ShortPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;

  const raw = getShortBySlug(slug);

  if (!raw) {
    return { notFound: true };
  }

  const short: ShortDoc = {
    ...raw,
    title: raw.title ?? "Untitled short",
    excerpt: raw.excerpt ?? null,
    date: raw.date ?? null,
    tags: raw.tags ?? [],
    readTime: (raw as any).readTime ?? (raw as any).readingTime ?? null,
    theme: (raw as any).theme ?? null,
  };

  return {
    props: { short },
    revalidate: 60, // 1 minute for faster interaction updates
  };
};

export default ShortPage;