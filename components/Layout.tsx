import * as React from "react";
import Head from "next/head";

type Props = React.PropsWithChildren<{
  title?: string;
}>;

export default function Layout({ children, title }: Props): JSX.Element {
  return (
    <>
      <Head>
        <title>{title ? `${title} | Abraham of London` : "Abraham of London"}</title>
      </Head>
      <div className="min-h-screen flex flex-col">{children}</div>
    </>
  );
}