import * as React from "react";

type StrategyDoc = { title?: string; summary?: string; body?: { code?: string } };
interface Props { doc: StrategyDoc | null }

export default function StrategyPrintPage({ doc }: Props){
  return (
    <div className="print-page">
      <h1>{doc?.title ?? "Strategy (print view)"}</h1>
      <p>{doc?.summary ?? "Content will be restored later."}</p>
    </div>
  );
}

// Required for dynamic SSG route
export async function getStaticPaths(){
  return { paths: [], fallback: false };
}

// Simple props so the page renders
export async function getStaticProps(){
  return { props: { doc: null } };
}