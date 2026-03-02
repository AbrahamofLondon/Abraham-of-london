/**
 * ABRAHAM OF LONDON: NETLIFY DOWNLOAD FUNCTION (SOURCE) - SSOT ALIGNED
 */

import type { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";

import type { AccessTier } from "../../../lib/access/tier-policy";
import {
  normalizeUserTier,
  hasAccess,
  getTierLabel,
} from "../../../lib/access/tier-policy";

type QualityTier = "free" | "basic" | "premium" | "enterprise" | "restricted";

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  
  cookieHeader.split(";").forEach((part) => {
    const [k, ...v] = part.trim().split("=");
    if (k) {
      out[k] = decodeURIComponent(v.join("=") || "");
    }
  });
  
  return out;
}

function getAccessTier(event: any): AccessTier {
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
  const qualityMap: Record<AccessTier, QualityTier> = {
    'public': 'free',
    'member': 'basic',
    'inner-circle': 'premium',
    'client': 'enterprise',
    'legacy': 'enterprise',
    'architect': 'restricted',
    'owner': 'restricted',
  };
  
  return qualityMap[tier] || 'free';
}

const ALLOWLIST: Record<string, AccessTier> = {
  "legacy-canvas": "member",
  "institution-pack": "client",
  "architecture-framework": "inner-circle",
  "governance-manual": "client",
  "strategic-playbook": "member",
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

    const unsignedPrivate = path.join(privateUnsignedRoot, base);
    if (fs.existsSync(unsignedPrivate)) {
      return { absPath: unsignedPrivate, filename: base, signed: false };
    }
  }

  const publicPath = path.join(publicRoot, base);
  if (fs.existsSync(publicPath)) {
    return { absPath: publicPath, filename: base, signed: false };
  }

  const unsignedPrivate = path.join(privateUnsignedRoot, base);
  if (fs.existsSync(unsignedPrivate)) {
    return { absPath: unsignedPrivate, filename: base, signed: false };
  }

  return null;
}

export const handler: Handler = async (event) => {
  try {
    const accessTier = getAccessTier(event);

    const key = (event.queryStringParameters?.key || "").trim();
    const fmt = (event.queryStringParameters?.format || "a4").toLowerCase();
    const format = (fmt === "letter" ? "letter" : fmt === "a3" ? "a3" : "a4") as "a4" | "letter" | "a3";

    const required = ALLOWLIST[key];
    if (!key || !required) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: "Resource not found" }) 
      };
    }
    
    if (!hasAccess(accessTier, required)) {
      return { 
        statusCode: 403, 
        body: JSON.stringify({ 
          error: "Access denied",
          required: getTierLabel(required),
          current: getTierLabel(accessTier)
        }) 
      };
    }

    const resolved = resolveFile(key, accessTier, format);
    if (!resolved) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: "File not found" }) 
      };
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
  } catch (error: any) {
    console.error("[Download Function Error]", error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "Internal server error" }) 
    };
  }
};