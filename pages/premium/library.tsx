import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/artifacts",
      permanent: false,
    },
  };
};

export default function PremiumLibraryRedirect() {
  return null;
}