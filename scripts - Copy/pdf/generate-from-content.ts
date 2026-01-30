// scripts/pdf/generate-from-content.ts
import { generateRegistryFromContent } from './scan-content-downloads';
import { generatePDFFromConfig } from './pdf-generator';
import fs from 'fs';
import path from 'path';

async function generateAllFromContent() {
  console.log('🔄 Step 1: Scanning content/downloads for MDX files...');
  const contentFiles = generateRegistryFromContent();
  
  console.log(`📄 Found ${contentFiles.length} content files to process\n`);
  
  const results = [];
  
  for (const config of contentFiles) {
    console.log(`🔄 Processing: ${config.title} (${config.id})`);
    
    try {
      // Find the source MDX file
      const sourcePath = findSourceFile(config.id);
      
      if (!sourcePath) {
        console.log(`   ⚠ No source MDX found for ${config.id}, skipping`);
        results.push({
          id: config.id,
          success: false,
          error: 'Source MDX not found'
        });
        continue;
      }
      
      // Read the MDX content
      const mdxContent = fs.readFileSync(sourcePath, 'utf-8');
      
      // Generate PDF
      const startTime = Date.now();
      const outputPath = await generatePDFFromConfig({
        ...config,
        sourceContent: mdxContent,
        sourcePath
      });
      
      const timeMs = Date.now() - startTime;
      
      // Update file size
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        config.fileSize = formatFileSize(stats.size);
        config.exists = true;
        config.lastModified = new Date().toISOString();
      }
      
      console.log(`   ✅ Generated: ${outputPath} (${timeMs}ms)`);
      
      results.push({
        id: config.id,
        success: true,
        generatedPath: outputPath,
        timeMs,
        fileSize: config.fileSize
      });
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      results.push({
        id: config.id,
        success: false,
        error: error.message
      });
    }
  }
  
  // Update the generated registry with new file info
  console.log('\n🔄 Step 2: Updating registry with generation results...');
  updateRegistryWithResults(contentFiles);
  
  // Generate report
  generateReport(results, contentFiles);
  
  return results;
}

function findSourceFile(id: string): string | null {
  // Search in content/downloads/
  const searchPaths = [
    `content/downloads/${id}.mdx`,
    `content/downloads/${id}.md`,
    `content/downloads/${id.replace(/-/g, '')}.mdx`,
    // Add more search patterns as needed
  ];
  
  for (const searchPath of searchPaths) {
    if (fs.existsSync(searchPath)) {
      return searchPath;
    }
  }
  
  // Also check subdirectories
  const contentDir = 'content/downloads';
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir, { recursive: true });
    for (const file of files) {
      if (typeof file === 'string') {
        const fileName = path.basename(file, path.extname(file));
        if (fileName.toLowerCase() === id.toLowerCase()) {
          return path.join(contentDir, file);
        }
      }
    }
  }
  
  return null;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function updateRegistryWithResults(configs: any[]) {
  // Re-save the registry with updated info
  const registryContent = `// scripts/pdf/pdf-registry.generated.ts
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Last Generation: ${new Date().toISOString()}

export const GENERATED_PDF_CONFIGS = ${JSON.stringify(configs, null, 2)};
`;

  fs.writeFileSync('scripts/pdf/pdf-registry.generated.ts', registryContent, 'utf-8');
}

function generateReport(results: any[], configs: any[]) {
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      total: configs.length,
      successful,
      failed
    },
    results,
    configs: configs.map(c => ({
      id: c.id,
      title: c.title,
      outputPath: c.outputPath,
      exists: c.exists,
      fileSize: c.fileSize
    }))
  };
  
  const reportPath = 'public/assets/downloads/pdf-generation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  
  console.log('\n📊 GENERATION REPORT:');
  console.log(`   Total: ${configs.length}`);
  console.log(`   ✅ Successful: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n   📄 Report saved to: ${reportPath}`);
}

// CLI support
if (require.main === module) {
  generateAllFromContent()
    .then(() => {
      console.log('\n🎉 PDF generation from content completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
}

export { generateAllFromContent };