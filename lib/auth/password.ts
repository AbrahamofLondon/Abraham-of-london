// lib/auth/password.ts — SSOT password helpers
import argon2 from "argon2";
import bcrypt from "bcryptjs";

function safeStr(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  const plain = safeStr(plainPassword);
  const hash = safeStr(hashedPassword);

  if (!plain || !hash) {
    return false;
  }

  try {
    if (hash.startsWith("$argon2")) {
      return await argon2.verify(hash, plain);
    }

    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const plain = safeStr(password).trim();

  if (!plain) {
    throw new Error("[AUTH] Cannot hash empty password");
  }

  // Optional: Add password strength validation
  if (plain.length < 8) {
    throw new Error("[AUTH] Password must be at least 8 characters");
  }

  return bcrypt.hash(plain, 12);
}

// Optional: Add password strength checker
export function isStrongPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  const plain = safeStr(password).trim();
  
  if (plain.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  
  if (!/[A-Z]/.test(plain)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(plain)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(plain)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  
  if (!/[^A-Za-z0-9]/.test(plain)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  
  return { valid: true };
}
