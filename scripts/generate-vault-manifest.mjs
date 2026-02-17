/* scripts/generate-vault-manifest.mjs */
import fs from 'fs';
import path from 'path';

async function runGenerator() {
  const GENERATED_PATH = path.resolve('./.contentlayer/generated');
  const OUTPUT = path.join(process.cwd(), 'vault-manifest.json');

  if (!fs.existsSync(GENERATED_PATH)) {
    console.error('\n❌ MANIFEST FAILURE: Contentlayer generated folder not found.');
    process.exit(1);
  }

  try {
    const allDocuments = [];
    // Get all directories in the generated folder (Post, Lexicon, etc.)
    const dirs = fs.readdirSync(GENERATED_PATH).filter(f => 
      fs.statSync(path.join(GENERATED_PATH, f)).isDirectory()
    );

    console.log(`\n--- 🏗️  Compiling Manifest from ${dirs.length} Content Types ---`);

    dirs.forEach(dir => {
      const indexPath = path.join(GENERATED_PATH, dir, '_index.json');
      if (fs.existsSync(indexPath)) {
        const rawData = fs.readFileSync(indexPath, 'utf8');
        const docs = JSON.parse(rawData);
        allDocuments.push(...docs);
        console.log(`   - Added ${docs.length} documents from ${dir}`);
      }
    });

    const manifestData = {
      version: "2026.1",
      timestamp: new Date().toISOString(),
      totalCount: allDocuments.length,
      entries: allDocuments.map(doc => ({
        title: doc.title || "Untitled",
        slug: doc.slug?.startsWith('/') ? doc.slug : `/${doc.slug || ''}`,
        type: doc.type,
        date: doc.date,
        folder: doc._raw?.sourceFileDir || "root",
        accessLevel: doc.accessLevel || "protected"
      }))
    };

    fs.writeFileSync(OUTPUT, JSON.stringify(manifestData, null, 2), 'utf8');
    console.log(`\n✅ SUCCESS: Manifest updated with ${allDocuments.length} entries.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Manifest Error:', err.message);
    process.exit(1);
  }
}

runGenerator();