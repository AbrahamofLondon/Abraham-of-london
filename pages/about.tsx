// pages/about.tsx
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function AboutPage() {
  const title = "About | Abraham of London";
  const desc =
    "About Abraham of London — strategist, writer, and builder focused on principled strategy, fatherhood, and craftsmanship.";

  return (
    <Layout pageTitle="About">
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href="https://abrahamoflondon.org/about" />
      </Head>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">About</h1>
        <p className="text-lg text-gray-700 mb-6">
          I’m Abraham of London — strategist, writer, and builder. My work sits
          at the intersection of principled strategy, fatherhood &amp; legacy,
          and craft.
        </p>
        <p className="text-gray-700">
          Want to collaborate or speak?{" "}
          <Link
            href="/contact"
            className="text-forest underline decoration-forest/40 underline-offset-2 hover:decoration-forest"
          >
            Get in touch
          </Link>
          .
        </p>
      </section>
    </Layout>
  );
}
