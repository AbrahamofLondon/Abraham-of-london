import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/editorials", permanent: true },
});

export default function EditorialsDiscoveryRedirect() {
  return null;
}
