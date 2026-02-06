import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, 'content');

function walk(dir) {
    if (!fs.existsSync(dir)) {
        console.warn(`Directory not found: ${dir}`);
        return;
    }

    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.mdx') || fullPath.endsWith('.md')) {
            try {
                // Read as buffer first to handle potential encoding weirdness
                const buffer = fs.readFileSync(fullPath);
                let content = buffer.toString('utf8');
                
                // 1. Strip Byte Order Mark (BOM)
                if (content.startsWith('\uFEFF')) {
                    content = content.slice(1);
                    console.log(`BOM removed: ${file}`);
                }
                
                // 2. Standardize Smart Quotes/Dashes
                const cleanedContent = content
                    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
                    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
                    .replace(/\u2013/g, "-")         // En-dash
                    .replace(/\u2014/g, "--")        // Em-dash
                    .replace(/\u00A0/g, ' ')         // Non-breaking space
                    .replace(/\0/g, '');             // Null characters

                // 3. Write back only if changes were made
                if (content !== cleanedContent || buffer[0] === 0xEF) {
                    fs.writeFileSync(fullPath, cleanedContent, { encoding: 'utf8' });
                    console.log(`Successfully sanitized: ${file}`);
                }
            } catch (err) {
                console.error(`Failed to process ${file}:`, err.message);
            }
        }
    });
}

console.log("--- Institutional Content Sanitization (ESM Mode) ---");
walk(contentDir);
console.log("--- Process Complete ---");