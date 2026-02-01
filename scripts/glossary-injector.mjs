import fs from 'fs';
import path from 'path';

/**
 * INSTITUTIONAL GLOSSARY INJECTOR (v3.1 - YAML-Safe, Idempotent, & Auditable)
 * Purpose: Systematically manages cross-links while protecting metadata.
 */
async function runInjector() {
  const SDK_PATH = path.resolve('./.contentlayer/generated/index.mjs');
  const LOG_PATH = path.resolve('./glossary-audit.log');

  if (!fs.existsSync(SDK_PATH)) {
    console.error('\n❌ GLOSSARY FAILURE: SDK missing. Run pnpm contentlayer:build first.');
    process.exit(1);
  }

  try {
    const { allDocuments } = await import('../.contentlayer/generated/index.mjs');
    
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
    let auditLog = `GLOSSARY INJECTION AUDIT - ${new Date().toISOString()}\n${'='.repeat(50)}\n`;

    allDocuments.forEach(doc => {
      const fullPath = path.join(process.cwd(), 'content', doc._raw.sourceFilePath);
      if (!fs.existsSync(fullPath)) return;

      const rawContent = fs.readFileSync(fullPath, 'utf8');
      
      // STEP 1: SEGREGATE FRONTMATTER FROM BODY
      const parts = rawContent.split('---');
      if (parts.length < 3) return;

      const frontmatter = parts[1];
      let body = parts.slice(2).join('---');
      const originalBody = body;

      // STEP 2: CLEANSE BODY ONLY
      body = body.replace(/\[([^\]]+)\]\(\/vault\/lexicon\/[^)]+\)/g, '$1');

      // STEP 3: INJECT INTO BODY
      let fileInjections = [];
      sortedTerms.forEach(term => {
        const url = LEXICON[term];
        const termRegex = new RegExp(`(?<!\\[)\\b(${term})\\b(?![^\\[]*\\]|\\(.*?\\))`, 'g');
        
        if (termRegex.test(body)) {
          body = body.replace(termRegex, `[$1](${url})`);
          fileInjections.push(term);
        }
      });

      // STEP 4: RECONSTRUCT AND PERSIST
      if (body !== originalBody) {
        const newFileContent = `---${frontmatter}---${body}`;
        fs.writeFileSync(fullPath, newFileContent, 'utf8');
        modifiedFiles++;
        totalInjections += fileInjections.length;
        auditLog += `MODIFIED: ${doc._raw.sourceFilePath} | TERMS: ${fileInjections.join(', ')}\n`;
      }
    });

    fs.writeFileSync(LOG_PATH, auditLog, 'utf8');
    console.log(`✅ Success: ${modifiedFiles} briefs hardened.`);
    console.log(`📄 Audit Log created: ${LOG_PATH}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Glossary Runtime Error:', err.message);
    process.exit(1);
  }
}

runInjector();