import React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  return (
    <Layout pageTitle="About">
      <Head>
        <meta name="description" content="About Abraham of London" />
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">About Abraham of London</h1>
        <p className="text-gray-700">
          Strategy, fatherhood, and craftsmanship—brought together for enduring impact.
        </p>

        <div className="mt-8">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-full bg-forest px-5 py-2 text-cream hover:bg-forest/90"
          >
            Contact
          </Link>
        </div>
      </section>
    </Layout>
  );
}
