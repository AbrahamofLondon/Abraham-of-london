// pages/speaking/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";

const SpeakingPage: NextPage = () => {
  return (
    <Layout
      title="Speaking"
      description="Keynotes, salons, and closed-room sessions for leaders who want depth, not theatrics."
    >
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="space-y-4 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
            Speaking · Rooms
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl text-cream">
            Speaking &amp; Chatham rooms
          </h1>
          <p className="text-sm sm:text-base text-gray-200">
            I don&apos;t do motivational noise. I work with leaders, boards, and
            founders who want to think in systems, history, and Scripture — and
            who are willing to be challenged.
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-sm text-gray-200">
            Speaking formats include:
          </p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-gray-200">
            <li>Keynotes for leadership away days and retreats</li>
            <li>Founder and boardroom salons (Chatham House rules)</li>
            <li>Closed small-room intensives for fathers and leaders</li>
          </ul>
          <p className="mt-4 text-sm text-gray-300">
            To discuss a room, email{" "}
            <a
              href="mailto:info@abrahamoflondon.org"
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              info@abrahamoflondon.org
            </a>{" "}
            or use the{" "}
            <Link
              href="/contact"
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              contact form
            </Link>
            .
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default SpeakingPage;