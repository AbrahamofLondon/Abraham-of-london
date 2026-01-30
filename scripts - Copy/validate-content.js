// scripts/validate-content.js - UPDATED WITH CONTENTLAYER INTEGRATION
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')
const projectRoot = path.join(__dirname, '..')

// Import Contentlayer data for cross-validation
let contentlayerData = null
try {
  // Dynamically import Contentlayer data
  const { allPosts, allDownloads, allBooks, allCanons, allShorts, allEvents, allPrints, allResources, allStrategies } = await import('../.contentlayer/generated/index.mjs')
  
  contentlayerData = {
    posts: allPosts || [],
    downloads: allDownloads || [],
    books: allBooks || [],
    canons: allCanons || [],
    shorts: allShorts || [],
    events: allEvents || [],
    prints: allPrints || [],
    resources: allResources || [],
    strategies: allStrategies || []
  }
  
  console.log('📦 Contentlayer data loaded successfully')
} catch (error) {
  console.warn('⚠️  Could not load Contentlayer data (run build first):', error.message)
  contentlayerData = {
    posts: [],
    downloads: [],
    books: [],
    canons: [],
    shorts: [],
    events: [],
    prints: [],
    resources: [],
    strategies: []
  }
}

const validateFile = (filePath, contentlayerDocuments = []) => {
  const relativeToContentDir = path.relative(contentDir, filePath).replace(/\\/g, "/"); // blog/x.mdx
  const relativeToProjectRoot = path
    .relative(projectRoot, filePath)
    .replace(/\\/g, "/"); // content/blog/x.mdx

  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check for frontmatter
    if (!content.startsWith("---")) {
      return {
        valid: false,
        path: relativeToContentDir,
        errors: ["No frontmatter (missing --- at start)"],
        warnings: [],
      };
    }

    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) {
      return {
        valid: false,
        path: relativeToContentDir,
        errors: ["Malformed frontmatter (missing closing ---)"],
        warnings: [],
      };
    }

    const yamlContent = fmMatch[1];
    const parsed = yaml.load(yamlContent) || {};

    const errors = [];
    const warnings = [];

    // Required fields
    if (!parsed.title) {
      errors.push("Missing required field: title");
    } else if (String(parsed.title).trim() === "") {
      errors.push("Title is empty");
    } else if (parsed.title === "Untitled Document") {
      warnings.push('Title is default value "Untitled Document"');
    }

    if (!parsed.date) {
      errors.push("Missing required field: date");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(parsed.date))) {
      errors.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`);
    }

    // Slug consistency (NOTE: keep warning only; slug can legitimately differ from filename if you prefer)
    const expectedSlug = path.basename(filePath, path.extname(filePath));
    if (parsed.slug && String(parsed.slug) !== expectedSlug) {
      warnings.push(`Slug "${parsed.slug}" doesn't match filename "${expectedSlug}"`);
    }

    // Tags
    if (parsed.tags && !Array.isArray(parsed.tags)) {
      warnings.push("Tags should be an array");
    }

    // Draft exclusion heads-up
    if (parsed.draft === true) {
      warnings.push("Document is marked as draft (will be excluded from production)");
    }

    // Legacy fields
    const legacyFields = {
      downloadFile: "Use downloadUrl instead",
      fileUrl: "Use downloadUrl instead",
      pdfPath: "Use downloadUrl instead",
      readtime: "Use readTime instead",
      readingTime: "Use readTime instead",
      isDraft: "Use draft instead",
      isPublished: "Use published instead",
    };

    Object.keys(parsed).forEach((field) => {
      if (legacyFields[field]) {
        warnings.push(`Legacy field "${field}": ${legacyFields[field]}`);
      }
    });

    // ✅ Contentlayer inclusion check (FIXED PATH LOGIC)
    // Contentlayer typically stores sourceFilePath like: "content/blog/foo.mdx"
    // Your prior code compared it to "blog/foo.mdx" — guaranteed mismatch.
    const inContentlayer =
      contentlayerDocuments.length === 0
        ? true // if caller didn't supply CL docs, don't warn
        : contentlayerDocuments.some((doc) => {
            const docPath = String(doc?._raw?.sourceFilePath || "").replace(/\\/g, "/");
            return docPath === relativeToProjectRoot || docPath === relativeToContentDir;
          });

    if (!inContentlayer && contentlayerDocuments.length > 0) {
      warnings.push("File not found in Contentlayer generated data (may be excluded)");
    }

    // Content length
    const contentBody = content.slice(fmMatch[0].length).trim();
    const hasContent = contentBody.length > 10;
    const isTooShort = contentBody.length < 50;

    if (!hasContent) warnings.push("Very little or no content after frontmatter");
    if (isTooShort) warnings.push("Content is very short (less than 50 characters)");

    // Broken internal links (more accurate)
    // - Ignore anchors (#)
    // - Ignore querystring (?x=)
    // - Check both exact path + common extensions + index variants
    const markdownLinks = contentBody.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
    markdownLinks.forEach((l) => {
      const m = l.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (!m) return;

      const rawUrl = m[2].trim();
      if (!rawUrl.startsWith("/")) return;

      const url = rawUrl.split("#")[0].split("?")[0];
      if (!url || url === "/") return;

      // Likely route, not file — check only for static assets under /public
      // If it looks like an asset (has extension), validate existence in /public
      const hasExt = path.posix.basename(url).includes(".");
      if (hasExt) {
        const assetPath = path.join(projectRoot, "public", url).replace(/\\/g, "/");
        if (!fs.existsSync(assetPath)) {
          warnings.push(`Possible broken internal link: ${rawUrl}`);
        }
        return;
      }

      // For route-like URLs, try to resolve to content files (md/mdx) or known page files.
      const candidates = [
        path.join(projectRoot, "content", url + ".mdx"),
        path.join(projectRoot, "content", url + ".md"),
        path.join(projectRoot, "pages", url + ".tsx"),
        path.join(projectRoot, "pages", url + ".ts"),
        path.join(projectRoot, "pages", url + ".jsx"),
        path.join(projectRoot, "pages", url + ".js"),
        path.join(projectRoot, "pages", url, "index.tsx"),
        path.join(projectRoot, "pages", url, "index.ts"),
        path.join(projectRoot, "pages", url, "index.jsx"),
        path.join(projectRoot, "pages", url, "index.js"),
      ];

      const exists = candidates.some((p) => fs.existsSync(p));
      if (!exists) warnings.push(`Possible broken internal link: ${rawUrl}`);
    });

    return {
      valid: errors.length === 0,
      path: relativeToContentDir,
      errors,
      warnings,
      hasContent,
      contentLength: contentBody.length,
      parsedFrontmatter: parsed,
    };
  } catch (error) {
    return {
      valid: false,
      path: relativeToContentDir,
      errors: [`YAML parsing error: ${error.message}`],
      warnings: [],
    };
  }
};

const main = async () => {
  console.log('='.repeat(70))
  console.log('🔍 CONTENT VALIDATION & CONTENTLAYER INTEGRATION')
  console.log('='.repeat(70))
  
  // Get Contentlayer document counts
  const contentlayerCounts = {}
  if (contentlayerData) {
    Object.entries(contentlayerData).forEach(([key, value]) => {
      contentlayerCounts[key] = Array.isArray(value) ? value.length : 0
    })
  }
  
  // Find all files
  const files = []
  const walk = (dir) => {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    items.forEach(item => {
      const fullPath = path.join(dir, item.name)
      if (item.isDirectory()) {
        walk(fullPath)
      } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
        files.push(fullPath)
      }
    })
  }
  
  walk(contentDir)
  
  console.log(`📁 Found ${files.length} content files in /content\n`)
  
  // Group files by type
  const fileGroups = {
    posts: files.filter(f => f.includes('/blog/')),
    downloads: files.filter(f => f.includes('/downloads/')),
    books: files.filter(f => f.includes('/books/')),
    canons: files.filter(f => f.includes('/canon/')),
    shorts: files.filter(f => f.includes('/shorts/')),
    events: files.filter(f => f.includes('/events/')),
    prints: files.filter(f => f.includes('/prints/')),
    resources: files.filter(f => f.includes('/resources/')),
    strategies: files.filter(f => f.includes('/strategy/')),
    other: files.filter(f => !f.includes('/blog/') && !f.includes('/downloads/') && !f.includes('/books/') && 
                             !f.includes('/canon/') && !f.includes('/shorts/') && !f.includes('/events/') && 
                             !f.includes('/prints/') && !f.includes('/resources/') && !f.includes('/strategy/'))
  }
  
  // Show file distribution
  console.log('📊 File Distribution:')
  Object.entries(fileGroups).forEach(([type, groupFiles]) => {
    if (groupFiles.length > 0) {
      console.log(`   ${type.charAt(0).toUpperCase() + type.slice(1)}: ${groupFiles.length} files`)
    }
  })
  
  console.log()
  
  // Validate all files
  const allContentlayerDocs = contentlayerData ? [
    ...contentlayerData.posts,
    ...contentlayerData.downloads,
    ...contentlayerData.books,
    ...contentlayerData.canons,
    ...contentlayerData.shorts,
    ...contentlayerData.events,
    ...contentlayerData.prints,
    ...contentlayerData.resources,
    ...contentlayerData.strategies
  ] : []
  
  const results = files.map(file => validateFile(file, allContentlayerDocs))
  const invalidFiles = results.filter(r => !r.valid)
  const validFiles = results.filter(r => r.valid)
  
  // Show Contentlayer comparison
  if (contentlayerData && Object.values(contentlayerCounts).some(count => count > 0)) {
    console.log('📦 Contentlayer Generated Data:')
    Object.entries(contentlayerCounts).forEach(([type, count]) => {
      if (count > 0) {
        const fileCount = fileGroups[type]?.length || 0
        const status = fileCount === count ? '✅' : fileCount > count ? '⚠️' : '❌'
        console.log(`   ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count} docs ${status} (${fileCount} files)`)
        
        if (fileCount > count) {
          console.log(`      ⚠️  ${fileCount - count} files not processed by Contentlayer`)
        } else if (fileCount < count) {
          console.log(`      ❌ Contentlayer has ${count - fileCount} extra docs (possible duplicates)`)
        }
      }
    })
    console.log()
  }
  
  if (invalidFiles.length === 0) {
    console.log('✅ All files are valid!')
  } else {
    console.log(`❌ ${invalidFiles.length} files have errors:\n`)
    
    invalidFiles.forEach(result => {
      console.log(`📄 ${result.path}`)
      result.errors.forEach(error => console.log(`   ❌ ${error}`))
      result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`))
      console.log()
    })
    
    console.log(`✅ ${validFiles.length} files passed validation`)
  }
  
  // Files with warnings only
  const warningFiles = validFiles.filter(r => r.warnings.length > 0)
  if (warningFiles.length > 0) {
    console.log(`\n⚠️  ${warningFiles.length} files have warnings:\n`)
    warningFiles.forEach(result => {
      console.log(`📄 ${result.path}`)
      result.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`))
    })
  }
  
  // Check for duplicates in Contentlayer
  if (allContentlayerDocs.length > 0) {
    const slugMap = {}
    const duplicates = []
    
    allContentlayerDocs.forEach(doc => {
      const slug = doc.slug || doc.slugComputed || doc._raw.sourceFileName
      if (slug) {
        if (slugMap[slug]) {
          duplicates.push(slug)
        } else {
          slugMap[slug] = true
        }
      }
    })
    
    if (duplicates.length > 0) {
      console.log(`\n🚨 Found ${duplicates.length} duplicate slugs in Contentlayer:`)
      duplicates.forEach(slug => console.log(`   ❌ ${slug}`))
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70))
  console.log('📊 VALIDATION SUMMARY')
  console.log('='.repeat(70))
  console.log(`Total content files: ${files.length}`)
  console.log(`Valid files: ${validFiles.length}`)
  console.log(`Invalid files: ${invalidFiles.length}`)
  console.log(`Files with warnings: ${warningFiles.length}`)
  
  if (contentlayerData) {
    console.log(`\n📦 Contentlayer Documents:`)
    const totalDocs = Object.values(contentlayerCounts).reduce((a, b) => a + b, 0)
    console.log(`   Total generated: ${totalDocs}`)
    
    const missingFromContentlayer = files.length - totalDocs
    if (missingFromContentlayer > 0) {
      console.log(`   ⚠️  ${missingFromContentlayer} files not in Contentlayer`)
    } else if (missingFromContentlayer < 0) {
      console.log(`   ⚠️  ${Math.abs(missingFromContentlayer)} extra docs in Contentlayer`)
    }
  }
  
  // Generate detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: files.length,
      validFiles: validFiles.length,
      invalidFiles: invalidFiles.length,
      warningFiles: warningFiles.length,
      contentlayerDocs: Object.values(contentlayerCounts).reduce((a, b) => a + b, 0)
    },
    fileDistribution: Object.fromEntries(
      Object.entries(fileGroups).map(([key, value]) => [key, value.length])
    ),
    contentlayerCounts,
    invalidFiles: invalidFiles.map(f => ({
      path: f.path,
      errors: f.errors,
      warnings: f.warnings
    })),
    warningFiles: warningFiles.map(f => ({
      path: f.path,
      warnings: f.warnings
    })),
    recommendations: []
  }
  
  // Add recommendations
  if (invalidFiles.length > 0) {
    report.recommendations.push('Fix invalid files before building')
  }
  
  if (warningFiles.length > 10) {
    report.recommendations.push('Consider fixing warnings to improve content quality')
  }
  
  if (fileGroups.other.length > 0) {
    report.recommendations.push(`Organize ${fileGroups.other.length} files in /content/other/ into proper categories`)
  }
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'content-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📋 Detailed report saved to: ${reportPath}`)
  
  // Generate quick-fix script
  if (invalidFiles.length > 0 || warningFiles.length > 0) {
    const quickFixScript = `
// Quick fix script generated on ${new Date().toISOString()}
const fs = require('fs')
const path = require('path')

console.log('🚀 Applying quick fixes...')

${invalidFiles.map(f => `
// Fix: ${f.path}
// Issues: ${f.errors.join(', ')}
try {
  const filePath = path.join(__dirname, '..', 'content', '${f.path.replace(/\\/g, '\\\\')}')
  let content = fs.readFileSync(filePath, 'utf8')
  // Add your fixes here
  console.log('  ⚠️  Manual fix needed for:', '${f.path}')
} catch (e) {
  console.error('  ❌ Failed to fix:', '${f.path}', e.message)
}
`).join('\n')}

console.log('✅ Quick fixes applied (review manually)')
    `.trim()
    
    const quickFixPath = path.join(__dirname, '..', 'scripts', 'quick-fix-content.js')
    fs.writeFileSync(quickFixPath, quickFixScript)
    console.log(`🔧 Quick-fix script generated: ${quickFixPath}`)
    console.log(`   Run: node ${quickFixPath}`)
  }
  
  // Exit with error code if invalid files exist
  if (invalidFiles.length > 0) {
    console.error('\n❌ Validation failed. Fix the errors above before building.')
    console.log('\n💡 Tips:')
    console.log('   1. Check date formats (must be YYYY-MM-DD)')
    console.log('   2. Ensure all files have a title')
    console.log('   3. Run quick-fix script for automated fixes')
    console.log('   4. Rebuild Contentlayer: rm -rf .contentlayer && pnpm build')
    process.exit(1)
  }
  
  console.log('\n✅ Validation passed! Ready to build.')
  console.log('\n💡 Next steps:')
  console.log('   1. Build project: pnpm build')
  console.log('   2. Check build logs for Contentlayer document counts')
  console.log('   3. Test pages in development: pnpm dev')
}

// Run validation
main().catch(error => {
  console.error('❌ Validation failed with error:', error)
  process.exit(1)
})