// pages/brands/index.tsx
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

export default function BrandsIndex() {
  return (
    <Layout title="Brands">
      <Head>
        <title>Brands | Abraham of London</title>
        <meta
          name="description"
          content="Strategic brands and movements under the Abraham of London umbrella."
        />
      </Head>

      <div className="min-h-screen bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="mb-6 font-serif text-4xl font-semibold text-softGold">
            Brands & Movements
          </h1>
          <p className="mb-8 text-xl text-slate-300">
            Expressions of a single conviction: men who lead, love, and build
            with fear of God and respect for legacy.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="mb-4 font-serif text-2xl font-semibold text-white">
                Fathering Without Fear
              </h3>
              <p className="mb-4 text-slate-300">
                A movement for men committed to intentional fatherhood,
                courageous love, and multi-generational legacy.
              </p>
              <Link
                href="/brands/fathering-without-fear"
                className="inline-flex items-center text-softGold hover:text-softGold/80"
              >
                Learn more →
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="mb-4 font-serif text-2xl font-semibold text-white">
                Brotherhood Covenant
              </h3>
              <p className="mb-4 text-slate-300">
                Structured circles of men committed to sharpening, accountability,
                and honour – not just casual friendship.
              </p>
              <Link
                href="/brands/brotherhood-covenant"
                className="inline-flex items-center text-forest hover:text-forest/80"
              >
                Explore →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}