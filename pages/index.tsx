import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import CategoryFrontDoor from "@/components/homepage/CategoryFrontDoor";
import type { HomepageEditorialViewModel } from "@/lib/content/homepage-editorial-series";
import { getHomepageEditorialSeries } from "@/lib/content/homepage-editorial-series";

type Props = {
  editorialViewModel: HomepageEditorialViewModel;
};

const HomePage: NextPage<Props> = ({ editorialViewModel }) => {
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

      <CategoryFrontDoor editorialViewModel={editorialViewModel} />
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const editorialViewModel = getHomepageEditorialSeries();
  return { props: { editorialViewModel } };
};

export default HomePage;