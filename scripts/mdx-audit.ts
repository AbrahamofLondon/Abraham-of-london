#!/usr/bin/env npx ts-node
/**
 * scripts/mdx-audit.ts — Pre-build MDX content audit
 *
 * Scans all contentlayer-generated documents for structural issues
 * that would cause rendering failures or artifact leakage in production.
 *
 * Usage:
 *   npx ts-node scripts/mdx-audit.ts
 *   # or via package.json:
 *   pnpm mdx:audit
 *
 * Exit codes:
 *   0 = clean (warnings may exist)
 *   1 = errors found (build should fail)
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "error" | "warning";
type Finding = {
  severity: Severity;
  file: string;
  title: string;
  message: string;
  detail?: string;
};

// ---------------------------------------------------------------------------
// Detection helpers (mirrored from render-body.ts for standalone use)
// ---------------------------------------------------------------------------

function looksLikeCompiledMdx(value: string): boolean {
  return (
    /\bfunction\s+MDXContent\s*\(/.test(value) ||
    /\buseMDXComponents\b/.test(value) ||
    /\b_jsx\s*\(/.test(value) ||
    /\b_jsxs\s*\(/.test(value) ||
    /react\/jsx-runtime/.test(value)
  );
}

function looksLikeLeakedModuleCode(value: string): boolean {
  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(value) ||
    /\bmodule\.exports\b/.test(value) ||
    /\bexports\.[A-Za-z_$]/.test(value) ||
    /\b__esModule\b/.test(value) ||
    /\brequire\s*\(/.test(value)
  );
}

// Known components in the registry (from components/mdx/registry.tsx)
const KNOWN_COMPONENTS = new Set([
  "Badge", "BadgeRow", "BrandFrame", "BriefAlert", "BriefSummaryCard",
  "Callout", "Caption", "CTA", "CTAPreset", "CtaPresetComponent",
  "Divider", "DownloadCard", "EmbossedBrandMark", "Grid", "HeroEyebrow",
  "JsonLd", "LexiconLink", "Note", "ProcessSteps", "PullLine", "Quote",
  "ResourcesCTA", "Responsibility", "ResponsibilityGrid", "Rule",
  "ShareRow", "Step", "Verse",
  // Aliases
  "Alert", "ProTip", "Tip", "Warning",
  // Common MDX/HTML elements that are fine
  "Image", "Link", "DocumentFooter",
  // Divider variants
  "SectionBreak", "PullQuote", "Blockquote",
]);

// ---------------------------------------------------------------------------
// Audit logic
// ---------------------------------------------------------------------------

function auditDocument(
  doc: any,
  indexFile: string,
): Finding[] {
  const findings: Finding[] = [];
  const title = doc.title || doc.slug || doc._raw?.flattenedPath || "Unknown";
  const docId = `${indexFile}:${title}`;

  const bodyCode = typeof doc?.body?.code === "string" ? doc.body.code.trim() : "";
  const bodyRaw = typeof doc?.body?.raw === "string" ? doc.body.raw.trim() : "";

  // Check 1: Empty body
  if (!bodyCode && !bodyRaw) {
    findings.push({
      severity: "warning",
      file: docId,
      title,
      message: "Document has no body content (neither compiled nor raw)",
    });
    return findings;
  }

  // Check 2: Leaked module code
  if (bodyCode && looksLikeLeakedModuleCode(bodyCode)) {
    findings.push({
      severity: "error",
      file: docId,
      title,
      message: "body.code contains leaked CommonJS module code",
      detail: bodyCode.slice(0, 200),
    });
  }

  // Check 3: body.code not compiled
  if (bodyCode && !looksLikeCompiledMdx(bodyCode) && !looksLikeLeakedModuleCode(bodyCode)) {
    findings.push({
      severity: "warning",
      file: docId,
      title,
      message: "body.code does not look like compiled MDX — will use fallback renderer",
    });
  }

  // Check 4: Unknown components in raw content
  if (bodyRaw) {
    const componentRefs = bodyRaw.match(/<([A-Z][A-Za-z0-9._-]*)\b/g);
    if (componentRefs) {
      const names = new Set<string>(componentRefs.map((m: string) => m.slice(1)));
      const unknown = [...names].filter((n) => !KNOWN_COMPONENTS.has(n));
      if (unknown.length > 0) {
        findings.push({
          severity: "warning",
          file: docId,
          title,
          message: `Unknown MDX components referenced: ${unknown.join(", ")}`,
        });
      }
    }

    // Check 5: Unclosed JSX tags
    const openTags = bodyRaw.match(/<([A-Z][A-Za-z0-9._-]*)\b[^/]*>/g) || [];
    const closeTags = bodyRaw.match(/<\/([A-Z][A-Za-z0-9._-]*)>/g) || [];
    const selfClose = bodyRaw.match(/<[A-Z][A-Za-z0-9._-]*\b[^>]*\/>/g) || [];

    const openCount = openTags.length;
    const closeCount = closeTags.length;
    const selfCloseCount = selfClose.length;

    if (openCount > closeCount + selfCloseCount) {
      findings.push({
        severity: "warning",
        file: docId,
        title,
        message: `Possible unclosed JSX tags (${openCount} open, ${closeCount} close, ${selfCloseCount} self-close)`,
      });
    }

    // Check 6: Dangerous HTML (script/iframe/object/embed = error; style = warning)
    const dangerousHtml = bodyRaw.match(/<(script|iframe|object|embed)\b/gi);
    if (dangerousHtml) {
      findings.push({
        severity: "error",
        file: docId,
        title,
        message: `Dangerous HTML elements found: ${dangerousHtml.join(", ")}`,
      });
    }
    const styleHtml = bodyRaw.match(/<style\b/gi);
    if (styleHtml) {
      findings.push({
        severity: "warning",
        file: docId,
        title,
        message: "Contains <style> tag — review for appropriateness",
      });
    }
  }

  return findings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const generatedRoot = path.join(process.cwd(), ".contentlayer", "generated");

  if (!fs.existsSync(generatedRoot)) {
    console.error("[mdx-audit] .contentlayer/generated not found. Run contentlayer build first.");
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(generatedRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  const allFindings: Finding[] = [];
  let totalDocs = 0;

  for (const dir of dirs) {
    const indexPath = path.join(generatedRoot, dir.name, "_index.json");
    if (!fs.existsSync(indexPath)) continue;

    try {
      const raw = fs.readFileSync(indexPath, "utf8");
      const data = JSON.parse(raw);
      const docs: any[] = Array.isArray(data)
        ? data
        : data.documents || data.allDocuments || [];

      totalDocs += docs.length;

      for (const doc of docs) {
        allFindings.push(...auditDocument(doc, `${dir.name}/_index.json`));
      }
    } catch (err) {
      console.error(`[mdx-audit] Failed to parse ${dir.name}/_index.json:`, err);
    }
  }

  // Report
  const errors = allFindings.filter((f) => f.severity === "error");
  const warnings = allFindings.filter((f) => f.severity === "warning");

  console.log(`\n[mdx-audit] Scanned ${totalDocs} documents across ${dirs.length} collections\n`);

  if (errors.length > 0) {
    console.error(`  ERRORS: ${errors.length}`);
    for (const f of errors) {
      console.error(`    [ERROR] ${f.title}: ${f.message}`);
      if (f.detail) console.error(`            ${f.detail.slice(0, 100)}...`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`  WARNINGS: ${warnings.length}`);
    for (const f of warnings) {
      console.warn(`    [WARN] ${f.title}: ${f.message}`);
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log("  All documents passed audit.\n");
  }

  console.log("");

  // Exit with error code if errors found
  if (errors.length > 0) {
    process.exit(1);
  }
}

main();
