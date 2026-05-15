/* Legacy route — /strategy-room is not yet a public surface.
   Redirect to the diagnostic ladder, which is the earned entry path. */
import type { GetServerSideProps } from "next";

export default function Redirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/diagnostics",
      permanent: false,
    },
  };
};
