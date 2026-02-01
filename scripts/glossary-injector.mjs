import fs from 'fs';
import path from 'path';

/**
 * INSTITUTIONAL GLOSSARY INJECTOR (Idempotent Version)
 * 1. Cleanses existing lexicon links to prevent duplicates/drift.
 * 2. Re-injects current lexicon mapping across the 163-brief portfolio.
 * 3. Ensures structural integrity for high-scale growth.
 */
async function runInjector() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ GLOSSARY FAILURE: SDK missing. Run pnpm contentlayer:build first.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    // THE SOURCE OF TRUTH: Update these paths here to sync the entire vault.
    const LEXICON = {
      "Institutional Integrity": "/vault/lexicon/integrity",
      "Strategic Autonomy": "/vault/lexicon/strategic-autonomy",
      "Sovereignty": "/vault/lexicon/sovereignty",
      "Integrity": "/vault/lexicon/integrity"
    };

    // Sort terms by length (descending) to ensure "Institutional Integrity" matches before "Integrity"
    const sortedTerms = Object.keys(LEXICON).sort((a, b) => b.length - a.length);
    
    let totalInjections = 0;
    let modifiedFiles = 0;

    console.log(`\n--- 📚 Synchronizing Glossary across ${allDocuments.length} Briefs ---`);

    allDocuments.forEach(doc => {
      const fullPath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
      if (!fs.existsSync(fullPath)) return;

      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;

      // STEP 1: CLEANSE (Idempotency)
      // Removes existing lexicon links: [Term](/vault/lexicon/path) -> Term
      // This allows us to "reset" the state before re-linking.
      content = content.replace(/\[([^\]]+)\]\(\/vault\/lexicon\/[^)]+\)/g, '$1');

      // STEP 2: INJECT
      sortedTerms.forEach(term => {
        const url = LEXICON[term];
        
        // Matches the term only if:
        // - Not already inside a Markdown link bracket: (?<!\[)
        // - Is a full word: \b
        // - Not followed by a markdown link or parenthesis: (?!\]|\()
        const termRegex = new RegExp(`(?<!\\[)\\b(${term})\\b(?![^\\[]*\\]|\\(.*?\\))`, 'g');
        
        if (termRegex.test(content)) {
          content = content.replace(termRegex, `[$1](${url})`);
        }
      });

      // STEP 3: PERSIST
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        modifiedFiles++;
        
        // Count matches in this file for the log
        const matches = (content.match(/\[[^\]]+\]\(\/vault\/lexicon\//g) || []).length;
        totalInjections += matches;
      }
    });

    console.log(`✅ Success: Updated ${modifiedFiles} files with ${totalInjections} active lexicon links.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Glossary Runtime Error:', err.message);
    process.exit(1);
  }
}

runInjector();