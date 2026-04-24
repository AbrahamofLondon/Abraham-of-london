/**
 * scripts/audit-email-integrity.ts
 *
 * Enforces the email consolidation contract:
 * 1. Only lib/email/core/sendEmail.ts may use Resend directly
 * 2. All templates must be registered in lib/email/templates/index.ts
 * 3. No hardcoded internal URLs in templates — must use EmailLinks
 * 4. No orphaned template files
 * 5. All adapters return structured SendEmailResult
 */

import fs from "fs";
import path from "path";

type Severity = "critical" | "high" | "medium";

type Finding = {
  finding: string;
  file: string;
  severity: Severity;
  suggestedFix: string;
};

const ROOT = process.cwd();
const SEARCH_DIRS = ["app", "pages", "lib", "emails", "components"];
const CORE_SENDER = "lib/email/core/sendEmail.ts";
const TEMPLATE_REGISTRY = "lib/email/templates/index.ts";
const LINKS_MODULE = "lib/email/links.ts";
const TEMPLATE_DIRS = ["emails", "components/emails", "lib/email/templates"];

// All files that are expected to send or handle emails
const EMAIL_RELEVANT_PATHS = new Set([
  CORE_SENDER,
  TEMPLATE_REGISTRY,
  LINKS_MODULE,
  "lib/email/sendInnerCircleEmail.ts",
  "lib/email/sendInnerCircleEmail.d.ts",
  "lib/mail.ts",
  "lib/mail/enterprise-mail-service.ts",
  "pages/api/contact.ts",
  "pages/api/inner-circle/register.ts",
  "pages/api/inner-circle/resend.ts",
  "lib/strategy-room/enrol-core.ts",
  "app/api/alignment/enterprise/campaigns/[id]/notify/route.ts",
  "app/api/alignment/enterprise/campaigns/[id]/nudge/route.ts",
  "app/actions/request-access.ts",
]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".git", ".next"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function rel(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function addFinding(
  findings: Finding[],
  finding: string,
  file: string,
  severity: Severity,
  suggestedFix: string,
) {
  findings.push({ finding, file: rel(file), severity, suggestedFix });
}

const files = SEARCH_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))).filter((file) =>
  /\.(ts|tsx|js|jsx|txt)$/i.test(file),
);

const contentByFile = new Map(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const findings: Finding[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 3: Only sendEmail.ts may use Resend directly
// ─────────────────────────────────────────────────────────────────────────────
for (const [file, content] of contentByFile.entries()) {
  const relative = rel(file);

  if (relative === CORE_SENDER) continue;

  if (
    /new Resend\(/.test(content) ||
    /resend\.emails\.send\(/.test(content) ||
    /fetch\(\s*["']https:\/\/api\.resend\.com\/emails["']/.test(content)
  ) {
    addFinding(
      findings,
      "Direct Resend send path outside core sender",
      file,
      "critical",
      `Route or adapter must call ${CORE_SENDER}.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 4: Routes must not import templates directly — must go through registry
// ─────────────────────────────────────────────────────────────────────────────
for (const [file, content] of contentByFile.entries()) {
  const relative = rel(file);

  // Skip the registry itself and the core sender
  if (relative === TEMPLATE_REGISTRY || relative === CORE_SENDER) continue;

  // Only check files in app/, pages/, lib/ (not templates themselves)
  const isRouteOrLib = relative.startsWith("app/") || relative.startsWith("pages/") || relative.startsWith("lib/");
  if (!isRouteOrLib) continue;

  // Check for direct imports from template directories
  const templateImportPatterns = [
    /from\s+["']@\/emails\//,
    /from\s+["']\.\.\/\.\.\/emails\//,
    /from\s+["']@\/components\/emails\//,
    /from\s+["']\.\.\/components\/emails\//,
  ];

  for (const pattern of templateImportPatterns) {
    if (pattern.test(content)) {
      addFinding(
        findings,
        "Route imports email template directly instead of through template registry",
        file,
        "critical",
        `Import from ${TEMPLATE_REGISTRY} instead.`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 5: No hardcoded internal URLs inside email templates
// ─────────────────────────────────────────────────────────────────────────────
const linksContent = contentByFile.get(path.join(ROOT, LINKS_MODULE)) || "";

for (const [file, content] of contentByFile.entries()) {
  const relative = rel(file);
  const isTemplate = TEMPLATE_DIRS.some((dir) => relative.startsWith(`${dir}/`));
  if (!isTemplate) continue;

  // Check for hardcoded paths that should use EmailLinks
  const hardcodedPatterns = [
    { pattern: /\/downloads\/[A-Za-z0-9._-]+\.pdf/, desc: "Hard-coded PDF path" },
    { pattern: /\/api\/downloads\//, desc: "API download route" },
    { pattern: /\/checkout\?slug=/, desc: "Hardcoded checkout slug" },
    { pattern: /\/consulting\/strategy-room/, desc: "Deprecated strategy-room route" },
  ];

  for (const { pattern, desc } of hardcodedPatterns) {
    if (pattern.test(content)) {
      addFinding(
        findings,
        `${desc} in template — must use EmailLinks`,
        file,
        "high",
        `Replace with EmailLinks.${desc.toLowerCase().replace(/\s+/g, "_")}() from ${LINKS_MODULE}.`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 6: Verify all templates are registered in the registry
// ─────────────────────────────────────────────────────────────────────────────
const registryContent = contentByFile.get(path.join(ROOT, TEMPLATE_REGISTRY)) || "";

for (const templateDir of TEMPLATE_DIRS) {
  for (const file of walk(path.join(ROOT, templateDir)).filter((item) => /\.(ts|tsx)$/i.test(item))) {
    const relative = rel(file);
    const basename = path.basename(relative, path.extname(relative));

    // Skip the registry itself and the core sender
    if (relative === TEMPLATE_REGISTRY || relative === CORE_SENDER) continue;

    // Check if the template is referenced in the registry
    const referencedInRegistry =
      registryContent.includes(basename) ||
      registryContent.includes(relative.split("/").pop() || "");

    if (!referencedInRegistry) {
      addFinding(
        findings,
        "Template exists without template-registry registration",
        file,
        "high",
        `Register in ${TEMPLATE_REGISTRY} or delete it.`,
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 7: All senders must return structured SendEmailResult (not void)
// ─────────────────────────────────────────────────────────────────────────────
// This is a code review check — we verify the known adapters return structured results
const ADAPTERS_TO_CHECK: Array<{ path: string; isBarrel?: boolean }> = [
  { path: "lib/email/core/sendEmail.ts" },
  { path: "lib/email/sendInnerCircleEmail.ts" },
  { path: "lib/mail.ts", isBarrel: true },
  { path: "lib/mail/enterprise-mail-service.ts" },
];

for (const adapter of ADAPTERS_TO_CHECK) {
  const adapterPath = path.join(ROOT, adapter.path);
  if (!fs.existsSync(adapterPath)) {
    addFinding(
      findings,
      "Expected adapter file not found",
      adapterPath,
      "high",
      `Recreate or remove reference from audit script.`,
    );
    continue;
  }

  // Re-export barrels delegate to the real implementation — skip content check
  if (adapter.isBarrel) continue;

  const content = contentByFile.get(adapterPath) || "";
  // Check that exported functions return a structured result type
  if (!content.includes("ok:") || !content.includes("provider:")) {
    addFinding(
      findings,
      "Adapter does not return structured SendEmailResult",
      adapterPath,
      "critical",
      `Must return { ok: boolean; provider: "resend"; error?: string }.`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSTREAM 8: Check for orphaned .backup / .surgical / stale files
// ─────────────────────────────────────────────────────────────────────────────
const STALE_PATTERNS = [/.backup/, /.surgical/, /_DEPRECATED/, /\.old\./];
for (const [file] of contentByFile) {
  const relative = rel(file);
  const isStale = STALE_PATTERNS.some((p) => p.test(relative));
  if (isStale && relative.startsWith("lib/email")) {
    addFinding(
      findings,
      "Stale/backup file remains in email directory",
      file,
      "medium",
      "Delete this file — it has no operational purpose.",
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────────────────────
if (!findings.length) {
  console.log("✅ EMAIL INTEGRITY: PASS — No findings.");
  process.exit(0);
}

console.log(`\n❌ EMAIL INTEGRITY: ${findings.length} finding(s):\n`);
console.table(findings);

const blocking = findings.filter((item) => item.severity !== "medium");
if (blocking.length) {
  console.error(`\n❌ ${blocking.length} blocking finding(s) — FAIL.\n`);
  process.exit(1);
}

console.log("\n⚠️  Non-blocking findings only — PASS with warnings.\n");
process.exit(0);