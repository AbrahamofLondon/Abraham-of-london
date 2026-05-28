#!/usr/bin/env node
/**
 * scripts/check-mdx-body-rendering.mjs
 *
 * For every expected public route document, loads the generated document
 * and calls renderDocBodyToStaticHtml() to verify body content renders.
 *
 * Output: reports/mdx-body-rendering-report.json
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const GENERATED = path.join(ROOT, ".contentlayer", "generated");
const OUTPUT_PATH = path.join(ROOT, "reports", "mdx-body-rendering-report.json");

// ─── Allowlist: document types that are intentionally metadata/index-only ─────
const ALLOWLIST_EMPTY_BODY = new Set([
  // These are index/landing pages, not content pages
]);

// ─── Inline the renderer logic (can't import TS directly in Node) ────────────
// This mirrors the logic from lib/mdx/static-mdx-runtime.tsx

function looksLikeCompiledMdx(value) {
  if (!value) return false;
  return (
    /\bfunction\s+MDXContent\s*\(/.test(value) ||
    /\buseMDXComponents\b/.test(value) ||
    /\breturn\s+_jsx\s*\(/.test(value) ||
    /\breturn\s+_jsxs\s*\(/.test(value) ||
    /\b_jsx\s*\(/.test(value) ||
    /\b_jsxs\s*\(/.test(value) ||
    /\bjsxDEV\s*\(/.test(value) ||
    /react\/jsx-runtime/.test(value) ||
    /\/\*@jsxRuntime\s+automatic\*\//.test(value)
  );
}

function looksLikeLeakedModuleCode(value) {
  if (!value) return false;
  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(value) ||
    /\bmodule\.exports\b/.test(value) ||
    /\bexports\.[A-Za-z_$]/.test(value) ||
    /\b__esModule\b/.test(value) ||
    /\brequire\s*\(/.test(value)
  );
}

function looksLikeReadableText(value) {
  if (!value) return false;
  if (looksLikeCompiledMdx(value)) return false;
  if (looksLikeLeakedModuleCode(value)) return false;
  return (
    /^#{1,6}\s+/m.test(value) ||
    /^\s*[-*+]\s+/m.test(value) ||
    /^\s*\d+\.\s+/m.test(value) ||
    /(^|\n)\s*>\s+/.test(value) ||
    /\[([^\]]+)\]\(([^)]+)\)/.test(value) ||
    /```[\s\S]*?```/.test(value) ||
    /\*\*[^*]+\*\*/.test(value) ||
    value.length > 80
  );
}

function renderDocBodyToStaticHtml(doc) {
  const bodyCode = (doc?.body?.code && typeof doc.body.code === "string") ? doc.body.code.trim() : "";
  const legacyBodyCode = (doc?.bodyCode && typeof doc.bodyCode === "string") ? doc.bodyCode.trim() : "";
  const rawBody = (doc?.body?.raw && typeof doc.body.raw === "string") ? doc.body.raw.trim() : "";
  const content = (doc?.content && typeof doc.content === "string") ? doc.content.trim() : "";

  // 1. Try body.code — if compiled MDX, skip to raw fallback
  if (bodyCode) {
    if (looksLikeCompiledMdx(bodyCode) && !looksLikeLeakedModuleCode(bodyCode)) {
      // Compiled MDX — fall through to raw body
    } else if (looksLikeLeakedModuleCode(bodyCode)) {
      // Suspicious — fall through
    } else if (looksLikeReadableText(bodyCode)) {
      return { mode: "markdown", html: "<rendered>" };
    }
  }

  // 2. Try legacy bodyCode
  if (legacyBodyCode) {
    if (looksLikeCompiledMdx(legacyBodyCode) && !looksLikeLeakedModuleCode(legacyBodyCode)) {
      // Fall through
    } else if (looksLikeReadableText(legacyBodyCode)) {
      return { mode: "markdown", html: "<rendered>" };
    }
  }

  // 3. Try raw body content
  const rawCandidate = rawBody || content;
  if (rawCandidate && looksLikeReadableText(rawCandidate)) {
    return { mode: "raw-mdx", html: "<rendered>" };
  }

  // 4. Empty
  return { mode: "empty", html: "" };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readIndexJson(typeDir) {
  const indexPath = path.join(GENERATED, typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function findDocInGenerated(typeDir, slug) {
  const docs = readIndexJson(typeDir);
  return docs.find(d =>
    (d.slugSafe && d.slugSafe === slug) ||
    (d.slug && d.slug === slug) ||
    (d.slugComputed && d.slugComputed === slug) ||
    (d._raw?.flattenedPath && d._raw.flattenedPath.endsWith("/" + slug))
  ) || null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkBodyRendering() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-mdx-body-rendering] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;

  const results = [];
  const failures = [];
  const warnings = [];

  for (const doc of docs) {
    // Only check documents that have body content or are expected public routes
    if (!doc.expectedPublicRoute && !doc.hasBodyRaw && !doc.hasBodyCode && !doc.hasContent) continue;

    // Load the actual generated document
    const generatedDoc = findDocInGenerated(doc.collection, doc.slug);

    if (!generatedDoc) {
      failures.push({
        type: "DOCUMENT_NOT_FOUND_IN_GENERATED",
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        routePath: doc.routePath,
        detail: "Document listed in manifest but not found in generated indexes",
      });
      continue;
    }

    // Check body fields exist in the actual generated document
    const hasRaw = typeof generatedDoc.body?.raw === "string" && generatedDoc.body.raw.trim().length > 0;
    const hasCode = typeof generatedDoc.body?.code === "string" && generatedDoc.body.code.trim().length > 0;
    const hasContent = typeof generatedDoc.content === "string" && generatedDoc.content.trim().length > 0;

    // Render
    const renderResult = renderDocBodyToStaticHtml(generatedDoc);

    const entry = {
      slug: doc.slug,
      collection: doc.collection,
      title: doc.title,
      routePath: doc.routePath,
      expectedPublicRoute: doc.expectedPublicRoute,
      hasBodyRaw: hasRaw,
      hasBodyCode: hasCode,
      hasContent: hasContent,
      bodyRawLength: hasRaw ? generatedDoc.body.raw.trim().length : 0,
      bodyCodeLength: hasCode ? generatedDoc.body.code.trim().length : 0,
      renderMode: renderResult.mode,
      renderEmpty: renderResult.html === "",
      pass: true,
    };

    // Check for failures
    if (doc.expectedPublicRoute && hasRaw && renderResult.mode === "empty") {
      // Has raw body but render returned empty — this is a bug
      entry.pass = false;
      failures.push({
        type: "EMPTY_RENDER_WITH_BODY",
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        routePath: doc.routePath,
        detail: `Public document has body.raw (${hasRaw ? generatedDoc.body.raw.trim().length : 0} chars) but renderDocBodyToStaticHtml returned empty`,
        bodyRawLength: hasRaw ? generatedDoc.body.raw.trim().length : 0,
        bodyCodeLength: hasCode ? generatedDoc.body.code.trim().length : 0,
      });
    }

    if (doc.expectedPublicRoute && hasCode && hasRaw && renderResult.mode === "empty") {
      // Has compiled body.code AND body.raw but fallback didn't work
      entry.pass = false;
      failures.push({
        type: "COMPILED_MDX_NO_RAW_FALLBACK",
        slug: doc.slug,
        collection: doc.collection,
        title: doc.title,
        routePath: doc.routePath,
        detail: "body.code is compiled MDX, body.raw exists but fallback returned empty — renderDocBodyToStaticHtml bug",
      });
    }

    if (doc.expectedPublicRoute && !hasRaw && !hasCode && !hasContent) {
      // Public document with no body at all — may be intentional (index page)
      if (!ALLOWLIST_EMPTY_BODY.has(doc.collection)) {
        warnings.push({
          type: "PUBLIC_DOCUMENT_NO_BODY",
          slug: doc.slug,
          collection: doc.collection,
          title: doc.title,
          routePath: doc.routePath,
          detail: "Public document has no body.raw, body.code, or content field",
        });
      }
    }

    results.push(entry);
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalChecked: results.length,
      passed: results.filter(r => r.pass).length,
      failures: failures.length,
      warnings: warnings.length,
      emptyRenderWithBody: failures.filter(f => f.type === "EMPTY_RENDER_WITH_BODY").length,
      compiledMdxNoFallback: failures.filter(f => f.type === "COMPILED_MDX_NO_RAW_FALLBACK").length,
      documentNotFound: failures.filter(f => f.type === "DOCUMENT_NOT_FOUND_IN_GENERATED").length,
    },
    failures,
    warnings: warnings.slice(0, 100),
    results: results.slice(0, 1000),
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n========================================");
  console.log("MDX BODY RENDERING REPORT");
  console.log("========================================");
  console.log(`Total checked:       ${report.summary.totalChecked}`);
  console.log(`Passed:              ${report.summary.passed}`);
  console.log(`Failures:            ${report.summary.failures}`);
  console.log(`Warnings:            ${report.summary.warnings}`);
  console.log(`  Empty render w/body: ${report.summary.emptyRenderWithBody}`);
  console.log(`  Compiled MDX no fallback: ${report.summary.compiledMdxNoFallback}`);
  console.log(`  Doc not found:     ${report.summary.documentNotFound}`);
  console.log("========================================\n");

  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures.slice(0, 20)) {
      console.error(`  [${f.type}] ${f.routePath || f.slug} — ${f.detail}`);
    }
    if (failures.length > 20) {
      console.error(`  ...and ${failures.length - 20} more`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — body rendering check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All ${report.summary.passed} checked documents pass body rendering`);
  process.exit(0);
}

checkBodyRendering();
