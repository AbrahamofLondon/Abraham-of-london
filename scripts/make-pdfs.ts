// scripts/make-pdfs.ts
// Premium PDF generation for Abraham of London
// - Strict validation with no placeholders
// - Only generates PDFs if all requirements are met
// - Throws errors for missing assets
// - Professional-grade content only

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = "content";
const PUBLIC_DIR = "public";
const DOWNLOADS_DIR = path.join(PUBLIC_DIR, "assets", "downloads");
const WRONG_DOWNLOADS_DIR = path.join(PUBLIC_DIR, "downloads");

// ----------------------------
// Premium Interfaces
// ----------------------------

interface ContentFile {
  path: string;
  name: string;
  content: string;
}

interface PdfReference {
  raw: string;
  canonicalPath: string;
  publicHref: string;
  filename: string;
}

interface PdfGenerationResult {
  status: 'exists' | 'generated' | 'copied' | 'error';
  pdfPath: string;
  publicHref: string;
  source?: string;
  error?: string;
}

interface CoverImageResult {
  status: 'exists' | 'missing' | 'error';
  path: string;
  error?: string;
}

interface ContentValidation {
  isValid: boolean;
  hasPdfRef: boolean;
  hasCoverImage: boolean;
  errors: string[];
}

// ----------------------------
// Premium Utilities
// ----------------------------

function logStep(msg: string): void {
  console.log(`🎯 ${msg}`);
}

function logSuccess(msg: string): void {
  console.log(`✅ ${msg}`);
}

function logWarning(msg: string): void {
  console.log(`⚠️  ${msg}`);
}

function logError(msg: string): void {
  console.error(`❌ ${msg}`);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
    logSuccess(`Ensured directory: ${dir}`);
  } catch (error) {
    throw new Error(`Failed to create directory ${dir}: ${error}`);
  }
}

function normalizePath(href: string): string {
  return href.trim().replace(/^\/+/, "").replace(/\\/g, "/");
}

function extractFrontmatterBlock(raw: string): string | null {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n/m);
  return match ? match[1] : null;
}

function extractFirstMatch(raw: string, regex: RegExp): string | null {
  const m = raw.match(regex);
  return m ? m[1] : null;
}

// ----------------------------
// Strict Content Validation
// ----------------------------

function validateContentFile(content: string): ContentValidation {
  const validation: ContentValidation = {
    isValid: true,
    hasPdfRef: false,
    hasCoverImage: false,
    errors: []
  };

  const fm = extractFrontmatterBlock(content);
  if (!fm) {
    validation.isValid = false;
    validation.errors.push("Missing or invalid frontmatter");
    return validation;
  }

  // Check for PDF references
  const pdfRefRegex = /^(?:pdfPath|downloadFile|file)\s*:\s*["'](.+?\.pdf)["']\s*$/m;
  if (pdfRefRegex.test(fm)) {
    validation.hasPdfRef = true;
  }

  // Check for cover image
  const coverRegex = /^coverImage\s*:\s*["'](.+?\.(?:jpg|jpeg|png|webp|avif))["']\s*$/m;
  if (coverRegex.test(fm)) {
    validation.hasCoverImage = true;
  }

  // Premium content must have both
  if (!validation.hasPdfRef) {
    validation.isValid = false;
    validation.errors.push("Missing PDF reference (pdfPath, downloadFile, or file)");
  }

  if (!validation.hasCoverImage) {
    validation.isValid = false;
    validation.errors.push("Missing coverImage");
  }

  return validation;
}

function extractPdfReference(content: string): PdfReference | null {
  const fm = extractFrontmatterBlock(content);
  if (!fm) return null;

  // Check all possible PDF reference keys
  const pdfPath = extractFirstMatch(fm, /^pdfPath\s*:\s*["'](.+?\.pdf)["']\s*$/m);
  if (pdfPath) {
    return normalizePdfReference(pdfPath);
  }

  const downloadFile = extractFirstMatch(fm, /^downloadFile\s*:\s*["'](.+?\.pdf)["']\s*$/m);
  if (downloadFile) {
    return normalizePdfReference(downloadFile);
  }

  const file = extractFirstMatch(fm, /^file\s*:\s*["'](.+?\.pdf)["']\s*$/m);
  if (file) {
    return normalizePdfReference(`/assets/downloads/${file}`);
  }

  return null;
}

function normalizePdfReference(ref: string): PdfReference {
  const normalized = normalizePath(ref);
  const filename = path.basename(normalized);
  
  // Ensure PDF is in the correct directory
  const publicHref = `assets/downloads/${filename}`;
  const canonicalPath = path.join(DOWNLOADS_DIR, filename);

  return {
    raw: ref,
    canonicalPath,
    publicHref,
    filename
  };
}

function extractCoverImage(content: string): string | null {
  const fm = extractFrontmatterBlock(content);
  if (!fm) return null;

  const cover = extractFirstMatch(
    fm,
    /^coverImage\s*:\s*["'](.+?\.(?:jpg|jpeg|png|webp|avif))["']\s*$/m
  );

  return cover ? normalizePath(cover) : null;
}

// ----------------------------
// Content Scanning
// ----------------------------

async function scanContentFiles(): Promise<ContentFile[]> {
  const files: ContentFile[] = [];
  
  async function scanDirectory(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            path: fullPath,
            name: entry.name,
            content
          });
        } catch (error) {
          logError(`Failed to read ${fullPath}: ${error}`);
        }
      }
    }
  }

  await scanDirectory(CONTENT_DIR);
  return files;
}

// ----------------------------
// PDF Generation
// ----------------------------

async function generatePremiumPdf(
  pdfRef: PdfReference,
  mdxPath: string,
  coverImagePath?: string
): Promise<void> {
  const { canonicalPath, filename } = pdfRef;
  
  logStep(`Generating premium PDF: ${filename}`);
  
  // Check if cover image exists
  if (coverImagePath) {
    const coverAbsPath = path.join(PUBLIC_DIR, coverImagePath);
    if (!(await pathExists(coverAbsPath))) {
      throw new Error(`Cover image not found: ${coverImagePath}`);
    }
  }

  // Check for existing React PDF generator
  const generatorPath = path.join(__dirname, '..', 'lib', 'pdf', `${path.basename(mdxPath, '.mdx')}-pdf.tsx`);
  
  if (await pathExists(generatorPath)) {
    await generateReactPdf(generatorPath, canonicalPath, coverImagePath);
  } else {
    // Fallback to external generator script
    await generateWithExternalScript(filename, canonicalPath);
  }
}

async function generateReactPdf(
  generatorPath: string,
  outputPath: string,
  coverImagePath?: string
): Promise<void> {
  // This would dynamically import and render the React PDF component
  // For now, we'll create a placeholder implementation
  logStep(`Using React PDF generator: ${path.basename(generatorPath)}`);
  
  // In a real implementation, you would:
  // 1. Dynamically import the component
  // 2. Render it with React PDF
  // 3. Save to outputPath
  
  throw new Error(`React PDF generator not implemented: ${generatorPath}`);
}

async function generateWithExternalScript(
  pdfName: string,
  outputPath: string
): Promise<void> {
  const scriptName = pdfName.replace('.pdf', '').replace(/-/g, '_');
  const scriptPath = path.join(__dirname, `generate-${scriptName}-pdf.ts`);
  
  if (await pathExists(scriptPath)) {
    logStep(`Using external generator: ${scriptPath}`);
    
    // Execute the TypeScript script
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    try {
      await execAsync(`npx tsx ${scriptPath} --output "${outputPath}"`);
      logSuccess(`Generated PDF: ${pdfName}`);
    } catch (error) {
      throw new Error(`Failed to execute generator ${scriptPath}: ${error}`);
    }
  } else {
    throw new Error(`No generator found for PDF: ${pdfName}`);
  }
}

// ----------------------------
// Asset Management
// ----------------------------

async function fixMisplacedPdfs(): Promise<void> {
  if (!(await pathExists(WRONG_DOWNLOADS_DIR))) {
    return;
  }

  try {
    const files = await fs.readdir(WRONG_DOWNLOADS_DIR);
    let movedCount = 0;

    for (const file of files) {
      if (!file.toLowerCase().endsWith('.pdf')) continue;

      const sourcePath = path.join(WRONG_DOWNLOADS_DIR, file);
      const targetPath = path.join(DOWNLOADS_DIR, file);

      if (await pathExists(targetPath)) {
        await fs.unlink(sourcePath);
        logWarning(`Removed duplicate: ${file}`);
      } else {
        await fs.rename(sourcePath, targetPath);
        logSuccess(`Moved: ${file} → assets/downloads/`);
        movedCount++;
      }
    }

    // Clean up empty directory
    const remainingFiles = await fs.readdir(WRONG_DOWNLOADS_DIR);
    if (remainingFiles.length === 0) {
      await fs.rm(WRONG_DOWNLOADS_DIR, { recursive: true });
      logSuccess('Removed empty downloads directory');
    }

    if (movedCount > 0) {
      logSuccess(`Fixed ${movedCount} misplaced PDFs`);
    }
  } catch (error) {
    logError(`Failed to fix misplaced PDFs: ${error}`);
  }
}

async function validateCoverImage(coverPath: string): Promise<CoverImageResult> {
  const absolutePath = path.join(PUBLIC_DIR, coverPath);
  
  try {
    const exists = await pathExists(absolutePath);
    
    if (!exists) {
      return {
        status: 'missing',
        path: coverPath,
        error: `Cover image not found: ${coverPath}`
      };
    }

    // Verify it's a valid image file
    const stats = await fs.stat(absolutePath);
    if (stats.size === 0) {
      return {
        status: 'error',
        path: coverPath,
        error: `Cover image is empty: ${coverPath}`
      };
    }

    return {
      status: 'exists',
      path: coverPath
    };
  } catch (error) {
    return {
      status: 'error',
      path: coverPath,
      error: `Failed to validate cover image: ${error}`
    };
  }
}

// ----------------------------
// Main Processing
// ----------------------------

async function processContentFile(contentFile: ContentFile): Promise<{
  pdfResult?: PdfGenerationResult;
  coverResult?: CoverImageResult;
}> {
  const { path: mdxPath, content } = contentFile;
  const baseName = path.basename(mdxPath);

  logStep(`Processing: ${baseName}`);

  // Validate content
  const validation = validateContentFile(content);
  if (!validation.isValid) {
    logError(`Invalid content in ${baseName}: ${validation.errors.join(', ')}`);
    return {};
  }

  // Extract PDF reference
  const pdfRef = extractPdfReference(content);
  if (!pdfRef) {
    logError(`Failed to extract PDF reference from ${baseName}`);
    return {};
  }

  // Extract cover image
  const coverImage = extractCoverImage(content);
  if (!coverImage) {
    logError(`Failed to extract cover image from ${baseName}`);
    return {};
  }

  // Validate cover image
  const coverResult = await validateCoverImage(coverImage);
  if (coverResult.status !== 'exists') {
    logError(`Cover image issue in ${baseName}: ${coverResult.error}`);
    return {};
  }

  // Check if PDF already exists
  if (await pathExists(pdfRef.canonicalPath)) {
    logSuccess(`PDF already exists: ${pdfRef.filename}`);
    return {
      pdfResult: {
        status: 'exists',
        pdfPath: pdfRef.canonicalPath,
        publicHref: pdfRef.publicHref
      },
      coverResult
    };
  }

  // Generate PDF
  try {
    await generatePremiumPdf(pdfRef, mdxPath, coverImage);
    
    return {
      pdfResult: {
        status: 'generated',
        pdfPath: pdfRef.canonicalPath,
        publicHref: pdfRef.publicHref
      },
      coverResult
    };
  } catch (error) {
    logError(`Failed to generate PDF for ${baseName}: ${error}`);
    
    return {
      pdfResult: {
        status: 'error',
        pdfPath: pdfRef.canonicalPath,
        publicHref: pdfRef.publicHref,
        error: String(error)
      },
      coverResult
    };
  }
}

// ----------------------------
// Main Function
// ----------------------------

async function main(): Promise<void> {
  console.log('✨ Premium PDF Generation System');
  console.log('===============================\n');

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    pdfs: {
      generated: 0,
      existing: 0,
      errors: 0
    },
    covers: {
      valid: 0,
      missing: 0,
      errors: 0
    }
  };

  try {
    // Step 1: Setup directories
    logStep('Setting up directories...');
    await ensureDirectory(DOWNLOADS_DIR);

    // Step 2: Fix misplaced PDFs
    logStep('Checking for misplaced assets...');
    await fixMisplacedPdfs();

    // Step 3: Scan content
    logStep('Scanning content files...');
    const contentFiles = await scanContentFiles();
    console.log(`Found ${contentFiles.length} content files\n`);

    // Step 4: Process each file
    for (const contentFile of contentFiles) {
      results.processed++;

      try {
        const { pdfResult, coverResult } = await processContentFile(contentFile);

        // Update cover results
        if (coverResult) {
          if (coverResult.status === 'exists') results.covers.valid++;
          else if (coverResult.status === 'missing') results.covers.missing++;
          else if (coverResult.status === 'error') results.covers.errors++;
        }

        // Update PDF results
        if (pdfResult) {
          if (pdfResult.status === 'generated') {
            results.pdfs.generated++;
            results.succeeded++;
          } else if (pdfResult.status === 'exists') {
            results.pdfs.existing++;
            results.succeeded++;
          } else if (pdfResult.status === 'error') {
            results.pdfs.errors++;
            results.failed++;
          }
        } else {
          results.skipped++;
        }
      } catch (error) {
        results.failed++;
        logError(`Unexpected error processing ${contentFile.name}: ${error}`);
      }

      console.log(''); // Empty line between files
    }

    // Step 5: Summary
    console.log('📊 Premium Generation Summary');
    console.log('============================');
    console.log(`📄 Processed:   ${results.processed} files`);
    console.log(`✅ Succeeded:   ${results.succeeded}`);
    console.log(`❌ Failed:      ${results.failed}`);
    console.log(`⏭️  Skipped:     ${results.skipped}`);
    console.log('');
    console.log('PDF Generation:');
    console.log(`  🔨 Generated: ${results.pdfs.generated}`);
    console.log(`  📁 Existing:  ${results.pdfs.existing}`);
    console.log(`  ❌ Errors:    ${results.pdfs.errors}`);
    console.log('');
    console.log('Cover Images:');
    console.log(`  ✅ Valid:     ${results.covers.valid}`);
    console.log(`  ❌ Missing:   ${results.covers.missing}`);
    console.log(`  ⚠️  Errors:    ${results.covers.errors}`);

    // Exit with error if any failures
    if (results.failed > 0) {
      console.log('\n❌ Build failed due to PDF generation errors');
      process.exit(1);
    }

    console.log('\n✨ Premium PDF generation completed successfully!');

  } catch (error) {
    logError(`Fatal error in premium PDF generation: ${error}`);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export {
  scanContentFiles,
  validateContentFile,
  extractPdfReference,
  extractCoverImage,
  generatePremiumPdf,
  fixMisplacedPdfs,
  validateCoverImage
};