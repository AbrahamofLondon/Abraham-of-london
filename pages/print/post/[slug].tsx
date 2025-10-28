// pages/print/post/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useMDXComponent } from "next-contentlayer2/hooks";
import { mdxComponents } from "@/lib/mdx-components";

type Doc = { title?: string; slug: string; body?: { code: string } };

export default function PrintPost({ doc }: { doc: Doc | null }) {
  const code = doc?.body?.code ?? "";
  const Component = useMDXComponent(code || "export default () => null");

  return (
    <>
      <Head>
        <title>{doc?.title ? `${doc.title} | Print` : "Print"}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main style={{ padding: 24 }}>
        {code ? (
          // @ts-expect-error MDX types are permissive in print context
          <Component components={mdxComponents} />
        ) : (
          <p>Nothing to render.</p>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  let CL: any = {};
  try { CL = await import("contentlayer/generated"); } catch {}
  const posts: Doc[] = (CL.allPosts ?? CL.allDocuments ?? []).filter(
    (p: any) => p?.slug && p?.body?.code
  );
  const paths = posts.map((p) => ({ params: { slug: p.slug } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  let CL: any = {};
  try { CL = await import("contentlayer/generated"); } catch {}
  const pool: Doc[] = (CL.allPosts ?? CL.allDocuments ?? []).filter(Boolean);
  const doc = pool.find((d) => d.slug === slug) ?? null;

  if (!doc?.body?.code) return { notFound: true, revalidate: 60 };
  return { props: { doc }, revalidate: 60 };
};