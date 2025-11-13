import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";

export default function EventPage(): JSX.Element {
  return <div>Event</div>;
}

export const getStaticPaths: GetStaticPaths = async () => {
  return { paths: [], fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};