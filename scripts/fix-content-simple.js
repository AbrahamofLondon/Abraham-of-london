// scripts/fix-content-simple.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

const fixFile = (filePath) => {
  const relativePath = path.relative(contentDir, filePath)
  console.log(`Fixing: ${relativePath}`)
  
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    
    if (relativePath.includes('surrender-not-submission.mdx')) {
      content = content.replace(/\n\s*\]\s*$/m, '\n  ""\n]')
    }
    
    if (relativePath.includes('legacy-architecture-canvas.mdx')) {
      content = content.replace(/-\s*"operating-cadence-pack"\s*$/gm, '- "operating-cadence-pack"')
    }
    
    if (relativePath.includes('surrender-operational-framework.mdx')) {
      if (!content.includes('title:')) {
        content = content.replace('---\n', '---\ntitle: "Surrender Operational Framework"\ndate: 2024-01-01\n')
      } else if (!content.includes('date:')) {
        content = content.replace(/(title:.*\n)/, '$1date: 2024-01-01\n')
      }
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content)
      console.log(`  ✅ Fixed`)
    } else {
      console.log(`  ✓ Already valid`)
    }
    
    return true
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
    return false
  }
}

const walkDir = (dir) => {
  const files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  items.forEach(item => {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...walkDir(fullPath))
    } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
      files.push(fullPath)
    }
  })
  
  return files
}

const main = () => {
  console.log('🔧 Fixing content files...')
  const files = walkDir(contentDir)
  console.log(`Found ${files.length} files\n`)
  
  let fixedCount = 0
  let errorCount = 0
  
  files.forEach(filePath => {
    const success = fixFile(filePath)
    if (success) fixedCount++
    else errorCount++
  })
  
  console.log(`\n📊 Results:`)
  console.log(`✅ Fixed: ${fixedCount} files`)
  console.log(`❌ Errors: ${errorCount} files`)
  console.log(`✓ Already valid: ${files.length - fixedCount - errorCount} files`)
}

main()