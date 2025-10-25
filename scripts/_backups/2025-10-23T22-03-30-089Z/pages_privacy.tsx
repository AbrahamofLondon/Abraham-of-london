import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.URL ??
  process.env.DEPLOY_PRIME_URL ??
  "https://abrahamoflondon.org";
const originNoSlash = ORIGIN.replace(/\/$/, "");
const CANONICAL = `${originNoSlash}/privacy`;

export default function PrivacyPolicy() {
  return (
    <Layout pageTitle="Privacy Policy">
      <Head d>
        <title>Privacy Policy | Abraham of London</title>
        <meta
          name="description"
          content="How Abraham of London collects, uses, and protects your data."
        />
        <link rel="canonical" href={CANONICAL} />
        <meta
          property="og:title"
          content="Privacy Policy | Abraham of London"
        />
        <meta
          property="og:description"
          content="How we collect, use, and protect your data."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={CANONICAL} />
        <meta name="robots" content="index, follow" />
      </Head>
      <section className="mx-auto max-w-3xl rounded-lg bg-white px-6 py-12 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Privacy Policy
        </h1>
        <p className="mb-8 text-sm text-gray-600/90">
          Last updated: August 16, 2025
        </p>
        <div className="prose prose-neutral max-w-none text-gray-800">
          <p>
            At Abraham of London, we are committed to protecting your privacy.
            This policy explains how we collect, use, disclose, and safeguard
            your information when you visit our website or interact with our
            services.
          </p>
          <h2>Information We Collect</h2>
          <p>
            We may collect personal information such as your name, email
            address, and message content when you submit a contact form or
            subscribe to our newsletter. We also collect non-personal
            information (e.g., browser type, IP address) for analytics.
          </p>
          <h2>How We Use Your Information</h2>
          <p>
            We use your information to respond to inquiries, send updates, and
            improve our services. We do not sell or rent your personal data to
            third parties.
          </p>
          <h2>Data Security</h2>
          <p>
            We implement reasonable security measures to protect your data, but
            no online transmission is fully secure.
          </p>
          <h2>Your Rights</h2>
          <p>
            You may request access, correction, or deletion of your personal
            data by contacting us at{" "}
            <a
              href="mailto:info@abrahamoflondon.org"
              className="underline decoration-forest/40 hover:decoration-forest"
            >
              info@abrahamoflondon.org
            </a>
            .
          </p>
          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted here.
          </p>
          <p>
            See also our{" "}
            <Link
              href="/terms"
              className="text-forest underline decoration-forest/40 hover:decoration-forest"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex items-center rounded-full px-4 py-2 text-forest underline decoration-forest/40 hover:decoration-forest"
          >
            Back to homepage
          </Link>
        </div>
      </section>
    </Layout>
  );
}
