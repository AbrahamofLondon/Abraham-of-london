import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Share2, Twitter, Linkedin, Mail, Link2, Check } from "lucide-react";
import { motion } from "framer-motion";

import { 
  getPublishedShorts, 
  getShortBySlug, 
  normalizeSlug, 
  resolveDocCoverImage 
} from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import mdxComponents from "@/components/mdx-components";
import { MDXRemote } from "next-mdx-remote";
import Layout from "@/components/Layout";

const SITE_URL = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getPublishedShorts().map((s) => ({ 
    params: { slug: normalizeSlug(s) } 
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "").toLowerCase().trim();
  const rawDoc = getShortBySlug(slug);
  
  if (!rawDoc) return { notFound: true };
  
  const short = JSON.parse(JSON.stringify({
    ...rawDoc,
    cover: resolveDocCoverImage(rawDoc)
  }));
  
  try {
    const source = await serialize(short.body.raw);
    return { props: { short, source }, revalidate: 1800 };
  } catch (err) {
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
    onClick={onClick}
    className={`group flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm font-medium text-gold transition-all hover:border-gold/40 hover:bg-gold/10 hover:scale-105 ${className}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const ShortPage: NextPage<{short: any, source: any}> = ({ short, source }) => {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${SITE_URL}/shorts/${normalizeSlug(short)}`;
  const shareTitle = short.title || "Wisdom from Abraham of London";
  const shareText = short.excerpt || "Thought-provoking insight worth reflecting on";

  const handleShare = React.useCallback((platform: 'twitter' | 'linkedin' | 'email' | 'copy') => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=abrahamoflondon`,
          '_blank',
          'width=550,height=420'
        );
        break;
      
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      
      case 'email':
        window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0ARead more: ${encodedUrl}`;
        break;
      
      case 'copy':
        navigator.clipboard.writeText(shareUrl).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  }, [shareUrl, shareTitle, shareText]);

  const handleNativeShare = React.useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      }).catch(() => {});
    }
  }, [shareUrl, shareTitle, shareText]);

  return (
    <Layout title={short.title} ogImage={short.cover}>
      <Head>
        <meta name="description" content={shareText} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareText} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        {short.cover && <meta property="og:image" content={short.cover} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareText} />
        <link rel="canonical" href={shareUrl} />
      </Head>

      <main className="mx-auto max-w-2xl px-6 py-20">
        {/* Back Link */}
        <Link 
          href="/shorts" 
          className="inline-flex items-center gap-2 text-sm text-gold/70 hover:text-gold transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shorts
        </Link>

        {/* Header */}
        <header className="mb-12 border-b border-gold/10 pb-10 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gold">
            {short.theme || "Reflection"}
          </p>
          <h1 className="mt-4 font-serif text-4xl text-white">
            {short.title}
          </h1>
          {short.excerpt && (
            <p className="mt-4 text-lg text-gray-400 italic">
              {short.excerpt}
            </p>
          )}
        </header>

        {/* Content */}
        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-p:text-gray-300 prose-strong:text-gold prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>

        {/* Share CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-8 backdrop-blur-sm"
        >
          <div className="text-center mb-6">
            <h2 className="font-serif text-2xl text-cream mb-3">
              Found This Valuable?
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Share this wisdom with those who would benefit. 
              Help build a community of thoughtful readers and principled leaders.
            </p>
          </div>

          {/* Share Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* Native Share (Mobile) */}
            {typeof window !== 'undefined' && navigator.share && (
              <ShareButton
                icon={<Share2 className="w-4 h-4" />}
                label="Share"
                onClick={handleNativeShare}
                className="sm:hidden"
              />
            )}

            {/* Twitter */}
            <ShareButton
              icon={<Twitter className="w-4 h-4" />}
              label="Share on Twitter"
              onClick={() => handleShare('twitter')}
            />

            {/* LinkedIn */}
            <ShareButton
              icon={<Linkedin className="w-4 h-4" />}
              label="Share on LinkedIn"
              onClick={() => handleShare('linkedin')}
            />

            {/* Email */}
            <ShareButton
              icon={<Mail className="w-4 h-4" />}
              label="Share via Email"
              onClick={() => handleShare('email')}
            />

            {/* Copy Link */}
            <ShareButton
              icon={copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              label={copied ? "Copied!" : "Copy Link"}
              onClick={() => handleShare('copy')}
              className={copied ? "border-green-500/40 bg-green-500/10 text-green-400" : ""}
            />
          </div>

          {/* Additional CTA */}
          <div className="mt-6 pt-6 border-t border-gold/10 text-center">
            <p className="text-xs text-gray-500 mb-3">
              Want more insights like this?
            </p>
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 text-sm font-medium text-gold hover:text-gold/80 transition-colors"
            >
              Explore More Shorts
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
          <Link
            href="/shorts"
            className="text-sm text-gray-500 hover:text-gold transition-colors"
          >
            ← All Shorts
          </Link>
          <Link
            href="/blog"
            className="text-sm text-gray-500 hover:text-gold transition-colors"
          >
            Read Essays →
          </Link>
        </div>
      </main>
    </Layout>
  );
};

export default ShortPage;