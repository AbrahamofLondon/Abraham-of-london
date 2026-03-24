/* pages/api/private/vault/[...path].ts — SECURE VAULT STREAM (Node runtime) */

import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers, { requiredTierFromVaultPath } from "@/lib/access/tiers";

const VAULT_ROOT = path.join(process.cwd(), "private", "vault");

function contentTypeFor(filePath: string): string {
  const ext = filePath.toLowerCase().split(".").pop() || "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "zip") return "application/zip";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "pptx") {
    return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (ext === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}

function safeResolveVaultPath(parts: string[]): string | null {
  const clean = parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, "/"));

  if (!clean.length) return null;

  for (const seg of clean) {
    if (seg === "." || seg === ".." || seg.includes("..") || seg.includes("\0")) {
      return null;
    }
    if (seg.startsWith("/") || seg.startsWith("\\") || seg.includes(":")) {
      return null;
    }
  }

  const joined = path.join(VAULT_ROOT, ...clean);
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

function isPreviewInline(ct: string): boolean {
  return ct === "application/pdf" || ct.startsWith("image/");
}

function weakEtag(stat: fs.Stats): string {
  return `W/"${stat.size}-${stat.mtimeMs}"`;
}

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : null;
  if (typeof value === "string" && value) return value;
  return null;
}

function parseRange(
  rangeHeader: string | null,
  size: number,
): { start: number; end: number } | null {
  if (!rangeHeader) return null;

  const m = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
  if (!m) return null;

  const startStr = m[1];
  const endStr = m[2];

  let start = startStr ? parseInt(startStr, 10) : Number.NaN;
  let end = endStr ? parseInt(endStr, 10) : Number.NaN;

  if (Number.isNaN(start) && !Number.isNaN(end)) {
    const last = end;
    if (last <= 0) return null;
    start = Math.max(0, size - last);
    end = size - 1;
  } else if (!Number.isNaN(start) && Number.isNaN(end)) {
    end = size - 1;
  }

  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start < 0 || end < 0 || start > end) return null;
  if (start >= size) return null;

  end = Math.min(end, size - 1);
  return { start, end };
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

  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

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

  const requiredTier = tiers.normalizeRequired(requiredTierFromVaultPath(filePath));

  if (requiredTier !== "public") {
    const auth = (await getInnerCircleAccess(req)) as InnerCircleAccessResult | null;

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

  const ct = contentTypeFor(filePath);
  const etag = weakEtag(stat);
  const filename = safeAttachmentName(filePath);

  res.setHeader("Content-Type", ct);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("ETag", etag);
  res.setHeader("Accept-Ranges", "bytes");

  const inline = isPreviewInline(ct);
  res.setHeader(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename="${filename}"`,
  );

  const ifNoneMatch = firstHeaderValue(req.headers["if-none-match"]);
  if (ifNoneMatch && ifNoneMatch === etag) {
    res.statusCode = 304;
    res.end();
    return;
  }

  if (req.method === "HEAD") {
    res.setHeader("Content-Length", String(stat.size));
    res.status(200).end();
    return;
  }

  const rangeHeader = firstHeaderValue(req.headers.range);
  const hasRangeHeader = Boolean(rangeHeader);
  const range = parseRange(rangeHeader, stat.size);

  if (hasRangeHeader && !range) {
    res.statusCode = 416;
    res.setHeader("Content-Range", `bytes */${stat.size}`);
    res.end();
    return;
  }

  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;

    res.statusCode = 206;
    res.setHeader("Content-Length", String(chunkSize));
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on("error", () => {
      if (!res.headersSent) res.status(500);
      res.end("STREAM_ERROR");
    });
    stream.pipe(res);
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Length", String(stat.size));

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    if (!res.headersSent) res.status(500);
    res.end("STREAM_ERROR");
  });
  stream.pipe(res);
}