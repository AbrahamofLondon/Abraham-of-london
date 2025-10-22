const fs = require('fs');
const path = require('path');

// --- Configuration (USING RAW HEX BYTES FOR SAFETY) ---
// Representing the corrupted byte sequences as hex arrays prevents your code editor 
// from corrupting the find/replace strings when you save the file.

const CORRUPTED_SEQUENCES = [
    // Corrupted sequence for the apostrophe/right single quote (') - The extremely deep corruption
    {
        // Hex representation of 'ÃƒÆ'Ã†â€™Ãƒâ€Ã¢â‚¬â„¢...'
        corrupt: Buffer.from([0xC3, 0x83, 0xC6, 0x92, 0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xBD, 0xCB, 0x9C, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xBD, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xCB, 0x9C, 0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xA1, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xE2, 0x80, 0xA0, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xE2, 0x80, 0xA0, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xE2, 0x80, 0xA0, 0xC3, 0x82, 0xC2, 0xAC]),
        correct: Buffer.from("'", 'utf8')
    },
    // The specific sequence 'ÃƒÆ'Ã†â€™Ãƒâ€Ã¢â‚¬â„¢ÃƒÆ'Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ'Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ'Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã...Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ'Ã¢â‚¬Â¦'
    {
        corrupt: Buffer.from([0xC3, 0x83, 0xC6, 0x92, 0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xBD, 0xCB, 0x9C, 0xC3, 0x83, 0xC6, 0x92, 0xC3, 0x82, 0xC2, 0xA2, 0xC3, 0x83, 0xE2, 0x80, 0xA0, 0xC3, 0x82, 0xC2, 0xAC, 0xC3, 0x85, 0xC2, 0xA6]),
        correct: Buffer.from("", 'utf8') // Replace with nothing (garbage cleanup)
    },
    // Common double-encoding for apostrophe/smart quote ('â€™')
    {
        corrupt: Buffer.from([0xE2, 0x80, 0x99]),
        correct: Buffer.from("'", 'utf8')
    },
    // Common double-encoding for left double quote ('â€œ')
    {
        corrupt: Buffer.from([0xE2, 0x80, 0x9C]),
        correct: Buffer.from('"', 'utf8')
    },
    // Common double-encoding for right double quote ('â€')
    {
        corrupt: Buffer.from([0xE2, 0x80, 0x9D]),
        correct: Buffer.from('"', 'utf8')
    },
    // Common double-encoding for ellipsis ('â€¦')
    {
        corrupt: Buffer.from([0xE2, 0x80, 0xA6]),
        correct: Buffer.from('...', 'utf8')
    },
    // ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬
    {
        corrupt: Buffer.from([0xC3, 0x83, 0xC2, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xA1, 0xC3, 0x82, 0xC2, 0xAC]),
        correct: Buffer.from("", 'utf8')
    },
    // ÃƒÆ'Ã†â€™Ãƒâ€Ã¢â‚¬â„¢ÃƒÆ'Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢
    {
        corrupt: Buffer.from([0xC3, 0x83, 0xC6, 0x92, 0xC3, 0xA2, 0xE2, 0x82, 0xAC, 0xC5, 0xBD, 0xCB, 0x9C, 0xC3, 0x83, 0xC2, 0xA2]),
        correct: Buffer.from("", 'utf8')
    }
];

/**
 * Replaces all occurrences of the corrupted buffer sequence with the correct buffer.
 * Operates on raw byte Buffers for safety.
 * @param {Buffer} data - The raw file data (Buffer)
 * @param {Buffer} find - The corrupted byte sequence to find
 * @param {Buffer} replace - The correct byte sequence to replace it with
 * @returns {Buffer} The modified data buffer
 */
function bufferReplaceAll(data, find, replace) {
    let parts = [];
    let current = 0;
    let index = data.indexOf(find, current);

    while (index !== -1) {
        parts.push(data.slice(current, index));
        parts.push(replace);
        current = index + find.length;
        index = data.indexOf(find, current);
    }

    parts.push(data.slice(current));
    return Buffer.concat(parts);
}

/**
 * Processes a single file to check for and fix corruption.
 * @param {string} filepath - The path to the file.
 * @param {boolean} dryRun - If true, only report fixes, don't save.
 */
function processFile(filepath, dryRun) {
    try {
        // 1. Read the file as a raw binary buffer
        let data = fs.readFileSync(filepath);
        const originalDataLength = data.length;
        let fixedCount = 0;

        // 2. Iterate and apply all corruption fixes
        for (const seq of CORRUPTED_SEQUENCES) {
            const beforeLength = data.length;
            data = bufferReplaceAll(data, seq.corrupt, seq.correct);
            
            // Simple check to see if any change actually occurred
            if (data.length !== beforeLength || data.indexOf(seq.correct) !== -1) {
                fixedCount++;
            }
        }
        
        // 3. Audit and save
        if (fixedCount > 0 || data.length !== originalDataLength) {
            console.log(`🛠️ FIXED (Count: ${fixedCount} changes) - ${filepath}`);
            
            if (!dryRun) {
                // Write the fixed buffer back to the file
                fs.writeFileSync(filepath, data);
            }
            return true;
        }

    } catch (error) {
        if (error.code === 'EISDIR') return false; // Ignore directories
        console.error(`❌ Error processing ${filepath}: ${error.message}`);
        return false;
    }
    return false;
}

/**
 * Recursively walks a directory to find and fix files.
 * @param {string} dirPath - The root directory to scan.
 * @param {boolean} dryRun - If true, only audit and report.
 */
function auditAndFixRepo(dirPath, dryRun) {
    if (!fs.existsSync(dirPath)) {
        console.error(`\nError: Directory not found at ${dirPath}`);
        return;
    }

    console.log(`\n--- Starting Node.js File Audit and Repair in: ${dirPath} ---`);
    if (dryRun) {
        console.log("!!! DRY RUN MODE: No files will be permanently modified. !!!");
    }

    let filesFixed = 0;
    let filesChecked = 0;

    const walk = (currentPath) => {
        try {
            const items = fs.readdirSync(currentPath);
            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    // Skip node_modules and hidden folders for speed/safety
                    if (item === 'node_modules' || item.startsWith('.')) {
                        continue;
                    }
                    walk(fullPath);
                } else if (stat.isFile()) {
                    filesChecked++;
                    
                    // Recommended extension filtering for safety:
                    const ext = path.extname(fullPath).toLowerCase();
                    if (['.html', '.md', '.css', '.js', '.json', '.xml', '.txt'].includes(ext) || ext === '') {
                        if (processFile(fullPath, dryRun)) {
                            filesFixed++;
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Error walking directory ${currentPath}: ${e.message}`);
        }
    };

    walk(dirPath);

    console.log("\n--- Audit and Repair Complete ---");
    console.log(`Files checked: ${filesChecked}`);
    console.log(`Files flagged/fixed: ${filesFixed}`);
    
    if (dryRun) {
        console.log("\n✅ Run the script again *without* the `--dry-run` argument to apply the fixes.");
    } else {
        console.log("\n✅ ALL CLEANED AND RESTORED. Remember to commit your changes!");
    }
}

// --- Execution ---

const args = process.argv.slice(2);
const repoPath = args[0] || '.'; // Default to current directory
const dryRun = args.includes('--dry-run');

auditAndFixRepo(repoPath, dryRun);