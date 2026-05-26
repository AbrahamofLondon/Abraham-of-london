# MDX Rendering Boundary

> Status: enforced  
> Last updated: 2026-05-26

## Rule

Every route that runs through `getStaticProps` or SSG (static site generation) **must not** import
`SafeMDXRenderer`, `ClientOnlyMDXRenderer`, or `ServerMDXRenderer` (old API).

SSG pages render at build time. If a page imports an MDX renderer that depends on
`useMDXComponent`, `getMDXComponent`, or `mdx-bundler/client` — even via a transitive dynamic
import — the build fails with an "HTML import outside document" or prerender error.

## The Two Zones

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SSG / getStaticProps  (build time, Node.js)                            │
│                                                                          │
│  ✅ StaticMDXRenderer          lib/mdx/static-mdx-runtime.tsx           │
│  ✅ renderDocBodyToStaticHtml  lib/mdx/static-mdx-runtime.tsx           │
│                                                                          │
│  ❌ ClientOnlyMDXRenderer      components/mdx/ClientOnlyMDXRenderer.tsx │
│  ❌ SafeMDXRenderer (shim)     components/mdx/SafeMDXRenderer.tsx       │
│  ❌ ServerMDXRenderer (old)    components/mdx/ServerMDXRenderer.tsx     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  Client runtime  ("use client" components, browser)                     │
│                                                                          │
│  ✅ ClientOnlyMDXRenderer      components/mdx/ClientOnlyMDXRenderer.tsx │
│  ✅ SafeMDXRenderer (shim)     → re-exports ClientOnlyMDXRenderer       │
│                                                                          │
│  ❌ StaticMDXRenderer not needed here (but harmless)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Canonical Pattern for SSG Pages

```tsx
// getStaticProps
import { renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";

export const getStaticProps = async ({ params }) => {
  const doc = getDocBySlug(params.slug);
  const { html: staticHtml } = renderDocBodyToStaticHtml(doc);
  return { props: { staticHtml }, revalidate: 1800 };
};

// Component
import { StaticMDXRenderer } from "@/lib/mdx/static-mdx-runtime";

const Page = ({ staticHtml }: { staticHtml: string }) => (
  <StaticMDXRenderer html={staticHtml} />
);
```

## Canonical Pattern for Client-Only Runtime Rendering

Used only in `"use client"` components that receive compiled MDX code at runtime
(e.g. after an unlock API call):

```tsx
"use client";
import ClientOnlyMDXRenderer from "@/components/mdx/ClientOnlyMDXRenderer";

export function MyClientWidget({ code }: { code: string }) {
  return <ClientOnlyMDXRenderer code={code} />;
}
```

## File Inventory

| File | Safe for SSG? | Purpose |
|---|---|---|
| `lib/mdx/static-mdx-runtime.tsx` | ✅ | Static HTML rendering from doc body |
| `components/mdx/ClientOnlyMDXRenderer.tsx` | ❌ | Runtime compiled-MDX rendering (client only) |
| `components/mdx/SafeMDXRenderer.tsx` | ❌ | Backward-compat shim → ClientOnlyMDXRenderer |
| `components/mdx/ServerMDXRenderer.tsx` | ✅ | Thin wrapper around StaticMDXRenderer for SSG |
| `components/mdx/CompiledMDXRenderer.tsx` | ❌ | Inner compiled-MDX evaluator (loaded lazily) |

## Guard Script

```
node scripts/check-unsafe-mdx-prerender.mjs
```

Fails if any SSG page (under `pages/`) imports `SafeMDXRenderer`, `ClientOnlyMDXRenderer`,
or `CompiledMDXRenderer` directly. Transitive imports through `DirectorateOversight` are
also detected.

## Why `next/dynamic` with `ssr: false` Is Insufficient

Webpack traces `import()` calls at build time regardless of the `ssr: false` flag.
If the traced module imports `useMDXComponent` (from `next-contentlayer2/hooks`),
the hook's module-level code can execute during SSG and trigger the
`<Html>` import guard added in Next.js 16.

The only safe path at SSG time is `StaticMDXRenderer` / `renderDocBodyToStaticHtml`,
which contain no `useMDXComponent` reference.
