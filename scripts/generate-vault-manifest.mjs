import fs from 'fs';
import path from 'path';

/**
 * VAULT MANIFEST GENERATOR (Direct-Read Mode)
 * Bypasses ESM import hangs by reading the raw JSON cache.
 */
async function runGenerator() {
  // Use the raw JSON instead of the .mjs SDK to avoid the hang
  const JSON_PATH = path.resolve('./.contentlayer/generated/Document/_index.json');
  const OUTPUT = path.join(process.cwd(), 'vault-manifest.json');

  if (!fs.existsSync(JSON_PATH)) {
    console.error('\n❌ MANIFEST FAILURE: Contentlayer JSON cache not found. Run "npx contentlayer build" first.');
    process.exit(1);
  }

  try {
    const rawData = fs.readFileSync(JSON_PATH, 'utf8');
    const allDocuments = JSON.parse(rawData);

    console.log(`\n--- 🏗️  Compiling Manifest for ${allDocuments.length} Verified Briefs ---`);

    const manifestData = {
      version: "2026.1",
      timestamp: new Date().toISOString(),
      count: allDocuments.length,
      entries: allDocuments.map(doc => ({
        title: doc.title,
        slug: doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`,
        date: doc.date,
        folder: doc._raw?.sourceFileDir || "root",
        readingTime: doc.readingTime?.text || "Unknown",
        tags: doc.tags || [],
        accessLevel: doc.accessLevel // Critical for the identity bridge
      }))
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(manifestData, null, 2), 'utf8');
    console.log(`✅ Manifest updated: ${OUTPUT}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Manifest Error:', err.message);
    process.exit(1);
  }
}

runGenerator();