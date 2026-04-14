import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

const AboutPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>About | Abraham of London</title>
        <meta
          name="description"
          content="Faith-rooted strategy, fatherhood architecture, and institutional thinking for serious builders."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              ABOUT · INSTITUTIONAL
            </p>

            <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] font-light italic leading-[0.95] text-white/92">
              The house.
            </h1>

            <p className="mt-5 max-w-[56ch] text-base italic leading-[1.6] text-white/48">
              Stewardship. Order. Responsibility.
            </p>

            <p className="mt-10 max-w-[65ch] text-[1.0625rem] leading-[1.8] text-white/72">
              Abraham of London is an institutional intelligence practice. We
              operate at the intersection of moral order and strategic
              execution. Our work serves principals, families, and executives
              who understand that human flourishing is architectural, not
              accidental.
            </p>

            <p className="mt-8 font-mono text-[8px] uppercase tracking-[0.2em] text-[#C9A96E]">
              Governed by purpose. Oriented to legacy.
            </p>

            <div className="mt-12">
              <Link
                href="/diagnostics"
                className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-500 transition-colors hover:underline"
              >
                Begin the diagnostic →
              </Link>
            </div>
          </div>
        </section>

        <footer className="mx-auto max-w-5xl px-6 pb-10 lg:px-12">
          <Link
            href="/"
            className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28 transition-colors hover:text-white/52"
          >
            ← Back to home
          </Link>
        </footer>
      </main>
    </>
  );
};

export default AboutPage;
