import type { NextPage } from "next";
import Link from "next/link";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

const InnerCirclePage: NextPage = () => {
  const pageTitle = "The Inner Circle";
  const description =
    "A private cohort for fathers, founders, and reformers working with the Canon at depth.";

  return (
    <Layout title={pageTitle} description={description}>
      <main className="mx-auto max-w-2xl px-6 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-gold/80">
            Private Cohort
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold text-cream sm:text-5xl leading-tight">
            The Inner Circle is Coming
          </h1>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-gray-300 sm:text-lg">
            <p>
              The Inner Circle is a small, invitation-controlled cohort for those
              who want to work with the Canon at depth-fathers, founders,
              policymakers, and reformers who intend to build with these frameworks,
              not just read them.
            </p>

            <p>
              Volume X and other protected Canon volumes will be unlocked here
              once the cohort opens. Until then, you can position yourself by
              joining the Founding Readers Circle.
            </p>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center rounded-xl bg-gold px-8 py-4 text-sm font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Join the Founding Readers Circle
            </Link>
            <Link
              href="/canon"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-cream transition-colors hover:bg-white/10"
            >
              Explore the Canon Prelude
            </Link>
          </div>

          <p className="mt-16 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-gold/50">
            The Canon is coming. It will not arrive quietly.
          </p>
        </motion.div>
      </main>
    </Layout>
  );
};

export default InnerCirclePage;

