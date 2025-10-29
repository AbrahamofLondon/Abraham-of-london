// scripts/check-mdx-components.ts (ts-node)
/* eslint-disable no-console */
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("../components/mdx.tsx");
  if (!mod.MDXComponents) {
    console.error("MDXComponents named export missing from components/mdx.tsx");
    process.exit(1);
  }
  process.exit(0);
} catch (e) {
  console.error("Unable to require components/mdx.tsx", e);
  process.exit(1);
}
