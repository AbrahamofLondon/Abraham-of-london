// pages/newsletter.tsx
import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import NewsletterForm from "@/components/Newsletter";

export default function NewsletterPage() {
  return (
    <Layout pageTitle="Newsletter" hideCTA>
      <Head>
        <meta name="description" content="Subscribe to Abraham of London updates and essays." />
      </Head>

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <header className="mb-6 text-center">
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal">
              Join the Newsletter
            </h1>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              Essays, event invitations, and project updates. No spam — ever.
            </p>
          </header>

          <div className="flex justify-center">
            <NewsletterForm />
          </div>
        </div>
      </section>
    </Layout>
  );
}
