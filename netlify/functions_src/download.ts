// netlify/functions_src/download.ts
/**
 * ABRAHAM OF LONDON: NETLIFY DOWNLOAD FUNCTION (SSOT ALIGNED)
 * Serves protected PDF downloads with tier-based access control
 */

import type { Handler, HandlerResponse } from "./_utils";
import fs from "fs";
import path from "path";

import type { AccessTier } from "../../lib/access/tier-policy";
import {
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "../../lib/access/tier-policy";

type QualityTier = "free" | "basic" | "premium" | "enterprise" | "restricted";

function parseCookies(
  cookieHeader: string | string[] | undefined
): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
  if (!raw) return out;

  raw.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("=") || "");
  });

  return out;
}

function getAccessTier(event: {
  headers: Record<string, string | string[] | undefined>;
}): AccessTier {
  const cookies = parseCookies(event.headers.cookie);

  const raw =
    cookies.aol_tier ||
    cookies.aol_ic_tier ||
    cookies.inner_circle_tier ||
    cookies.ic_tier ||
    cookies.innerCircleTier ||
    "public";

  return normalizeUserTier(raw);
}

function qualityForAccessTier(tier: AccessTier): QualityTier {
  const qualityMap = {
    public: "free",
    member: "basic",
    "inner-circle": "premium",
    client: "enterprise",
    legacy: "enterprise",
    architect: "restricted",
    restricted: "restricted",
    owner: "restricted",
    "top-secret": "restricted",
  } satisfies Record<AccessTier, QualityTier>;

  return qualityMap[tier];
}

const ALLOWLIST: Record<string, AccessTier> = {
  "legacy-canvas": "member",
  "institution-pack": "client",
  "architecture-framework": "inner-circle",
  "governance-manual": "client",
  "strategic-playbook": "member",
  "vault-master-key": "top-secret",
};

function resolveFile(
  logicalKey: string,
  accessTier: AccessTier,
  format: "a4" | "letter" | "a3"
): { absPath: string; filename: string; signed: boolean } | null {
  const quality = qualityForAccessTier(accessTier);

  const filenameMap: Record<string, (format: string, quality: string) => string> = {
    "legacy-canvas": (f, q) => `legacy-architecture-canvas-${f}-${q}.pdf`,
    "institution-pack": (f, q) => `institution-builder-pack-${f}-${q}.pdf`,
    "architecture-framework": (f, q) => `architecture-framework-${f}-${q}.pdf`,
    "governance-manual": (f, q) => `governance-manual-${f}-${q}.pdf`,
    "strategic-playbook": (f, q) => `strategic-playbook-${f}-${q}.pdf`,
    "vault-master-key": (f, q) => `vault-master-key-${f}-${q}.pdf`,
  };

  const baseGenerator = filenameMap[logicalKey];
  if (!baseGenerator) return null;

  const base = baseGenerator(format, quality);
  const wantsSigned = hasAccess(accessTier, "client");
  const signedName = base.replace(/\.pdf$/i, ".signed.pdf");

  const publicRoot = path.join(process.cwd(), "public", "assets", "downloads");
  const privateSignedRoot = path.join(process.cwd(), "private_downloads", "signed");
  const privateUnsignedRoot = path.join(process.cwd(), "private_downloads", "unsigned");

  if (wantsSigned) {
    const signedPath = path.join(privateSignedRoot, signedName);
    if (fs.existsSync(signedPath)) {
      return { absPath: signedPath, filename: signedName, signed: true };
    }
  }

  const unsignedPrivate = path.join(privateUnsignedRoot, base);
  if (fs.existsSync(unsignedPrivate)) {
    return { absPath: unsignedPrivate, filename: base, signed: false };
  }

  const publicPath = path.join(publicRoot, base);
  if (fs.existsSync(publicPath)) {
    return { absPath: publicPath, filename: base, signed: false };
  }

  return null;
}

function jsonResponse(statusCode: number, payload: unknown): HandlerResponse {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  };
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  try {
    const accessTier = getAccessTier(event);

    const key = String(event.queryStringParameters?.key || "").trim();
    const fmt = String(event.queryStringParameters?.format || "a4").toLowerCase();
    const format = (
      fmt === "letter" ? "letter" : fmt === "a3" ? "a3" : "a4"
    ) as "a4" | "letter" | "a3";

    const required = ALLOWLIST[key];
    if (!key || !required) {
      return jsonResponse(404, { error: "Resource not found" });
    }

    if (!hasAccess(accessTier, required)) {
      return jsonResponse(403, {
        error: "Access denied",
        required: getTierLabel(required),
        current: getTierLabel(accessTier),
      });
    }

    const resolved = resolveFile(key, accessTier, format);
    if (!resolved) {
      return jsonResponse(404, { error: "File not found" });
    }

    const buf = fs.readFileSync(resolved.absPath);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${resolved.filename}"`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-AOL-Tier": accessTier,
        "X-AOL-Tier-Label": getTierLabel(accessTier),
        "X-AOL-Signed": resolved.signed ? "true" : "false",
      },
      body: buf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[Download Function Error]", error);
    return jsonResponse(500, { error: "Internal server error" });
  }
};