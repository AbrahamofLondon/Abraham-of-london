// pages/shorts/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Share2,
  Twitter,
  Linkedin,
  Mail,
  Link2,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";

import {
  getPublishedShorts,
  getShortBySlug,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";

import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import mdxComponents from "@/components/mdx-components";
import Layout from "@/components/Layout";

const SITE_URL = "https://www.abrahamoflondon.org";
const DIM_KEY = "aol_shorts_dim_mode";

type PageProps = {
  short: any;
  source: MDXRemoteSerializeResult;
  canonicalUrl: string;
  ogImage: string | null;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getPublishedShorts().map((s) => ({
    params: { slug: normalizeSlug(s) },
  }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slugParam = String(params?.slug ?? "").toLowerCase().trim();
  const rawDoc = getShortBySlug(slugParam);

  if (!rawDoc) return { notFound: true };

  const cover = resolveDocCoverImage(rawDoc) ?? null;
  const canonicalUrl = `${SITE_URL}/shorts/${normalizeSlug(rawDoc)}`;

  // Keep JSON-safe
  const short = JSON.parse(JSON.stringify({ ...rawDoc, cover }));

  try {
    const source = await serialize(short.body.raw, {
      mdxOptions: {
        // keep your existing pipeline defaults; don't introduce plugins here unless needed
      },
    });
    return {
      props: {
        short,
        source,
        canonicalUrl,
        ogImage: cover,
      },
      revalidate: 1800,
    };
  } catch {
    return { notFound: true };
  }
};

const ShareButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  subtle?: boolean;
  success?: boolean;
}> = ({ icon, label, onClick, subtle, success }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "group inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition",
      "backdrop-blur-sm",
      subtle
        ? "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
        : "border-gold/20 bg-gold/5 text-gold hover:border-gold/35 hover:bg-gold/10",
      success ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "",
    ].join(" ")}
  >
    <span className="opacity-90">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const TinyToggle: React.FC<{
  enabled: boolean;
  onToggle: () => void;
}> = ({ enabled, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    className={[
      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition",
      "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10",
    ].join(" ")}
    aria-pressed={enabled}
    aria-label={enabled ? "Dim mode on" : "Dim mode off"}
  >
    {enabled ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
    <span className="opacity-90">{enabled ? "Dim" : "Light"}</span>
  </button>
);

const ShortPage: NextPage<PageProps> = ({ short, source, canonicalUrl, ogImage }) => {
  const reduceMotion = useReducedMotion();

  const [copied, setCopied] = React.useState(false);
  const [canNativeShare, setCanNativeShare] = React.useState(false);

  // Ritual layer
  const [showBreathe, setShowBreathe] = React.useState(false);
  const [dimMode, setDimMode] = React.useState(false);

  const shareTitle = short?.title || "Short · Abraham of London";
  const shareText = short?.excerpt || "A short reflection worth keeping.";
  const shareUrl = canonicalUrl;

  // Detect native share after mount (prevents SSR mismatch)
  React.useEffect(() => {
    if (typeof navigator !== "undefined" && typeof (navigator as any).share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Load dim mode preference + show breathe cue briefly
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.localStorage.getItem(DIM_KEY);
    if (saved === "1") setDimMode(true);

    // Tiny “Breathe” cue: appears, then fades out after ~2s (unless reduced motion)
    if (reduceMotion) return;

    setShowBreathe(true);
    const t = window.setTimeout(() => setShowBreathe(false), 2000);
    return () => window.clearTimeout(t);
  }, [reduceMotion]);

  const toggleDim = React.useCallback(() => {
    setDimMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(DIM_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const handleShare = React.useCallback(
    (platform: "twitter" | "linkedin" | "email" | "copy") => {
      if (typeof window === "undefined") return;

      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedTitle = encodeURIComponent(shareTitle);
      const encodedText = encodeURIComponent(shareText);

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=abrahamoflondon`,
            "_blank",
            "width=550,height=420",
          );
          return;

        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            "_blank",
            "width=550,height=420",
          );
          return;

        case "email":
          window.location.href = `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0ARead: ${encodedUrl}`;
          return;

        case "copy":
          if (!navigator?.clipboard?.writeText) return;
          navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1800);
          });
          return;
      }
    },
    [shareUrl, shareTitle, shareText],
  );

  const handleNativeShare = React.useCallback(() => {
    if (typeof navigator === "undefined" || !(navigator as any).share) return;
    (navigator as any).share({ title: shareTitle, text: shareText, url: shareUrl }).catch(() => {});
  }, [shareTitle, shareText, shareUrl]);

  // Calm motion curve: slow, late, settling.
  const settle = reduceMotion
    ? { duration: 0.01 }
    : ({ duration: 0.9, ease: [0.16, 1, 0.3, 1] } as const);

  // Closure line (non-denominational)
  const closureLine = "Peace to your mind. Strength to your steps.";

  return (
    <Layout title={shareTitle} ogImage={ogImage ?? undefined}>
      <Head>
        <meta name="description" content={shareText} />

        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareText} />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={shareText} />

        <link rel="canonical" href={shareUrl} />
      </Head>

      <main className="relative overflow-hidden bg-black">
        {/* Ambient chapel architecture */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {/* Soft sanctuary wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.10),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,140,0,0.08),transparent_55%)]" />

          {/* Smoke drift — extremely slow */}
          {!reduceMotion ? (
            <>
              <motion.div
                className="absolute left-[-15%] top-[22%] h-[520px] w-[520px] rounded-full bg-white/6 blur-[140px]"
                animate={{ x: [0, 140, 0], opacity: [0.12, 0.22, 0.12] }}
                transition={{ duration: 36, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute right-[-18%] top-[50%] h-[480px] w-[480px] rounded-full bg-amber-400/10 blur-[160px]"
                animate={{ x: [0, -150, 0], opacity: [0.1, 0.18, 0.1] }}
                transition={{ duration: 42, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          ) : null}

          {/* Vignette (dim mode deepens it) */}
          <div
            className={[
              "absolute inset-0",
              dimMode
                ? "bg-[radial-gradient(ellipse_at_center,transparent_28%,rgba(0,0,0,0.78)_82%)]"
                : "bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.58)_80%)]",
            ].join(" ")}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-6 py-16 sm:py-20">
          {/* Top controls */}
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 transition hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4 opacity-80" />
              Back to Shorts
            </Link>

            <div className="flex items-center gap-2">
              <TinyToggle enabled={dimMode} onToggle={toggleDim} />
            </div>
          </div>

          {/* Tiny “Breathe” cue (fades out after 2s) */}
          <AnimatePresence>
            {showBreathe ? (
              <motion.div
                initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
                }
                className="pointer-events-none mb-8 flex justify-center"
              >
                <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[11px] tracking-[0.3em] text-gray-200/90 backdrop-blur-sm">
                  BREATHE
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Header */}
          <header className="mb-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...settle, delay: reduceMotion ? 0 : 0.05 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold/90"
            >
              <Sparkles className="h-4 w-4" />
              {short.theme || "Reflection"}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...settle, delay: reduceMotion ? 0 : 0.15 }}
              className="font-serif text-4xl text-white sm:text-5xl"
            >
              {short.title}
            </motion.h1>

            {short.excerpt ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...settle, delay: reduceMotion ? 0 : 0.35 }}
                className="mx-auto mt-5 max-w-2xl text-base text-gray-300 sm:text-lg"
              >
                <span className="italic">{short.excerpt}</span>
              </motion.p>
            ) : null}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...settle, delay: reduceMotion ? 0 : 0.55 }}
              className="mx-auto mt-6 max-w-xl text-xs text-gray-400"
            >
              If your mind is noisy, read it slowly. If your life is heavy, read it twice.
            </motion.p>
          </header>

          {/* Body (Dim mode subtly affects the whole “room”: lower contrast + more blur) */}
          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...settle, delay: reduceMotion ? 0 : 0.25 }}
            className={[
              "rounded-3xl border p-7 sm:p-9",
              dimMode
                ? "border-white/10 bg-white/[0.035] text-gray-200/90 backdrop-blur-lg"
                : "border-white/10 bg-white/5 text-gray-200 backdrop-blur-md",
              "prose prose-invert max-w-none",
              "prose-headings:font-serif prose-headings:text-cream",
              dimMode
                ? "prose-p:text-gray-200/85 prose-strong:text-gold/90 prose-a:text-gold/90"
                : "prose-p:text-gray-200 prose-strong:text-gold prose-a:text-gold",
              "prose-blockquote:border-l-gold/40 prose-blockquote:text-gray-200",
            ].join(" ")}
          >
            <MDXRemote {...source} components={mdxComponents} />
          </motion.article>

          {/* Quiet action strip */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:scale-[1.02]"
            >
              <ChevronLeft className="h-4 w-4" />
              Return to the feed
            </Link>

            <div className="text-center text-xs text-gray-400">
              Under pressure? Keep it simple: one short, then back to life.
            </div>
          </div>

          {/* End-of-page closure line (non-denominational, “Amen-style” closure without the label) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20%" }}
            transition={
              reduceMotion ? { duration: 0.01 } : { duration: 0.85, ease: [0.16, 1, 0.3, 1] }
            }
            className="mt-14 flex justify-center"
          >
            <div className="max-w-xl text-center">
              <div className="mx-auto mb-3 h-px w-24 bg-gradient-to-r from-transparent via-gold/35 to-transparent" />
              <p className="font-serif text-base text-cream/90">{closureLine}</p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-gray-400">
                Close the tab. Keep the point.
              </p>
            </div>
          </motion.div>

          {/* Share (soft, optional) */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...settle, delay: reduceMotion ? 0 : 0.4 }}
            className={[
              "mt-14 rounded-3xl border border-white/10 p-7 backdrop-blur-md",
              dimMode ? "bg-white/[0.03]" : "bg-white/5",
            ].join(" ")}
          >
            <div className="text-center">
              <h2 className="font-serif text-xl text-cream">Share quietly</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-300">
                If this steadied you, it may steady someone else.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {canNativeShare ? (
                <ShareButton
                  icon={<Share2 className="h-4 w-4" />}
                  label="Share"
                  onClick={handleNativeShare}
                  subtle
                />
              ) : null}

              <ShareButton
                icon={<Twitter className="h-4 w-4" />}
                label="Twitter"
                onClick={() => handleShare("twitter")}
                subtle
              />
              <ShareButton
                icon={<Linkedin className="h-4 w-4" />}
                label="LinkedIn"
                onClick={() => handleShare("linkedin")}
                subtle
              />
              <ShareButton
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                onClick={() => handleShare("email")}
                subtle
              />
              <ShareButton
                icon={copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                label={copied ? "Copied" : "Copy link"}
                onClick={() => handleShare("copy")}
                subtle
                success={copied}
              />
            </div>

            <div className="mt-6 border-t border-white/10 pt-5 text-center">
              <Link
                href="/shorts"
                className="inline-flex items-center gap-2 text-sm font-medium text-gold transition hover:text-gold/80"
              >
                Explore more Shorts <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.section>

          {/* Footer navigation (links verified) */}
          <div className="mt-12 flex items-center justify-between border-t border-white/10 pt-8 text-sm text-gray-400">
            <Link href="/shorts" className="transition hover:text-gold">
              ← All Shorts
            </Link>
            <Link href="/blog" className="transition hover:text-gold">
              Read Essays →
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default ShortPage;