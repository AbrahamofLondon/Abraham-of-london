import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/intelligence/global-market-intelligence-q2-2026",
    permanent: false,
  },
});

export default function LegacyGmiQ2OfferRedirect() {
  return null;
}