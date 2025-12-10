// pages/canon-campaign/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";

const CanonCampaignPage: NextPage = () => {
  return (
    <Layout
      title="Canon Campaign"
      description="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders."
    >
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-8 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Canon · Campaign
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-cream">
            The Canon Campaign
          </h1>
          <p className="text-sm sm:text-base text-gray-200">
            The Canon is a multi-volume, multi-format project — books, essays,
            tools, events — built for men who have to carry real responsibility
            over time. The campaign is the long march to build, test, and
            deploy it.
          </p>
        </header>

        <section className="space-y-4 text-sm text-gray-200">
          <p>
            Right now the Canon lives in three main expressions:
          </p>
          <ul className="list-disc space-y-2 pl-5">
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
                href="/canon"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Canon library
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Live rooms &amp; workshops
              </Link>
            </li>
          </ul>

          <p className="mt-4">
            As the Canon expands, this page will track new volumes, campaigns,
            and ways to engage — from leadership cohorts to fatherhood tracks.
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default CanonCampaignPage;