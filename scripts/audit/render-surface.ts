// scripts/audit/render-surface.ts
//
// Phase-1 render-surface inventory. Classifies every file under pages/
// by static-generation type, extracts top-level imports from the static
// ones, ranks shared render dependencies, and flags likely render
// hotspots by size / MDX usage / top-level transform complexity.
//
// Run with: npx tsx scripts/audit/render-surface.ts

import fs from "node:fs";
import path from "node:path";

type PageKind =
  | "ssr" // getServerSideProps — not prerendered
  | "staticDynamic" // getStaticPaths + getStaticProps
  | "staticSingleton" // getStaticProps only (or plain static page)
  | "plainStatic" // no data functions at all
  | "api" // pages/api/*
  | "sitemap"
  | "app" // app router
  | "skip";

type PageRecord = {
  file: string;
  rel: string;
  kind: PageKind;
  bytes: number;
  lines: number;
  imports: string[];
  usesMdxRenderer: boolean;
  usesServerMdx: boolean;
  usesSafeMdx: boolean;
  usesGetRenderableBody: boolean;
  hasGetStaticProps: boolean;
  hasGetStaticPaths: boolean;
  hasGetServerSideProps: boolean;
};

const ROOT = process.cwd();

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      if (entry.name === ".next") continue;
      walk(full, acc);
    } else if (entry.isFile()) {
      if (/\.(tsx?|mdx?)$/.test(entry.name)) acc.push(full);
    }
  }
  return acc;
}

function extractTopLevelImports(src: string): string[] {
  const imports: string[] = [];
  const re =
    /^\s*import\s+(?:[\s\S]*?)from\s+['"]([^'"]+)['"];?/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) imports.push(m[1]!);
  return imports;
}

function classify(src: string, rel: string): PageKind {
  if (rel.startsWith("pages/api/")) return "api";
  if (rel.startsWith("app/")) return "app";
  if (/sitemap|robots/.test(rel)) return "sitemap";
  if (/_app|_document|_error|_middleware/.test(rel)) return "skip";

  const hasGssp = /\bgetServerSideProps\b/.test(src);
  if (hasGssp) return "ssr";

  const hasGsp = /\bgetStaticProps\b/.test(src);
  const hasGspaths = /\bgetStaticPaths\b/.test(src);
  if (hasGsp && hasGspaths) return "staticDynamic";
  if (hasGsp) return "staticSingleton";
  return "plainStatic";
}

function classifyPages(): PageRecord[] {
  const out: PageRecord[] = [];
  const pagesRoot = path.join(ROOT, "pages");
  const appRoot = path.join(ROOT, "app");
  const files = [
    ...(fs.existsSync(pagesRoot) ? walk(pagesRoot) : []),
    ...(fs.existsSync(appRoot) ? walk(appRoot) : []),
  ];
  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, "/");
    const src = fs.readFileSync(file, "utf8");
    const kind = classify(src, rel);
    if (kind === "skip") continue;

    const imports = extractTopLevelImports(src);
    out.push({
      file,
      rel,
      kind,
      bytes: Buffer.byteLength(src, "utf8"),
      lines: src.split("\n").length,
      imports,
      usesMdxRenderer: imports.some((i) =>
        /mdx|MDXRenderer|MDXProvider/i.test(i),
      ),
      usesServerMdx: imports.some((i) => /ServerMDXRenderer/i.test(i)),
      usesSafeMdx: imports.some((i) => /SafeMDXRenderer/i.test(i)),
      usesGetRenderableBody: /getRenderableBody|renderableBody/.test(src),
      hasGetStaticProps: /\bgetStaticProps\b/.test(src),
      hasGetStaticPaths: /\bgetStaticPaths\b/.test(src),
      hasGetServerSideProps: /\bgetServerSideProps\b/.test(src),
    });
  }
  return out;
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s.slice(0, n - 1) + "…";
  return s + " ".repeat(n - s.length);
}

function padRight(n: number, w: number): string {
  return String(n).padStart(w, " ");
}

function main() {
  const pages = classifyPages();

  const counts: Record<PageKind, number> = {
    ssr: 0,
    staticDynamic: 0,
    staticSingleton: 0,
    plainStatic: 0,
    api: 0,
    sitemap: 0,
    app: 0,
    skip: 0,
  };
  for (const p of pages) counts[p.kind]++;

  console.log("\n=== PAGE KIND TOTALS ===");
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${pad(k, 20)} ${v}`);
  }

  // Static pages only = staticDynamic + staticSingleton + plainStatic.
  // Exclude SSR, api, sitemap, app-router.
  const staticPages = pages.filter(
    (p) =>
      p.kind === "staticDynamic" ||
      p.kind === "staticSingleton" ||
      p.kind === "plainStatic",
  );

  console.log(`\nStatic-render surface: ${staticPages.length} pages`);

  // -----------------------------------------------------------------------
  // SHARED-IMPORT FREQUENCY TABLE
  const importFreq = new Map<string, number>();
  for (const p of staticPages) {
    const seen = new Set<string>(); // unique per page
    for (const imp of p.imports) {
      if (seen.has(imp)) continue;
      seen.add(imp);
      importFreq.set(imp, (importFreq.get(imp) || 0) + 1);
    }
  }

  // Filter: we care most about internal (@/, ./, ../) and known heavy libs.
  const importEntries = [...importFreq.entries()]
    .filter(([name]) => {
      // drop trivial/ambient
      if (name === "react") return false;
      if (name === "next") return false;
      if (name.startsWith("next/")) return false;
      if (name === "next-auth/react") return false;
      return true;
    })
    .sort((a, b) => b[1] - a[1]);

  console.log("\n=== TOP 25 SHARED IMPORTS ACROSS STATIC PAGES ===");
  console.log(pad("import", 60) + padRight(0, 6) + "  pages");
  console.log("-".repeat(80));
  for (const [name, n] of importEntries.slice(0, 25)) {
    console.log(pad(name, 60) + padRight(n, 6));
  }

  // -----------------------------------------------------------------------
  // Suspicious internal-lib imports (content / mdx / render / pdf / og / editorial)
  const heavyPatterns = [
    /^@\/lib\/content\//,
    /^@\/lib\/mdx\//,
    /^@\/lib\/editorial\//,
    /^@\/lib\/pdf/,
    /^@\/lib\/og/,
    /render-body/,
    /MDXRenderer/,
    /^@\/lib\/contentlayer/,
    /^contentlayer\//,
  ];

  const heavy = importEntries.filter(([name]) =>
    heavyPatterns.some((re) => re.test(name)),
  );

  console.log("\n=== HEAVY INTERNAL IMPORTS (content / mdx / render / pdf / og / editorial) ===");
  console.log(pad("import", 60) + padRight(0, 6) + "  pages");
  console.log("-".repeat(80));
  for (const [name, n] of heavy) {
    console.log(pad(name, 60) + padRight(n, 6));
  }

  // -----------------------------------------------------------------------
  // Highest-risk static pages by composite score:
  //   bytes weight + MDX-renderer flags + getStaticProps complexity
  const scored = staticPages
    .map((p) => {
      let score = 0;
      score += Math.min(p.bytes / 1000, 60); // up to 60 for very large files
      if (p.usesServerMdx) score += 20;
      if (p.usesSafeMdx) score += 20;
      if (p.usesMdxRenderer) score += 10;
      if (p.usesGetRenderableBody) score += 10;
      if (p.hasGetStaticPaths) score += 15;
      // count heavy internal imports this page has
      const heavyHere = p.imports.filter((imp) =>
        heavyPatterns.some((re) => re.test(imp)),
      ).length;
      score += heavyHere * 4;
      return { p, score, heavyHere };
    })
    .sort((a, b) => b.score - a.score);

  console.log("\n=== TOP 15 HIGHEST-RISK STATIC PAGES (composite score) ===");
  console.log(
    pad("file", 52) +
      padRight(0, 8) + "  bytes  " +
      padRight(0, 5) + " lines " +
      padRight(0, 4) + " heavy " +
      "flags",
  );
  console.log("-".repeat(110));
  for (const { p, score, heavyHere } of scored.slice(0, 15)) {
    const flags = [
      p.hasGetStaticPaths ? "GSP" : "   ",
      p.usesServerMdx ? "srvMDX" : "      ",
      p.usesSafeMdx ? "safeMDX" : "       ",
      p.usesGetRenderableBody ? "renderBody" : "          ",
    ].join(" ");
    console.log(
      pad(p.rel, 52) +
        padRight(Math.round(score), 6) + "  " +
        padRight(p.bytes, 7) + " " +
        padRight(p.lines, 5) + "  " +
        padRight(heavyHere, 4) + "  " +
        flags,
    );
  }

  // -----------------------------------------------------------------------
  // Pages importing getRenderableBody (the content-to-render pipeline)
  const renderBodyPages = staticPages.filter((p) => p.usesGetRenderableBody);
  console.log(
    `\n=== Pages invoking getRenderableBody / render-body pipeline: ${renderBodyPages.length} ===`,
  );
  for (const p of renderBodyPages) {
    console.log(`  ${p.rel}`);
  }

  // -----------------------------------------------------------------------
  // Pages importing ServerMDXRenderer / SafeMDXRenderer
  const serverMdxPages = staticPages.filter((p) => p.usesServerMdx);
  const safeMdxPages = staticPages.filter((p) => p.usesSafeMdx);
  console.log(
    `\n=== Pages importing ServerMDXRenderer: ${serverMdxPages.length} ===`,
  );
  for (const p of serverMdxPages) console.log(`  ${p.rel}`);
  console.log(
    `\n=== Pages importing SafeMDXRenderer: ${safeMdxPages.length} ===`,
  );
  for (const p of safeMdxPages) console.log(`  ${p.rel}`);
}

main();
