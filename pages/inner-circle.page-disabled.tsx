// pages/inner-circle.tsx

import type { NextPage } from "next";
import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";

const InnerCirclePage: NextPage = () => {
  const pageTitle = "Inner Circle | The Canon | Abraham of London";
  const description =
    "The Inner Circle is a private cohort that will receive full access to the Canon’s master volumes, including Volume X — The Arc of Future Civilisation.";

  return (
    <SiteLayout pageTitle={pageTitle} metaDescription={description}>
      <div className="mx-auto max-w-2xl py-16 text-gray-100">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
          Inner Circle
        </p>

        <h1 className="mt-3 font-serif text-3xl font-semibold text-gray-50 sm:text-4xl">
          The Inner Circle is Coming
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">
          The Inner Circle is a small, invitation-controlled cohort for those
          who want to work with the Canon at depth — fathers, founders,
          policymakers, and reformers who intend to build with these
          frameworks, not just read them.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-gray-300 sm:text-base">
          Volume X and other inner-circle Canon volumes will be unlocked here
          once the cohort opens. Until then, you can position yourself by
          joining the Founding Readers Circle and staying on the core list.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center rounded-full bg-softGold px-8 py-3 text-sm font-semibold text-deepCharcoal shadow-2xl shadow-softGold/30 transition-transform duration-300 hover:scale-[1.03] hover:shadow-softGold/40"
          >
            Join the Founding Readers Circle
          </Link>
          <Link
            href="/canon"
            className="inline-flex items-center justify-center rounded-full border border-softGold/70 bg-transparent px-8 py-3 text-sm font-semibold text-softGold transition-all duration-300 hover:bg-softGold/10 hover:scale-[1.02]"
          >
            Explore the Canon Prelude
          </Link>
        </div>

        <p className="mt-8 text-[0.75rem] uppercase tracking-[0.24em] text-softGold/70">
          The Canon is coming. It will not arrive quietly.
        </p>
      </div>
    </SiteLayout>
  );
};

export default InnerCirclePage;