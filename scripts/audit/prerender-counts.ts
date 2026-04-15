// scripts/audit/prerender-counts.ts
//
// Standalone local audit — does NOT run `next build`. Imports the same
// loaders used by every dynamic route's getStaticPaths and computes the
// exact path count each route would emit. Reconciles the total against
// the `Generating static pages using 5 workers (0/N)` number the Netlify
// log shows.
//
// Run with: npx tsx scripts/audit/prerender-counts.ts

import fs from "node:fs";
import path from "node:path";

import {
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllEvents,
  getAllPosts,
  getAllPrints,
  getAllResources,
  getAllShorts,
  getAllVault,
  getAllBriefs,
  getAllPlaybooks,
  getAllStrategies,
  getPublishedBooks,
  getPublishedPosts,
  getPublishedStrategies as getPublishedStrategiesFromServer,
} from "../../lib/content/server";

import { getPublicationCatalogue } from "../../lib/editorial/catalogue";
import { getAllFrameworkSlugs } from "../../lib/resources/strategic-frameworks.static";
import { getPublishedStrategies as getPublishedStrategiesData } from "../../lib/server/strategies-data";
import { ALL_SOURCE_PDFS } from "../pdf/pdf-registry.source";

type Row = {
  route: string;
  loader: string;
  count: number;
  fallback: string;
  notes?: string;
};

const rows: Row[] = [];

function pushRow(r: Row) {
  rows.push(r);
}

function safeFp(d: any): string {
  return String(
    d?._raw?.flattenedPath || d?._raw?.sourceFilePath || d?.slug || "",
  ).toLowerCase();
}

function notDraft(d: any): boolean {
  return !d?.draft && d?.published !== false;
}

function countVenturesHardcoded(): number {
  // pages/ventures/[slug].tsx: `const ventures: Venture[] = [...]`
  const file = path.resolve("pages/ventures/[slug].tsx");
  const src = fs.readFileSync(file, "utf8");
  const block = src.slice(src.indexOf("const ventures:"));
  const end = block.indexOf("];");
  const trimmed = block.slice(0, end);
  return (trimmed.match(/slug:\s*['"]/g) || []).length;
}

async function main() {
  // -----------------------------------------------------------------------
  // 1. pages/[slug].tsx   → paths: []
  pushRow({
    route: "pages/[slug].tsx",
    loader: "(empty)",
    count: 0,
    fallback: "blocking",
    notes: "catch-all root; runtime resolve",
  });

  // -----------------------------------------------------------------------
  // 2. pages/content/[...slug].tsx → paths: []
  pushRow({
    route: "pages/content/[...slug].tsx",
    loader: "(empty)",
    count: 0,
    fallback: "blocking",
    notes: "catch-all /content; runtime resolve",
  });

  // -----------------------------------------------------------------------
  // 3. pages/blog/[...slug].tsx → getPublishedPosts() filtered to blog/|posts/
  {
    const posts = (getPublishedPosts() || []) as any[];
    // The route accepts any post with a derivable bare slug; most Post docs qualify.
    const count = posts.filter(notDraft).length;
    pushRow({
      route: "pages/blog/[...slug].tsx",
      loader: "getPublishedPosts()",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 4. pages/books/[slug].tsx → getPublishedBooks()
  {
    const books = (getPublishedBooks() || []) as any[];
    pushRow({
      route: "pages/books/[slug].tsx",
      loader: "getPublishedBooks()",
      count: books.filter(notDraft).length,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 5. pages/canon/[slug].tsx → getAllCanons() + isCanonDoc filter
  {
    const docs = (getAllCanons() || []) as any[];
    // Mirror isCanonDoc: path starts with canon/, vault/canon/, etc. The
    // narrow per-kind loader only returns Canon docs so path check is cheap.
    const count = docs
      .filter(notDraft)
      .filter((d) => {
        const fp = safeFp(d);
        return (
          fp.startsWith("canon/") ||
          fp.startsWith("content/canon/") ||
          fp.startsWith("vault/canon/") ||
          d?.type === "canon" ||
          d?.docKind === "canon"
        );
      }).length;
    pushRow({
      route: "pages/canon/[slug].tsx",
      loader: "getAllCanons()",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 6. pages/editorials/[slug].tsx → getPublicationCatalogue()
  {
    const items = getPublicationCatalogue() || [];
    pushRow({
      route: "pages/editorials/[slug].tsx",
      loader: "getPublicationCatalogue() (hardcoded)",
      count: items.length,
      fallback: "false",
    });
  }

  // -----------------------------------------------------------------------
  // 7. pages/events/[slug].tsx → getServerAllEvents() / getAllEvents()
  {
    const events = (getAllEvents() || []) as any[];
    const count = events.filter((e) => !e?.draftSafe && notDraft(e)).length;
    pushRow({
      route: "pages/events/[slug].tsx",
      loader: "getAllEvents()",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 8. pages/library/[slug].tsx → pdf-registry.source ALL_SOURCE_PDFS
  {
    const pdfs = (ALL_SOURCE_PDFS as any[]) || [];
    pushRow({
      route: "pages/library/[slug].tsx",
      loader: "ALL_SOURCE_PDFS (scripts/pdf/pdf-registry.source)",
      count: pdfs.length,
      fallback: "blocking",
      notes: "non-contentlayer; PDF registry",
    });
  }

  // -----------------------------------------------------------------------
  // 9. pages/playbooks/[slug].tsx → getAllPlaybooks()
  {
    const p = (getAllPlaybooks() || []) as any[];
    pushRow({
      route: "pages/playbooks/[slug].tsx",
      loader: "getAllPlaybooks()",
      count: p.filter(notDraft).length,
      fallback: "false",
    });
  }

  // -----------------------------------------------------------------------
  // 10. pages/prints/[slug].tsx → getAllPrints() + isPrintDoc filter
  {
    const docs = (getAllPrints() || []) as any[];
    const count = docs.filter(notDraft).length;
    pushRow({
      route: "pages/prints/[slug].tsx",
      loader: "getAllPrints()",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 11. pages/registry/[type]/[slug].tsx → allPosts + allShorts capped to 10 most recent
  {
    const posts = (getAllPosts() || []).filter((p: any) => !p?.draft);
    const shorts = (getAllShorts() || []).filter((s: any) => !s?.draft);
    const combined = [...posts, ...shorts].sort(
      (a: any, b: any) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
    );
    const count = Math.min(10, combined.length);
    pushRow({
      route: "pages/registry/[type]/[slug].tsx",
      loader: "getAllPosts() + getAllShorts() → top 10 recent",
      count,
      fallback: "blocking",
      notes: `raw=${posts.length + shorts.length}, capped to 10`,
    });
  }

  // -----------------------------------------------------------------------
  // 12. pages/resources/[...slug].tsx → getAllResources() (non-draft)
  {
    const docs = (getAllResources() || []) as any[];
    pushRow({
      route: "pages/resources/[...slug].tsx",
      loader: "getAllResources()",
      count: docs.filter(notDraft).length,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 13. pages/resources/surrender-framework/[slug].tsx → getAllResources() filtered to surrender-framework/
  {
    const docs = (getAllResources() || []) as any[];
    const count = docs.filter(notDraft).filter((d) => {
      const fp = safeFp(d);
      return fp.includes("surrender-framework/");
    }).length;
    pushRow({
      route: "pages/resources/surrender-framework/[slug].tsx",
      loader: "getAllResources() → surrender-framework/",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 14. pages/resources/strategic-frameworks/[slug].tsx → getAllFrameworkSlugs()
  {
    const slugs = (getAllFrameworkSlugs() || []) as string[];
    pushRow({
      route: "pages/resources/strategic-frameworks/[slug].tsx",
      loader: "getAllFrameworkSlugs() (static)",
      count: slugs.length,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 15. pages/shorts/[...slug].tsx → getAllShorts() capped to 10 most recent
  {
    const docs = (getAllShorts() || []).filter(notDraft) as any[];
    const raw = docs.length;
    pushRow({
      route: "pages/shorts/[...slug].tsx",
      loader: "getAllShorts() → top 10 recent",
      count: Math.min(10, raw),
      fallback: "blocking",
      notes: `raw=${raw}, capped to 10`,
    });
  }

  // -----------------------------------------------------------------------
  // 16. pages/strategy/[...slug].tsx → lib/server/strategies-data.getPublishedStrategies()
  {
    try {
      const list = await getPublishedStrategiesData();
      pushRow({
        route: "pages/strategy/[...slug].tsx",
        loader: "getPublishedStrategies (strategies-data)",
        count: Array.isArray(list) ? list.length : 0,
        fallback: "blocking",
      });
    } catch (e: any) {
      pushRow({
        route: "pages/strategy/[...slug].tsx",
        loader: "getPublishedStrategies (strategies-data)",
        count: 0,
        fallback: "blocking",
        notes: `loader threw: ${e?.message || e}`,
      });
    }
  }

  // -----------------------------------------------------------------------
  // 17. pages/vault/[...slug].tsx → getAllVault() (non-briefs)
  {
    const docs = (getAllVault() || []) as any[];
    const count = docs.filter(notDraft).filter((d) => {
      const fp = safeFp(d);
      // Route excludes `briefs` first-segment; vault/briefs is handled separately.
      const bare = fp.replace(/^content\//, "").replace(/^vault\//, "");
      const first = bare.split("/")[0];
      return first && first !== "briefs";
    }).length;
    pushRow({
      route: "pages/vault/[...slug].tsx",
      loader: "getAllVault() (excluding briefs)",
      count,
      fallback: "blocking",
    });
  }

  // -----------------------------------------------------------------------
  // 18. pages/vault/briefs/[slug].tsx → getAllBriefs() capped to 10 most recent
  {
    const docs = (getAllBriefs() || []).filter(notDraft) as any[];
    const raw = docs.length;
    pushRow({
      route: "pages/vault/briefs/[slug].tsx",
      loader: "getAllBriefs() → top 10 recent",
      count: Math.min(10, raw),
      fallback: "blocking",
      notes: `raw=${raw}, capped to 10`,
    });
  }

  // -----------------------------------------------------------------------
  // 19. pages/ventures/[slug].tsx → hardcoded array
  pushRow({
    route: "pages/ventures/[slug].tsx",
    loader: "hardcoded ventures[]",
    count: countVenturesHardcoded(),
    fallback: "blocking",
  });

  // -----------------------------------------------------------------------
  // Static singleton pages (non-dynamic .tsx under pages/, excluding api/
  // and _*.tsx). These still contribute to the prerender queue count.
  function walkStatic(dir: string, acc: string[] = []): string[] {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "api") continue;
        if (entry.name.startsWith("_")) continue;
        walkStatic(full, acc);
      } else if (entry.isFile()) {
        if (!/\.tsx?$/.test(entry.name)) continue;
        if (entry.name.startsWith("_")) continue;
        if (entry.name.includes("[")) continue; // dynamic
        // Skip obvious sitemap files (server-side only)
        if (entry.name.includes("sitemap")) continue;
        if (entry.name.endsWith(".xml.ts")) continue;
        acc.push(full);
      }
    }
    return acc;
  }
  const staticFiles = walkStatic(path.resolve("pages"));
  // Subtract files that actually use getServerSideProps (not prerendered)
  const trulyStatic = staticFiles.filter((f) => {
    try {
      const src = fs.readFileSync(f, "utf8");
      return !/getServerSideProps/.test(src);
    } catch {
      return true;
    }
  });

  // -----------------------------------------------------------------------
  // Print results
  const sorted = [...rows].sort((a, b) => b.count - a.count);

  const totalDynamic = rows.reduce((acc, r) => acc + r.count, 0);
  const totalStatic = trulyStatic.length;

  const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);

  console.log("\n=== PRERENDER INVENTORY ===\n");
  console.log(
    pad("route", 52) +
      pad("count", 7) +
      pad("fallback", 10) +
      "loader / notes",
  );
  console.log("-".repeat(110));
  for (const r of sorted) {
    console.log(
      pad(r.route, 52) +
        pad(String(r.count), 7) +
        pad(r.fallback, 10) +
        r.loader +
        (r.notes ? ` — ${r.notes}` : ""),
    );
  }

  console.log("\n=== TOTALS ===");
  console.log("dynamic-route paths (sum of all getStaticPaths): " + totalDynamic);
  console.log("static singleton .tsx pages (non-SSR):           " + totalStatic);
  console.log("combined:                                        " + (totalDynamic + totalStatic));

  console.log("\n=== TOP 10 BY COUNT ===");
  sorted.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.count}] ${r.route} — ${r.loader}`);
  });

  console.log("\n=== RECONCILE AGAINST 553 ===");
  const combined = totalDynamic + totalStatic;
  console.log(`  explicit dynamic + static singletons = ${combined}`);
  console.log("  Netlify last seen (0/553)                = 553");
  console.log(`  delta                                    = ${553 - combined}`);
  if (combined < 553) {
    console.log("  NOTE: delta likely comes from nested static pages under subdirs,");
    console.log("        MDX/app-router routes, or 404/500/locale variants not inventoried.");
  } else if (combined > 553) {
    console.log("  NOTE: combined exceeds 553 — some routes above likely overcount");
    console.log("        due to filters Next applies later (drafts, unknown slugs).");
  }
}

main().catch((e) => {
  console.error("[prerender-counts] failed:", e);
  process.exit(1);
});
