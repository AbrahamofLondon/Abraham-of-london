// pages/about.tsx
import Head from "next/head";
import Image from "next/image";
import Layout from "@/components/Layout";

export default function About() {
  return (
    <Layout pageTitle="About">
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-start">
          <div>
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">About Abraham of London</h1>
            <p className="mb-4 text-gray-700">
              I’m Abraham — strategist, writer, and builder. My work sits at the intersection of principled
              strategy, fatherhood & legacy, and craft. I help leaders build with clarity, discipline,
              and standards that endure.
            </p>
            <p className="mb-4 text-gray-700">
              Here you’ll find essays, books, and ventures focused on stewardship, family,
              and high standards in leadership.
            </p>
            <p className="text-gray-700">
              For speaking, partnerships, or consulting, visit the{" "}
              <a href="/contact" className="text-forest underline underline-offset-2">contact page</a>.
            </p>
          </div>

          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham of London Portrait"
              width={640}
              height={800}
              className="h-auto w-full object-cover"
              priority={false}
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}
