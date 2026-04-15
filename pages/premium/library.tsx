import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  console.log("[PAGE_DATA] pages/premium/library.tsx getServerSideProps START");
  try {
  return {
    redirect: {
      destination: "/artifacts",
      permanent: false,
    },
  };

  } finally {
    console.log("[PAGE_DATA] pages/premium/library.tsx getServerSideProps END");
  }
};

export default function PremiumLibraryRedirect() {
  return null;
}