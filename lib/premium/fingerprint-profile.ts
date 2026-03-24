/* lib/premium/fingerprint-profile.ts — INSTITUTIONAL FORENSIC STANDARDS */
import crypto from "crypto";

export type FingerprintProfile = {
  profileId: string;
  contentId: string;
  title?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  userId?: string | null;
  sessionId?: string | null;
  tier?: string | null;
  producer?: string | null;
  creator?: string | null;
  issuedAt: string;

  /** Transitional compatibility aliases */
  watermarkId: string;
  traceId: string;

  components: {
    stableHash: string;
    contextualHash: string;
    fileBand: string;
  };
};

export type BuildFingerprintProfileParams = {
  contentId: string;
  title?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  userId?: string | null;
  sessionId?: string | null;
  tier?: string | null;
  producer?: string | null;
  creator?: string | null;
  issuedAt?: Date | string | null;
  tokenId?: string | null;
  classification?: string | null;
};

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * BANDS FILE SIZE
 * Prevents minor byte-drift (due to metadata shifts) from invalidating the stable fingerprint.
 */
function bandFileSize(size: number | null): string {
  if (size === null || size < 0) return "unknown";
  if (size < 50_000) return "<50kb";
  if (size < 250_000) return "50-250kb";
  if (size < 1_000_000) return "250kb-1mb";
  if (size < 5_000_000) return "1-5mb";
  if (size < 20_000_000) return "5-20mb";
  return "20mb+";
}

export function buildFingerprintProfile(
  params: BuildFingerprintProfileParams,
): FingerprintProfile {
  const contentId = normalizeString(params.contentId) || "unknown-content";
  const title = normalizeString(params.title);
  const filename = normalizeString(params.filename);
  const mimeType = normalizeString(params.mimeType);
  const fileSize = normalizeNumber(params.fileSize);
  const userId = normalizeString(params.userId);
  const sessionId = normalizeString(params.sessionId);
  const tier = normalizeString(params.tier);
  const producer = normalizeString(params.producer);
  const creator = normalizeString(params.creator);
  const tokenId = normalizeString(params.tokenId);
  const classification = normalizeString(params.classification);

  // DETERMINISTIC ISSUANCE:
  // If no date is provided, we use the current hour to maintain cache stability 
  // during batch runs of vault-master.ts
  const now = new Date();
  const issuedAtDate =
    params.issuedAt instanceof Date
      ? params.issuedAt
      : typeof params.issuedAt === "string" && params.issuedAt.trim()
        ? new Date(params.issuedAt)
        : now;

  const issuedAt = Number.isNaN(issuedAtDate.getTime())
    ? now.toISOString()
    : issuedAtDate.toISOString();

  const fileBand = bandFileSize(fileSize);

  // 1. STABLE HASH: Immutable document traits
  const stableHash = sha256(
    JSON.stringify({
      contentId,
      title,
      filename,
      mimeType,
      fileBand,
      producer,
      creator,
    }),
  );

  // 2. CONTEXTUAL HASH: Traceable event traits
  // Sliced to minutes (0, 16) to allow for re-tries within the same session
  const contextualHash = sha256(
    JSON.stringify({
      contentId,
      userId,
      sessionId,
      tokenId,
      tier,
      classification,
      issuedAt: issuedAt.slice(0, 16), // YYYY-MM-DDTHH:mm
    }),
  );

  // 3. PROFILE ID: The forensic master token
  const profileId = sha256(`${stableHash}|${contextualHash}`).slice(0, 24).toUpperCase();

  return {
    profileId,
    contentId,
    title,
    filename,
    mimeType,
    fileSize,
    userId,
    sessionId,
    tier,
    producer,
    creator,
    issuedAt,
    watermarkId: profileId,
    traceId: contextualHash.slice(0, 24).toUpperCase(),
    components: {
      stableHash,
      contextualHash,
      fileBand,
    },
  };
}

export function fingerprintSimilarity(
  a: FingerprintProfile | null | undefined,
  b: FingerprintProfile | null | undefined,
): number {
  if (!a || !b) return 0;
  let score = 0;

  if (a.profileId === b.profileId) score += 40;
  if (a.watermarkId === b.watermarkId) score += 10;
  if (a.traceId === b.traceId) score += 10;
  if (a.contentId === b.contentId) score += 15;
  if (a.components.stableHash === b.components.stableHash) score += 15;
  if (a.components.contextualHash === b.components.contextualHash) score += 10;

  return Math.max(0, Math.min(100, score));
}

export const generateFingerprintProfile = buildFingerprintProfile;

export default {
  build: buildFingerprintProfile,
  generate: buildFingerprintProfile,
  similarity: fingerprintSimilarity,
};