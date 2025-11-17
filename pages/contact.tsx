// pages/contact.tsx
import * as React from "react";
import Head from "next/head";
import Layout from "@/components/Layout";

const ContactPage = (): JSX.Element => {
  const pageTitle = "Contact";

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        <meta
          name="description"
          content="Contact Abraham of London for speaking, advisory, or collaboration enquiries."
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-12 lg:py-16">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.28em] text-softGold/80">
            Get in touch
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            Contact Abraham of London
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.8]">
            For speaking invitations, strategic advisory, media enquiries, or
            collaboration opportunities, please use the form below. A response
            will be prioritised based on clarity of brief and strategic fit.
          </p>
        </header>

        <section className="rounded-2xl border border-lightGrey bg-white p-6 shadow-card sm:p-8">
          <form
            method="post"
            action="/api/contact"
            className="space-y-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-lightGrey bg-warmWhite/40 px-3 py-2 text-sm text-deepCharcoal outline-none ring-0 transition focus:border-softGold/80 focus:bg-white focus:ring-1 focus:ring-softGold/70"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wide text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-lightGrey bg-warmWhite/40 px-3 py-2 text-sm text-deepCharcoal outline-none ring-0 transition focus:border-softGold/80 focus:bg-white focus:ring-1 focus:ring-softGold/70"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-700"
              >
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-lightGrey bg-warmWhite/40 px-3 py-2 text-sm text-deepCharcoal outline-none ring-0 transition focus:border-softGold/80 focus:bg-white focus:ring-1 focus:ring-softGold/70"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-xs font-semibold uppercase tracking-wide text-gray-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                required
                className="mt-1 w-full rounded-lg border border-lightGrey bg-warmWhite/40 px-3 py-2 text-sm leading-relaxed text-deepCharcoal outline-none ring-0 transition focus:border-softGold/80 focus:bg-white focus:ring-1 focus:ring-softGold/70"
              />
              <p className="mt-1 text-[0.75rem] text-gray-500">
                Be specific: context, objectives, timelines, and decision-makers
                involved. Precision accelerates progress.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="text-[0.75rem] text-gray-500">
                You can also email directly:{" "}
                <a
                  href="mailto:info@abrahamoflondon.org"
                  className="font-semibold text-forest underline-offset-2 hover:underline"
                >
                  info@abrahamoflondon.org
                </a>
              </p>

              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-forest px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-cream shadow-sm transition hover:bg-[color:var(--color-primary)/0.9]"
              >
                Submit enquiry
              </button>
            </div>
          </form>
        </section>
      </main>
    </Layout>
  );
};

export default ContactPage;