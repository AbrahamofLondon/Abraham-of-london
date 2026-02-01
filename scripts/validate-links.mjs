import fs from 'fs';
import path from 'path';

/**
 * VAULT LINK VALIDATOR (2026 Edition)
 * Ensures structural integrity across 163+ intelligence briefs.
 * Handles MDX slugs, static routes, asset bypasses, and lexicon terms.
 */
async function runValidator() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ VALIDATION FAILURE: Contentlayer SDK not found.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    // 1. Map all valid MDX slugs from the content layer
    const VALID_SLUGS = new Set(allDocuments.map(doc => 
      doc.slug.startsWith('/') ? doc.slug : `/${doc.slug}`
    ));

    // 2. Define Institutional White-list (Static routes and platform pages)
    const WHITE_LIST = [
      '/', 
      '/contact', 
      '/subscribe', 
      '/inner-circle', 
      '/about', 
      '/lexicon',
      '/vault'
    ];

    const BROKEN_LINKS = [];
    const linkRegex = /\[([^\]]+)\]\((?!\http|mailto|tel|\/\/)([^)]+)\)/g;

    console.log(`\n--- 🔗 Validating Links across ${allDocuments.length} Briefs ---`);

    allDocuments.forEach(doc => {
      const content = doc.body.raw;
      const filePath = doc._raw.sourceFilePath;
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = match[2].split('#')[0]; // Strip anchors for existence check
        
        // Validation Logic
        const isWhiteListed = WHITE_LIST.includes(linkPath) || linkPath.startsWith('/vault/lexicon');
        const isAsset = linkPath.startsWith('/assets/') || 
                        linkPath.endsWith('.pdf') || 
                        linkPath.endsWith('.jpg') || 
                        linkPath.endsWith('.png') || 
                        linkPath.endsWith('.jpeg');
        const isInternalBrief = VALID_SLUGS.has(linkPath);

        if (!isWhiteListed && !isAsset && !isInternalBrief) {
          BROKEN_LINKS.push({
            file: filePath,
            link: linkPath,
            context: match[0]
          });
        }
      }
    });

    if (BROKEN_LINKS.length > 0) {
      console.error(`\n❌ Found ${BROKEN_LINKS.length} Broken Internal Links:`);
      console.table(BROKEN_LINKS);
      process.exit(1);
    }

    console.log('✅ Link Validation Passed: All references are solvent.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Validator Runtime Error:', err.message);
    process.exit(1);
  }
}

runValidator();