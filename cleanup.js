// cleanup.js
const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'pages');

// List of file pairs identified as duplicates from your log
const DUPLICATE_PAIRS = [
    // Note: We MUST handle the index files with care. The script assumes the goal is to keep the single file.
    // The log is slightly inconsistent, but the pattern is: pages/file.tsx vs pages/file/index.tsx

    // Direct duplicates (keep the single file, delete the directory/index file)
    { single: 'brands.tsx', index: 'brands/index.tsx' },
    { single: 'about.tsx', index: 'about/index.tsx' }, // Assuming 'about' was also a duplicate
    { single: 'terms.tsx', index: 'terms/index.tsx' },

    // /print/ duplicates
    { single: 'print/board-investor-one-pager-template.tsx', index: 'print/board-investor-one-pager-template/index.tsx' },
    { single: 'print/entrepreneur-survival-checklist.tsx', index: 'print/entrepreneur-survival-checklist/index.tsx' },
    { single: 'print/family-altar-liturgy.tsx', index: 'print/family-altar-liturgy/index.tsx' },
    { single: 'print/fatherhood-guide.tsx', index: 'print/fatherhood-guide/index.tsx' },
    { single: 'print/fathering-without-fear-teaser-mobile.tsx', index: 'print/fathering-without-fear-teaser-mobile/index.tsx' },
    { single: 'print/household-rhythm-starter.tsx', index: 'print/household-rhythm-starter/index.tsx' },
    { single: 'print/leadership-playbook.tsx', index: 'print/leadership-playbook/index.tsx' },
    { single: 'print/mentorship-starter-kit.tsx', index: 'print/mentorship-starter-kit/index.tsx' },
    { single: 'print/principles-for-my-son-cue-card.tsx', index: 'print/principles-for-my-son-cue-card/index.tsx' },
    { single: 'print/scripture-track-john14.tsx', index: 'print/scripture-track-john14/index.tsx' },
    { single: 'print/standards-brief.tsx', index: 'print/standards-brief/index.tsx' },

    // /print/a6/ duplicates
    { single: 'print/a6/brotherhood-cue-card-two-up.tsx', index: 'print/a6/brotherhood-cue-card-two-up/index.tsx' },
    { single: 'print/a6/leaders-cue-card-two-up.tsx', index: 'print/a6/leaders-cue-card-two-up/index.tsx' },
    { single: 'print/a6/principles-for-my-son-cue-card-two-up.tsx', index: 'print/a6/principles-for-my-son-cue-card-two-up/index.tsx' },

    // /print/static/ duplicates
    { single: 'print/static/brotherhood-covenant.tsx', index: 'print/static/brotherhood-covenant/index.tsx' },
    { single: 'print/static/fathering-without-fear-teaser.tsx', index: 'print/static/fathering-without-fear-teaser/index.tsx' },
    { single: 'print/static/principles-for-my-son.tsx', index: 'print/static/principles-for-my-son/index.tsx' },

    // Handle pages/index.js vs pages/index.tsx (Keep TS, delete JS)
    { single: 'index.tsx', index: 'index.js' },
];

/**
 * Safely removes the specified file/directory.
 * @param {string} relativePath - The path relative to the 'pages' directory.
 * @param {boolean} dryRun - If true, only prints the action.
 */
function safeDelete(relativePath, dryRun) {
    const fullPath = path.join(PAGES_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`[SKIP] Path not found: ${relativePath}`);
        return;
    }

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
        console.log(`[DRY RUN] Would delete redundant directory: ${relativePath}`);
        if (!dryRun) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`[DELETE] Deleted redundant directory: ${relativePath}`);
        }
    } else {
        console.log(`[DRY RUN] Would delete redundant file: ${relativePath}`);
        if (!dryRun) {
            fs.unlinkSync(fullPath);
            console.log(`[DELETE] Deleted redundant file: ${relativePath}`);
        }
    }
}

/**
 * Main function to perform the cleanup.
 * @param {boolean} dryRun - If true, only prints actions.
 */
function cleanup(dryRun) {
    console.log(`--- Starting Cleanup (Dry Run: ${dryRun}) ---`);

    for (const pair of DUPLICATE_PAIRS) {
        // 1. Check if the file to keep exists
        const keepPath = path.join(PAGES_DIR, pair.single);
        if (!fs.existsSync(keepPath)) {
            console.log(`[WARNING] File to KEEP not found: ${pair.single}. SKIPPING pair.`);
            continue;
        }

        // 2. The file/folder to delete is the 'index' entry
        safeDelete(pair.index, dryRun);

        // 3. For index files that resolve to a directory (e.g., 'brands/index.tsx'), 
        // we should try to delete the parent directory if the single file (e.g., 'brands.tsx') is kept.
        // The path to delete is 'brands'
        if (pair.index.endsWith('index.tsx') || pair.index.endsWith('index.js')) {
            const dirToDelete = path.dirname(pair.index);
            // Only attempt to delete the directory if it's NOT the pages folder itself
            if (dirToDelete !== '.') {
                safeDelete(dirToDelete, dryRun);
            }
        }
    }

    console.log(`--- Cleanup Complete (Dry Run: ${dryRun}) ---`);
    if (dryRun) {
        console.log('\n*** To perform the actual deletion, run: node cleanup.js --delete ***\n');
    }
}

// Check command-line arguments to determine if this is a dry run or actual deletion
const isDelete = process.argv.includes('--delete');
cleanup(!isDelete); // Run dry run by default