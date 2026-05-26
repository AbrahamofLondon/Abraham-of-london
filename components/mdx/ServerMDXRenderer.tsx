/* components/mdx/ServerMDXRenderer.tsx */
/**
 * ServerMDXRenderer — thin static wrapper for SSG pages.
 *
 * Takes pre-rendered HTML (from renderDocBodyToStaticHtml in getStaticProps)
 * and renders it via StaticMDXRenderer. SSG-safe: no useMDXComponent,
 * no mdx-bundler/client, no next-contentlayer2/hooks.
 *
 * Usage in getStaticProps:
 *   import { renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
 *   const { html: staticHtml } = renderDocBodyToStaticHtml(doc);
 *   return { props: { staticHtml } };
 *
 * Usage in component:
 *   <ServerMDXRenderer html={staticHtml} />
 */
import { StaticMDXRenderer } from "@/lib/mdx/static-mdx-runtime";

export default function ServerMDXRenderer({ html }: { html: string }) {
  return <StaticMDXRenderer html={html} />;
}
