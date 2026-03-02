// lib/server/auth/tokens.ts
import crypto from "crypto";

export function tokenPrefix(): string {
  return "aol_";
}

/** 32 bytes => 256-bit */
export function tokenBytes(): number {
  return 32;
}

/** Random hex token (2 chars per byte) */
export function randomToken(bytes: number = tokenBytes()): string {
  if (!Number.isFinite(bytes) || bytes < 16) {
    throw new Error("randomToken: bytes must be >= 16");
  }
  return crypto.randomBytes(bytes).toString("hex");
}

/** Convenience: a human-shareable token you can issue */
export function mintAccessToken(): string {
  return `${tokenPrefix()}${randomToken(tokenBytes())}`;
}