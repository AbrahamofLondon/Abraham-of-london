import type { NextApiRequest, NextApiResponse } from "next";
import innerCircleStore, { type VerifyInnerCircleKeyResult } from "@/lib/server/inner-circle-store";

type RevokeResponse = { 
  ok: boolean; 
  message?: string; 
  error?: string;
  keySuffix?: string;
  revokedAt?: string;
};

function isAdmin(req: NextApiRequest): boolean {
  const raw =
    (req.headers["x-inner-circle-admin-key"] as string | undefined) ||
    (req.headers["authorization"] as string | undefined) ||
    (req.body?.adminSecret as string | undefined);

  const token = raw?.replace(/^Bearer\s+/i, "").trim();
  const expected = process.env.INNER_CIRCLE_ADMIN_KEY;
  return !!token && !!expected && token === expected;
}

function extractKeySuffix(key: string): string {
  const cleaned = key.trim();
  if (cleaned.length <= 6) return cleaned;
  return cleaned.slice(-6);
}

function validateKeyFormat(key: string): { valid: boolean; error?: string } {
  if (!key || typeof key !== "string") {
    return { valid: false, error: "Key must be a string" };
  }
  
  const cleaned = key.trim();
  if (!cleaned) {
    return { valid: false, error: "Key cannot be empty" };
  }
  
  if (!cleaned.startsWith("icl_")) {
    return { valid: false, error: "Key must start with 'icl_'" };
  }
  
  if (cleaned.length < 10) {
    return { valid: false, error: "Key is too short" };
  }
  
  return { valid: true };
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<RevokeResponse>
) {
  // Only allow POST method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ 
      ok: false, 
      error: "Method Not Allowed. Use POST for revocation requests." 
    });
  }

  // Admin authentication
  if (!isAdmin(req)) {
    console.warn("[InnerCircle] Unauthorized revoke attempt from IP:", req.socket?.remoteAddress);
    return res.status(401).json({ 
      ok: false, 
      error: "Unauthorized. Valid admin key required." 
    });
  }

  // Parse request body
  let body: any;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ 
      ok: false, 
      error: "Invalid JSON body" 
    });
  }

  const key = typeof body?.key === "string" ? body.key.trim() : "";
  
  // Validate key format
  const keyValidation = validateKeyFormat(key);
  if (!keyValidation.valid) {
    return res.status(400).json({ 
      ok: false, 
      error: keyValidation.error 
    });
  }

  // Optional reason
  const reason = typeof body?.reason === "string" 
    ? body.reason.trim().slice(0, 255) 
    : "manual_revocation";

  try {
    // First verify the key exists and is active
    const verificationResult: VerifyInnerCircleKeyResult = await innerCircleStore.verifyInnerCircleKey(key);
    
    if (!verificationResult.valid) {
      const statusMessage = verificationResult.reason === "expired" 
        ? "already expired" 
        : verificationResult.reason === "revoked" 
          ? "already revoked" 
          : "not found";
          
      return res.status(409).json({ 
        ok: false, 
        error: `Key ending in ${extractKeySuffix(key)} is ${statusMessage}`,
        keySuffix: extractKeySuffix(key)
      });
    }

    // Revoke the key
    const success = await innerCircleStore.revokeInnerCircleKey(key, "admin", reason);
    
    if (!success) {
      return res.status(500).json({ 
        ok: false, 
        error: "Failed to revoke key" 
      });
    }

    const revokedAt = new Date().toISOString();
    
    console.log(`[InnerCircle] Key revoked: ${extractKeySuffix(key)} by admin at ${revokedAt}`);
    
    return res.status(200).json({
      ok: true,
      message: `Key ending in ${extractKeySuffix(key)} has been revoked successfully.`,
      keySuffix: extractKeySuffix(key),
      revokedAt
    });
    
  } catch (error) {
    console.error("[InnerCircle] Revoke error:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Internal server error";
    
    return res.status(500).json({ 
      ok: false, 
      error: `Revocation failed: ${errorMessage}` 
    });
  }
}

// API configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};