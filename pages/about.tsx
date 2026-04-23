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
          content="Decision authority system for founder-led and executive teams under structural ambiguity. Contradiction detection, consequence pricing, execution enforcement, verified outcomes."
        />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <section className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pb-20 lg:pt-36">
          <div className="max-w-3xl">
            <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/38">
              ABOUT · DECISION AUTHORITY
            </p>

            <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,4rem)] font-light italic leading-[0.95] text-white/92">
              The system.
            </h1>

            <p className="mt-5 max-w-[56ch] text-base italic leading-[1.6] text-white/48">
              Contradiction. Consequence. Enforcement. Verification.
            </p>

            <p className="mt-10 max-w-[65ch] text-[1.0625rem] leading-[1.8] text-white/72">
              Abraham of London is a decision authority system for founder-led
              and executive teams under structural ambiguity. We identify
              contradictions that cannot be dismissed, price what they cost to
              ignore, sequence the interventions that resolve them, and verify
              whether action worked.
            </p>

            <p className="mt-6 max-w-[65ch] text-[1.0625rem] leading-[1.8] text-white/52">
              The system accumulates evidence across diagnostic stages, detects
              where authority says one thing and evidence shows another, and
              enforces decisions with priced consequence. Outcomes are verified,
              not assumed.
            </p>

            <p className="mt-8 font-mono text-[8px] uppercase tracking-[0.2em] text-[#C9A96E]">
              Outcome-verified decision intelligence.
            </p>

            <div className="mt-12">
              <Link
                href="/diagnostics"
                className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-500 transition-colors hover:underline"
              >
                Enter the system →
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
