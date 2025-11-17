// pages/contact.tsx

import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SocialFollowStrip from "@/components/SocialFollowStrip";
import { siteConfig, getPageTitle } from "@/lib/siteConfig";

const ContactPage: NextPage = () => {
  const pageTitle = getPageTitle("Contact");
  const email = siteConfig.email || "info@abrahamoflondon.org";
  const phone = siteConfig.phone || "+44 0000 000000";

  return (
    <Layout title={pageTitle} description="Contact Abraham of London for speaking, advisory, or collaboration enquiries.">
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content="Contact Abraham of London for strategic advisory, speaking, collaborations and media enquiries."
        />
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        {/* Page header */}
        <header className="mb-8 md:mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Contact
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-deepCharcoal md:text-4xl">
            Let’s talk about the work that matters.
          </h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-gray-700">
            For advisory, speaking, collaborations or media enquiries, use the form
            below or reach out directly via email or phone. A considered response
            beats a rushed one – but you will be answered.
          </p>
        </header>

        {/* Contact details */}
        <section
          aria-labelledby="contact-details-heading"
          className="mb-10 grid gap-8 md:grid-cols-[1.2fr_1fr]"
        >
          {/* Form */}
          <div>
            <h2
              id="contact-details-heading"
              className="mb-4 font-serif text-xl font-semibold text-deepCharcoal"
            >
              Send a message
            </h2>
            {/* 
              NOTE: No JS handler here – this is intentionally generic.
              You can wire this to Formspree, a serverless function, or a CRM later.
            */}
            <form
              className="space-y-4 rounded-2xl border border-lightGrey bg-white p-6 shadow-sm"
              method="post"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="mt-1 block w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal shadow-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal shadow-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-700"
                >
                  Topic (optional)
                </label>
                <input
                  id="topic"
                  name="topic"
                  type="text"
                  placeholder="Speaking, advisory, collaboration, media…"
                  className="mt-1 block w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal shadow-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="mt-1 block w-full rounded-lg border border-lightGrey bg-white px-3 py-2 text-sm text-deepCharcoal shadow-sm focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>

              <p className="text-xs text-gray-500">
                By submitting, you agree that your message may be stored for the
                purposes of following up on your enquiry.
              </p>

              <button
                type="submit"
                className="inline-flex items-center rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-forest/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest"
              >
                Send message
              </button>
            </form>
          </div>

          {/* Direct contact block */}
          <aside className="space-y-6 rounded-2xl border border-lightGrey bg-warmWhite/60 p-6">
            <h2 className="font-serif text-lg font-semibold text-deepCharcoal">
              Direct contact
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Email:</span>{" "}
                <a
                  href={`mailto:${email}`}
                  className="text-forest underline-offset-4 hover:underline"
                >
                  {email}
                </a>
              </p>
              {phone && (
                <p>
                  <span className="font-medium">Phone:</span>{" "}
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="text-forest underline-offset-4 hover:underline"
                  >
                    {phone}
                  </a>
                </p>
              )}
            </div>

            <div className="border-t border-lightGrey pt-4 text-sm text-gray-700">
              <p className="mb-2 font-medium text-deepCharcoal">
                Typical enquiries:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Strategic advisory & board-level conversations</li>
                <li>Speaking & teaching on faith, strategy, and legacy</li>
                <li>Partnerships around Africa-focused ventures</li>
                <li>Media, interviews, and thought-leadership features</li>
              </ul>
            </div>

            <div className="border-t border-lightGrey pt-4 text-xs text-gray-500">
              <p>
                For time-sensitive matters, email is prioritised. If you have a
                formal brief or RFP, feel free to include it as an attachment via
                email for structured review.
              </p>
            </div>
          </aside>
        </section>

        {/* Social follow strip for consistency */}
        <SocialFollowStrip variant="light" className="mt-4" />

        {/* Back links */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/"
            className="text-forest underline-offset-4 hover:underline"
          >
            ← Back to home
          </Link>
          <Link
            href="/ventures"
            className="text-forest underline-offset-4 hover:underline"
          >
            Explore ventures
          </Link>
        </div>
      </main>
    </Layout>
  );
};

export default ContactPage;