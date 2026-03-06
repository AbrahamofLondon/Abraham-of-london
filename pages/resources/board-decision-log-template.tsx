import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/downloads/board-decision-log-template", permanent: true },
});

export default function Redirect() {
  return null;
}