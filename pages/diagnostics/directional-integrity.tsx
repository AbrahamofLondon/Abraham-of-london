/* Orphaned route — not listed in the diagnostics ladder.
   Redirects to the canonical constitutional diagnostic entry point.
   Permanent redirect preserves any existing links/bookmarks. */
import type { GetServerSideProps } from "next";

export default function Redirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const qs = ctx.resolvedUrl.split("?")[1];
  return {
    redirect: {
      destination: `/diagnostics/constitutional-diagnostic${qs ? `?${qs}` : ""}`,
      permanent: true,
    },
  };
};
