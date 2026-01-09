// scripts/fix-content.js - ACTUAL FIX SCRIPT
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

const fixFile = (filePath) => {
  const relativePath = path.relative(contentDir, filePath)
  console.log(`🔧 Fixing: ${relativePath}`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Check if file needs fixes
    let modified = false
    let newContent = content
    
    // Fix 1: Add missing frontmatter
    if (!newContent.startsWith('---')) {
      console.log(`   ⚠️  Adding frontmatter`)
      const fileName = path.basename(filePath, path.extname(filePath))
      const title = fileName
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
      
      const frontmatter = `---
title: "${title}"
date: "${new Date().toISOString().split('T')[0]}"
draft: false
---
`
      newContent = frontmatter + newContent
      modified = true
    }
    
    // Fix 2: Parse and fix YAML
    const match = newContent.match(/^---\n([\s\S]*?)\n---/)
    if (match) {
      try {
        const yamlContent = match[1]
        const parsed = yaml.load(yamlContent)
        const fixes = []
        
        // Fix missing title
        if (!parsed.title || parsed.title.trim() === '') {
          const fileName = path.basename(filePath, path.extname(filePath))
          const title = fileName
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
          parsed.title = title
          fixes.push(`Added title: "${title}"`)
          modified = true
        }
        
        // Fix missing date
        if (!parsed.date || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
          // Try to extract from filename
          const dateMatch = path.basename(filePath).match(/(\d{4}-\d{2}-\d{2})/)
          if (dateMatch) {
            parsed.date = dateMatch[1]
            fixes.push(`Fixed date from filename: ${dateMatch[1]}`)
          } else {
            parsed.date = new Date().toISOString().split('T')[0]
            fixes.push(`Added date: ${parsed.date}`)
          }
          modified = true
        }
        
        // Fix draft status
        if (parsed.draft === undefined) {
          parsed.draft = false
          fixes.push('Set draft: false')
          modified = true
        }
        
        // Fix legacy field names
        const fieldMappings = {
          'downloadFile': 'downloadUrl',
          'fileUrl': 'downloadUrl', 
          'pdfPath': 'downloadUrl',
          'readtime': 'readTime',
          'readingTime': 'readTime',
          'isDraft': 'draft',
          'isPublished': 'published'
        }
        
        Object.keys(fieldMappings).forEach(oldField => {
          if (parsed[oldField] !== undefined) {
            const newField = fieldMappings[oldField]
            if (!parsed[newField]) {
              parsed[newField] = parsed[oldField]
            }
            delete parsed[oldField]
            fixes.push(`Renamed field: ${oldField} → ${newField}`)
            modified = true
          }
        })
        
        // Fix tags format
        if (parsed.tags && !Array.isArray(parsed.tags)) {
          if (typeof parsed.tags === 'string') {
            parsed.tags = parsed.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
            fixes.push('Converted tags string to array')
            modified = true
          }
        }
        
        if (modified && fixes.length > 0) {
          // Update the YAML
          const newYaml = yaml.dump(parsed, { lineWidth: -1 })
          newContent = newContent.replace(match[0], `---\n${newYaml}---`)
          console.log(`   ✅ Applied fixes: ${fixes.join(', ')}`)
        }
        
      } catch (yamlError) {
        console.log(`   ❌ YAML error: ${yamlError.message}`)
      }
    }
    
    if (modified) {
      // Backup original file
      const backupPath = filePath + '.backup'
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(filePath, backupPath)
      }
      
      // Write fixed file
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`   💾 Saved changes (backup: ${backupPath})`)
      return true
    } else {
      console.log(`   ✓ No fixes needed`)
      return false
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return false
  }
}

const main = async () => {
  console.log('='.repeat(60))
  console.log('🔧 CONTENT FIX SCRIPT')
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
  
  let fixedCount = 0
  let errorCount = 0
  
  // Process each file
  for (const file of files) {
    const fixed = fixFile(file)
    if (fixed) fixedCount++
    console.log() // Empty line between files
  }
  
  // Summary
  console.log('='.repeat(60))
  console.log('📊 FIX SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total files processed: ${files.length}`)
  console.log(`Files fixed: ${fixedCount}`)
  console.log(`Files with errors: ${errorCount}`)
  
  if (fixedCount > 0) {
    console.log(`\n💡 Next steps:`)
    console.log(`   1. Review the changes: git diff content/`)
    console.log(`   2. Check backup files: find content/ -name "*.backup"`)
    console.log(`   3. Run validation: npm run validate:content`)
    console.log(`   4. Rebuild Contentlayer: rm -rf .contentlayer && pnpm build`)
  } else {
    console.log(`\n✅ All files are already valid!`)
  }
  
  console.log(`\n⚠️  Note: Backup files were created with .backup extension`)
  console.log(`   Delete them after verifying: find content/ -name "*.backup" -delete`)
}

// Run fix script
main().catch(error => {
  console.error('❌ Fix script failed:', error)
  process.exit(1)
})