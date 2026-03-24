/* scripts/batch-gen.ts — ARCHIVAL BATCH CONTROLLER */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PrismaClient, ContentType } from "@prisma/client";
import { generatePDF } from '../lib/pdf-generator';

const prisma = new PrismaClient();

async function runInstitutionalBuild() {
  console.log('🚀 AOL VAULT: STARTING FORENSIC BATCH BUILD + DB SYNC');
  console.log('='.repeat(60));
  
  const contentDir = path.join(process.cwd(), 'content');
  const outputDir = path.join(process.cwd(), 'public', 'downloads', 'briefs');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Mapping local folders to your specific Prisma ContentType Enums
  const folderToTypeMap: Record<string, ContentType> = {
    "briefs": ContentType.Briefs,
    "vault": ContentType.Dossier,
    "strategy": ContentType.Operational_Framework,
    "lexicon": ContentType.Lexicon,
    "blog": ContentType.Briefs,
    "landing": ContentType.Landing
  };

  const folders = Object.keys(folderToTypeMap);
  const briefData: { id: string, type: ContentType }[] = [];

  folders.forEach(folder => {
    const dir = path.join(contentDir, folder);
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));
      files.forEach(f => {
        briefData.push({ 
          id: path.basename(f, '.mdx'), 
          type: folderToTypeMap[folder] 
        });
      });
    }
  });

  console.log(`🔍 Found ${briefData.length} source documents.`);

  for (const item of briefData) {
    const { id, type } = item;
    process.stdout.write(`Vaulting ${id}... `);

    try {
      // Logic handles profileId, traceId, and watermarking
      const result = await generatePDF(id, false);

      if (result.success && result.path) {
        const fullPath = path.join(process.cwd(), 'public', result.path.replace(/^\//, ''));
        
        if (fs.existsSync(fullPath)) {
          const buffer = fs.readFileSync(fullPath);
          const hash = crypto.createHash("sha256").update(buffer).digest("hex");
          const stats = fs.statSync(fullPath);

          // DATABASE UPSERT
          await prisma.contentMetadata.upsert({
            where: { slug: id },
            update: {
              pdfPath: result.path,
              fileSize: Math.round(stats.size / 1024),
              contentType: type,
              metadata: JSON.stringify({ ...result.signature, sha256: hash }), 
              updatedAt: new Date(),
            },
            create: {
              slug: id,
              title: id.replace(/-/g, ' ').toUpperCase(),
              contentType: type,
              pdfPath: result.path,
              fileSize: Math.round(stats.size / 1024),
              metadata: JSON.stringify({ ...result.signature, sha256: hash }),
              version: "1.0.0"
            }
          });

          console.log(`✅`);
        }
      } else {
        throw new Error(result.error || 'Unknown Error');
      }
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`BUILD COMPLETE: Records synced to Database.`);
}

runInstitutionalBuild()
  .catch(console.error)
  .finally(() => prisma.$disconnect());