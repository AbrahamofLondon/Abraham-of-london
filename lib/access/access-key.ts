import crypto from "crypto";

const ACCESS_KEY_PREFIX = "aolk";

export function normalizeAccessKey(input: string): string {
  return input.trim().replace(/\s+/g, "").toLowerCase();
}

export function hashAccessKey(input: string): string {
  return crypto
    .createHash("sha256")
    .update(normalizeAccessKey(input))
    .digest("hex");
}

export function previewAccessKey(input: string): string {
  const normalized = normalizeAccessKey(input);
  return normalized.length <= 8
    ? normalized
    : `${normalized.slice(0, 4)}…${normalized.slice(-4)}`;
}

export function generateAccessKey(length = 32): string {
  const raw = crypto.randomBytes(length).toString("base64url");
  return `${ACCESS_KEY_PREFIX}_${raw}`;
}