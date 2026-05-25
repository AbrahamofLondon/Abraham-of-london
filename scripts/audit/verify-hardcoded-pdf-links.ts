// scripts/audit/verify-hardcoded-pdf-links.ts
import fs from "node:fs";
import path from "node:path";

type Violation = {
  file: string;
  line: number;
  value: string;
  kind: "href" | "markdown" | "config" | "string";
};

const ROOT = process.cwd();

const SCAN_DIRS = [
  "components",
  "pages",
  "app",
  "content",
  "data",
];

const EXTRA_SCAN_FILES = [
  "lib/hero-banners.ts",
  "lib/editorial/catalogue.ts",
  "lib/editorial/discovery.ts",
  "lib/editorial/types.ts",
  "lib/decision/frontmatter-example.ts",
];

const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
]);

const ALLOWLIST_PATTERNS = [
  /reports\/.*\.json$/i,
  /docs\/program\//i,
  /lib\/pdf\/pdf-registry\.generated\.ts$/i,
  /lib\/pdf\/registry\.server\.ts$/i,
  /lib\/pdf-handler\.ts$/i,
  // The canonical download handler must construct the binary asset path internally
  // (it is the download handler — it is the correct place for this path).
  /pages\/downloads\/\[\.\.\.slug\]\.tsx$/i,
];

function shouldScanFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!EXTENSIONS.has(ext)) return false;
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (/^(app|pages)\/api\//.test(rel)) return false;
  return true;
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    } else if (entry.isFile() && shouldScanFile(full)) {
      out.push(full);
    }
  }

  return out;
}

function isAllowed(value: string): boolean {
  return ALLOWLIST_PATTERNS.some((pattern) => pattern.test(value));
}

function isAllowedFile(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return ALLOWLIST_PATTERNS.some((pattern) => pattern.test(normalized));
}

function looksLikeDirectPdfLink(value: string): boolean {
  const v = value.trim();
  if (!/(^|https?:\/\/|\.{0,2}\/|[A-Za-z0-9_-])[^"'`\s)]+\.pdf(?:[?#][^"'`\s)]*)?$/i.test(v)) return false;
  return true;
}

function collectViolations(filePath: string): Violation[] {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  if (isAllowedFile(rel)) return [];

  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const violations: Violation[] = [];

  const hrefPattern = /(?:href|src)\s*=\s*["'`]([^"'`]+\.pdf(?:[?#][^"'`]*)?)["'`]/gi;
  const configPattern = /(?:href|url|link|file|fileUrl|downloadUrl|previewUrl|pdfPath|path)\s*:\s*["'`]([^"'`]+\.pdf(?:[?#][^"'`]*)?)["'`]/gi;
  const markdownPattern = /\[[^\]]+\]\(([^)]+\.pdf(?:[?#][^)]+)?)\)/gi;
  const quotedStringPattern = /["'`]((?:https?:\/\/|\/|\.{1,2}\/)[^"'`]+\.pdf(?:[?#][^"'`]*)?)["'`]/gi;

  lines.forEach((line, index) => {
    for (const pattern of [hrefPattern, configPattern, markdownPattern, quotedStringPattern]) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(line)) !== null) {
        const value = match[1];
        if (!looksLikeDirectPdfLink(value)) continue;
        if (isAllowed(value)) continue;

        violations.push({
          file: rel,
          line: index + 1,
          value,
          kind:
            pattern === markdownPattern
              ? "markdown"
              : pattern === hrefPattern
                ? "href"
                : pattern === configPattern
                  ? "config"
                  : "string",
        });
      }
    }
  });

  return violations;
}

function main(): void {
  const files = [
    ...SCAN_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))),
    ...EXTRA_SCAN_FILES.map((file) => path.join(ROOT, file)).filter((file) => fs.existsSync(file) && shouldScanFile(file)),
  ];
  const violations = files.flatMap(collectViolations);
  const reportPath = path.join(ROOT, "reports", "pdf-link-verification.json");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scannedRoots: SCAN_DIRS,
        totals: {
          rawPdfLinks: violations.length,
          rawCanonicalDownloadLinks: violations.filter((v) => v.value.startsWith("/assets/downloads/")).length,
        },
        governance: {
          primaryUxDownloadSurface: violations.length === 0 ? "pass" : "fail",
          requiredSurface: "/downloads/{slug}",
          rawPdfLinks: violations,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  if (violations.length > 0) {
    console.error("Direct PDF links detected in primary UX sources:\n");
    for (const v of violations) {
      console.error(`- ${v.file}:${v.line} [${v.kind}] ${v.value}`);
    }
    process.exit(1);
  }

  console.log("No direct PDF links detected in primary UX sources.");
}

main();
