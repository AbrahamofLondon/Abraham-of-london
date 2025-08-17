import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <Head>
        <title>Page Not Found | Abraham of London</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main
        className="container px-4 py-20 text-center"
        role="main"
        aria-labelledby="notfound-title"
      >
        <h1
          id="notfound-title"
          className="font-serif text-4xl text-forest mb-3"
        >
          Page Not Found
        </h1>

        <p className="text-deepCharcoal/80 mb-8">
          Sorry, the page you&rsquo;re looking for doesn&rsquo;t exist.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-forest text-cream px-5 py-2 rounded-md hover:bg-softGold hover:text-forest transition"
            aria-label="Go back home"
          >
            &larr; Go back home
          </Link>

          <a
            href="mailto:info@abrahamoflondon.org?subject=Broken%20link%20report"
            className="text-forest underline underline-offset-4 hover:text-softGold"
          >
            Report a broken link
          </a>
        </div>
      </main>
    </Layout>
  );
}











