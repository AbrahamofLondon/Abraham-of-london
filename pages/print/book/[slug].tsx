// pages/print/book/[slug].tsx
import * as React from "react";
import { useMDXComponent } from "next-contentlayer2/hooks";

export async function getStaticPaths() {
  // Avoid build-time dependency on a specific collection
  return { paths: [], fallback: "blocking" };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  // Dynamically import; don't assume allBooks exists
  const CL: any = await import("contentlayer/generated").catch(() => ({}));
  const candidates =
    CL.allBooks ??
    CL.allDocuments ??
    CL.allPosts ??
    CL.allResources ??
    [];

  const doc =
    candidates.find((d: any) => d?.slug === params.slug) ??
    null;

  if (!doc) return { notFound: true };
  return { props: { doc } };
}

export default function BookPrintPage({ doc }: { doc: any }) {
  const code = doc?.body?.code ?? "";
  const MDX = useMDXComponent(code);

  return (
    <div className="print-page print-book">
      <h1>{doc?.title ?? "Untitled"}</h1>
      {doc?.summary ? <p>{doc.summary}</p> : null}
      <MDX /* if your MdxComponents map is optional, don’t import it statically */ />
    </div>
  );
}
