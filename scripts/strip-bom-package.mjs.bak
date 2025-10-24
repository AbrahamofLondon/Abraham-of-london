// scripts/strip-bom-package.mjs
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the path to the package.json file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagePath = path.resolve(__dirname, '..', 'package.json');

// BOM (Byte Order Mark) for UTF-8 is often represented as \uFEFF
const BOM_CHAR = '\uFEFF';

console.log(`[BOM STRIPPER] Starting scan of: ${packagePath}`);

async function stripBomAndSave(filePath) {
    try {
        // 1. Read the file content
        let content = await fs.readFile(filePath, { encoding: 'utf8' });

        // 2. Check for and remove the BOM character
        if (content.startsWith(BOM_CHAR)) {
            console.log("[BOM STRIPPER] BOM detected! Removing character.");
            content = content.substring(1); // Remove the first character (the BOM)

            // 3. Write the cleaned content back to the file
            await fs.writeFile(filePath, content, { encoding: 'utf8' });
            console.log("[BOM STRIPPER] File successfully cleaned and saved as UTF-8 (without BOM).");
            return true;
        } else {
            console.log("[BOM STRIPPER] No BOM detected. File is already clean.");
            return true;
        }
    } catch (error) {
        console.error(`[BOM STRIPPER] ERROR processing file: ${error.message}`);
        return false;
    }
}

// Execute the function
stripBomAndSave(packagePath)
    .then(success => {
        if (success) {
            console.log("[BOM STRIPPER] Script finished.");
            process.exit(0);
        } else {
            console.error("[BOM STRIPPER] Script failed to complete.");
            process.exit(1);
        }
    })
    .catch(err => {
        console.error("[BOM STRIPPER] Unhandled error:", err);
        process.exit(1);
    });