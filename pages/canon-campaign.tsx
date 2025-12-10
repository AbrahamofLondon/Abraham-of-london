// pages/canon-campaign.tsx
import type { GetServerSideProps, NextPage } from "next";

const CanonCampaignRedirect: NextPage = () => null;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/canon/canon-campaign",
      permanent: true,
    },
  };
};

export default CanonCampaignRedirect;