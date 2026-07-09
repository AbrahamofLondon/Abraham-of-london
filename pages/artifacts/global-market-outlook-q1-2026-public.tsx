import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/intelligence/global-market-intelligence-q1-2026",
    permanent: true,
  },
});

export default function LegacyGmiQ1PublicRedirect() {
  return null;
}