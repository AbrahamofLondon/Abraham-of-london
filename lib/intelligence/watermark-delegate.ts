/* lib/intelligence/watermark-delegate.ts — BRAND-EQUITY FORENSIC WATERMARK (AOL-WM-V2) */
import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { AccessTier, TIER_LABELS } from "@/lib/access/tier-policy";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type WatermarkClassification = AccessTier;
export type WatermarkScheme = "AOL-WM-V2";

export type DossierSignature = {
  scheme: WatermarkScheme;
  sig: string;
  traceId: string;
  issuedAt: string;
  nonce: string;
  issuer: {
    brand: string;
    issuerId: string;
  };
  proof: {
    memberHash: string;
    briefHash: string;
    hmac: string;
  };
};

export type WatermarkPayload = {
  visibleFooter: string;
  overlayToken: string;
  overlayHints: {
    rotationDeg: number;
    opacity: number;
    fontSize: number;
    letterSpacing: number;
  };
  metadata: Record<string, unknown>;
};

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

function mustGetSecret(name: string, minLen: number): string {
  const value = process.env[name];
  if (!value || value.trim().length < minLen) {
    throw new Error(
      `[WATERMARK] Missing/weak ${name}. Set a strong secret (>=${minLen} chars).`
    );
  }
  return value.trim();
}

function getBrand(): string {
  return (process.env.AOL_BRAND_NAME || "Abraham of London").trim();
}

function getIssuerId(): string {
  return (
    process.env.AOL_ISSUER_ID ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "unknown"
  )
    .toString()
    .trim()
    .toUpperCase();
}

function getIntegritySalt(): string {
  return mustGetSecret("SYSTEM_INTEGRITY_SALT", 16);
}

function getHashSalt(): string {
  const explicit = process.env.AOL_HASH_SALT;
  if (explicit && explicit.trim().length >= 16) {
    return explicit.trim();
  }
  return getIntegritySalt();
}

function hmacHex(key: string, payload: string): string {
  return createHmac("sha256", key).update(payload).digest("hex");
}

function shortHash(label: string, value: string): string {
  return createHmac("sha256", getHashSalt())
    .update(`${label}:${value}`)
    .digest("hex")
    .slice(0, 12);
}

function makeNonce(): string {
  return randomBytes(12).toString("hex");
}

function sigFromHmac(hmac: string): string {
  return `AOL-${hmac.slice(0, 16).toUpperCase()}`;
}

function traceFrom(memberHash: string, briefHash: string, nonce: string): string {
  return `${memberHash.slice(-4)}-${briefHash.slice(-4)}-${nonce.slice(-4)}`.toUpperCase();
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAllowedTiers(): AccessTier[] {
  return Object.keys(TIER_LABELS) as AccessTier[];
}

function normalizeClassification(input: unknown): AccessTier {
  const raw = safeString(input, "public").toLowerCase();
  const allowed = getAllowedTiers();

  const directMatch = allowed.find((tier) => String(tier).toLowerCase() === raw);
  if (directMatch) return directMatch;

  const labelMatch = allowed.find((tier) => {
    const label = safeString(TIER_LABELS[tier]).toLowerCase();
    return label === raw;
  });
  if (labelMatch) return labelMatch;

  if (raw === "premium") {
    const premiumLike = allowed.find((tier) =>
      ["member", "restricted"].includes(String(tier).toLowerCase())
    );
    if (premiumLike) return premiumLike;
  }

  return (allowed.includes("public" as AccessTier)
    ? ("public" as AccessTier)
    : allowed[0]) as AccessTier;
}

function getClassificationLabel(classification: AccessTier): string {
  const rawLabel = TIER_LABELS[classification];
  return safeString(rawLabel, classification).toUpperCase();
}

function sanitizeContext(context: unknown): Record<string, unknown> {
  if (!isRecord(context)) return {};

  const safeContext: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safeContext[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      safeContext[key] = value.map((item) =>
        typeof item === "string" || typeof item === "number" || typeof item === "boolean"
          ? item
          : safeString(item)
      );
      continue;
    }

    if (isRecord(value)) {
      safeContext[key] = Object.fromEntries(
        Object.entries(value).map(([nestedKey, nestedValue]) => [
          nestedKey,
          typeof nestedValue === "string" ||
          typeof nestedValue === "number" ||
          typeof nestedValue === "boolean" ||
          nestedValue === null
            ? nestedValue
            : safeString(nestedValue),
        ])
      );
      continue;
    }

    safeContext[key] = safeString(value);
  }

  return safeContext;
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

export function generateDossierSignature(
  memberId: string,
  briefId: string,
  opts?: { issuedAt?: string; nonce?: string; brand?: string }
): DossierSignature {
  const scheme: WatermarkScheme = "AOL-WM-V2";
  const brand = safeString(opts?.brand, getBrand());
  const issuerId = getIssuerId();
  const issuedAt = safeString(opts?.issuedAt, new Date().toISOString());
  const nonce = safeString(opts?.nonce, makeNonce());

  const memberHash = shortHash("member", safeString(memberId, "anonymous"));
  const briefHash = shortHash("brief", safeString(briefId, "unfiled"));

  const proofPayload = `${scheme}|${issuerId}|${memberHash}|${briefHash}|${issuedAt}|${nonce}`;
  const hmac = hmacHex(getIntegritySalt(), proofPayload);

  return {
    scheme,
    sig: sigFromHmac(hmac),
    traceId: traceFrom(memberHash, briefHash, nonce),
    issuedAt,
    nonce,
    issuer: {
      brand,
      issuerId,
    },
    proof: {
      memberHash,
      briefHash,
      hmac,
    },
  };
}

export function getWatermarkPayload(params: {
  signature: DossierSignature;
  classification: WatermarkClassification | string;
  context?: {
    briefTitle?: string;
    route?: string;
    [key: string]: unknown;
  };
}): WatermarkPayload {
  const signature = params.signature;
  const classification = normalizeClassification(params.classification);
  const label = getClassificationLabel(classification);
  const context = sanitizeContext(params.context);

  const footerLine =
    `${label} // PROPRIETARY INTELLIGENCE // ` +
    `SIG ${signature.sig} // TRACE ${signature.traceId} // ` +
    `${signature.issuer.brand} // ${signature.issuer.issuerId}`;

  const overlayToken =
    `AUTHORIZED:${String(classification).toUpperCase()}:` +
    `${signature.sig}:${signature.traceId}:${signature.issuer.issuerId}`;

  const metadata: Record<string, unknown> = {
    author: signature.issuer.brand,
    subject: "Institutional Intelligence Brief",
    keywords: [
      signature.sig,
      String(classification),
      signature.traceId,
      signature.issuer.issuerId,
    ].join(","),
    aol: {
      scheme: signature.scheme,
      classification,
      classificationLabel: label,
      sig: signature.sig,
      traceId: signature.traceId,
      issuedAt: signature.issuedAt,
      nonce: signature.nonce,
      issuer: signature.issuer,
      context,
      proof: signature.proof,
    },
  };

  return {
    visibleFooter: footerLine,
    overlayToken,
    overlayHints: {
      rotationDeg: -28,
      opacity: 0.06,
      fontSize: 10,
      letterSpacing: 1.6,
    },
    metadata,
  };
}

export function verifyDossierSignature(sig: DossierSignature): boolean {
  try {
    const scheme: WatermarkScheme = "AOL-WM-V2";
    if (sig.scheme !== scheme) return false;

    const payload =
      `${sig.scheme}|${sig.issuer.issuerId}|${sig.proof.memberHash}|${sig.proof.briefHash}|${sig.issuedAt}|${sig.nonce}`;

    const expected = hmacHex(getIntegritySalt(), payload);

    const a = Buffer.from(sig.proof.hmac, "hex");
    const b = Buffer.from(expected, "hex");

    if (a.length !== b.length) return false;
    if (!timingSafeEqual(a, b)) return false;

    return sig.sig === sigFromHmac(expected);
  } catch {
    return false;
  }
}

export function getWatermarkStyles(signature: string) {
  const brand = getBrand();
  const issuerId = getIssuerId();

  return {
    visibleFooter: `PROPRIETARY INTELLIGENCE // SIG ${signature} // ${brand} // ${issuerId}`,
    opacityOverlay: `AUTHORIZED:${signature}:${issuerId}`,
    metadata: {
      author: brand,
      subject: "Institutional Intelligence Brief",
      keywords: `${signature},${issuerId}`,
    },
  };
}