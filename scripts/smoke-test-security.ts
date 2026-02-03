/* ============================================================================
 * SOVEREIGN OS: SECURITY SMOKE TEST [MILESTONE 1 VERIFICATION]
 * ============================================================================ */

import { hashEmail, encryptDocument, decryptDocument } from "../lib/security";
import { ROLE_HIERARCHY } from "../types/auth";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function runSmokeTest() {
  console.log("🚀 INITIALIZING SOVEREIGN SECURITY SMOKE TEST...\n");

  const testEmail = "director@abrahamoflondon.org";
  const masterSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  const encryptionKey = process.env.ENCRYPTION_KEY;

  // --- TEST 1: Environment Integrity ---
  console.log("📋 [TEST 1/4] Checking Environment Variables...");
  if (!masterSecret) throw new Error("❌ FAIL: JWT_SECRET / NEXTAUTH_SECRET is missing.");
  if (!encryptionKey) throw new Error("❌ FAIL: ENCRYPTION_KEY is missing.");
  console.log("✅ PASS: Environment Secure.\n");

  // --- TEST 2: Hashing & Identity ---
  console.log("📋 [TEST 2/4] Verifying Identity Hashing...");
  const hashed = hashEmail(testEmail);
  console.log(`   Email: ${testEmail}`);
  console.log(`   Hash:  ${hashed}`);
  if (!hashed || hashed.length < 32) throw new Error("❌ FAIL: Hashing Algorithm Integrity Compromised.");
  console.log("✅ PASS: Identity Obfuscation Verified.\n");

  // --- TEST 3: Encryption / Decryption Cycle ---
  console.log("📋 [TEST 3/4] Testing AES-256-GCM Cryptographic Cycle...");
  const sensitiveIntel = "DIRECTORATE_EYES_ONLY: The 2026 Strategy is set for London deployment.";
  
  const encrypted = encryptDocument(sensitiveIntel);
  console.log("   Plaintext encrypted successfully.");
  
  const decrypted = decryptDocument(encrypted.content, encrypted.iv, encrypted.authTag);
  
  if (decrypted === sensitiveIntel) {
    console.log("✅ PASS: Symmetric Encryption Cycle Integrity Confirmed.");
  } else {
    throw new Error("❌ FAIL: Decrypted content does not match plaintext.");
  }
  console.log("");

  // --- TEST 4: Hierarchy Logic ---
  console.log("📋 [TEST 4/4] Verifying Role Hierarchy Weights...");
  const adminWeight = ROLE_HIERARCHY["admin"]; // 6
  const memberWeight = ROLE_HIERARCHY["member"]; // 2

  if (adminWeight > memberWeight) {
    console.log(`   Admin (${adminWeight}) > Member (${memberWeight})`);
    console.log("✅ PASS: Hierarchy Weights Correctly Weighted.\n");
  } else {
    throw new Error("❌ FAIL: Role Hierarchy Logic Inverted.");
  }

  console.log("==========================================================");
  console.log("🏆 SMOKE TEST COMPLETE: SOVEREIGN SECURITY LAYER IS STABLE");
  console.log("==========================================================");
}

runSmokeTest().catch((err) => {
  console.error("\n💥 SMOKE TEST FAILED!");
  console.error(err.message);
  process.exit(1);
});