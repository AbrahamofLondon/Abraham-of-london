// pages/leadership/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";

const LeadershipPage: NextPage = () => {
  return (
    <Layout
      title="Leadership Resources"
      description="Leadership frameworks for men who steward people, capital, and institutions."
    >
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Leadership · Governance
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Leadership that survives headlines
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            For men holding responsibility in boardrooms, congregations, or
            communities - this is where you enter the leadership stream of the
            Canon.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Canon anchors
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Begin with the volumes and essays that frame authority,
              stewardship, and institutional design.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-200">
              <li>
                <Link
                  href="/canon"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  The Canon index
                </Link>
              </li>
              <li>
                <Link
                  href="/content"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  Leadership-tagged content in the Library
                </Link>
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Workshops &amp; rooms
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Leadership Workshops and Chatham rooms will be surfaced on the{" "}
              <Link
                href="/events"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Events
              </Link>{" "}
              page - starting with the{" "}
              <Link
                href="/events/leadership-workshop"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Leadership Workshop
              </Link>
              .
            </p>
          </article>
        </section>
      </main>
    </Layout>
  );
};

export default LeadershipPage;

