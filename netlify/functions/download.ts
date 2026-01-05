import type { Handler } from "@netlify/functions";
import fs from "fs";
import path from "path";

type Tier = "free" | "basic" | "premium" | "enterprise" | "restricted";

const TIER_MAP = {
  "public": "free",
  "inner-circle": "basic",
  "inner-circle-plus": "premium",
  "inner-circle-elite": "enterprise",
  "private": "restricted",
} as const;

function parseCookies(cookieHeader: string | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach((p) => {
    const [k, ...v] = p.trim().split("=");
    out[k] = decodeURIComponent(v.join("=") || "");
  });
  return out;
}

/**
 * Decide tier from your existing unlock flow.
 * Adjust cookie name(s) to match your implementation.
 */
function getTier(event: any): Tier {
  const cookies = parseCookies(event.headers.cookie);
  const raw = (cookies.inner_circle_tier || cookies.innerCircleTier || "public").toLowerCase();

  const mapped = (TIER_MAP as any)[raw] as Tier | undefined;
  return mapped || "free";
}

function canAccess(tier: Tier, allowed: Tier[]) {
  return allowed.includes(tier);
}

/**
 * Allowlist of logical assets and which tiers can access them.
 * We keep this business logic explicit and auditable.
 */
const ALLOWLIST: Record<string, Tier[]> = {
  // Legacy canvas
  "legacy-canvas": ["free", "basic", "premium", "enterprise", "restricted"],

  // Institution pack (example)
  "institution-pack": ["premium", "enterprise", "restricted"],
};

/**
 * Resolve which physical file should be served for a logical key.
 * Premium + enterprise: signed.
 * Free/basic: unsigned public copy.
 * Restricted: signed if available, else unsigned.
 */
function resolveFile(logicalKey: string, tier: Tier, format: "a4" | "letter" | "a3") {
  const quality =
    tier === "free" ? "free" :
    tier === "basic" ? "basic" :
    tier === "premium" ? "premium" :
    tier === "enterprise" ? "enterprise" :
    "premium"; // restricted defaults to premium

  // Logical key → base filename
  const base =
    logicalKey === "legacy-canvas"
      ? `legacy-architecture-canvas-${format}-${quality}.pdf`
      : logicalKey === "institution-pack"
      ? `institution-builder-pack-${format}-${quality}.pdf`
      : null;

  if (!base) return null;

  const wantsSigned = tier === "premium" || tier === "enterprise" || tier === "restricted";

  // Signed file naming convention
  const signedName = base.replace(/\.pdf$/i, ".signed.pdf");

  const publicRoot = path.join(process.cwd(), "public", "assets", "downloads");
  const privateSignedRoot = path.join(process.cwd(), "private_downloads", "signed");
  const privateUnsignedRoot = path.join(process.cwd(), "private_downloads", "unsigned");

  if (wantsSigned) {
    const signedPath = path.join(privateSignedRoot, signedName);
    if (fs.existsSync(signedPath)) return { absPath: signedPath, filename: signedName, signed: true };

    // fallback (restricted safety)
    const unsignedPrivate = path.join(privateUnsignedRoot, base);
    if (fs.existsSync(unsignedPrivate)) return { absPath: unsignedPrivate, filename: base, signed: false };
  }

  // Free/basic: public files
  const publicPath = path.join(publicRoot, base);
  if (fs.existsSync(publicPath)) return { absPath: publicPath, filename: base, signed: false };

  // Final fallback: private unsigned (if you decide to keep it)
  const unsignedPrivate = path.join(privateUnsignedRoot, base);
  if (fs.existsSync(unsignedPrivate)) return { absPath: unsignedPrivate, filename: base, signed: false };

  return null;
}

export const handler: Handler = async (event) => {
  try {
    const tier = getTier(event);

    const key = (event.queryStringParameters?.key || "").trim(); // e.g. "legacy-canvas"
    const fmt = (event.queryStringParameters?.format || "a4").toLowerCase(); // a4|letter|a3
    const format = (fmt === "letter" ? "letter" : fmt === "a3" ? "a3" : "a4") as "a4" | "letter" | "a3";

    if (!key || !ALLOWLIST[key]) return { statusCode: 404, body: "Not found" };
    if (!canAccess(tier, ALLOWLIST[key])) return { statusCode: 403, body: "Forbidden" };

    const resolved = resolveFile(key, tier, format);
    if (!resolved) return { statusCode: 404, body: "File missing" };

    const buf = fs.readFileSync(resolved.absPath);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${resolved.filename}"`,
        "Cache-Control": "private, max-age=0, no-store",
        "X-AOL-Tier": tier,
        "X-AOL-Signed": resolved.signed ? "true" : "false",
      },
      body: buf.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e: any) {
    return { statusCode: 500, body: e.message || "Server error" };
  }
};