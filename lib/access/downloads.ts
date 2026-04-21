import crypto from "crypto";
import type { AccessTier } from "./types";

export type ProtectedAsset = {
  key: string;
  kind: "artifact" | "product";
  requiredTier?: AccessTier;
  fileUrl: string;
};

export const ACCESS_DOWNLOADS: Record<string, ProtectedAsset> = {
  "gmi-q1-2026-report": {
    key: "gmi-q1-2026-report",
    kind: "artifact",
    requiredTier: "member",
    fileUrl: "/api/downloads/global-market-intelligence-report-q1-2026",
  },
  "gmi-q1-2026-deck": {
    key: "gmi-q1-2026-deck",
    kind: "artifact",
    requiredTier: "member",
    fileUrl: "/api/downloads/global-market-intelligence-board-deck-q1-2026",
  },
};

const SIGNED_URL_TTL_SECONDS = 300;
const SIGNING_SECRET = process.env.DOWNLOAD_SIGNING_SECRET || "aol-download-secret";

export function createSignedDownloadToken(artifactKey: string, userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SIGNED_URL_TTL_SECONDS;
  const payload = `${artifactKey}:${userId}:${expires}`;
  const signature = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  return { expires, signature, expiresIn: SIGNED_URL_TTL_SECONDS };
}

export function verifySignedDownloadToken(input: {
  artifactKey: string;
  userId: string;
  expires: number;
  signature: string;
}) {
  if (!Number.isFinite(input.expires) || input.expires <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${input.artifactKey}:${input.userId}:${input.expires}`;
  const expected = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
}
