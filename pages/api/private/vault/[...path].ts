/* pages/api/private/vault/[...path].ts — SECURE VAULT STREAM (Node runtime) */

import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers, { requiredTierFromVaultPath } from "@/lib/access/tiers";
import { vaultRuntimeConfig } from "@/lib/runtime/vault-config";
import { getVaultManifestEntry } from "@/lib/runtime/vault-file-manifest";

const VAULT_ROOT = path.resolve("private", "vault");
const VAULT_FILE_PATHS: Readonly<Record<string, string>> = {
  "frameworks/inner-circle/operating-cadence-pack.pptx": path.resolve(
    "private",
    "vault",
    "frameworks",
    "inner-circle",
    "operating-cadence-pack.pptx",
  ),
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".zip":
      return "application/zip";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".epub":
      return "application/epub+zip";
    case ".json":
      return "application/json; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function normalizeVaultKey(parts: string[]): string | null {
  const clean = parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, "/"));

  if (!clean.length) return null;

  for (const seg of clean) {
    if (
      seg === "." ||
      seg === ".." ||
      seg.includes("..") ||
      seg.includes("\0") ||
      seg.startsWith("/") ||
      seg.startsWith("\\") ||
      seg.includes(":")
    ) {
      return null;
    }
  }

  return clean.join("/").replace(/\/{2,}/g, "/");
}

function safeResolveVaultPath(parts: string[]): string | null {
  const key = normalizeVaultKey(parts);
  if (!key) return null;

  const entry = getVaultManifestEntry(key);
  if (!entry) return null;

  const joined = VAULT_FILE_PATHS[entry.key];
  if (!joined) return null;

  const normalizedRoot = path.resolve(VAULT_ROOT);
  const normalizedJoined = path.resolve(joined);

  if (
    normalizedJoined !== normalizedRoot &&
    !normalizedJoined.startsWith(normalizedRoot + path.sep)
  ) {
    return null;
  }

  return normalizedJoined;
}

function isPreviewInline(contentType: string): boolean {
  return contentType === "application/pdf" || contentType.startsWith("image/");
}

function weakEtag(stat: fs.Stats): string {
  return `W/"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
}

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : null;
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function parseRange(
  rangeHeader: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!rangeHeader) return null;

  const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader);
  if (!match) return null;

  const startStr = match[1];
  const endStr = match[2];

  let start = startStr ? Number.parseInt(startStr, 10) : Number.NaN;
  let end = endStr ? Number.parseInt(endStr, 10) : Number.NaN;

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    const suffixLength = end;
    if (suffixLength <= 0) return null;
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else if (!Number.isNaN(start) && Number.isNaN(end)) {
    end = size - 1;
  }

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start < 0 ||
    end < 0 ||
    start > end ||
    start >= size
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, size - 1),
  };
}

function safeAttachmentName(filePath: string): string {
  return path.basename(filePath).replace(/["\r\n]/g, "_");
}

type InnerCircleAccessResult = {
  hasAccess?: boolean;
  reason?: string;
  tier?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
    return;
  }

  const cacheSeconds = vaultRuntimeConfig.cacheSeconds;
  if (cacheSeconds > 0) {
    res.setHeader("Cache-Control", `private, max-age=${cacheSeconds}`);
  } else {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  const parts = Array.isArray(req.query.path)
    ? req.query.path
    : [String(req.query.path || "")];

  const filePath = safeResolveVaultPath(parts);
  if (!filePath) {
    res.status(400).json({ ok: false, reason: "BAD_PATH" });
    return;
  }

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    res.status(404).json({ ok: false, reason: "NOT_FOUND" });
    return;
  }

  if (!stat.isFile()) {
    res.status(404).json({ ok: false, reason: "NOT_FOUND" });
    return;
  }

  const requiredTier = tiers.normalizeRequired(
    requiredTierFromVaultPath(filePath),
  );

  if (vaultRuntimeConfig.enforceAuth && requiredTier !== "public") {
    const auth = (await getInnerCircleAccess(
      req,
    )) as InnerCircleAccessResult | null;

    if (!auth?.hasAccess) {
      res.status(401).json({
        ok: false,
        reason: auth?.reason || "REQUIRES_AUTH",
        requiredTier,
      });
      return;
    }

    const userTier = tiers.normalizeUser(auth.tier ?? "public");
    if (!tiers.hasAccess(userTier, requiredTier)) {
      res.status(403).json({
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier,
      });
      return;
    }
  }

  const contentType = contentTypeFor(filePath);
  const etag = weakEtag(stat);
  const fileName = safeAttachmentName(filePath);

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("ETag", etag);
  res.setHeader(
    "Content-Disposition",
    `${isPreviewInline(contentType) ? "inline" : "attachment"}; filename="${fileName}"`,
  );

  const ifNoneMatch = firstHeaderValue(req.headers["if-none-match"]);
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.status(304).end();
    return;
  }

  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }

  const rangeHeader = firstHeaderValue(req.headers.range);
  const hasRangeHeader = Boolean(rangeHeader);
  const range = parseRange(rangeHeader, stat.size);

  if (hasRangeHeader && !range) {
    res.status(416);
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    res.end();
    return;
  }

  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;

    res.status(206);
    res.setHeader("Content-Length", String(chunkSize));
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);

    const rangedStream = fs.createReadStream(filePath, { start, end });
    rangedStream.on("error", () => {
      if (!res.headersSent) {
        res.status(500);
      }
      res.end("STREAM_ERROR");
    });
    rangedStream.pipe(res);
    return;
  }

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) {
      res.status(500);
    }
    res.end("STREAM_ERROR");
  });
  stream.pipe(res);
}
