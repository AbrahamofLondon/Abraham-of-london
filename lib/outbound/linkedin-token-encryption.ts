import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getLinkedInTokenEncryptionSecret(): string {
  const secret = String(process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY || "").trim();
  if (!secret) {
    throw new Error("[LINKEDIN_TOKEN_ENCRYPTION] Missing LINKEDIN_TOKEN_ENCRYPTION_KEY");
  }
  return secret;
}

function deriveKey(): Buffer {
  return crypto
    .createHash("sha256")
    .update(getLinkedInTokenEncryptionSecret())
    .digest();
}

export function encryptLinkedInToken(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptLinkedInToken(payload: string): string {
  const [ivPart, tagPart, encryptedPart] = payload.split(".");
  if (!ivPart || !tagPart || !encryptedPart) {
    throw new Error("[LINKEDIN_TOKEN_ENCRYPTION] Invalid encrypted token payload");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
