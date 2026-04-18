/* Legacy parallel route — canonical strategy room is at /strategy-room.
   Permanent redirect consolidates the two entry points. */
import type { GetServerSideProps } from "next";

export default function Redirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const qs = ctx.resolvedUrl.split("?")[1];
  return {
    redirect: {
      destination: `/strategy-room${qs ? `?${qs}` : ""}`,
      permanent: true,
    },
  };
};
