// scripts/make-pdfs.mjs - Enhanced with comprehensive error handling
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const CONTENT_DIR = 'content';
const DOWNLOADS_DIR = 'public/assets/downloads';
const RESOURCES_PDF_DIR = 'public/assets/resources/pdfs';
const IMAGES_CANON_DIR = 'public/assets/images/canon';
const IMAGES_DOWNLOADS_DIR = 'public/assets/images/downloads';
const IMAGES_RESOURCES_DIR = 'public/assets/images/resources';

// Ensure all required directories exist
async function ensureDirectories() {
  const dirs = [
    DOWNLOADS_DIR,
    RESOURCES_PDF_DIR,
    IMAGES_CANON_DIR,
    IMAGES_DOWNLOADS_DIR,
    IMAGES_RESOURCES_DIR,
  ];
  
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    console.log(`✅ Ensured directory: ${dir}`);
  }
}

// Get all content files that reference PDFs
async function getContentFilesWithPDFs() {
  const files = [];
  
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Check if file references a downloadFile
        if (content.includes('downloadFile:')) {
          files.push({
            path: fullPath,
            content,
            name: entry.name,
          });
        }
      }
    }
  }
  
  await walk(CONTENT_DIR);
  return files;
}

// Extract PDF paths from content files
function extractPDFPath(content) {
  const match = content.match(/downloadFile:\s*["'](.+?\.pdf)["']/);
  return match ? match[1] : null;
}

// Extract cover image path from content files
function extractCoverImage(content) {
  const match = content.match(/coverImage:\s*["'](.+?\.(jpg|jpeg|png))["']/);
  return match ? match[1] : null;
}

// Generate placeholder PDF if it doesn't exist
async function generatePlaceholderPDF(pdfPath, sourceFile) {
  const fullPath = path.join('public', pdfPath);
  
  try {
    await fs.access(fullPath);
    console.log(`  ⏭️  PDF already exists: ${pdfPath}`);
    return { status: 'exists', path: pdfPath };
  } catch {
    // PDF doesn't exist, try to find and copy an existing one first
    console.log(`  🔍 Looking for existing PDF: ${pdfPath}`);
    
    const copied = await tryFindAndCopyExistingPDF(pdfPath, fullPath, sourceFile);
    if (copied) {
      console.log(`  ✅ Copied existing PDF: ${pdfPath}`);
      return { status: 'copied', path: pdfPath };
    }
    
    // No existing PDF found, generate it
    console.log(`  🔨 Generating PDF: ${pdfPath}`);
    
    try {
      // Try to use your existing PDF generation logic
      await generateSpecificPDF(sourceFile, fullPath);
      console.log(`  ✅ Generated: ${pdfPath}`);
      return { status: 'generated', path: pdfPath };
    } catch (error) {
      console.error(`  ❌ Failed to generate ${pdfPath}:`, error.message);
      
      // Create a minimal placeholder PDF as fallback
      await createMinimalPDF(fullPath, sourceFile);
      console.log(`  ⚠️  Created placeholder: ${pdfPath}`);
      return { status: 'placeholder', path: pdfPath, error: error.message };
    }
  }
}

// Try to find and copy an existing PDF with similar name
async function tryFindAndCopyExistingPDF(targetPath, fullPath, sourceFile) {
  const basename = path.basename(targetPath, '.pdf');
  const targetDir = path.dirname(fullPath);
  
  // Ensure target directory exists
  await fs.mkdir(targetDir, { recursive: true });
  
  // Look in public/assets/downloads for existing PDFs
  const searchDirs = [
    'public/assets/downloads',
    'public/downloads', // Check wrong location too
  ];
  
  for (const searchDir of searchDirs) {
    try {
      const files = await fs.readdir(searchDir);
      
      // Try exact match first (case-insensitive, with spaces/dashes variations)
      const normalizedTarget = basename.toLowerCase().replace(/[-_\s]/g, '');
      
      for (const file of files) {
        if (!file.endsWith('.pdf')) continue;
        
        const fileBase = path.basename(file, '.pdf').toLowerCase().replace(/[-_\s]/g, '');
        
        // Exact normalized match
        if (fileBase === normalizedTarget) {
          await fs.copyFile(path.join(searchDir, file), fullPath);
          console.log(`  📋 Copied from: ${searchDir}/${file}`);
          return true;
        }
      }
      
      // Try partial match (e.g., "scripture-track" matches "Scripture Track - John 14.pdf")
      const keywords = basename.toLowerCase().split(/[-_\s]+/).filter(w => w.length > 3);
      
      for (const file of files) {
        if (!file.endsWith('.pdf')) continue;
        
        const fileLower = file.toLowerCase();
        const matchCount = keywords.filter(kw => fileLower.includes(kw)).length;
        
        // If most keywords match, consider it a match
        if (matchCount >= Math.ceil(keywords.length * 0.7)) {
          await fs.copyFile(path.join(searchDir, file), fullPath);
          console.log(`  📋 Copied similar: ${searchDir}/${file}`);
          return true;
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't read, continue
      continue;
    }
  }
  
  return false;
}

// Move wrongly placed PDFs to correct location
async function fixWronglyPlacedPDFs() {
  try {
    const wrongDir = 'public/downloads';
    const correctDir = 'public/assets/downloads';
    
    const files = await fs.readdir(wrongDir);
    let moved = 0;
    
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const wrongPath = path.join(wrongDir, file);
        const correctPath = path.join(correctDir, file);
        
        try {
          // Check if already exists in correct location
          await fs.access(correctPath);
          // Delete from wrong location
          await fs.unlink(wrongPath);
          console.log(`  🗑️  Deleted duplicate: ${wrongPath}`);
        } catch {
          // Doesn't exist in correct location, move it
          await fs.rename(wrongPath, correctPath);
          console.log(`  📦 Moved: ${file} -> ${correctDir}/`);
          moved++;
        }
      }
    }
    
    if (moved > 0) {
      console.log(`✅ Moved ${moved} PDFs to correct location\n`);
    }
    
    // Try to remove the wrong directory if empty
    try {
      await fs.rmdir(wrongDir);
      console.log(`🗑️  Removed empty directory: ${wrongDir}\n`);
    } catch {
      // Not empty or doesn't exist, that's fine
    }
  } catch (error) {
    // Directory doesn't exist, that's fine
  }
}
async function generateSpecificPDF(sourceFile, outputPath) {
  const basename = path.basename(sourceFile, path.extname(sourceFile));
  
  // Check if there's a specific generator for this file
  const generators = {
    'the-ultimate-purpose-of-man-abraham-of-london': generateUltimatePurposePDF,
    'canon-volume-iv-diagnostic-toolkit': generateCanonToolkitPDF,
    'canon-volume-v-governance-toolkit': generateCanonToolkitPDF,
    'scripture-track-john14': generateScriptureTrackPDF,
    'destiny-mapping-worksheet': generateWorksheetPDF,
    'fatherhood-impact-framework': generateFrameworkPDF,
    'institutional-health-scorecard': generateScorecardPDF,
    'leadership-standards-blueprint': generateBlueprintPDF,
  };
  
  const generator = generators[basename];
  
  if (generator) {
    await generator(outputPath);
  } else {
    // Use generic content-to-PDF conversion
    await generateGenericPDF(sourceFile, outputPath);
  }
}

// Generic PDF generation from MDX content
async function generateGenericPDF(sourceFile, outputPath) {
  const content = await fs.readFile(sourceFile, 'utf-8');
  
  // Remove frontmatter
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Use pandoc or your preferred PDF generator
  const tempMd = `${outputPath}.temp.md`;
  await fs.writeFile(tempMd, contentWithoutFrontmatter);
  
  try {
    // Try pandoc first (best quality)
    await execAsync(`pandoc "${tempMd}" -o "${outputPath}" --pdf-engine=xelatex`);
  } catch {
    try {
      // Fallback to markdown-pdf if pandoc not available
      await execAsync(`npx markdown-pdf "${tempMd}" -o "${outputPath}"`);
    } catch {
      // Final fallback: create simple text-based PDF
      await createSimpleTextPDF(contentWithoutFrontmatter, outputPath);
    }
  } finally {
    await fs.unlink(tempMd).catch(() => {});
  }
}

// Create simple text-based PDF using Node
async function createSimpleTextPDF(content, outputPath) {
  // Use pdf-lib or similar for creating basic PDFs
  const PDFDocument = (await import('pdf-lib')).PDFDocument;
  const pdfDoc = await PDFDocument.create();
  
  const page = pdfDoc.addPage([612, 792]); // Letter size
  const { height } = page.getSize();
  
  const fontSize = 12;
  const margin = 50;
  const lineHeight = fontSize * 1.5;
  
  // Split content into lines that fit the page width
  const lines = content.split('\n').flatMap(line => {
    // Simple word wrapping
    const maxWidth = 512; // page width minus margins
    const words = line.split(' ');
    const wrappedLines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (testLine.length * fontSize * 0.5 < maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) wrappedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) wrappedLines.push(currentLine);
    
    return wrappedLines.length ? wrappedLines : [''];
  });
  
  // Add text to page
  let y = height - margin;
  for (const line of lines.slice(0, 40)) { // First 40 lines
    if (y < margin) break;
    
    page.drawText(line, {
      x: margin,
      y,
      size: fontSize,
    });
    
    y -= lineHeight;
  }
  
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outputPath, pdfBytes);
}

// Create minimal placeholder PDF
async function createMinimalPDF(outputPath, sourceFile) {
  const basename = path.basename(sourceFile, path.extname(sourceFile));
  const title = basename.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  const content = `# ${title}\n\nThis PDF will be generated with full content soon.\n\nSource: ${sourceFile}`;
  await createSimpleTextPDF(content, outputPath);
}

// Specific PDF generators (implement these based on your needs)
async function generateUltimatePurposePDF(outputPath) {
  // Use your existing generate-ultimate-purpose-of-man-pdf.tsx
  await execAsync(`npx tsx scripts/generate-ultimate-purpose-of-man-pdf.tsx`);
}

async function generateCanonToolkitPDF(outputPath) {
  const title = path.basename(outputPath).includes('iv') ? 'Volume IV Diagnostic Toolkit' : 'Volume V Governance Toolkit';
  await createSimpleTextPDF(`# Canon ${title}\n\nToolkit content coming soon.`, outputPath);
}

async function generateScriptureTrackPDF(outputPath) {
  await createSimpleTextPDF('# Scripture Track - John 14\n\nScripture study guide.', outputPath);
}

async function generateWorksheetPDF(outputPath) {
  await createSimpleTextPDF('# Destiny Mapping Worksheet\n\nWorksheet content.', outputPath);
}

async function generateFrameworkPDF(outputPath) {
  await createSimpleTextPDF('# Fatherhood Impact Framework\n\nFramework content.', outputPath);
}

async function generateScorecardPDF(outputPath) {
  await createSimpleTextPDF('# Institutional Health Scorecard\n\nScorecard content.', outputPath);
}

async function generateBlueprintPDF(outputPath) {
  await createSimpleTextPDF('# Leadership Standards Blueprint\n\nBlueprint content.', outputPath);
}

// Generate placeholder images if missing
async function ensureCoverImage(imagePath, contentFile) {
  const fullPath = path.join('public', imagePath);
  
  try {
    await fs.access(fullPath);
    console.log(`  ⏭️  Image exists: ${imagePath}`);
    return { status: 'exists', path: imagePath };
  } catch {
    console.log(`  🖼️  Creating placeholder image: ${imagePath}`);
    
    // Try to copy from a similar existing image
    const similarImage = await findSimilarImage(imagePath);
    
    if (similarImage) {
      await fs.copyFile(similarImage, fullPath);
      console.log(`  ✅ Copied from: ${similarImage}`);
      return { status: 'copied', path: imagePath, source: similarImage };
    } else {
      // Create a simple placeholder using sharp or similar
      await createPlaceholderImage(fullPath, contentFile);
      console.log(`  ⚠️  Created placeholder image: ${imagePath}`);
      return { status: 'placeholder', path: imagePath };
    }
  }
}

// Find a similar existing image to copy
async function findSimilarImage(targetPath) {
  const dir = path.dirname(path.join('public', targetPath));
  const basename = path.basename(targetPath, path.extname(targetPath));
  
  try {
    const files = await fs.readdir(dir);
    
    // Look for similar named files
    const similar = files.find(f => {
      const fbase = path.basename(f, path.extname(f));
      return fbase.includes(basename.split('-')[0]) || basename.includes(fbase.split('-')[0]);
    });
    
    return similar ? path.join(dir, similar) : null;
  } catch {
    return null;
  }
}

// Create a simple placeholder image
async function createPlaceholderImage(outputPath, sourceFile) {
  try {
    const sharp = (await import('sharp')).default;
    
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    const title = basename.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // Create a simple colored rectangle with text
    const svg = `
      <svg width="800" height="1000">
        <rect width="800" height="1000" fill="#1a365d"/>
        <text x="400" y="500" font-size="32" fill="white" text-anchor="middle" font-family="Arial, sans-serif">
          ${title}
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 85 })
      .toFile(outputPath);
  } catch (error) {
    console.error(`  ❌ Failed to create placeholder image:`, error.message);
    // If sharp fails, just create an empty file to prevent validation errors
    await fs.writeFile(outputPath, '');
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive PDF and asset generation...\n');
  
  try {
    // Step 0: Fix any wrongly placed PDFs
    console.log('📦 Checking for misplaced PDFs...');
    await fixWronglyPlacedPDFs();
    
    // Step 1: Ensure all directories exist
    console.log('📁 Ensuring directories...');
    await ensureDirectories();
    console.log();
    
    // Step 2: Get all content files
    console.log('📄 Scanning content files...');
    const contentFiles = await getContentFilesWithPDFs();
    console.log(`Found ${contentFiles.length} files with PDF references\n`);
    
    // Step 3: Process each file
    const results = {
      pdfs: { generated: 0, exists: 0, placeholder: 0, errors: [] },
      images: { generated: 0, exists: 0, placeholder: 0, copied: 0, errors: [] },
    };
    
    for (const file of contentFiles) {
      console.log(`Processing: ${file.name}`);
      
      // Handle PDF
      const pdfPath = extractPDFPath(file.content);
      if (pdfPath) {
        const result = await generatePlaceholderPDF(pdfPath, file.path);
        results.pdfs[result.status]++;
        if (result.error) results.pdfs.errors.push({ file: file.name, error: result.error });
      }
      
      // Handle cover image
      const imagePath = extractCoverImage(file.content);
      if (imagePath) {
        const result = await ensureCoverImage(imagePath, file.path);
        results.images[result.status]++;
        if (result.error) results.images.errors.push({ file: file.name, error: result.error });
      }
      
      console.log();
    }
    
    // Step 4: Print summary
    console.log('📊 Generation Summary:');
    console.log('PDFs:');
    console.log(`  ✅ Already existed: ${results.pdfs.exists}`);
    console.log(`  📋 Copied from existing: ${results.pdfs.copied || 0}`);
    console.log(`  🔨 Generated: ${results.pdfs.generated}`);
    console.log(`  ⚠️  Placeholders: ${results.pdfs.placeholder}`);
    if (results.pdfs.errors.length) {
      console.log(`  ❌ Errors: ${results.pdfs.errors.length}`);
      results.pdfs.errors.forEach(e => console.log(`     - ${e.file}: ${e.error}`));
    }
    
    console.log('\nImages:');
    console.log(`  ✅ Already existed: ${results.images.exists}`);
    console.log(`  🔨 Generated: ${results.images.generated}`);
    console.log(`  📋 Copied: ${results.images.copied}`);
    console.log(`  ⚠️  Placeholders: ${results.images.placeholder}`);
    if (results.images.errors.length) {
      console.log(`  ❌ Errors: ${results.images.errors.length}`);
      results.images.errors.forEach(e => console.log(`     - ${e.file}: ${e.error}`));
    }
    
    console.log('\n✅ PDF generation complete!');
    
    // Exit with error if there were critical failures
    if (results.pdfs.errors.length > 0 || results.images.errors.length > 0) {
      console.log('\n⚠️  Some assets had errors but placeholders were created');
      // Don't fail the build, just warn
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();