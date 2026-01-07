// pages/founders/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";

const FoundersPage: NextPage = () => {
  return (
    <Layout
      title="Founder Tools"
      description="Strategic tools and lenses for founders who want to build with conscience and competence."
    >
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-10 space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Founders · Tools
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream">
            Building companies that can look God in the eye
          </h1>
          <p className="mx-auto max-w-2xl text-sm sm:text-base text-gray-200">
            Not hustle porn. Operating systems for founders who want to build
            ventures that can stand scrutiny - spiritual, ethical, and
            financial.
          </p>
        </header>

        <section className="space-y-8">
          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Strategy &amp; governance
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Start with the parts of the Canon and essays that frame power,
              governance, and stewardship.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm text-gray-200">
              <li>
                <Link
                  href="/canon"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  The Canon overview
                </Link>
              </li>
              <li>
                <Link
                  href="/content"
                  className="text-amber-300 underline-offset-2 hover:underline"
                >
                  Strategy &amp; governance pieces in the Content Library
                </Link>
              </li>
            </ul>
          </article>

          <article className="rounded-xl border border-gold/20 bg-night/60 p-5 shadow-sm">
            <h2 className="font-serif text-xl text-cream mb-2">
              Founder-facing rooms
            </h2>
            <p className="text-sm text-gray-200 mb-3">
              Founder Salons and closed rooms will be listed as{" "}
              <Link
                href="/events/founders-salon"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                events
              </Link>{" "}
              when live.
            </p>
            <p className="text-sm text-gray-300">
              To register interest ahead of time, use the{" "}
              <Link
                href="/contact"
                className="text-amber-300 underline-offset-2 hover:underline"
              >
                contact form
              </Link>{" "}
              or join the{" "}
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

export default FoundersPage;

