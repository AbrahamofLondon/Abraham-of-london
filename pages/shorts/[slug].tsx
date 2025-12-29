import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Share2, Twitter, Linkedin, Mail, Link2, Check } from "lucide-react";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import {
  getPublishedShorts,
  getShortBySlug,
  normalizeSlug,
  resolveDocCoverImage,
  coerceShortTheme,
} from "@/lib/contentlayer-helper";

const SITE_URL = "https://www.abrahamoflondon.org";

type ShortPageProps = {
  short: {
    slug: string;
    title: string;
    excerpt: string | null;
    date: string | null;
    readTime: string | null;
    tags: string[];
    theme: string | null;
    cover: string | null;
    body: { raw: string };
  };
  source: MDXRemoteSerializeResult;
};

function toAbsoluteUrl(maybeUrl: string | null | undefined): string | null {
  if (!maybeUrl) return null;
  if (maybeUrl.startsWith("http://") || maybeUrl.startsWith("https://")) return maybeUrl;
  if (maybeUrl.startsWith("/")) return `${SITE_URL}${maybeUrl}`;
  return `${SITE_URL}/${maybeUrl}`;
}

function safeDateLabel(dateLike?: string | null): string | null {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getPublishedShorts().map((s) => ({
    params: { slug: normalizeSlug(s) },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<ShortPageProps> = async ({ params }) => {
  const slugParam = params?.slug;
  const slug =
    typeof slugParam === "string"
      ? slugParam.toLowerCase().trim()
      : Array.isArray(slugParam)
      ? String(slugParam[0] ?? "").toLowerCase().trim()
      : "";

  if (!slug) return { notFound: true };

  const rawDoc = getShortBySlug(slug);
  if (!rawDoc) return { notFound: true };

  const stableSlug = normalizeSlug(rawDoc);
  const cover = toAbsoluteUrl(resolveDocCoverImage(rawDoc)) ?? null;

  // FIX: Explicit mapping avoids JSON hacks and ensures no "undefined" leaks
  const short: ShortPageProps["short"] = {
    slug: stableSlug,
    title: rawDoc.title || "Untitled Short",
    excerpt: rawDoc.excerpt || null,
    date: rawDoc.date ? String(rawDoc.date) : null,
    readTime: rawDoc.readTime || null,
    tags: Array.isArray(rawDoc.tags) ? (rawDoc.tags as string[]) : [],
    theme: coerceShortTheme(rawDoc) ?? null, // Safe coercion
    cover,
    body: { raw: rawDoc.body?.raw || "" },
  };

  try {
    const source = await serialize(short.body.raw);
    return { props: { short, source } };
  } catch {
    return { notFound: true };
  }
};

const ShareButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}> = ({ icon, label, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "group flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-4 py-2.5",
      "text-sm font-medium text-gold transition-all hover:border-gold/40 hover:bg-gold/10 hover:scale-[1.03]",
      "active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-gold/30",
      className,
    ].join(" ")}
    aria-label={label}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default function ShortPage({ short, source }: ShortPageProps): JSX.Element {
  const [copied, setCopied] = React.useState(false);

  const shareUrl = `${SITE_URL}/shorts/${short.slug}`;
  const shareTitle = short.title || "Shorts · Abraham of London";
  const shareText =
    short.excerpt ||
    "A short reflection from Abraham of London — faith-rooted clarity without the noise.";

  const dateLabel = safeDateLabel(short.date);

  const handleShare = React.useCallback(
    (platform: "twitter" | "linkedin" | "email" | "copy") => {
      if (typeof window === "undefined") return;

      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedTitle = encodeURIComponent(shareTitle);
      const encodedText = encodeURIComponent(shareText);

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodedTitle}%0A${encodedText}&url=${encodedUrl}`,
            "_blank",
            "noopener,noreferrer,width=550,height=420"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            "_blank",
            "noopener,noreferrer,width=550,height=420"
          );
          break;
        case "email":
          window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0ARead%3A%20${encodedUrl}`;
          break;
        case "copy":
          if (!navigator?.clipboard?.writeText) return;
          navigator.clipboard
            .writeText(shareUrl)
            .then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            })
            .catch(() => {});
          break;
      }
    },
    [shareUrl, shareTitle, shareText]
  );

  const handleNativeShare = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (!navigator?.share) return;
    navigator.share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
  }, [shareUrl, shareTitle, shareText]);

  return (
    <Layout title={shareTitle} description={shareText} ogImage={short.cover ?? undefined}>
      <Head>
        <meta name="description" content={shareText} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareText} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        {short.cover ? <meta property="og:image" content={short.cover} /> : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareText} />
        <link rel="canonical" href={shareUrl} />
      </Head>

      <main className="mx-auto max-w-2xl px-6 py-20">
        <Link
          href="/shorts"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gold/70 transition-colors hover:text-gold"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shorts
        </Link>

        <header className="mb-12 border-b border-gold/10 pb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gold">
            {short.theme || "Reflection"}
          </p>

          <h1 className="mt-4 font-serif text-4xl text-white">{short.title}</h1>

          {short.excerpt ? <p className="mt-4 text-lg text-gray-400 italic">{short.excerpt}</p> : null}

          <div className="mt-6 flex items-center justify-center gap-3 text-xs text-gray-500">
            {short.readTime ? <span>{short.readTime} read</span> : null}
            {dateLabel ? (
              <>
                <span className="opacity-40">•</span>
                <span>{dateLabel}</span>
              </>
            ) : null}
          </div>
        </header>

        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-p:text-gray-300 prose-strong:text-gold prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-8 backdrop-blur-sm"
        >
          <div className="mb-6 text-center">
            <h2 className="mb-3 font-serif text-2xl text-cream">Share it forward</h2>
            <p className="mx-auto max-w-md text-sm text-gray-400">
              If this met you in the right moment, send it to someone who needs steady clarity.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <ShareButton icon={<Share2 className="h-4 w-4" />} label="Share" onClick={handleNativeShare} className="sm:hidden" />
            <ShareButton icon={<Twitter className="h-4 w-4" />} label="Twitter" onClick={() => handleShare("twitter")} />
            <ShareButton icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" onClick={() => handleShare("linkedin")} />
            <ShareButton icon={<Mail className="h-4 w-4" />} label="Email" onClick={() => handleShare("email")} />
            <ShareButton
              icon={copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              label={copied ? "Copied" : "Copy link"}
              onClick={() => handleShare("copy")}
              className={copied ? "border-green-500/40 bg-green-500/10 text-green-400" : ""}
            />
          </div>

          <div className="mt-6 border-t border-gold/10 pt-6 text-center">
            <p className="mb-3 text-xs text-gray-500">Want another one like this?</p>
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-gold/80"
            >
              Explore more Shorts
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.section>

        <nav className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
          <Link href="/shorts" className="text-sm text-gray-500 transition-colors hover:text-gold">
            ← All Shorts
          </Link>
          <Link href="/blog" className="text-sm text-gray-500 transition-colors hover:text-gold">
            Read Essays →
          </Link>
        </nav>
      </main>
    </Layout>
  );
}