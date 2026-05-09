import type { NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import CategoryFrontDoor from "@/components/homepage/CategoryFrontDoor";

const HomePage: NextPage = () => {
  return (
    <Layout
      title="Abraham of London"
      description="Decision Infrastructure by Abraham of London. The decision system that can refuse to proceed, retain the record, and govern what happens next."
      canonicalUrl="/"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/assets/images/social/og-image.jpg" />
      </Head>

      <CategoryFrontDoor />
    </Layout>
  );
};

export default HomePage;
