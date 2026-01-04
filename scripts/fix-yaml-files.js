// scripts/fix-yaml-specific.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

const fixFiles = () => {
  console.log('🔧 Fixing specific YAML issues...\n')
  
  // 1. Fix surrender-not-submission.mdx
  const file1 = path.join(contentDir, 'blog', 'surrender-not-submission.mdx')
  if (fs.existsSync(file1)) {
    console.log('1. Fixing surrender-not-submission.mdx...')
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
  
  console.log('\n🎉 All specific fixes applied!')
  console.log('\nNext steps:')
  console.log('1. Run: pnpm clean:win')
  console.log('2. Run: pnpm contentlayer:direct')
  console.log('3. Run: pnpm build')
}

fixFiles()