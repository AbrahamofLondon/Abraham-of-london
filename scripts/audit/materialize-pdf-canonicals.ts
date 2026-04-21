import fs from "fs";
import path from "path";

import {
  buildDuplicateGroups,
  groupBy,
  publicUrlToAbs,
  scanPublicPdfAssets,
  writeJsonReport,
  type DuplicateGroup,
  type PdfAssetRecord,
} from "./pdf-audit-shared";

type ActionRecord = {
  action: "copied_canonical" | "overwrote_canonical" | "deleted_identical_alias" | "archived_duplicate";
  from: string;
  to?: string;
  slug: string;
  reason: string;
};

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const ARCHIVE_ROOT = path.join(PUBLIC_ROOT, "_archive", "pdfs");
const PROTECTED_PREFIXES = ["/vault/", "/resources/", "/prints/", "/lexicon/"];

function canonicalPathForFilename(filename: string): string {
  return `/assets/downloads/${filename.replace(/\.pdf$/i, "")}.pdf`;
}

function isProtected(publicUrl: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => publicUrl.startsWith(prefix));
}

function shaFor(publicUrl: string): string | null {
  const file = scanPublicPdfAssets().find((asset) => asset.publicUrl === publicUrl);
  return file?.sha256 || null;
}

function activeArchivePath(publicUrl: string): string {
  const relative = publicUrl.replace(/^\/+/, "");
  return path.join(ARCHIVE_ROOT, relative);
}

function ensureParent(file: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function sameBytes(a: string, b: string): boolean {
  if (!fs.existsSync(a) || !fs.existsSync(b)) return false;
  const left = fs.readFileSync(a);
  const right = fs.readFileSync(b);
  return left.length === right.length && left.equals(right);
}

function routeRedirectExists(from: string, to: string): boolean {
  try {
    const netlify = fs.readFileSync(path.join(process.cwd(), "netlify.toml"), "utf8");
    return netlify.includes(`from = "${from}"`) && netlify.includes(`to = "${to}"`);
  } catch {
    return false;
  }
}

function selectSource(group: DuplicateGroup) {
  const files = group.files;
  const canonical = files.find((file) => file.publicUrl === canonicalPathForFilename(group.filename));
  if (group.uniqueHashCount === 1) return canonical || files[0];

  const staticFiles = files.filter((file) => file.folderClass !== "generated_download");
  if (staticFiles.length > 0) {
    return (
      canonical ||
      staticFiles.sort((a, b) => {
        const order = ["canonical_download", "resource_pdf", "vault_pdf", "vault_brief_pdf", "print_pdf", "lexicon_pdf", "legacy_download", "other_pdf"];
        return order.indexOf(a.folderClass) - order.indexOf(b.folderClass) || a.publicUrl.localeCompare(b.publicUrl);
      })[0]
    );
  }

  return canonical || files.sort((a, b) => a.publicUrl.localeCompare(b.publicUrl))[0];
}

function materializeGroup(group: DuplicateGroup, actions: ActionRecord[]): void {
  const source = selectSource(group);
  if (!source) return;

  const slug = group.filename.replace(/\.pdf$/i, "");
  const targetUrl = canonicalPathForFilename(group.filename);
  const sourceAbs = publicUrlToAbs(source.publicUrl);
  const targetAbs = publicUrlToAbs(targetUrl);

  ensureParent(targetAbs);

  if (!fs.existsSync(targetAbs)) {
    fs.copyFileSync(sourceAbs, targetAbs);
    actions.push({
      action: "copied_canonical",
      from: source.publicUrl,
      to: targetUrl,
      slug,
      reason: "Physical canonical endpoint was missing.",
    });
  } else if (!sameBytes(sourceAbs, targetAbs)) {
    fs.copyFileSync(sourceAbs, targetAbs);
    actions.push({
      action: "overwrote_canonical",
      from: source.publicUrl,
      to: targetUrl,
      slug,
      reason: "Canonical endpoint did not match selected authority source.",
    });
  }
}

function materializeRecord(record: PdfAssetRecord, actions: ActionRecord[]): void {
  const targetUrl = canonicalPathForFilename(record.filename);
  const sourceAbs = publicUrlToAbs(record.publicUrl);
  const targetAbs = publicUrlToAbs(targetUrl);
  const slug = record.filename.replace(/\.pdf$/i, "");

  if (record.publicUrl === targetUrl) return;
  if (!fs.existsSync(sourceAbs)) return;

  ensureParent(targetAbs);
  if (!fs.existsSync(targetAbs)) {
    fs.copyFileSync(sourceAbs, targetAbs);
    actions.push({
      action: "copied_canonical",
      from: record.publicUrl,
      to: targetUrl,
      slug,
      reason: "Single active PDF was materialised at the canonical endpoint.",
    });
  }
}

function cleanupGroup(group: DuplicateGroup, actions: ActionRecord[]): void {
  const slug = group.filename.replace(/\.pdf$/i, "");
  const canonicalUrl = canonicalPathForFilename(group.filename);
  const canonicalAbs = publicUrlToAbs(canonicalUrl);
  if (!fs.existsSync(canonicalAbs)) return;

  const canonicalHash = shaFor(canonicalUrl);

  for (const file of group.files) {
    if (file.publicUrl === canonicalUrl) continue;
    if (isProtected(file.publicUrl)) continue;

    const sourceAbs = publicUrlToAbs(file.publicUrl);
    if (!fs.existsSync(sourceAbs)) continue;

    if (canonicalHash && file.sha256 === canonicalHash && routeRedirectExists(file.publicUrl, canonicalUrl)) {
      fs.unlinkSync(sourceAbs);
      actions.push({
        action: "deleted_identical_alias",
        from: file.publicUrl,
        slug,
        reason: "Byte-identical alias had a confirmed redirect to the canonical endpoint.",
      });
      continue;
    }

    const archiveAbs = activeArchivePath(file.publicUrl);
    ensureParent(archiveAbs);
    fs.renameSync(sourceAbs, archiveAbs);
    actions.push({
      action: "archived_duplicate",
      from: file.publicUrl,
      to: `/${path.relative(PUBLIC_ROOT, archiveAbs).replace(/\\/g, "/")}`,
      slug,
      reason: "Non-canonical duplicate retained outside active public surface.",
    });
  }
}

const actions: ActionRecord[] = [];

let groups = buildDuplicateGroups(scanPublicPdfAssets());
for (const group of groups) materializeGroup(group, actions);

const byFilename = groupBy(scanPublicPdfAssets(), (record) => record.filename.toLowerCase());
for (const files of byFilename.values()) {
  if (files.length === 1) materializeRecord(files[0]!, actions);
}

groups = buildDuplicateGroups(scanPublicPdfAssets());
for (const group of groups) cleanupGroup(group, actions);

const out = writeJsonReport("pdf-materialization-report.json", {
  generatedAt: new Date().toISOString(),
  totals: {
    actions: actions.length,
    copiedCanonical: actions.filter((action) => action.action === "copied_canonical").length,
    overwrittenCanonical: actions.filter((action) => action.action === "overwrote_canonical").length,
    deletedIdenticalAliases: actions.filter((action) => action.action === "deleted_identical_alias").length,
    archivedDuplicates: actions.filter((action) => action.action === "archived_duplicate").length,
  },
  actions,
});

console.log("[pdf:materialize] wrote", path.relative(process.cwd(), out));
console.log("[pdf:materialize] actions", actions.length);
