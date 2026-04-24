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
const EMAIL_TEMPLATE_DIR = path.join(ROOT, "emails");
const EMAIL_RELEVANT_PATHS = [
  "pages/api/contact.ts",
  "lib/inner-circle/email.ts",
  "pages/api/inner-circle/resend.ts",
  "pages/api/inner-circle/register.ts",
  "lib/email/sendInnerCircleEmail.ts",
  "lib/access/invite-mail.ts",
  "lib/mail/enterprise-mail-service.ts",
  "lib/email/dispatcher.ts",
];

const findings: Finding[] = [];

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function addFinding(finding: string, file: string, severity: Severity, suggestedFix: string) {
  findings.push({ finding, file: relative(file), severity, suggestedFix });
}

const allFiles = SEARCH_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));
const textFiles = allFiles.filter((file) => /\.(ts|tsx|js|jsx|md|mdx|txt)$/i.test(file));
const auditFiles = textFiles.filter((file) => {
  const rel = relative(file);
  return rel.startsWith("emails/")
    || rel.startsWith("components/emails/")
    || EMAIL_RELEVANT_PATHS.includes(rel);
});
const sourceMap = new Map<string, string>();
for (const file of auditFiles) {
  sourceMap.set(file, fs.readFileSync(file, "utf8"));
}

for (const [file, content] of sourceMap.entries()) {
  const rel = relative(file);
  const deprecatedTemplate =
    (rel.startsWith("emails/") || rel.startsWith("components/emails/")) && /@deprecated/.test(content);
  if (content.includes("/api/downloads/")) {
    addFinding("Email or sender references /api/downloads/", file, "high", "Replace with verified public route or remove the link.");
  }
  if (content.includes("/checkout?slug=")) {
    addFinding("Email or sender references /checkout?slug=", file, "critical", "Replace with a verified commercial route or remove.");
  }
  if (content.includes("/consulting/strategy-room")) {
    addFinding("Deprecated Strategy Room path referenced", file, "high", "Replace with /strategy-room.");
  }
  if (content.includes("window.prompt")) {
    addFinding("Browser prompt hack present", file, "medium", "Replace with embedded UI state.");
  }
  if (
    /\/downloads\/[A-Za-z0-9._-]+\.pdf/.test(content) &&
    file.replace(/\\/g, "/").includes("/emails/") &&
    !deprecatedTemplate
  ) {
    addFinding("Hard-coded /downloads/*.pdf link in email template", file, "critical", "Use verified live route or canonical asset URL.");
  }
}

const emailTemplateFiles = walk(EMAIL_TEMPLATE_DIR).filter((file) => /\.(ts|tsx)$/i.test(file));
for (const templateFile of emailTemplateFiles) {
  const templateName = path.basename(templateFile, path.extname(templateFile));
  const templateContent = sourceMap.get(templateFile) || "";
  const importedSomewhere = [...sourceMap.entries()].some(([candidateFile, candidateContent]) => {
    if (candidateFile === templateFile) return false;
    return candidateContent.includes(`/${templateName}`) || candidateContent.includes(`"${templateName}"`) || candidateContent.includes(`'${templateName}'`);
  });
  const deprecated = /@deprecated/.test(templateContent);
  if (!importedSomewhere && !deprecated) {
    addFinding("Orphaned email template without deprecation marker", templateFile, "high", "Mark deprecated or wire to a live sender.");
  }
}

const resendWrappers = auditFiles.filter((file) => {
  const content = sourceMap.get(file) || "";
  return content.includes("resend.emails.send(") || content.includes("new Resend(");
});
if (resendWrappers.length > 1) {
  for (const file of resendWrappers) {
    addFinding("Multiple Resend send wrappers detected", file, "medium", "Keep for now, but consolidate to a single sender authority later.");
  }
}

if (!findings.length) {
  console.log("No email integrity findings.");
  process.exit(0);
}

console.table(findings);

const blocking = findings.filter((item) => {
  if (item.severity === "medium") return false;
  if (item.finding.includes("Orphaned email template") && (item.file.startsWith("emails/") || item.file.startsWith("components/emails/"))) return false;
  return true;
});
if (blocking.length) {
  process.exit(1);
}
