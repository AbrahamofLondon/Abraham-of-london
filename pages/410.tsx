// pages/410.tsx
import Head from "next/head";
import Link from "next/link";

export default function Gone410() {
  return (
    <>
      <Head>
        <title>410 • Gone — Abraham of London</title>
        <meta name="robots" content="noindex" />
        <meta name="description" content="This content is no longer available." />
      </Head>

      <main className="min-h-[70vh] bg-warmWhite dark:bg-black/90">
        <section className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-2xl border border-lightGrey/70 bg-white/80 p-8 shadow-card backdrop-blur dark:border-white/15 dark:bg-white/5">
            <span className="mb-2 inline-flex items-center rounded-full border border-lightGrey/70 bg-warmWhite/70 px-3 py-1 text-xs uppercase tracking-widest text-[color:var(--color-on-secondary)/0.7] dark:border-white/20 dark:text-[color:var(--color-on-primary)/0.8]">
              410 • Gone
            </span>

            <h1 className="font-serif text-3xl font-semibold text-forest sm:text-4xl">
              This content is no longer available
            </h1>

            <p className="mt-3 text-[color:var(--color-on-secondary)/0.85] dark:text-[color:var(--color-on-primary)/0.85]">
              The page you requested has been intentionally retired or is restricted to private sessions.
              You can continue to our main site or explore active ventures.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full bg-softGold px-5 py-2 text-sm font-semibold text-deepCharcoal transition hover:brightness-95"
              >
                Go to Homepage
              </Link>
              <Link
                href="/ventures"
                className="rounded-full border border-lightGrey px-5 py-2 text-sm font-semibold text-deepCharcoal transition hover:bg-black/5 dark:border-white/20 dark:text-cream dark:hover:bg-white/10"
              >
                Explore Ventures
              </Link>
            </div>

            <p className="mt-4 text-xs text-[color:var(--color-on-secondary)/0.6] dark:text-[color:var(--color-on-primary)/0.6]">
              Abraham of London • Principled strategy, writing, and ventures.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

/**
 * If you ever want to send an actual 410 status from Next for /410,
 * switch to getServerSideProps below. (Netlify brand-host redirects
 * already return 410 for /410.html, so this is optional.)
 *
 * export const getServerSideProps: GetServerSideProps = async ({ res }) => {
 *   res.statusCode = 410;
 *   return { props: {} };
 * };
 */
