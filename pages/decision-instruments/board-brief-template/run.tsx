import type { GetServerSideProps } from "next";

/**
 * Redirect from legacy /board-brief-template/run to canonical /board-brief-builder/run
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/decision-instruments/board-brief-builder/run",
      permanent: true,
    },
  };
};

export default function BoardBriefTemplateRedirect() {
  return null;
}
