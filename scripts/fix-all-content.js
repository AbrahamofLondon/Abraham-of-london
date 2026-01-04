// scripts/fix-all-content.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

// Configuration for known fixes
const FIX_CONFIG = {
  // Files that need specific fixes
  specificFixes: {
    'blog/surrender-not-submission.mdx': {
      fix: (content) => content.replace(
        /tags:\s*\n([\s\S]*?)\]\s*\n---/,
        `tags:\n$1  ""\n]\n---`
      ),
      description: 'Fix YAML array ending'
    },
    'downloads/legacy-architecture-canvas.mdx': {
      fix: (content) => content.replace(
        /-\s*"operating-cadence-pack"\s*$/gm,
        '- "operating-cadence-pack"'
      ),
      description: 'Fix array item quoting'
    },
    'blog/surrender-operational-framework.mdx': {
      fix: (content) => {
        if (!content.includes('title:')) {
          return content.replace(
            '---\n',
            '---\ntitle: "Surrender Operational Framework"\ndate: 2024-01-01\n'
          )
        } else if (!content.includes('date:')) {
          return content.replace(
            /(title:.*\n)/,
            '$1date: 2024-01-01\n'
          )
        }
        return content
      },
      description: 'Add missing required fields'
    }
  },
  
  // Field mappings for different file types
  fieldMappings: {
    'downloads/': {
      'fileUrl': 'downloadUrl',
      'downloadFile': 'downloadUrl',
      'pdfPath': 'downloadUrl',
      'file': 'downloadUrl',
    },
    'resources/': {
      'readtime': 'readTime',
      'fileUrl': 'downloadUrl',
    }
  }
}

// Find all content files
const findAllContentFiles = () => {
  const files = []
  
  const walk = (dir) => {
    const items = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name)
      
      if (item.isDirectory()) {
        walk(fullPath)
      } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }
  
  walk(contentDir)
  return files
}

// Fix YAML in content
const fixYAML = (content) => {
  return content
    // Fix trailing commas
    .replace(/,(\s*])/g, '$1')
    .replace(/,(\s*})/g, '$1')
    // Fix missing quotes
    .replace(/^(\s*[a-zA-Z_][a-zA-Z0-9_]*):\s*([^"'\s][^:\n]*)$/gm, '$1: "$2"')
    // Fix array items
    .replace(/^(\s*)-\s*([^"\s][^:\n]*)$/gm, '$1- "$2"')
    // Fix empty arrays
    .replace(/^(\s*[a-zA-Z_][a-zA-Z0-9_]*):\s*\[\s*\]/gm, '$1: []')
    // Remove trailing spaces
    .replace(/[ \t]+$/gm, '')
    // Ensure proper line endings
    .replace(/\r\n/g, '\n')
}

// Apply field mappings
const applyFieldMappings = (yamlContent, filePath) => {
  let result = yamlContent
  
  // Apply specific field mappings based on file path
  for (const [pathPattern, mappings] of Object.entries(FIX_CONFIG.fieldMappings)) {
    if (filePath.includes(pathPattern)) {
      for (const [oldField, newField] of Object.entries(mappings)) {
        const regex = new RegExp(`^(${oldField}):\\s*(.+)$`, 'gm')
        if (regex.test(result)) {
          result = result.replace(regex, `${newField}: $2`)
          console.log(`   ↳ Mapped ${oldField} → ${newField}`)
        }
      }
    }
  }
  
  return result
}

// Fix a single file
const fixFile = (filePath) => {
  const relativePath = path.relative(contentDir, filePath)
  console.log(`\n🔧 Fixing: ${relativePath}`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Apply specific fix if configured
    if (FIX_CONFIG.specificFixes[relativePath]) {
      const fix = FIX_CONFIG.specificFixes[relativePath]
      console.log(`   ${fix.description}`)
      content = fix.fix(content)
    }
    
    // Always apply YAML fixes
    if (content.startsWith('---')) {
      const match = content.match(/^---\n([\s\S]*?)\n---/)
      if (match) {
        let yamlContent = match[1]
        
        // Apply field mappings
        yamlContent = applyFieldMappings(yamlContent, relativePath)
        
        // Fix YAML formatting
        yamlContent = fixYAML(yamlContent)
        
        // Reconstruct content
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${yamlContent}\n---`)
      }
    }
    
    // Check for required fields
    if (content.startsWith('---')) {
      const match = content.match(/^---\n([\s\S]*?)\n---/)
      if (match) {
        const parsed = yaml.load(match[1])
        
        // Ensure required fields exist
        if (!parsed.title) {
          const filename = path.basename(filePath, path.extname(filePath))
          const title = filename
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          content = content.replace('---\n', `---\ntitle: "${title}"\n`)
          console.log(`   ↳ Added title: "${title}"`)
        }
        
        if (!parsed.date) {
          content = content.replace('---\n', `---\ndate: 2024-01-01\n`)
          console.log(`   ↳ Added default date`)
        }
      }
    }
    
    // Write back if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      console.log(`   ✅ Fixed`)
    } else {
      console.log(`   ✓ Already valid`)
    }
    
    return { fixed: content !== originalContent, path: relativePath }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`)
    return { fixed: false, path: relativePath, error: error.message }
  }
}

// Main function
const main = () => {
  console.log('='.repeat(60))
  console.log('🔧 COMPREHENSIVE CONTENT FIXER')
  console.log('='.repeat(60))
  
  const files = findAllContentFiles()
  console.log(`📁 Found ${files.length} content files\n`)
  
  const results = files.map(fixFile)
  
  const fixedCount = results.filter(r => r.fixed).length
  const errorCount = results.filter(r => r.error).length
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULTS')
  console.log('='.repeat(60))
  console.log(`✅ Fixed: ${fixedCount} files`)
  console.log(`❌ Errors: ${errorCount} files`)
  console.log(`✓ Already valid: ${files.length - fixedCount - errorCount} files`)
  
  if (errorCount > 0) {
    console.log('\n📋 Files with errors:')
    results.filter(r => r.error).forEach(r => {
      console.log(`   • ${r.path}: ${r.error}`)
    })
  }
  
  // Create validation report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    fixedFiles: fixedCount,
    errorFiles: errorCount,
    details: results.map(r => ({
      path: r.path,
      fixed: r.fixed,
      error: r.error || null
    }))
  }
  
  const reportPath = path.join(__dirname, '..', 'content-fix-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\n📋 Report saved to: ${reportPath}`)
  
  // Fix Windows permission issue
  if (process.platform === 'win32') {
    console.log('\n🪟 Checking Windows permissions...')
    const imagePath = path.join(__dirname, '..', 'public', 'assets', 'images', 'shorts', 'default-cover.jpg')
    
    if (fs.existsSync(imagePath)) {
      try {
        // Try to fix permissions
        fs.chmodSync(imagePath, 0o666)
        console.log('✅ Fixed Windows file permissions')
      } catch (error) {
        console.warn('⚠️  Could not fix permissions:', error.message)
      }
    } else {
      console.log('ℹ️  Default cover image not found, creating...')
      const dir = path.dirname(imagePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      // Create a minimal placeholder
      const placeholder = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      )
      fs.writeFileSync(imagePath, placeholder)
      console.log('✅ Created placeholder image')
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🎉 ALL FIXES COMPLETED!')
  console.log('='.repeat(60))
  console.log('\nNext steps:')
  console.log('1. Run: npm run validate-content')
  console.log('2. Run: npm run build')
  console.log('3. Deploy when all checks pass')
}

// Run the fixer
main()