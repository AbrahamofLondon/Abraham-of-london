import fs from "fs";
import path from "path";
import crypto from "crypto";

export type PremiumAssetBackend = "local-private" | "local-public";

export type PremiumAssetRecord = {
  id: string;
  title: string;
  relativePath: string;
  absolutePath: string;
  mimeType: string;
  filename: string;
  exists: boolean;
  size?: number;
  sizeBytes?: number;
  checksumSha256?: string;
  backend: PremiumAssetBackend;
};

const PRIVATE_PREMIUM_ROOT = path.join(
  process.cwd(),
  "private_storage",
  "premium-content",
);

const PUBLIC_DOWNLOADS_ROOT = path.join(
  process.cwd(),
  "public",
  "assets",
  "downloads",
);

function safeBasename(input: string): string {
  return String(input || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop() || "";
}

function inferMimeType(fileName: string): string {
  const lower = String(fileName || "").toLowerCase();

  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".pptx")) {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (lower.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";

  return "application/octet-stream";
}

function ensureSafeRelativePath(relativePath: string): string {
  const clean = String(relativePath || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");

  if (!clean) {
    throw new Error("[PREMIUM_ASSET] Empty relative path");
  }

  if (clean.includes("\0") || clean.includes("..")) {
    throw new Error("[PREMIUM_ASSET] Unsafe relative path");
  }

  return clean;
}

function assertWithinRoot(root: string, absolutePath: string): void {
  const normalizedRoot = path.normalize(root + path.sep);
  const normalizedAbsolute = path.normalize(absolutePath);

  if (!normalizedAbsolute.startsWith(normalizedRoot)) {
    throw new Error("[PREMIUM_ASSET] Path escaped permitted root");
  }
}

function resolvePrivateAssetPath(relativePath: string): string {
  const safeRelative = ensureSafeRelativePath(relativePath);
  const absolute = path.join(PRIVATE_PREMIUM_ROOT, safeRelative);
  assertWithinRoot(PRIVATE_PREMIUM_ROOT, absolute);
  return absolute;
}

function resolvePublicAssetPath(relativePath: string): string {
  const safeRelative = ensureSafeRelativePath(relativePath);
  const absolute = path.join(PUBLIC_DOWNLOADS_ROOT, safeRelative);
  assertWithinRoot(PUBLIC_DOWNLOADS_ROOT, absolute);
  return absolute;
}

function statIfFile(absolutePath: string): fs.Stats | null {
  try {
    const stat = fs.statSync(absolutePath);
    return stat.isFile() ? stat : null;
  } catch {
    return null;
  }
}

function computeFileSha256Sync(absolutePath: string): string {
  const hash = crypto.createHash("sha256");
  const buffer = fs.readFileSync(absolutePath);
  hash.update(buffer);
  return hash.digest("hex");
}

/**
 * Resolve candidate locations in priority order.
 *
 * Priority:
 * 1. private_storage/premium-content/<relativePath>
 * 2. public/assets/downloads/<relativePath>
 *
 * This lets you publish richer flagship artifacts like PPTX now,
 * without forcing an immediate storage migration.
 */
function resolveAssetCandidate(relativePath: string): {
  absolutePath: string;
  backend: PremiumAssetBackend;
  exists: boolean;
  stat: fs.Stats | null;
} {
  const safeRelative = ensureSafeRelativePath(relativePath);

  const privatePath = resolvePrivateAssetPath(safeRelative);
  const privateStat = statIfFile(privatePath);
  if (privateStat) {
    return {
      absolutePath: privatePath,
      backend: "local-private",
      exists: true,
      stat: privateStat,
    };
  }

  const publicPath = resolvePublicAssetPath(safeRelative);
  const publicStat = statIfFile(publicPath);
  if (publicStat) {
    return {
      absolutePath: publicPath,
      backend: "local-public",
      exists: true,
      stat: publicStat,
    };
  }

  return {
    absolutePath: privatePath,
    backend: "local-private",
    exists: false,
    stat: null,
  };
}

export async function getPremiumAssetRecord(input: {
  id: string;
  title?: string;
  relativePath: string;
  mimeType?: string;
  filename?: string;
}): Promise<PremiumAssetRecord> {
  const relativePath = ensureSafeRelativePath(input.relativePath);

  const filename =
    typeof input.filename === "string" && input.filename.trim()
      ? input.filename.trim()
      : safeBasename(relativePath);

  const mimeType =
    typeof input.mimeType === "string" && input.mimeType.trim()
      ? input.mimeType.trim()
      : inferMimeType(filename);

  const candidate = resolveAssetCandidate(relativePath);

  return {
    id: String(input.id),
    title: input.title || String(input.id),
    relativePath,
    absolutePath: candidate.absolutePath,
    mimeType,
    filename,
    exists: candidate.exists,
    size: candidate.stat?.size,
    sizeBytes: candidate.stat?.size,
    checksumSha256:
      candidate.exists && candidate.stat ? computeFileSha256Sync(candidate.absolutePath) : undefined,
    backend: candidate.backend,
  };
}

export async function readPremiumAssetBuffer(relativePath: string): Promise<Buffer> {
  const candidate = resolveAssetCandidate(relativePath);

  if (!candidate.exists) {
    throw new Error(`[PREMIUM_ASSET] Asset not found: ${relativePath}`);
  }

  return fs.promises.readFile(candidate.absolutePath);
}

export function createLocalReadStream(relativePath: string): fs.ReadStream {
  const candidate = resolveAssetCandidate(relativePath);

  if (!candidate.exists) {
    throw new Error(`[PREMIUM_ASSET] Asset not found: ${relativePath}`);
  }

  return fs.createReadStream(candidate.absolutePath);
}

export async function computeBufferSha256(buffer: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function premiumAssetExists(relativePath: string): boolean {
  return resolveAssetCandidate(relativePath).exists;
}

export function getPremiumAssetRoots(): {
  privateRoot: string;
  publicDownloadsRoot: string;
} {
  return {
    privateRoot: PRIVATE_PREMIUM_ROOT,
    publicDownloadsRoot: PUBLIC_DOWNLOADS_ROOT,
  };
}