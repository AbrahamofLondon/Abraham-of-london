// scripts/fix-yaml-specific.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

const fixFiles = () => {
  console.log('🔧 Fixing all YAML issues...\n')
  
  // Fix all shorts files with theme issues
  const shortsDir = path.join(contentDir, 'shorts')
  if (fs.existsSync(shortsDir)) {
    const files = fs.readdirSync(shortsDir).filter(f => f.endsWith('.mdx'))
    let fixedShorts = 0
    
    files.forEach(fileName => {
      const filePath = path.join(shortsDir, fileName)
      try {
        let content = fs.readFileSync(filePath, 'utf8')
        const originalContent = content
        
        // Fix theme field without quotes (matching your error pattern)
        content = content.replace(/theme:\s*([^\s\n"']+)/g, 'theme: "$1"')
        
        // Fix other common unquoted string fields in frontmatter
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/
        const match = content.match(frontmatterRegex)
        
        if (match) {
          let frontmatter = match[1]
          // Fix unquoted string values (simple ones without spaces)
          frontmatter = frontmatter.replace(/(\w+):\s*([^\s\n"'][^\n]*)(?=\n|$)/g, (match, key, value) => {
            // Don't fix boolean values
            if (value === 'true' || value === 'false') return match
            // Don't fix numbers
            if (/^\d+$/.test(value)) return match
            // Don't fix arrays
            if (value.startsWith('[')) return match
            return `${key}: "${value.trim()}"`
          })
          
          content = content.replace(frontmatterRegex, `---\n${frontmatter}\n---`)
        }
        
        if (content !== originalContent) {
          fs.writeFileSync(filePath, content)
          fixedShorts++
          console.log(`   ✅ Fixed: ${fileName}`)
        }
      } catch (error) {
        console.log(`   ❌ Error fixing ${fileName}: ${error.message}`)
      }
    })
    
    if (fixedShorts > 0) {
      console.log(`\n✅ Fixed ${fixedShorts} shorts files`)
    } else {
      console.log('✅ No shorts files needed fixing')
    }
  } else {
    console.log('⚠️  shorts directory not found')
  }
  
  // Keep your existing specific fixes
  console.log('\n🔧 Applying specific file fixes...')
  
  // 1. Fix surrender-not-submission.mdx
  const file1 = path.join(contentDir, 'blog', 'surrender-not-submission.mdx')
  if (fs.existsSync(file1)) {
    console.log('\n1. Fixing surrender-not-submission.mdx...')
    let content = fs.readFileSync(file1, 'utf8')
    
    // Fix category array formatting
    content = content.replace(
      /category:\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/,
      'category:\n  - "$1"\n  - "$2"\n  - "$3"'
    )
    
    fs.writeFileSync(file1, content)
    console.log('   ✅ Fixed category array formatting')
  }
  
  // 2. Fix surrender-operational-framework.mdx
  const file2 = path.join(contentDir, 'blog', 'surrender-operational-framework.mdx')
  if (fs.existsSync(file2)) {
    console.log('\n2. Fixing surrender-operational-framework.mdx...')
    let content = fs.readFileSync(file2, 'utf8')
    
    // Check if it has frontmatter
    if (!content.startsWith('---')) {
      console.log('   ❌ No frontmatter found - this file needs manual fixing')
      console.log('   Please add proper frontmatter with title and date fields')
    } else {
      const frontmatterEnd = content.indexOf('\n---', 4)
      if (frontmatterEnd !== -1) {
        const frontmatter = content.substring(0, frontmatterEnd + 4)
        
        if (!frontmatter.includes('title:')) {
          content = content.replace('---\n', '---\ntitle: "Surrender Operational Framework"\n')
          console.log('   ✅ Added missing title')
        }
        
        if (!content.includes('date:')) {
          content = content.replace(/(title:.*\n)/, '$1date: "2024-01-05"\n')
          console.log('   ✅ Added missing date')
        }
        
        fs.writeFileSync(file2, content)
      }
    }
  }
  
  // 3. Fix legacy-architecture-canvas.mdx
  const file3 = path.join(contentDir, 'downloads', 'legacy-architecture-canvas.mdx')
  if (fs.existsSync(file3)) {
    console.log('\n3. Fixing legacy-architecture-canvas.mdx...')
    let content = fs.readFileSync(file3, 'utf8')
    
    // Fix the array item formatting
    content = content.replace(
      /-\s*"operating-cadence-pack"\s*$/gm,
      '- "operating-cadence-pack"'
    )
    
    // Ensure proper array formatting
    content = content.replace(
      /relatedDownloads:\s*\n([\s\S]*?)(?=\n\w|$)/,
      'relatedDownloads:\n  - "decision-matrix-scorecard"\n  - "board-decision-log-template"\n  - "operating-cadence-pack"'
    )
    
    fs.writeFileSync(file3, content)
    console.log('   ✅ Fixed array formatting')
  }
  
  console.log('\n🎉 All YAML fixes applied!')
  console.log('\nNext steps:')
  console.log('1. Run: pnpm clean')
  console.log('2. Run: pnpm contentlayer:build')
  console.log('3. Run: pnpm build')
}

fixFiles()
