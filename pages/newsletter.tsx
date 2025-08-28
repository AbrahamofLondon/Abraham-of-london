// pages/newsletter.tsx
import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Layout from "@/components/Layout";

// Load the form client-side only to avoid SSR/promises issues
const NewsletterForm = dynamic(() => import("@/components/NewsletterForm"), { ssr: false });

export default function NewsletterPage() {
  return (
    <Layout pageTitle="Newsletter" hideCTA>
      <Head>
        <meta name="description" content="Subscribe to Abraham of London updates and essays." />
        {/* No manual font preloads; let Next handle fonts to avoid 'preload not used' warnings */}
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <header className="mb-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">Join the Newsletter</h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              Essays, event invitations, and project updates. No spam — ever.
            </p>
          </header>

          {/* Client-only form */}
          <NewsletterForm />
        </div>
      </section>
    </Layout>
  );
}
