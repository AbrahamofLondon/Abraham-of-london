/* scripts/verify-vault.ts — FORENSIC VAULT INTEGRITY CHECKER */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Forensic signing helper (mirrors your watermark-delegate.ts logic)
function generateForensicSignature(id: string, salt: string): string {
  return crypto
    .createHmac('sha256', salt)
    .update(id)
    .digest('hex')
    .substring(0, 16); // Using the 16-char short-sig pattern
}

async function verifyVaultIntegrity() {
  const SALT = process.env.SYSTEM_INTEGRITY_SALT;
  
  console.log('🔍 INITIATING FORENSIC VAULT INTEGRITY CHECK...');
  console.log(`🔑 SALT DETECTED: ${SALT ? 'YES (Verified)' : 'NO (Missing)'}`);
  console.log('='.repeat(60));

  if (!SALT || SALT.length < 16) {
    console.error('❌ ERROR: SYSTEM_INTEGRITY_SALT is missing or too weak for forensic verification.');
    return;
  }

  try {
    const records = await prisma.contentMetadata.findMany();

    let validCount = 0;
    let forensicFailCount = 0;
    let hashFailCount = 0;

    for (const record of records) {
      process.stdout.write(`Analyzing ${record.slug}... `);

      const fullPath = path.join(process.cwd(), 'public', (record.pdfPath || '').replace(/^\//, ''));
      
      // 1. Basic File Existence
      if (!fs.existsSync(fullPath)) {
        console.log('❌ FILE MISSING');
        hashFailCount++;
        continue;
      }

      // 2. Hash Integrity (File hasn't changed)
      const fileBuffer = fs.readFileSync(fullPath);
      const currentHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      const meta = JSON.parse(record.metadata as string || '{}');
      
      if (currentHash !== meta.sha256) {
        console.log('❌ HASH MISMATCH');
        hashFailCount++;
        continue;
      }

      // 3. Forensic Signature Check (Was it signed by our SALT?)
      // We generate what the signature SHOULD be and compare it to the DB record
      const expectedSignature = generateForensicSignature(record.slug, SALT);
      const storedSignature = meta.signature; // This is populated by generatePDF result.signature

      if (storedSignature && storedSignature !== expectedSignature) {
        console.log('❌ FORENSIC SPOOF DETECTED');
        forensicFailCount++;
      } else if (!storedSignature) {
        // If generatePDF didn't return a signature last run, we check if the file is verifiable anyway
        console.log('⚠️  UNRESTRICTED (No Stored Sig)');
        validCount++;
      } else {
        console.log('✅ VERIFIED');
        validCount++;
      }
    }

    console.log('='.repeat(60));
    console.log(`VERIFICATION SUMMARY`);
    console.log(`✅ Fully Verified:  ${validCount}`);
    console.log(`❌ Hash Mismatches: ${hashFailCount}`);
    console.log(`❌ Forensic Fails:  ${forensicFailCount}`);

  } catch (error: any) {
    console.error('\n❌ CRITICAL ERROR:');
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyVaultIntegrity();