// pages/downloads/index.tsx
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";

const DownloadsIndexPage: React.FC = () => {
  const title = "Downloads";
  const description =
    "Curated tools, cue cards, briefs, and print-ready resources from Abraham of London.";

  return (
    <Layout title={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={description} />
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-serif font-semibold text-deepCharcoal md:text-5xl">
            Downloads
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            A growing library of print-ready assets, cue cards, and strategy
            tools. Access direct links from blog posts and book pages while we
            roll out the full catalogue view.
          </p>
        </header>

        <section className="rounded-2xl border border-lightGrey bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-xl font-semibold text-deepCharcoal">
            How to access resources
          </h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              Open any{" "}
              <Link
                href="/"
                className="font-medium text-forest hover:underline"
              >
                blog post
              </Link>{" "}
              or{" "}
              <Link
                href="/books"
                className="font-medium text-forest hover:underline"
              >
                book page
              </Link>{" "}
              and follow the <strong>Related Resources</strong> section.
            </li>
            <li>
              Each card links to a dedicated{" "}
              <span className="font-mono text-sm">/downloads/[slug]</span> page
              with a primary download button.
            </li>
            <li>
              If you&apos;re looking for something specific,{" "}
              <Link
                href="/contact"
                className="font-medium text-forest hover:underline"
              >
                get in touch
              </Link>{" "}
              and we&apos;ll point you to the right asset.
            </li>
          </ul>
        </section>
      </main>
    </Layout>
  );
};

export default DownloadsIndexPage;