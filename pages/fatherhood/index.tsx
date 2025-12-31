// pages/fatherhood/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";

const FatherhoodPage: NextPage = () => {
  return (
    <Layout
      title="Fatherhood Frameworks"
      description="Faith-rooted frameworks and tools for men carrying the weight of fatherhood."
    >
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Fatherhood · Frameworks
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Fatherhood without disappearing
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            A focused doorway into the Canon, essays, and tools for men who
            want to carry fatherhood with courage, clarity, and conviction -
            not sentimentality.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Start with the Canon
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              The deep work sits inside the Canon volumes and field letters.
              If you&apos;re a father under pressure, begin here.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-200">
              <li>
                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  The Architecture of Human Purpose · Prelude
                </Link>
              </li>
              <li>
                <Link
                  href="/canon/volume-i-foundations-of-purpose"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  Volume I - Foundations of Purpose
                </Link>
              </li>
              <li>
                <Link
                  href="/when-the-storm-finds-you"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  When the Storm Finds You
                </Link>{" "}
                (field letter on delay, loss, and staying present as a father)
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Essays &amp; field notes
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Shorter, high-protein pieces on fatherhood, legacy, and raising
              sons who can stand in the open.
            </p>
            <p className="text-sm text-gray-300">
              Browse the{" "}
              <Link
                href="/content"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Content Library
              </Link>{" "}
              and look for pieces tagged with{" "}
              <span className="font-semibold text-amber-300">
                fatherhood
              </span>
              ,{" "}
              <span className="font-semibold text-amber-300">
                family
              </span>
              , or{" "}
              <span className="font-semibold text-amber-300">
                legacy
              </span>
              .
            </p>
          </article>

          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Rooms &amp; cohorts
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              From time to time there will be closed rooms specifically for
              fathers - part workshop, part confessional, part strategy lab.
            </p>
            <p className="text-sm text-gray-300">
              When those open, they&apos;ll be listed on the{" "}
              <Link
                href="/events"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Events
              </Link>{" "}
              page and through the{" "}
              <Link
                href="/newsletter"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                newsletter
              </Link>
              .
            </p>
          </article>
        </section>
      </main>
    </Layout>
  );
};

export default FatherhoodPage;
