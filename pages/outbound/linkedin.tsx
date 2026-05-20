import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/admin/outbound/linkedin",
    permanent: false,
  },
});

export default function LegacyLinkedInOutboundRedirect() {
  return null;
}
