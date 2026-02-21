import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const IntelligenceBriefsClient = dynamic(
  () => import("@/components/inner-circle/IntelligenceBriefsClient"),
  { ssr: false, loading: () => <LoadingSpinner size="lg" message="Decrypting Portal..." /> }
);

const IntelligenceBriefsPage: NextPage = () => {
  return (
    <ErrorBoundary>
      <Layout title="Briefing Room">
        <Head>
          <title>Intelligence Portfolio</title>
          <meta name="robots" content="noindex,nofollow" />
        </Head>

        {/* ✅ client-only: no NextAuth hook runs during prerender */}
        <IntelligenceBriefsClient />
      </Layout>
    </ErrorBoundary>
  );
};

export default IntelligenceBriefsPage;