import fs from 'fs';
import path from 'path';

/**
 * INSTITUTIONAL GLOSSARY INJECTOR (v3.0 - YAML-Safe & Idempotent)
 * Purpose: Systematically manages cross-links for the 163-brief portfolio.
 */
async function runInjector() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ GLOSSARY FAILURE: SDK missing. Run pnpm contentlayer:build first.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    // THE SOURCE OF TRUTH: All roads lead to the Lexicon.
    const LEXICON = {
      "Institutional Integrity": "/vault/lexicon/integrity",
      "Strategic Autonomy": "/vault/lexicon/strategic-autonomy",
      "Sovereignty": "/vault/lexicon/sovereignty",
      "Purpose": "/vault/lexicon/purpose",
      "Governance": "/vault/lexicon/governance",
      "Father": "/vault/lexicon/father",
      "Legacy": "/vault/lexicon/legacy",
      "Surrender": "/vault/lexicon/surrender",
      "Family": "/vault/lexicon/family",
      "Responsibility": "/vault/lexicon/responsibility",
      "Identity": "/vault/lexicon/identity",
      "Leadership": "/vault/lexicon/leadership",
      "Clarity": "/vault/lexicon/clarity",
      "Integrity": "/vault/lexicon/integrity"
    };

    const sortedTerms = Object.keys(LEXICON).sort((a, b) => b.length - a.length);
    let totalInjections = 0;
    let modifiedFiles = 0;

    console.log(`\n--- 📚 Synchronizing Glossary: Protecting Frontmatter for ${allDocuments.length} Briefs ---`);

    allDocuments.forEach(doc => {
      const fullPath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
      if (!fs.existsSync(fullPath)) return;

      const rawContent = fs.readFileSync(fullPath, 'utf8');
      
      // STEP 1: SEGREGATE FRONTMATTER FROM BODY
      // This ensures we never break the YAML block that Contentlayer relies on.
      const parts = rawContent.split('---');
      if (parts.length < 3) return; // Skip files without proper frontmatter delimiters

      const frontmatter = parts[1];
      let body = parts.slice(2).join('---');
      const originalBody = body;

      // STEP 2: CLEANSE BODY ONLY (Idempotency)
      // Removes existing lexicon links specifically to avoid nesting/drift.
      body = body.replace(/\[([^\]]+)\]\(\/vault\/lexicon\/[^)]+\)/g, '$1');

      // STEP 3: INJECT INTO BODY
      sortedTerms.forEach(term => {
        const url = LEXICON[term];
        
        // Regex Logic:
        // (?<!\[)           -> Not already inside a link bracket
        // \b(${term})\b     -> Exact word/phrase match
        // (?![^\[]*\])      -> Not followed by a closing bracket (prevents breaking existing Markdown links)
        const termRegex = new RegExp(`(?<!\\[)\\b(${term})\\b(?![^\\[]*\\]|\\(.*?\\))`, 'g');
        
        if (termRegex.test(body)) {
          body = body.replace(termRegex, `[$1](${url})`);
        }
      });

      // STEP 4: RECONSTRUCT AND PERSIST
      if (body !== originalBody) {
        const newFileContent = `---${frontmatter}---${body}`;
        fs.writeFileSync(fullPath, newFileContent, 'utf8');
        modifiedFiles++;
        
        const fileMatches = (body.match(/\[[^\]]+\]\(\/vault\/lexicon\//g) || []).length;
        totalInjections += fileMatches;
      }
    });

    console.log(`✅ Success: ${modifiedFiles} briefs hardened with ${totalInjections} semantic links.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Glossary Runtime Error:', err.message);
    process.exit(1);
  }
}

runInjector();