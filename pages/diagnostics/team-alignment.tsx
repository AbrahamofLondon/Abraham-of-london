/* Stale route — superseded by /diagnostics/team-assessment.
   Permanent redirect preserves any existing links/bookmarks. */
import type { GetServerSideProps } from "next";

export default function Redirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const qs = ctx.resolvedUrl.split("?")[1];
  return {
    redirect: {
      destination: `/diagnostics/team-assessment${qs ? `?${qs}` : ""}`,
      permanent: true,
    },
  };
};
