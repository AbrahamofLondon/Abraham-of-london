import type { GetServerSideProps } from "next";

export default function AccessRevokeLegacyPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/admin/access-keys",
      permanent: false,
    },
  };
};
