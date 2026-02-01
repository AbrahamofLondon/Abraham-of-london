import fs from 'fs';
import path from 'path';

async function runInjector() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');
  if (!fs.existsSync(SDK_PATH)) process.exit(1);

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
    // SCALE TIP: In the future, move this to a separate config file
    const LEXICON = {
      "Sovereignty": "/vault/lexicon/sovereignty",
      "Strategic Autonomy": "/vault/lexicon/strategic-autonomy",
      "Institutional Integrity": "/vault/lexicon/integrity",
      "Integrity": "/vault/lexicon/integrity"
    };

    let totalLinks = 0;
    let filesModified = 0;

    allDocuments.forEach(doc => {
      const fullPath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      // SAFETY: Sort terms by length (descending) 
      // This prevents "Integrity" from breaking "Institutional Integrity"
      const sortedTerms = Object.keys(LEXICON).sort((a, b) => b.length - a.length);

      sortedTerms.forEach(term => {
        const url = LEXICON[term];
        
        // REGEX EXPLAINED: 
        // 1. (?<!\[) -> Not preceded by a [ (prevents double linking)
        // 2. \b(${term})\b -> Exact word match
        // 3. (?![^\[]*\]) -> Not followed by a ] later in the same segment (prevents breaking existing links)
        const termRegex = new RegExp(`(?<!\\[)\\b(${term})\\b(?![^\\[]*\\]|\\(.*?\\))`, 'g');
        
        if (termRegex.test(content)) {
          content = content.replace(termRegex, `[$1](${url})`);
        }
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        filesModified++;
      }
    });

    console.log(`✅ Scale Check: ${filesModified} briefs updated.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}
runInjector();