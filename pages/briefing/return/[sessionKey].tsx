import type { GetServerSideProps } from "next";

/**
 * Legacy Return Brief path normaliser.
 *
 * A generated client brief page is not yet exposed as a stable public route.
 * Preserve older links without pretending that this path is a live data surface.
 */
export default function ReturnBriefLegacyRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/return-brief",
      permanent: false,
    },
  };
};
