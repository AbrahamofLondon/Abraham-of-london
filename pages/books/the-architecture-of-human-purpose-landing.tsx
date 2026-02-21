// pages/books/the-architecture-of-human-purpose-landing.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import { ArrowRight, BookOpen, Layers, Lock, ShieldCheck } from "lucide-react";

// ✅ Add the missing import
import { sanitizeData, isDraftContent } from "@/lib/content/server";

type PreludeBook = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  slug?: string | null;
};

type PurposeLandingProps = {
  book: PreludeBook;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
const canonicalPath = "/books/the-architecture-of-human-purpose-landing";
const canonicalUrl = `${SITE_URL}${canonicalPath}`;

const PurposeLandingPage: NextPage<PurposeLandingProps> = ({ book }) => {
  const title = book?.title || "The Architecture of Human Purpose";
  const subtitle = book?.subtitle || "Prelude MiniBook - Limited Release Edition";
  const description =
    book?.description ||
    "A limited-release Prelude Minibook introducing the Canon on purpose, civilisation, governance, spiritual alignment, and human destiny.";
  const excerpt =
    book?.excerpt ||
    "Human flourishing is not accidental. It is architectural. This Prelude introduces the foundational patterns that govern purpose, identity, civilisation and destiny.";
  const cover = book?.coverImage || "/assets/images/books/the-architecture-of-human-purpose.jpg";

  return (
    <Layout
      title={`${title} — Prelude MiniBook`}
      description={description}
      canonicalUrl={canonicalPath}
      ogType="book"
      ogImage={cover}
      fullWidth
      className="bg-black"
      headerTransparent
    >
      <Head>
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="pointer-events-none absolute inset-0 opacity-[0.05]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,158,11,0.35),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_65%,rgba(245,158,11,0.18),transparent_60%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              {/* Copy */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2">
                  <ShieldCheck className="h-4 w-4 text-amber-300" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200">
                    Canon Prelude · Limited Release
                  </span>
                </div>

                <h1 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                  {title.split(" ").slice(0, 3).join(" ")}{" "}
                  <span className="block text-amber-200">{title.split(" ").slice(3).join(" ")}</span>
                </h1>

                <p className="text-sm font-mono uppercase tracking-[0.28em] text-white/55">
                  {subtitle}
                </p>

                <p className="max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                  {description}
                </p>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-amber-200/70">
                    Excerpt
                  </p>
                  <p className="mt-3 text-base font-serif leading-relaxed text-white/85">
                    {excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-black hover:bg-amber-400 transition-all"
                  >
                    <BookOpen className="h-4 w-4" />
                    Read the Prelude
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/canon"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-7 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/85 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    <Layers className="h-4 w-4" />
                    Enter the Canon
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/5 px-7 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-amber-200 hover:bg-amber-500/10 hover:border-amber-500/55 transition-all"
                  >
                    <Lock className="h-4 w-4" />
                    Founding Readers Circle
                  </Link>
                </div>

                <p className="pt-2 text-xs text-white/45">
                  Volume 0 thinking: a frame strong enough to hold decisions, covenants, markets, and legacy without collapsing into “purpose vibes”.
                </p>
              </div>

              {/* Cover */}
              <div className="flex justify-center lg:justify-end">
                <div className="relative">
                  <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent blur-2xl opacity-70" />
                  <div className="relative rounded-[2rem] border border-amber-500/25 bg-black/60 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.9)]">
                    <Image
                      src={cover}
                      alt={`${title} cover`}
                      width={420}
                      height={620}
                      className="h-auto w-[240px] rounded-2xl border border-amber-500/35 shadow-2xl sm:w-[280px]"
                      priority
                    />
                    <div className="mt-4 text-center text-[10px] font-mono uppercase tracking-[0.28em] text-white/50">
                      Canon Shelf · Prelude MiniBook
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hairline */}
            <div className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />
          </div>
        </section>

        {/* CANON INTRO — real, not a “mini pill” */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/18 bg-amber-500/10 px-4 py-2">
                  <Layers className="h-4 w-4 text-amber-300" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200">
                    The Canon
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-4xl text-white/95">
                  Not content. An operating library.
                </h2>

                <p className="text-base leading-relaxed text-white/70">
                  Most platforms publish ideas. This platform publishes <span className="text-amber-200">systems</span>.
                  The Canon is the doctrinal spine — the place where the frameworks live: diagnostics, matrices, models,
                  institutional blueprints, and operating procedures.
                </p>

                <p className="text-base leading-relaxed text-white/60">
                  The Prelude is the key. The Canon is the architecture.
                  If you want a worldview that can hold pressure — family, leadership, governance, markets, culture —
                  you don’t need more inspiration. You need structure.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/canon"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-black hover:bg-slate-100 transition-all"
                  >
                    Browse Canon <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/downloads"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/80 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Vault & Tools <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm">
                <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-amber-200/70">
                  What the Canon contains
                </p>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="text-sm font-semibold text-white">Diagnostics & Indices</div>
                    <div className="mt-2 text-sm text-white/60 leading-relaxed">
                      Alignment Index™, coherence scoring, and decision-quality frameworks across person, family, organisation, and nation.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="text-sm font-semibold text-white">Models & Matrices</div>
                    <div className="mt-2 text-sm text-white/60 leading-relaxed">
                      Input → logic → output systems that can be audited, taught, deployed, and improved.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                    <div className="text-sm font-semibold text-white">Institutional Blueprints</div>
                    <div className="mt-2 text-sm text-white/60 leading-relaxed">
                      Governance, continuity, stewardship, and legacy design — church, business, household, and state.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
                    <div className="text-sm font-semibold text-amber-100">The Prelude’s role</div>
                    <div className="mt-2 text-sm text-white/65 leading-relaxed">
                      A doorway: it gives you the load-bearing logic without opening the entire vault of tools.
                    </div>
                  </div>
                </div>

                <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-amber-500/15 to-transparent" />

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-black hover:bg-amber-400 transition-all"
                  >
                    Open the Prelude <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/85 hover:bg-white/10 hover:border-white/20 transition-all"
                  >
                    Join Inner Circle <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 bg-gradient-to-r from-black via-slate-950 to-black py-14">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <h3 className="font-serif text-2xl sm:text-3xl text-white/95">
              Ready to read the Prelude?
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base text-white/60 leading-relaxed">
              Start with the doorway. Then track the Canon as new volumes, tools, and operating frameworks are released.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-black hover:bg-slate-100 transition-all"
              >
                Read the Prelude <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-8 py-3 text-[11px] font-mono uppercase tracking-[0.28em] text-white/85 hover:bg-white/10 hover:border-white/20 transition-all"
              >
                Explore the Vault <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const PRELUDE_SOURCE_FILE = "content/books/the-architecture-of-human-purpose.mdx";

export const getStaticProps: GetStaticProps<PurposeLandingProps> = async () => {
  // fallback if content pipeline fails (never breaks deploy)
  let book: PreludeBook = {
    title: "The Architecture of Human Purpose",
    subtitle: "Prelude MiniBook - Limited Release Edition",
    description:
      "A distilled, high-level preview of the forthcoming multi-volume Canon on purpose, civilisation, governance, spiritual alignment, and human destiny.",
    excerpt:
      "Human flourishing is not accidental. It is architectural. This Prelude introduces the foundational patterns that govern purpose, identity, civilisation and destiny.",
    coverImage: "/assets/images/books/the-architecture-of-human-purpose.jpg",
    slug: "/books/the-architecture-of-human-purpose",
  };

  try {
    const mod: any = await import("@/lib/content/server");
    const getAll = mod?.getAllContentlayerDocs;

    if (typeof getAll === "function") {
      const docs = (getAll() || []).filter((d: any) => !isDraftContent(d));

      const prelude = docs.find((d: any) => {
        const fp = String(d?._raw?.sourceFilePath || "").replace(/\\/g, "/");
        const kind = String(d?.docKind || d?.type || d?.kind || "").toLowerCase();
        return (kind === "book" || fp.includes("/content/books/")) && fp.endsWith(PRELUDE_SOURCE_FILE);
      });

      if (prelude) {
        book = {
          title: String(prelude?.title || book.title),
          subtitle: (prelude?.subtitle ?? book.subtitle) as any,
          description: (prelude?.description ?? book.description) as any,
          excerpt: (prelude?.excerpt ?? prelude?.description ?? book.excerpt) as any,
          coverImage: (prelude?.coverImage ?? book.coverImage) as any,
          slug: (prelude?.slug ?? book.slug) as any,
        };
      }
    }
  } catch (err) {
    console.error("[PurposeLanding/getStaticProps] non-fatal:", err);
  }

  return {
    props: sanitizeData({ book }),
    revalidate: 3600,
  };
};

export default PurposeLandingPage;