import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = join(__dirname, '..', 'content')

console.log('🔧 Fixing specific YAML issues...\n')

// Fix 1: surrender-not-submission.mdx
const file1 = join(contentDir, 'blog', 'surrender-not-submission.mdx')
if (existsSync(file1)) {
  console.log('1. Fixing surrender-not-submission.mdx...')
  let content = readFileSync(file1, 'utf8')
  
  // Fix category array - change inline array to bullet list
  content = content.replace(
    /category:\s*\["([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\]/,
    'category:\n  - "$1"\n  - "$2"\n  - "$3"'
  )
  
  writeFileSync(file1, content)
  console.log('   ✅ Fixed category array')
}

// Fix 2: surrender-operational-framework.mdx
const file2 = join(contentDir, 'blog', 'surrender-operational-framework.mdx')
if (existsSync(file2)) {
  console.log('\n2. Fixing surrender-operational-framework.mdx...')
  let content = readFileSync(file2, 'utf8')
  
  if (!content.includes('title:')) {
    content = '---\ntitle: "Surrender Operational Framework"\ndate: 2024-01-05\n---\n' + content
    console.log('   ✅ Added title and date')
  } else if (!content.includes('date:')) {
    const titleMatch = content.match(/title:.*\n/)
    if (titleMatch) {
      content = content.replace(titleMatch[0], titleMatch[0] + 'date: 2024-01-05\n')
      console.log('   ✅ Added missing date')
    }
  }
  
  writeFileSync(file2, content)
}

// Fix 3: legacy-architecture-canvas.mdx
const file3 = join(contentDir, 'downloads', 'legacy-architecture-canvas.mdx')
if (existsSync(file3)) {
  console.log('\n3. Fixing legacy-architecture-canvas.mdx...')
  let content = readFileSync(file3, 'utf8')
  
  // Fix the array item with trailing space
  content = content.replace(
    /-\s*"operating-cadence-pack"\s*$/gm,
    '- "operating-cadence-pack"'
  )
  
  writeFileSync(file3, content)
  console.log('   ✅ Fixed array formatting')
}

console.log('\n🎉 All fixes applied!')