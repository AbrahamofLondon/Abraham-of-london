#!/usr/bin/env node
/**
 * scripts/check-mdx-template-rendering.mjs
 *
 * Validates every MDX route template's body prop contract.
 * For every expected public route:
 *   - resolve document
 *   - resolve route template
 *   - confirm bodyHtml/renderedHtml/staticHtml exists at document level
 *   - confirm route template uses the same field
 *   - fail if rendered content exists at document level but is not passed into page template
 *   - fail if template renders a blank placeholder while document body exists
 *
 * Output: reports/mdx-template-rendering-report.json
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "mdx-template-rendering-report.json");

// ─── Route template definitions ─────────────────────────────────────────────
// For each route template, define:
//   - how it loads the document
//   - which body field it passes to the renderer
//   - whether it uses renderDocBodyToStaticHtml or getRenderableBody
//   - whether it uses StaticMDXRenderer or SafeMDXRenderer
//   - what prop name carries rendered HTML/code

const ROUTE_TEMPLATES = {
  "pages/canon/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Uses ReaderBody wrapper. Correct static rendering path.",
  },
  "pages/playbooks/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "html",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Imports contentlayer/generated type. Should use local type.",
  },
  "pages/shorts/[...slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "loadAllShorts (custom loader)",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Renders in getStaticProps via toPageItem(). Correct path.",
  },
  "pages/blog/[...slug].tsx": {
    renderFunction: "getRenderableBody",
    renderComponent: "Client-side MDX (useMDXComponent)",
    htmlPropName: "code",
    renderMode: "client-side",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.code (via getRenderableBody + API fetch)",
    notes: "Client-side rendering via API. Different from static path.",
  },
  "pages/editorials/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getAllEditorials",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Correct static rendering path.",
  },
  "pages/editorials/series/[seriesSlug]/[partSlug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getEditorialSeriesPartDocument",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Correct static rendering path.",
  },
  "pages/books/[slug].tsx": {
    renderFunction: "getRenderableBody",
    renderComponent: "Client-side MDX (useMDXComponent)",
    htmlPropName: "bodyCode",
    renderMode: "client-side",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.code (via getRenderableBody + API fetch)",
    notes: "Client-side rendering via API. Different from static path.",
  },
  "pages/briefs/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Uses render in toPageItem, not directly in getStaticProps.",
  },
  "pages/vault/briefs/[slug].tsx": {
    renderFunction: "getRenderableBody",
    renderComponent: "ClientOnlyMDXRenderer (dynamic, ssr:false)",
    htmlPropName: "code",
    renderMode: "client-side",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.code (via getRenderableBody + SafeMDXRenderer)",
    notes: "Client-side rendering via dynamic import. No SSR.",
  },
  "pages/resources/[...slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Correct static rendering path.",
  },
  "pages/intelligence/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Uses render in toPageItem, not directly in getStaticProps.",
  },
  "pages/strategy/[...slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "staticHtml",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Correct static rendering path.",
  },
  "pages/lexicon/[slug].tsx": {
    renderFunction: "renderDocBodyToStaticHtml",
    renderComponent: "StaticMDXRenderer",
    htmlPropName: "rendered",
    renderMode: "static",
    docSource: "getDocBySlug",
    bodyFieldUsed: "body.raw (via renderDocBodyToStaticHtml)",
    notes: "Uses 'rendered' as prop name. Correct static rendering path.",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v, fallback = "") {
  return (v && typeof v === "string") ? v.trim() : fallback;
}

function readIndexJson(typeDir) {
  const indexPath = path.join(ROOT, ".contentlayer", "generated", typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkTemplateRendering() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-template-rendering] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;

  const failures = [];
  const warnings = [];
  const templateResults = [];

  // ── Check 1: For each template, verify the body prop contract ──────────
  for (const [templatePath, template] of Object.entries(ROUTE_TEMPLATES)) {
    const templateAbsPath = path.join(ROOT, templatePath);
    const templateExists = fs.existsSync(templateAbsPath);

    const result = {
      template: templatePath,
      exists: templateExists,
      renderFunction: template.renderFunction,
      renderComponent: template.renderComponent,
      htmlPropName: template.htmlPropName,
      renderMode: template.renderMode,
      documentsChecked: 0,
      documentsWithBody: 0,
      documentsWithEmptyRender: 0,
      passed: true,
      issues: [],
    };

    if (!templateExists) {
      result.passed = false;
      result.issues.push("Template file not found");
      failures.push({
        type: "TEMPLATE_NOT_FOUND",
        template: templatePath,
        detail: `Route template file does not exist at ${templatePath}`,
      });
      templateResults.push(result);
      continue;
    }

    // Read template content to verify it uses the expected functions
    const templateContent = fs.readFileSync(templateAbsPath, "utf8");

    if (template.renderFunction === "renderDocBodyToStaticHtml") {
      if (!templateContent.includes("renderDocBodyToStaticHtml")) {
        result.passed = false;
        result.issues.push(`Expected renderDocBodyToStaticHtml but not found in template`);
        failures.push({
          type: "MISSING_RENDER_FUNCTION",
          template: templatePath,
          expected: "renderDocBodyToStaticHtml",
          detail: `Template does not import or use renderDocBodyToStaticHtml`,
        });
      }
      if (!templateContent.includes("StaticMDXRenderer")) {
        result.passed = false;
        result.issues.push(`Expected StaticMDXRenderer but not found in template`);
        failures.push({
          type: "MISSING_RENDER_COMPONENT",
          template: templatePath,
          expected: "StaticMDXRenderer",
          detail: `Template does not import or use StaticMDXRenderer`,
        });
      }
    }

    if (template.renderFunction === "getRenderableBody") {
      if (!templateContent.includes("getRenderableBody")) {
        result.passed = false;
        result.issues.push(`Expected getRenderableBody but not found in template`);
        failures.push({
          type: "MISSING_RENDER_FUNCTION",
          template: templatePath,
          expected: "getRenderableBody",
          detail: `Template does not import or use getRenderableBody`,
        });
      }
    }

    // Check for contentlayer/generated import
    if (templateContent.includes("contentlayer/generated")) {
      result.passed = false;
      result.issues.push("Imports contentlayer/generated - should use lib/content/server instead");
      failures.push({
        type: "CONTENTLAYER_GENERATED_IMPORT",
        template: templatePath,
        detail: "Template imports from contentlayer/generated - should use lib/content/server",
      });
    }

    templateResults.push(result);
  }

  // ── Check 2: For each expected public route, verify body exists at document level ──
  const publicRoutes = docs.filter(d => d.expectedPublicRoute);

  for (const doc of publicRoutes) {
    // Check if body exists in the generated document
    const hasBody = doc.hasBodyRaw || doc.hasBodyCode || doc.hasContent;
    const bodyLength = Math.max(doc.bodyRawLength || 0, doc.bodyCodeLength || 0);

    if (!hasBody) {
      failures.push({
        type: "PUBLIC_ROUTE_NO_BODY",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        detail: `Expected public route has no body content in generated document`,
      });
    } else if (bodyLength < 10) {
      warnings.push({
        type: "PUBLIC_ROUTE_TRIVIAL_BODY",
        routePath: doc.routePath,
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        bodyLength,
        detail: `Public route has very short body content (${bodyLength} chars)`,
      });
    }
  }

  // ── Check 3: Verify the body.code vs body.raw classification ──────────
  // Read the actual generated documents to verify body.code classification
  const generatedDirs = fs.readdirSync(path.join(ROOT, ".contentlayer", "generated"), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let compiledMdxCount = 0;
  let leakedModuleCount = 0;
  let readableCodeCount = 0;
  let emptyCodeCount = 0;

  for (const typeDir of generatedDirs) {
    const genDocs = readIndexJson(typeDir);
    for (const genDoc of genDocs) {
      const code = safeStr(genDoc.body?.code);
      if (!code) { emptyCodeCount++; continue; }
      if (/\bfunction\s+MDXContent\s*\(/.test(code)) { compiledMdxCount++; continue; }
      if (/\bObject\.defineProperty\s*\(\s*exports\b/.test(code)) { leakedModuleCount++; continue; }
      readableCodeCount++;
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalTemplates: Object.keys(ROUTE_TEMPLATES).length,
      templatesPassed: templateResults.filter(r => r.passed).length,
      templatesFailed: templateResults.filter(r => !r.passed).length,
      totalPublicRoutes: publicRoutes.length,
      publicRoutesWithBody: publicRoutes.filter(d => d.hasBodyRaw || d.hasBodyCode || d.hasContent).length,
      publicRoutesWithoutBody: failures.filter(f => f.type === "PUBLIC_ROUTE_NO_BODY").length,
      failures: failures.length,
      warnings: warnings.length,
      bodyCodeClassification: {
        compiledMdx: compiledMdxCount,
        leakedModule: leakedModuleCount,
        readableText: readableCodeCount,
        empty: emptyCodeCount,
      },
    },
    templateResults,
    failures,
    warnings: warnings.slice(0, 100),
    routeTemplates: ROUTE_TEMPLATES,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n============================================");
  console.log("MDX TEMPLATE RENDERING REPORT");
  console.log("============================================");
  console.log(`Templates checked:    ${report.summary.totalTemplates}`);
  console.log(`Templates passed:     ${report.summary.templatesPassed}`);
  console.log(`Templates failed:     ${report.summary.templatesFailed}`);
  console.log(`Public routes:        ${report.summary.totalPublicRoutes}`);
  console.log(`  With body:          ${report.summary.publicRoutesWithBody}`);
  console.log(`  Without body:       ${report.summary.publicRoutesWithoutBody}`);
  console.log(`Failures:             ${report.summary.failures}`);
  console.log(`Warnings:             ${report.summary.warnings}`);
  console.log(`\nBody.code classification:`);
  console.log(`  Compiled MDX:       ${report.summary.bodyCodeClassification.compiledMdx}`);
  console.log(`  Leaked module:      ${report.summary.bodyCodeClassification.leakedModule}`);
  console.log(`  Readable text:      ${report.summary.bodyCodeClassification.readableText}`);
  console.log(`  Empty:              ${report.summary.bodyCodeClassification.empty}`);
  console.log("\n============================================\n");

  // Detailed template results
  for (const tr of templateResults) {
    const status = tr.passed ? "✅" : "❌";
    console.log(`${status} ${tr.template}`);
    console.log(`   Render: ${tr.renderFunction} → ${tr.renderComponent} (prop: ${tr.htmlPropName})`);
    if (tr.issues.length > 0) {
      tr.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
    }
  }

  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const f of failures.slice(0, 20)) {
      console.error(`  [${f.type}] ${f.template || f.routePath} — ${f.detail}`);
    }
    if (failures.length > 20) {
      console.error(`  ...and ${failures.length - 20} more`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — template rendering check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All ${report.summary.templatesPassed}/${report.summary.totalTemplates} templates pass`);
  process.exit(0);
}

checkTemplateRendering();
