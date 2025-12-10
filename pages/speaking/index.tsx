// pages/speaking/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Layout from "@/components/Layout";

const SpeakingPage: NextPage = () => {
  return (
    <Layout title="Speaking">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Platforms · Speaking
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Speaking & Rooms
          </h1>
          <p className="mt-2 text-sm text-gray-200">
            This route is reserved for keynotes, workshops, and private
            rooms. The live booking experience is being wired into the new
            Canon architecture.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-gray-200">
          <p>
            If you&apos;re looking to invite Abraham for a keynote,
            leadership intensive, or closed-room strategy day, use the{" "}
            <span className="font-semibold text-gold">Enquire</span> button
            in the header or visit the{" "}
            <a
              href="/consulting"
              className="underline decoration-gold/60 underline-offset-4 hover:text-gold"
            >
              consulting page
            </a>
            .
          </p>
        </section>
      </main>
    </Layout>
  );
};

export default SpeakingPage;