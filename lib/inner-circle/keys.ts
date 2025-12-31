import crypto from "crypto";

export function generateAccessKey() {
  const raw = crypto.randomBytes(16).toString("hex").toUpperCase();
  const fullKey = `IC-${raw}`;
  return {
    fullKey,
    suffix: fullKey.slice(-4),
    hash: fullKey // Using the key as the identifier for simplicity in findUnique
  };
}

export function getEmailHash(email: string): string {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}
