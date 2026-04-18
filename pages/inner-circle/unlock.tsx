import type { GetServerSideProps } from "next";

export default function LegacyUnlockPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/access/redeem",
      permanent: false,
    },
  };
};
