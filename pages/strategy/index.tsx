// pages/strategy/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";

const StrategyPage: NextPage = () => {
  return (
    <Layout
      title="Strategy Guides"
      description="Strategy, systems, and institutional design for serious builders."
    >
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Strategy · Systems
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Strategy that can survive reality
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            Structural thinking for people who have to decide where capital,
            time, and trust actually go - not just talk about it.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Guides &amp; frameworks
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Strategy documents, playbooks, and working papers will be
              surfaced here as they are published.
            </p>
            <p className="text-sm text-gray-300">
              For now, the best starting point is the{" "}
              <Link
                href="/content"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                Content Library
              </Link>{" "}
              - filter for pieces tagged{" "}
              <span className="font-semibold text-amber-300">
                strategy
              </span>{" "}
              or{" "}
              <span className="font-semibold text-amber-300">
                systems
              </span>
              .
            </p>
          </article>

          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Canon &amp; events
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Strategy is baked into the Canon and into live rooms.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-200">
              <li>
                <Link
                  href="/canon"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  Canon index
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  Strategy-linked events
                </Link>
              </li>
            </ul>
          </article>
        </section>
      </main>
    </Layout>
  );
};

export default StrategyPage;
