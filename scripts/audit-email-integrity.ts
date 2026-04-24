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
const TEMPLATE_DIRS = ["emails", "components/emails", "lib/email/templates"];
const EMAIL_RELEVANT_PATHS = new Set([
  CORE_SENDER,
  TEMPLATE_REGISTRY,
  "lib/email/sendInnerCircleEmail.ts",
  "lib/email/dispatcher.ts",
  "lib/access/invite-mail.ts",
  "lib/mail.ts",
  "lib/mail/enterprise-mail-service.ts",
  "lib/alignment/campaign-actions.ts",
  "pages/api/contact.ts",
  "pages/api/newsletter.tsx",
  "pages/api/verify-newsletter.ts",
  "pages/api/admin/auth/send-link.ts",
  "pages/api/inner-circle/register.ts",
  "pages/api/inner-circle/resend.ts",
  "pages/api/admin/invites/create.ts",
  "app/api/campaigns/[id]/invite/route.ts",
  "app/api/campaigns/[id]/nudge/route.ts",
  "app/api/alignment/enterprise/campaigns/[id]/notify/route.ts",
  "app/api/alignment/enterprise/campaigns/[id]/nudge/route.ts",
  "lib/strategy-room/enrol-core.ts",
  "lib/email/links.ts",
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

for (const [file, content] of contentByFile.entries()) {
  const relative = rel(file);
  const isTemplate = TEMPLATE_DIRS.some((dir) => relative.startsWith(`${dir}/`));
  if (!EMAIL_RELEVANT_PATHS.has(relative) && !isTemplate) continue;

  if (relative !== CORE_SENDER) {
    if (/new Resend\(/.test(content) || /resend\.emails\.send\(/.test(content) || /fetch\(\s*["']https:\/\/api\.resend\.com\/emails["']/.test(content)) {
      addFinding(
        findings,
        "Direct Resend send path outside core sender",
        file,
        "critical",
        `Route or adapter must call ${CORE_SENDER}.`,
      );
    }
  }

  if (content.includes("/checkout?slug=")) {
    addFinding(findings, "Dead checkout slug link in email-related file", file, "critical", "Replace with a verified route.");
  }
  if (content.includes("/api/downloads/")) {
    addFinding(findings, "API download route referenced in email-related file", file, "high", "Use public route or remove the link.");
  }
  if (/\/downloads\/[A-Za-z0-9._-]+\.pdf/.test(content)) {
    addFinding(findings, "Hard-coded PDF route in email-related file", file, "high", "Use EmailLinks downloads() route.");
  }
  if (/["'`](?:https?:\/\/[^"'`]+)?\/consulting\/strategy-room/.test(content)) {
    addFinding(findings, "Deprecated Strategy Room route referenced", file, "high", "Replace with /strategy-room or EmailLinks.strategyRoom.");
  }
  if (content.includes("window.prompt")) {
    addFinding(findings, "Browser prompt hack present", file, "medium", "Replace with embedded UI state.");
  }
}

const registryContent = contentByFile.get(path.join(ROOT, TEMPLATE_REGISTRY)) || "";
for (const templateDir of TEMPLATE_DIRS) {
  for (const file of walk(path.join(ROOT, templateDir)).filter((item) => /\.(ts|tsx)$/i.test(item))) {
    const relative = rel(file);
    const basename = path.basename(relative, path.extname(relative));
    if (relative === TEMPLATE_REGISTRY || relative === CORE_SENDER) continue;
    const referencedInRegistry =
      registryContent.includes(basename) || registryContent.includes(relative.split("/").pop() || "");
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

if (!findings.length) {
  console.log("No email integrity findings.");
  process.exit(0);
}

console.table(findings);

const blocking = findings.filter((item) => item.severity !== "medium");
if (blocking.length) {
  process.exit(1);
}
