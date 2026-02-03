// scripts/pdf/pdf-registry-generated.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ALL_SOURCE_PDFS } from './pdf-registry.source';

const OUTPUT_FILE = path.join(process.cwd(), 'scripts/pdf/pdf-registry.generated.ts');

function getFileMetadata(relativePath: string) {
  const fullPath = path.join(process.cwd(), 'public', relativePath);
  if (!fs.existsSync(fullPath)) return null;

  const stats = fs.statSync(fullPath);
  const fileBuffer = fs.readFileSync(fullPath);
  const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');

  return {
    fileSize: `${(stats.size / 1024).toFixed(1)} KB`,
    lastModified: stats.mtime.toISOString(),
    md5: hash,
    exists: true
  };
}

async function generate() {
  console.log("🏛️  Starting Institutional Registry Build...");
  
  const enrichedConfigs = ALL_SOURCE_PDFS.map(item => {
    const meta = getFileMetadata(item.outputPath);
    
    if (!meta) {
      console.warn(`⚠️  ASSET MISSING ON DISK: ${item.id} at ${item.outputPath}`);
    }

    return {
      ...item,
      ...(meta || { exists: false, fileSize: "0 KB", md5: "missing" }),
      lastModified: meta?.lastModified || new Date().toISOString(),
    };
  });

  const fileContent = `// AUTO-GENERATED FROM SOURCE REGISTRY - DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}

export const GENERATED_PDF_CONFIGS = ${JSON.stringify(enrichedConfigs, null, 2)} as const;

export const GENERATED_AT = "${new Date().toISOString()}";
export const GENERATED_COUNT = ${enrichedConfigs.length};
`;

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`✅ Build Complete. Registered ${enrichedConfigs.length} assets.`);
}

generate();