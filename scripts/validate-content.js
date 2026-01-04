// scripts/validate-content.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

const validateFile = (filePath) => {
  const relativePath = path.relative(contentDir, filePath)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check for frontmatter
    if (!content.startsWith('---')) {
      return {
        valid: false,
        path: relativePath,
        errors: ['No frontmatter (missing --- at start)'],
        warnings: []
      }
    }
    
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) {
      return {
        valid: false,
        path: relativePath,
        errors: ['Malformed frontmatter (missing closing ---)'],
        warnings: []
      }
    }
    
    const yamlContent = match[1]
    const parsed = yaml.load(yamlContent)
    
    const errors = []
    const warnings = []
    
    // Check required fields
    if (!parsed.title) {
      errors.push('Missing required field: title')
    } else if (parsed.title.trim() === '') {
      errors.push('Title is empty')
    }
    
    if (!parsed.date) {
      errors.push('Missing required field: date')
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      errors.push(`Invalid date format: "${parsed.date}" (must be YYYY-MM-DD)`)
    }
    
    // Check for common issues
    if (parsed.tags && !Array.isArray(parsed.tags)) {
      warnings.push('Tags should be an array')
    }
    
    // Check for legacy fields
    const legacyFields = {
      'downloadFile': 'Use downloadUrl instead',
      'fileUrl': 'Use downloadUrl instead',
      'pdfPath': 'Use downloadUrl instead',
      'readtime': 'Use readTime instead',
      'readingTime': 'Use readTime instead',
    }
    
    Object.keys(parsed).forEach(field => {
      if (legacyFields[field]) {
        warnings.push(`Legacy field "${field}": ${legacyFields[field]}`)
      }
    })
    
    return {
      valid: errors.length === 0,
      path: relativePath,
      errors,
      warnings,
      hasContent: content.length > match[0].length + 10
    }
  } catch (error) {
    return {
      valid: false,
      path: relativePath,
      errors: [`YAML parsing error: ${error.message}`],
      warnings: []
    }
  }
}

const main = () => {
  console.log('='.repeat(60))
  console.log('🔍 CONTENT VALIDATION')
  console.log('='.repeat(60))
  
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
  
  console.log(`📁 Found ${files.length} content files\n`)
  
  const results = files.map(validateFile)
  const invalidFiles = results.filter(r => !r.valid)
  const validFiles = results.filter(r => r.valid)
  
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
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total files: ${files.length}`)
  console.log(`Valid: ${validFiles.length}`)
  console.log(`Invalid: ${invalidFiles.length}`)
  console.log(`With warnings: ${warningFiles.length}`)
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    total: files.length,
    valid: validFiles.length,
    invalid: invalidFiles.length,
    withWarnings: warningFiles.length,
    invalidFiles: invalidFiles.map(f => ({
      path: f.path,
      errors: f.errors,
      warnings: f.warnings
    })),
    warningFiles: warningFiles.map(f => ({
      path: f.path,
      warnings: f.warnings
    }))
  }
  
  const reportPath = path.join(__dirname, '..', 'content-validation-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📋 Report saved to: ${reportPath}`)
  
  // Exit with error code if invalid files exist
  if (invalidFiles.length > 0) {
    console.error('\n❌ Validation failed. Run `npm run fix-content` to fix automatically.')
    process.exit(1)
  }
  
  console.log('\n✅ Validation passed! Ready to build.')
}

main()