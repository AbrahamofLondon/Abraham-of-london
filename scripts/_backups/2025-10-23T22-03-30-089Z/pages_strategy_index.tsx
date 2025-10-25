import * as React from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";
// <-- FIXED
import Link from "next/link";

type Props = { strategies: Strategy[] };

export default function StrategyIndex({ strategies }: Props) {
  return (
    <>
      <Head d>
        <title>Strategies—Abraham of London</title>
      </Head>
      <main className="prose lg:prose-lg mx-auto px-4 py-10">
        <h1>Strategies</h1>
        <ul>
          {strategies.map((s) => (
            <li key={s._id}>
              <Link href={`/strategy/${s.slug}`}>{s.title}</Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const strategies = [...allStrategies].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  );
  return { props: { strategies } };
};
