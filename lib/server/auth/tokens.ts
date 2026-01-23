// lib/server/auth/tokens.ts
import crypto from "crypto";

export function tokenPrefix() {
  return "aol_";
}

export function tokenBytes() {
  return 32; // 256-bit
}

export function randomToken(bytes: number) {
  return crypto.randomBytes(bytes).toString("hex");
}