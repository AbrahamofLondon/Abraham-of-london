import { encryptDocument, decryptDocument, hashEmail } from "../lib/security";
import dotenv from "dotenv";
import path from "path";

// 1. Force absolute path to .env to eliminate "missing" errors
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

async function test() {
  console.log("🛠️  DIAGNOSTIC: VERIFYING SECURITY HANDSHAKE...");
  console.log(`📂 Looking for .env at: ${envPath}`);
  
  // 2. Check if the key is actually loaded into memory
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.error("❌ CRITICAL: ENCRYPTION_KEY is NOT in the process environment.");
    console.log("📝 Current Env Keys detected:", Object.keys(process.env).filter(k => !k.startsWith('NODE_')));
    return;
  }

  console.log(`✅ ENCRYPTION_KEY Detected (Length: ${key.length})`);

  try {
    const secret = "DIRECTORATE_EYES_ONLY_2026";
    const encrypted = encryptDocument(secret);
    console.log("✅ Encryption: SUCCESS");
    
    const decrypted = decryptDocument(encrypted.content, encrypted.iv, encrypted.authTag);
    if (decrypted === secret) {
      console.log("✅ Decryption: SUCCESS (Match)");
      console.log("\n💎 SECURITY LAYER STABLE. PROCEED TO MILESTONE 2.");
    }
  } catch (e: any) {
    console.error("\n💥 CRYPTO ERROR:", e.message);
  }
}

test();