import type { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async () => ({
  redirect: { destination: "/editorials", permanent: true },
});

export default function EditorialsDiscoveryRedirect() {
  return null;
}
