// pages/404.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

const NotFoundPage: React.FC = () => {
  const router = useRouter();
  const attemptedPath = router?.asPath || "/";

  const title = "Page Not Found | Abraham of London";
  const description =
    "This page could not be found. Use the links below to return to a live, curated part of the Abraham of London experience.";

  return (
    <Layout title="404 – Not Found">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="flex min-h-[80vh] items-center justify-center bg-gradient-to-b from-black via-deepCharcoal to-black px-4">
        <section className="mx-auto w-full max-w-3xl rounded-3xl border border-softGold/30 bg-white/5 p-8 text-center shadow-2xl shadow-black/60 backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-softGold">
            Abraham of London
          </p>

          <h1 className="mb-3 font-serif text-4xl font-semibold text-white md:text-5xl">
            404
            <span className="block text-lg font-sans uppercase tracking-[0.25em] text-softGold/90">
              This page could not be found.
            </span>
          </h1>

          <p className="mx-auto mb-4 max-w-xl text-sm text-gray-200 md:text-base">
            Either the URL is wrong, the content has been retired, or this route
            simply hasn&apos;t been brought into the live experience yet.
          </p>

          <div className="mx-auto mb-6 max-w-xl rounded-2xl bg-black/50 px-4 py-3 text-xs text-left text-gray-300">
            <p className="mb-1 font-semibold text-gray-200">Attempted path</p>
            <code className="block overflow-x-auto whitespace-nowrap rounded-md bg-black/70 px-3 py-2 text-[11px] text-softGold">
              {attemptedPath}
            </code>
            <p className="mt-2 text-[11px] text-gray-400">
              If this URL should exist, note it down – it helps when we&apos;re tightening
              routes or migrating content.
            </p>
          </div>

          {/* Recovery links */}
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-softGold px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-deepCharcoal shadow-md shadow-softGold/40 hover:bg-softGold/90"
            >
              Go to Home
            </Link>
            <Link
              href="/downloads"
              className="inline-flex items-center rounded-full border border-softGold/50 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-softGold hover:bg-softGold/10"
            >
              View Downloads
            </Link>
            <Link
              href="/strategy/sample-strategy"
              className="inline-flex items-center rounded-full border border-white/30 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/5"
            >
              Strategy Sample
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-white/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/5"
            >
              Contact Abraham
            </Link>
          </div>

          <p className="text-[11px] uppercase tracking-[0.3em] text-gray-500">
            Something always happens | Fathering Without Fear
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default NotFoundPage;