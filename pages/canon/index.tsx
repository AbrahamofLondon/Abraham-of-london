// pages/canon/index.tsx

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import * as React from "react";

import Layout from "@/components/Layout";
import { allCanons } from "contentlayer2/generated";
import type { Canon } from "contentlayer2/generated";

const sortCanon = (docs: Canon[]): Canon[] => {
  return [...docs]
    .filter((doc) => !doc.draft)
    .sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;

      const dateA = new Date(a.date ?? "1970-01-01").getTime();
      const dateB = new Date(b.date ?? "1970-01-01").getTime();
      return dateB - dateA; // newer first
    });
};

const CanonIndexPage: NextPage = () => {
  const canonDocs = sortCanon(allCanons);

  return (
    <Layout title="The Canon — Index">
      <Head>
        <title>The Canon — Abraham of London</title>
        <meta
          name="description"
          content="Index of Canon volumes, preludes, and builder documents — for fathers, founders, reformers and civilisation-carriers."
        />
      </Head>

      <div className="bg-black text-white">
        <section className="px-4 pb-12 pt-20 sm:pt-24">
          <div className="mx-auto max-w-5xl">
            <header className="mb-10 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.26em] text-softGold/80">
                THE CANON · PREVIEWS & VOLUMES
              </p>
              <h1 className="mb-4 font-serif text-3xl text-white sm:text-4xl">
                The Canon — A New Era of Builders
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
                A ten-volume architectural system for purpose, civilisation,
                governance, and destiny. This index includes public previews,
                campaign pages, catechisms, and restricted volumes for the Inner
                Circle.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2">
              {canonDocs.map((doc) => {
                const href = `/canon/${doc.slug}`;
                const isInnerCircle = doc.accessLevel === "inner-circle";

                return (
                  <article
                    key={doc.slug}
                    className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:border-softGold/60 hover:bg-white/10"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
                        {doc.volumeNumber
                          ? `VOLUME ${doc.volumeNumber}`
                          : "CANON DOCUMENT"}
                      </p>
                      {isInnerCircle && (
                        <span className="rounded-full border border-softGold/60 bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-softGold">
                          Inner Circle Only
                        </span>
                      )}
                    </div>

                    <h2 className="mb-2 font-serif text-lg text-white sm:text-xl">
                      {doc.title}
                    </h2>

                    {doc.subtitle && (
                      <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                        {doc.subtitle}
                      </p>
                    )}

                    <p className="mb-4 flex-1 text-sm leading-relaxed text-gray-300">
                      {doc.description || doc.excerpt}
                    </p>

                    {doc.tags && doc.tags.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {doc.tags.slice(0, 4).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/15 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {doc.date
                          ? new Date(doc.date).toLocaleDateString("en-GB", {
                              year: "numeric",
                              month: "short",
                              day: "2-digit",
                            })
                          : null}
                      </span>
                      {doc.readTime && (
                        <span>{doc.readTime.replace(/read/i, "").trim()} read</span>
                      )}
                    </div>

                    <div className="mt-4 flex justify-between gap-3">
                      <Link
                        href={href}
                        className="inline-flex items-center rounded-full bg-softGold px-4 py-2 text-xs font-semibold text-deepCharcoal transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-softGold/30"
                        prefetch
                      >
                        {isInnerCircle ? "View Locked Volume" : "Open Canon Page"}
                      </Link>

                      {isInnerCircle && (
                        <Link
                          href="/inner-circle"
                          className="inline-flex items-center rounded-full border border-softGold/70 px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-softGold transition-all duration-300 hover:scale-105 hover:bg-softGold/10"
                          prefetch
                        >
                          Join Inner Circle
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default CanonIndexPage;