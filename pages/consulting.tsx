/* Legacy route — permanent redirect to /counsel.
   The consulting page has been replaced by the governed Counsel Review room. */
import type { GetServerSideProps } from "next";

export default function Redirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const qs = ctx.resolvedUrl.split("?")[1];
  return {
    redirect: {
      destination: `/counsel${qs ? `?${qs}` : ""}`,
      permanent: true,
    },
  };
};
