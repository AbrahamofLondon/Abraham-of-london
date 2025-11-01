// scripts/fix-pdf-links.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { globSync } from "glob";

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

const CONTENT_DIR = path.join(process.cwd(), "content");

// This regex finds relative PDF links inside content, like <a href="...">
// It captures the path part.
const PDF_LINK_REGEX = /(<a\s+[^>]*?href=["'])(\/downloads\/[^"']+)\.pdf(["'])/gi;

// Utility to convert a slug (kebab-case) to the Title_Case_With_Underscores expected by Netlify redirects
function slugToRedirectCase(slug) {
    if (!slug) return '';
    // 1. Remove initial /downloads/
    let base = slug.toLowerCase().replace(/^\/downloads\//, '');
    
    // 2. Convert from kebab-case (or lowercase) to Title_Case_With_Underscores
    return base
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('_');
}

async function fixPdfLinks() {
    console.log("Scanning content for relative PDF links to standardize...");
    
    const pattern = `${normalizePath(CONTENT_DIR)}/**/*.{md,mdx}`;
    const files = globSync(pattern);

    let updatedCount = 0;

    for (const file of files) {
        try {
            const originalContent = await fs.readFile(file, "utf8");
            let updatedContent = originalContent;

            // 1. Fix download links within the MDX body
            updatedContent = originalContent.replace(PDF_LINK_REGEX, (match, p1, p2, p3) => {
                const standardizedFileName = slugToRedirectCase(p2);
                const newPath = `/downloads/${standardizedFileName}.pdf`;
                return `${p1}${newPath}${p3}`;
            });

            if (originalContent !== updatedContent) {
                await fs.writeFile(file, updatedContent, "utf8");
                console.log(`✔ Fixed PDF links in: ${file.replace(normalizePath(process.cwd()), "")}`);
                updatedCount++;
            }
        } catch (err) {
            console.error(`✖ Error processing ${file}:`, err.message);
        }
    }

    console.log(`\nDone. Standardized links in ${updatedCount} files.`);
}

fixPdfLinks();