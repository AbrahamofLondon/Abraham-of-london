/* pages/api/private/vault/[...path].ts — SECURE VAULT STREAM (Node runtime) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers, { requiredTierFromVaultPath } from "@/lib/access/tiers"; // ✅ Updated import

// 1) Root folder on server
const VAULT_ROOT = path.join(process.cwd(), "private", "vault");

// 2) Minimal MIME mapping (expand as needed)
function contentTypeFor(filePath: string) {
  const ext = filePath.toLowerCase().split(".").pop() || "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "zip") return "application/zip";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

// 3) Hard traversal guard
function safeResolveVaultPath(parts: string[]): string | null {
  const clean = parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .map((p) => p.replace(/\\/g, "/"));

  if (!clean.length) return null;

  for (const seg of clean) {
    // block traversal and weirdness
    if (seg === "." || seg === ".." || seg.includes("..") || seg.includes("\0")) return null;
    // disallow absolute-ish
    if (seg.startsWith("/") || seg.startsWith("\\") || seg.includes(":")) return null;
  }

  const joined = path.join(VAULT_ROOT, ...clean);
  const normalizedRoot = path.normalize(VAULT_ROOT + path.sep);
  const normalizedJoined = path.normalize(joined);

  if (!normalizedJoined.startsWith(normalizedRoot)) return null;
  return normalizedJoined;
}

function isPreviewInline(ct: string) {
  return ct === "application/pdf" || ct.startsWith("image/");
}

function weakEtag(stat: fs.Stats) {
  return `W/"${stat.size}-${stat.mtimeMs}"`;
}

function parseRange(rangeHeader: string | null, size: number) {
  // supports: bytes=start-end
  if (!rangeHeader) return null;
  const m = rangeHeader.match(/^bytes=(\d*)-(\d*)$/i);
  if (!m) return null;

  const startStr = m[1];
  const endStr = m[2];

  let start = startStr ? parseInt(startStr, 10) : NaN;
  let end = endStr ? parseInt(endStr, 10) : NaN;

  // bytes=-500 (last 500 bytes)
  if (Number.isNaN(start) && !Number.isNaN(end)) {
    const last = end;
    if (last <= 0) return null;
    start = Math.max(0, size - last);
    end = size - 1;
  } else {
    // bytes=500- (to end)
    if (!Number.isNaN(start) && Number.isNaN(end)) end = size - 1;
  }

  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (start < 0 || end < 0 || start > end) return null;
  if (start >= size) return null;

  end = Math.min(end, size - 1);
  return { start, end };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  // Never cache proprietary content at edge/CDN/proxy level.
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");

  const parts = Array.isArray(req.query.path) ? req.query.path : [String(req.query.path || "")];
  const filePath = safeResolveVaultPath(parts);
  if (!filePath) return res.status(400).json({ ok: false, reason: "BAD_PATH" });

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
  }

  if (!stat.isFile()) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

  // --- AUTH using SSOT vault policy ---
  const requiredTier = tiers.normalizeRequired(requiredTierFromVaultPath(filePath));

  if (requiredTier !== "public") {
    const auth = await getInnerCircleAccess(req);
    if (!auth?.hasAccess) {
      return res.status(401).json({
        ok: false,
        reason: auth?.reason || "REQUIRES_AUTH",
        requiredTier,
      });
    }

    const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");
    if (!tiers.hasAccess(userTier, requiredTier)) {
      return res.status(403).json({
        ok: false,
        reason: "INSUFFICIENT_TIER",
        requiredTier,
      });
    }
  }

  // --- HEAD fast path ---
  const ct = contentTypeFor(filePath);
  const etag = weakEtag(stat);

  res.setHeader("Content-Type", ct);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("ETag", etag);
  res.setHeader("Accept-Ranges", "bytes");

  // Inline preview for PDFs/images; attachment for zips/office files
  const inline = isPreviewInline(ct);
  res.setHeader(
    "Content-Disposition",
    `${inline ? "inline" : "attachment"}; filename="${path.basename(filePath)}"`
  );

  // Basic conditional support
  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch && String(ifNoneMatch) === etag) {
    res.statusCode = 304;
    return res.end();
  }

  if (req.method === "HEAD") {
    res.setHeader("Content-Length", String(stat.size));
    return res.status(200).end();
  }

  // Range support (PDF preview + large assets)
  const range = parseRange(req.headers.range ?? null, stat.size);
  if (range) {
    const { start, end } = range;
    const chunkSize = end - start + 1;

    res.statusCode = 206;
    res.setHeader("Content-Length", String(chunkSize));
    res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);

    const stream = fs.createReadStream(filePath, { start, end });
    stream.on("error", () => res.status(500).end("STREAM_ERROR"));
    return stream.pipe(res);
  }

  // Full stream
  res.statusCode = 200;
  res.setHeader("Content-Length", String(stat.size));

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => res.status(500).end("STREAM_ERROR"));
  return stream.pipe(res);
}