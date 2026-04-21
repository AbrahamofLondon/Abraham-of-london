import crypto from "crypto";
import fs from "fs";
import path from "path";

export type FolderClass =
  | "canonical_download"
  | "generated_download"
  | "legacy_download"
  | "resource_pdf"
  | "vault_pdf"
  | "vault_brief_pdf"
  | "print_pdf"
  | "lexicon_pdf"
  | "other_pdf";

export type CanonicalityStatus =
  | "candidate_canonical"
  | "generated"
  | "legacy_compatibility"
  | "specialty_route_asset"
  | "other";

export type PdfAssetRecord = {
  relativePath: string;
  publicUrl: string;
  filename: string;
  slugCandidate: string;
  folderClass: FolderClass;
  fileSizeBytes: number;
  sha256: string;
  canonicalityStatus: CanonicalityStatus;
  duplicateGroupId: string | null;
};

export type DuplicateGroup = {
  groupId: string;
  filename: string;
  classification:
    | "identical_duplicate"
    | "divergent_duplicate"
    | "generated_vs_static_conflict";
  recommendedAction:
    | "safe_redirect_candidate"
    | "manual_resolution_required"
    | "leave_untouched";
  recommendedCanonicalPath: string | null;
  uniqueHashCount: number;
  files: Array<{
    publicUrl: string;
    folderClass: FolderClass;
    canonicalityStatus: CanonicalityStatus;
    fileSizeBytes: number;
    sha256: string;
  }>;
};

export type PdfReferenceClassification =
  | "ok"
  | "missing"
  | "placeholder"
  | "private_registry_reference"
  | "comment_or_example"
  | "needs_manual_review";

export type PdfReference = {
  url: string;
  file: string;
  line: number;
  column: number;
  classification: PdfReferenceClassification;
  exists: boolean;
  note?: string;
};

export const REPO_ROOT = process.cwd();
export const PUBLIC_ROOT = path.join(REPO_ROOT, "public");
export const REPORTS_DIR = path.join(REPO_ROOT, "reports");

export const CANONICAL_DOWNLOAD_PREFIX = "/assets/downloads/";
export const GENERATED_PREFIXES = [
  "/assets/downloads/content-downloads/",
  "/assets/downloads/lib-pdf/",
];
export const LEGACY_DIRECT_PREFIXES = [
  "/downloads/",
  "/resources/",
  "/vault/",
  "/prints/",
  "/lexicon/",
  "/briefs/",
  "/strategy/",
];

export function ensureReportsDir(): void {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

export function toPublicUrl(absPath: string): string {
  return `/${path.relative(PUBLIC_ROOT, absPath).replace(/\\/g, "/")}`;
}

export function publicUrlToAbs(publicUrl: string): string {
  return path.join(PUBLIC_ROOT, publicUrl.replace(/^\/+/, ""));
}

export function normalizePublicUrl(input: string): string {
  return `/${String(input || "").trim().replace(/\\/g, "/").replace(/^\/+/, "")}`;
}

export function slugCandidateFromFilename(filename: string): string {
  return filename.replace(/\.pdf$/i, "");
}

export function sha256File(absPath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(absPath)).digest("hex");
}

export function walkFiles(root: string, predicate: (absPath: string) => boolean): string[] {
  if (!fs.existsSync(root)) return [];

  const out: string[] = [];
  const stack = [root];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;

    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", ".contentlayer", ".git"].includes(entry.name)) continue;
        stack.push(abs);
      } else if (entry.isFile() && predicate(abs)) {
        out.push(abs);
      }
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

export function classifyFolder(publicUrl: string): FolderClass {
  const url = normalizePublicUrl(publicUrl);

  if (/^\/assets\/downloads\/[^/]+\.pdf$/i.test(url)) return "canonical_download";
  if (url.startsWith("/assets/downloads/content-downloads/")) return "generated_download";
  if (url.startsWith("/assets/downloads/lib-pdf/")) return "generated_download";
  if (url.startsWith("/downloads/")) return "legacy_download";
  if (url.startsWith("/resources/") || url.startsWith("/assets/resources/pdfs/")) return "resource_pdf";
  if (url.startsWith("/vault/briefs/")) return "vault_brief_pdf";
  if (url.startsWith("/vault/") || url.startsWith("/assets/vault/")) return "vault_pdf";
  if (url.startsWith("/prints/")) return "print_pdf";
  if (url.startsWith("/lexicon/") || url.startsWith("/assets/downloads/lexicon/")) return "lexicon_pdf";

  return "other_pdf";
}

export function canonicalityStatus(publicUrl: string): CanonicalityStatus {
  const folderClass = classifyFolder(publicUrl);
  if (folderClass === "canonical_download") return "candidate_canonical";
  if (folderClass === "generated_download") return "generated";
  if (folderClass === "legacy_download") return "legacy_compatibility";
  if (
    folderClass === "resource_pdf" ||
    folderClass === "vault_pdf" ||
    folderClass === "vault_brief_pdf" ||
    folderClass === "print_pdf" ||
    folderClass === "lexicon_pdf"
  ) {
    return "specialty_route_asset";
  }
  return "other";
}

export function scanPublicPdfAssets(): PdfAssetRecord[] {
  const files = walkFiles(PUBLIC_ROOT, (abs) => abs.toLowerCase().endsWith(".pdf"));
  const records = files.map((abs) => {
    const publicUrl = toPublicUrl(abs);
    const filename = path.basename(abs);
    return {
      relativePath: path.relative(REPO_ROOT, abs).replace(/\\/g, "/"),
      publicUrl,
      filename,
      slugCandidate: slugCandidateFromFilename(filename),
      folderClass: classifyFolder(publicUrl),
      fileSizeBytes: fs.statSync(abs).size,
      sha256: sha256File(abs),
      canonicalityStatus: canonicalityStatus(publicUrl),
      duplicateGroupId: null,
    } satisfies PdfAssetRecord;
  });

  const byFilename = groupBy(records, (record) => record.filename.toLowerCase());
  return records.map((record) => {
    const key = record.filename.toLowerCase();
    const duplicateGroupId = (byFilename.get(key)?.length || 0) > 1 ? `filename:${key}` : null;
    return { ...record, duplicateGroupId };
  });
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key) || [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

export function chooseCanonicalPath(files: PdfAssetRecord[]): string | null {
  const canonical = files
    .filter((file) => file.folderClass === "canonical_download")
    .sort((a, b) => a.publicUrl.localeCompare(b.publicUrl))[0];

  if (canonical) return canonical.publicUrl;

  const generated = files
    .filter((file) => file.folderClass === "generated_download")
    .sort((a, b) => a.publicUrl.localeCompare(b.publicUrl))[0];

  return generated?.publicUrl || null;
}

export function buildDuplicateGroups(records: PdfAssetRecord[]): DuplicateGroup[] {
  const byFilename = groupBy(records, (record) => record.filename.toLowerCase());
  const groups: DuplicateGroup[] = [];

  for (const [filenameKey, files] of byFilename.entries()) {
    if (files.length < 2) continue;

    const uniqueHashes = Array.from(new Set(files.map((file) => file.sha256)));
    const hasGenerated = files.some((file) => file.folderClass === "generated_download");
    const hasStatic = files.some((file) => file.folderClass !== "generated_download");
    const classification =
      uniqueHashes.length === 1
        ? "identical_duplicate"
        : hasGenerated && hasStatic
        ? "generated_vs_static_conflict"
        : "divergent_duplicate";
    const recommendedCanonicalPath = chooseCanonicalPath(files);

    groups.push({
      groupId: `filename:${filenameKey}`,
      filename: files[0]?.filename || filenameKey,
      classification,
      recommendedAction:
        classification === "identical_duplicate" && recommendedCanonicalPath
          ? "safe_redirect_candidate"
          : "manual_resolution_required",
      recommendedCanonicalPath,
      uniqueHashCount: uniqueHashes.length,
      files: files
        .map((file) => ({
          publicUrl: file.publicUrl,
          folderClass: file.folderClass,
          canonicalityStatus: file.canonicalityStatus,
          fileSizeBytes: file.fileSizeBytes,
          sha256: file.sha256,
        }))
        .sort((a, b) => a.publicUrl.localeCompare(b.publicUrl)),
    });
  }

  return groups.sort((a, b) => a.filename.localeCompare(b.filename));
}

export function isLegacyDirectFileUrl(publicUrl: string): boolean {
  const url = normalizePublicUrl(publicUrl);
  return LEGACY_DIRECT_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function isCandidateCanonicalUrl(publicUrl: string): boolean {
  return /^\/assets\/downloads\/[^/]+\.pdf$/i.test(normalizePublicUrl(publicUrl));
}

export function sourceFilesForLinkScan(): string[] {
  const roots = ["app", "pages", "components", "lib", "content"];
  const exts = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);
  const files = roots.flatMap((root) =>
    walkFiles(path.join(REPO_ROOT, root), (abs) => exts.has(path.extname(abs).toLowerCase())),
  );
  const netlifyToml = path.join(REPO_ROOT, "netlify.toml");
  if (fs.existsSync(netlifyToml)) files.push(netlifyToml);
  return files.sort((a, b) => a.localeCompare(b));
}

export function lineAndColumnForIndex(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index);
  const lines = before.split(/\r?\n/);
  return {
    line: lines.length,
    column: (lines[lines.length - 1]?.length || 0) + 1,
  };
}

export function lineAt(text: string, lineNumber: number): string {
  return text.split(/\r?\n/)[lineNumber - 1] || "";
}

export function isLikelyCommentOrExample(file: string, line: string): boolean {
  const normalized = line.trim().toLowerCase();
  const normalizedFile = file.replace(/\\/g, "/").toLowerCase();

  if (normalizedFile.includes("/components/downloads/template_filename")) return true;
  if (normalizedFile.includes("/components/downloads/the-file-slug")) return true;

  return (
    normalized.startsWith("//") ||
    normalized.startsWith("*") ||
    normalized.startsWith("/*") ||
    normalized.includes(" e.g.") ||
    normalized.includes("example") ||
    normalized.includes("placeholder")
  );
}

export function isPlaceholderUrl(publicUrl: string): boolean {
  const url = publicUrl.toLowerCase();
  return (
    url.includes("sample.pdf") ||
    url.includes("foo.pdf") ||
    url.includes("the-file-slug.pdf") ||
    url.includes("template.pdf")
  );
}

export function isPrivateRegistryReference(file: string, publicUrl: string): boolean {
  const normalizedFile = file.replace(/\\/g, "/").toLowerCase();
  const url = publicUrl.toLowerCase();
  return (
    normalizedFile.endsWith("lib/premium/content-registry.ts") &&
    (url === "/ultimate-purpose-of-man-editorial.pdf" || url === "/intel-2026-q1.pdf")
  );
}

export function classifyPdfReference(params: {
  file: string;
  lineText: string;
  publicUrl: string;
  exists: boolean;
}): { classification: PdfReferenceClassification; note?: string } {
  const { file, lineText, publicUrl, exists } = params;

  if (exists) return { classification: "ok" };
  if (isPrivateRegistryReference(file, publicUrl)) {
    return { classification: "private_registry_reference", note: "Private storage relative path, not a public URL." };
  }
  if (isLikelyCommentOrExample(file, lineText)) {
    return { classification: "comment_or_example", note: "Comment, example, or template reference." };
  }
  if (isPlaceholderUrl(publicUrl)) {
    return { classification: "placeholder", note: "Explicit placeholder/template asset reference." };
  }

  return { classification: "missing" };
}

export function writeJsonReport(fileName: string, value: unknown): string {
  ensureReportsDir();
  const out = path.join(REPORTS_DIR, fileName);
  fs.writeFileSync(out, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return out;
}
