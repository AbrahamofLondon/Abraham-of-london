import fs from 'fs';
import path from 'path';

/**
 * GLOSSARY INJECTOR
 * Systematically cross-references defined terms within the vault.
 */
async function runInjector() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ GLOSSARY FAILURE: SDK missing. Run build first.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    // Define the core lexicon mapping
    const LEXICON = {
      "Sovereignty": "/vault/lexicon/sovereignty",
      "Strategic Autonomy": "/vault/lexicon/strategic-autonomy",
      "Institutional Integrity": "/vault/lexicon/integrity"
    };

    let injectionCount = 0;

    console.log(`\n--- 📚 Injecting Glossary links into ${allDocuments.length} Briefs ---`);

    allDocuments.forEach(doc => {
      const fullPath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
      if (!fs.existsSync(fullPath)) return;

      let content = fs.readFileSync(fullPath, 'utf8');
      let isModified = false;

      Object.entries(LEXICON).forEach(([term, url]) => {
        // Matches the term only if NOT already inside a Markdown link []()
        const termRegex = new RegExp(`(?<!\\[)\\b(${term})\\b(?!\\])`, 'g');
        
        if (termRegex.test(content)) {
          content = content.replace(termRegex, `[$1](${url})`);
          isModified = true;
          injectionCount++;
        }
      });

      if (isModified) {
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    });

    console.log(`✅ Success: ${injectionCount} glossary terms auto-linked.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Glossary Runtime Error:', err.message);
    process.exit(1);
  }
}

runInjector();