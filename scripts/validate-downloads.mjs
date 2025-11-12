// scripts/run-validate-downloads.mjs
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function validateDownloads() {
  console.log('🔍 Validating downloads structure...');
  
  try {
    // Check if content directory exists
    const contentDir = join(process.cwd(), 'content');
    if (!existsSync(contentDir)) {
      console.log('⚠️  Content directory not found, skipping download validation');
      return true;
    }
    
    // Check downloads directory
    const downloadsDir = join(contentDir, 'downloads');
    if (!existsSync(downloadsDir)) {
      console.log('⚠️  Downloads directory not found, creating empty structure');
      return true;
    }
    
    // Get all download files
    const downloadFiles = readdirSync(downloadsDir, { recursive: true })
      .filter(file => file.endsWith('.mdx') || file.endsWith('.md'));
    
    console.log(`📁 Found ${downloadFiles.length} download files`);
    
    // Basic validation for each file
    let validCount = 0;
    let invalidCount = 0;
    
    for (const file of downloadFiles) {
      try {
        const filePath = join(downloadsDir, file);
        const content = readFileSync(filePath, 'utf8');
        
        // Basic frontmatter validation
        if (!content.includes('---')) {
          console.log(`❌ ${file}: Missing frontmatter`);
          invalidCount++;
          continue;
        }
        
        // Check for required fields
        const hasTitle = content.includes('title:');
        const hasSlug = content.includes('slug:');
        
        if (!hasTitle || !hasSlug) {
          console.log(`❌ ${file}: Missing required fields (title or slug)`);
          invalidCount++;
          continue;
        }
        
        validCount++;
        
      } catch (error) {
        console.log(`❌ ${file}: Error reading file - ${error.message}`);
        invalidCount++;
      }
    }
    
    console.log(`\n📊 Validation Results:`);
    console.log(`✅ Valid files: ${validCount}`);
    console.log(`❌ Invalid files: ${invalidCount}`);
    console.log(`📋 Total files: ${downloadFiles.length}`);
    
    return invalidCount === 0;
    
  } catch (error) {
    console.log('❌ Error during download validation:', error.message);
    return false;
  }
}

// Run validation
const isValid = validateDownloads();
process.exit(isValid ? 0 : 1);