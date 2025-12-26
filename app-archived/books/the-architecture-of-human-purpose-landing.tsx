import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

// Import Layout without type issues
const Layout = React.lazy(() => import("@/components/Layout"));

const PurposeLandingPage: NextPage = () => {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

  const canonicalUrl = `${SITE_URL}/books/the-architecture-of-human-purpose-landing`;

  return (
    <>
      <Head>
        <title>
          The Architecture of Human Purpose — Prelude Minibook | Abraham of
          London
        </title>
        <meta
          name="description"
          content="A limited-release Prelude Minibook introducing the Canon on purpose, civilisation, governance, spiritual alignment, and human destiny."
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta
          property="og:title"
          content="The Architecture of Human Purpose — Prelude Minibook"
        />
        <meta
          property="og:description"
          content="Human flourishing is not accidental. It is architectural. This Prelude sketches the scaffolding behind purpose, civilisation, and destiny."
        />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content={`${SITE_URL}/assets/images/books/the-architecture-of-human-purpose.jpg`}
        />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* Hero */}
        <section className="border-b border-white/10">
          <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16 pt-16 md:flex-row md:items-center md:pb-20">
            {/* Left copy */}
            <div className="flex-1 space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-softGold/80">
                Canon Prelude · Limited Release
              </p>

              <h1 className="font-serif text-3xl font-semibold sm:text-4xl md:text-5xl">
                The Architecture of{" "}
                <span className="block text-softGold">Human Purpose</span>
              </h1>

              <p className="max-w-xl text-sm leading-relaxed text-gray-200 sm:text-base">
                This Prelude Minibook is a distilled, high-level preview of a
                larger Canon on{" "}
                <span className="font-medium text-softGold">
                  purpose, civilisation, governance, spiritual alignment, and
                  human destiny
                </span>
                . It doesn't give you motivational slogans — it sketches the
                actual scaffolding reality runs on.
              </p>

              <p className="max-w-xl text-sm leading-relaxed text-gray-300">
                If you have ever sensed that your life, your work, and your
                family are meant to plug into something larger than private
                ambition, this is where the map begins to sharpen.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="inline-flex items-center gap-2 rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:bg-softGold/90 hover:shadow-xl hover:shadow-softGold/40 hover:-translate-y-0.5"
                >
                  <span>📖</span>
                  Read the Prelude Minibook
                </Link>

                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-full border border-softGold/60 bg-transparent px-8 py-3 text-sm font-semibold text-softGold transition-all hover:bg-softGold/10 hover:-translate-y-0.5"
                >
                  <span>⚡</span>
                  Join the Canon Inner Circle
                </Link>
              </div>

              <p className="pt-3 text-[0.8rem] text-gray-400">
                This is **Volume 0** thinking: setting the frame so every
                decision, project, and covenant sits inside a coherent
                architecture — not vague "purpose talk".
              </p>
            </div>

            {/* Right: Book cover */}
            <div className="flex w-full justify-center md:w-auto">
              <div className="relative group">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-softGold/25 via-softGold/5 to-transparent blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
                <div className="relative rounded-3xl border border-softGold/30 bg-black/60 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
                  <Image
                    src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                    alt="The Architecture of Human Purpose — Prelude Minibook"
                    width={360}
                    height={520}
                    className="h-auto w-[220px] rounded-2xl border border-softGold/40 shadow-2xl sm:w-[260px]"
                    priority
                  />
                  <div className="mt-4 text-center text-xs text-gray-300">
                    Prelude Minibook · Canon Shelf
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Middle section – what's inside */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-cream">
                Human Flourishing is Architectural, Not Accidental
              </h2>
              <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
                This Prelude doesn't give you every pillar in detail — it hands
                you the **blueprint skeleton**. You'll see how{" "}
                <span className="text-softGold">
                  identity, authority, covenant, time, and legacy
                </span>{" "}
                all lock together so that a life, a family, a business, and a
                nation can either align or fragment.
              </p>
              <p className="text-sm leading-relaxed text-gray-300">
                The goal is simple: when you look at history, scripture, news,
                or your own household, you begin to recognise the same
                underlying architecture — and you stop living as if it's all
                random.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_14px_40px_rgba(0,0,0,0.85)]">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
                Inside the Prelude
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-200">
                <li>
                  • Why **purpose** cannot be defined in isolation from
                  civilisation and covenant.
                </li>
                <li>
                  • The difference between **calling**, **assignment**, and
                  **occupation**.
                </li>
                <li>
                  • How **time, authority, and responsibility** shape destiny
                  more than raw talent.
                </li>
                <li>
                  • Why fatherhood and stewardship sit at the **load-bearing
                  walls** of any culture.
                </li>
              </ul>
              <p className="mt-4 text-[0.8rem] text-gray-400">
                It's written for fathers, founders, and stewards who don't want
                vibes — they want a coherent mental model for building in a
                collapsing world.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-white/10 bg-gradient-to-r from-forest/90 via-forest to-forest/90 py-14">
          <div className="mx-auto max-w-4xl px-4 text-center text-cream">
            <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
              Ready to Read the Prelude?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/90 sm:text-base">
              Start with this limited-release Prelude, then track the Canon as
              new volumes are released. This is where **Fathering Without Fear**{" "}
              and the broader Abraham of London Canon quietly intersect.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-deepCharcoal shadow-lg transition-all hover:bg-slate-100 hover:-translate-y-0.5"
              >
                <span>📖</span>
                Read the Prelude Minibook
              </Link>
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-transparent px-8 py-3 text-sm font-semibold text-cream transition-all hover:bg-white/10 hover:-translate-y-0.5"
              >
                <span>⬇️</span>
                Explore Strategic Downloads
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default PurposeLandingPage;