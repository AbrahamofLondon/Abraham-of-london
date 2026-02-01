import fs from 'fs';
import path from 'path';

/**
 * VAULT MANIFEST GENERATOR
 * Compiles a high-performance index of the 75+ intelligence briefs.
 */
async function runGenerator() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');
  const OUTPUT = path.join(process.cwd(), 'vault-manifest.json');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ MANIFEST FAILURE: Source data not found.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');

    console.log(`\n--- 🏗️  Compiling Manifest for ${allDocuments.length} Intelligence Briefs ---`);

    const manifestData = {
      version: "2026.1",
      timestamp: new Date().toISOString(),
      count: allDocuments.length,
      entries: allDocuments.map(doc => ({
        title: doc.title,
        slug: doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`,
        date: doc.date,
        folder: doc._raw.sourceFileDir,
        readingTime: doc.readingTime?.text || "Unknown",
        tags: doc.tags || []
      }))
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(manifestData, null, 2), 'utf8');
    console.log(`✅ Manifest successfully updated at: ${OUTPUT}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Manifest Generation Error:', err.message);
    process.exit(1);
  }
}

runGenerator();