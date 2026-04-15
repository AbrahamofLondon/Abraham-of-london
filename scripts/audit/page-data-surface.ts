// scripts/audit/page-data-surface.ts
//
// Local-only inventory: walks every Pages Router file (excluding pages/api),
// classifies data functions, and flags imports of heavy shared modules.
// Used to reason about page-data-collection memory cost without running
// `next build`.
//
// Run with: npx tsx scripts/audit/page-data-surface.ts

import fs from "node:fs";
import path from "node:path";

type Row = {
  file: string;
  bytes: number;
  gsp: boolean;
  gspaths: boolean;
  gssp: boolean;
  imports: {
    contentServer: boolean;
    contentlayerWrapper: boolean;
    contentlayerGenerated: boolean;
    prisma: boolean;
    tokenStorePostgres: boolean;
    authCookies: boolean;
    serverMdx: boolean;
    safeMdx: boolean;
  };
};

function walk(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "api") continue;
      if (e.name === "node_modules" || e.name === ".next") continue;
      walk(full, acc);
    } else if (e.isFile() && /\.tsx?$/.test(e.name) && !e.name.startsWith("_")) {
      acc.push(full);
    }
  }
  return acc;
}

function has(src: string, pattern: RegExp): boolean {
  return pattern.test(src);
}

function classify(file: string): Row {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, "/");
  const src = fs.readFileSync(file, "utf8");
  return {
    file: rel,
    bytes: Buffer.byteLength(src, "utf8"),
    gsp: has(src, /\bgetStaticProps\b/),
    gspaths: has(src, /\bgetStaticPaths\b/),
    gssp: has(src, /\bgetServerSideProps\b/),
    imports: {
      contentServer: has(src, /from\s+["']@\/lib\/content\/server["']/),
      contentlayerWrapper: has(src, /from\s+["']@\/lib\/contentlayer["']/),
      contentlayerGenerated: has(src, /from\s+["']contentlayer\/generated["']|import\(\s*["']contentlayer\/generated["']/),
      prisma: has(src, /from\s+["']@\/lib\/prisma["']/),
      tokenStorePostgres: has(src, /from\s+["']@\/lib\/server\/auth\/tokenStore\.postgres["']/),
      authCookies: has(src, /from\s+["']@\/lib\/server\/auth\/cookies["']/),
      serverMdx: has(src, /ServerMDXRenderer/),
      safeMdx: has(src, /SafeMDXRenderer/),
    },
  };
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n - 1) + "…";
  return s + " ".repeat(n - s.length);
}

function main() {
  const files = walk(path.resolve("pages"));
  const rows = files.map(classify).sort((a, b) => b.bytes - a.bytes);

  const withData = rows.filter((r) => r.gsp || r.gspaths || r.gssp);
  const heavy = rows.filter(
    (r) =>
      r.imports.contentServer ||
      r.imports.contentlayerWrapper ||
      r.imports.contentlayerGenerated ||
      r.imports.prisma ||
      r.imports.tokenStorePostgres ||
      r.imports.authCookies,
  );

  console.log(`\n=== PAGE-DATA SURFACE (${files.length} files) ===\n`);
  console.log(
    pad("file", 52) + pad("size", 8) + "GSP GSPaths GSSP  imports",
  );
  console.log("-".repeat(120));

  for (const r of withData) {
    const gsp = r.gsp ? "Y  " : "   ";
    const gsp2 = r.gspaths ? "Y      " : "       ";
    const gssp = r.gssp ? "Y    " : "     ";
    const tags: string[] = [];
    if (r.imports.contentServer) tags.push("content/server");
    if (r.imports.contentlayerWrapper) tags.push("@/lib/contentlayer");
    if (r.imports.contentlayerGenerated) tags.push("contentlayer/generated");
    if (r.imports.prisma) tags.push("prisma");
    if (r.imports.tokenStorePostgres) tags.push("tokenStore.postgres");
    if (r.imports.authCookies) tags.push("auth/cookies");
    if (r.imports.serverMdx) tags.push("serverMDX");
    if (r.imports.safeMdx) tags.push("safeMDX");
    console.log(
      pad(r.file, 52) +
        pad(String(r.bytes), 8) +
        gsp +
        gsp2 +
        gssp +
        "  " +
        tags.join(", "),
    );
  }

  console.log(`\nfiles with any data fn: ${withData.length}`);
  console.log(
    `files importing any heavy shared module (contentlayer / prisma / auth): ${heavy.length}`,
  );

  // Contentlayer barrel offenders — any file that pulls in either of the
  // full-barrel modules defeats the per-kind lazy loader.
  const barrelOffenders = rows.filter(
    (r) => r.imports.contentlayerWrapper || r.imports.contentlayerGenerated,
  );
  console.log(
    `\nfiles still importing contentlayer barrel (@/lib/contentlayer or contentlayer/generated): ${barrelOffenders.length}`,
  );
  for (const r of barrelOffenders) {
    console.log("  " + r.file);
  }
}

main();
