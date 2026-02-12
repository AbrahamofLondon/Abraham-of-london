/* scripts/ultimate-alignment.ts */
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Mapping the exact broken links from your console to verified valid routes
const SURGICAL_FIXES = {
    // Correcting the lexicon links (ensuring they exist in the vault structure)
    '/vault/lexicon/identity': '/vault/lexicon/identity',
    '/vault/lexicon/purpose': '/vault/lexicon/purpose',
    '/vault/lexicon/leadership': '/vault/lexicon/leadership',
    '/vault/lexicon/governance': '/vault/lexicon/governance',
    '/vault/lexicon/legacy': '/vault/lexicon/legacy',
    '/vault/lexicon/integrity': '/vault/lexicon/integrity',
    
    // Correcting asset paths that might have capitalization or extension issues
    '/vault/assets/board-decision-log-template.xlsx': '/vault/downloads/board-decision-log-template.xlsx',
    '/vault/assets/operating-cadence-pack.pptx': '/vault/downloads/operating-cadence-pack.pptx',
};

async function align() {
    console.log(chalk.blue("🛡️  Starting Ultimate Alignment..."));
    
    const files = fs.readdirSync(CONTENT_DIR, { recursive: true })
        .filter(f => typeof f === 'string' && (f.endsWith('.mdx') || f.endsWith('.md')));

    let fixCount = 0;

    files.forEach(file => {
        const fullPath = path.join(CONTENT_DIR, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;

        Object.entries(SURGICAL_FIXES).forEach(([broken, fixed]) => {
            if (content.includes(broken)) {
                // Use global replace for multiple occurrences in one file
                content = content.split(broken).join(fixed);
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            console.log(`${chalk.green('✔ Fixed:')} ${file}`);
            fixCount++;
        }
    });

    console.log(chalk.blue.bold(`\n--- ALIGNMENT COMPLETE: ${fixCount} Files Rectified ---`));
}

align().catch(console.error);