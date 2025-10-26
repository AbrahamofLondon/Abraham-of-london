import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";

export async function getStaticPaths() {
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const CL: any = await import("contentlayer/generated").catch(() => ({}));
  const candidates =
    CL.allEvents ??
    CL.allDocuments ??
    CL.allPosts ??
    CL.allResources ??
    [];

  const doc =
    candidates.find((d: any) => d?.slug === params.slug) ?? null;

  if (!doc) return { notFound: true };
  return { props: { doc } };
}

export default function EventPrintPage({ doc }: { doc: any }) {
  const code = doc?.body?.code ?? "";
  const MDX = useMDXComponent(code);
  return (
    <div className="print-page print-event">
      <h1>{doc?.title ?? "Untitled"}</h1>
      <MDX />
    </div>
  );
}
