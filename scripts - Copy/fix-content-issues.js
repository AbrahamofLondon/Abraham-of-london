// scripts/fix-content-issues.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const contentDir = path.join(__dirname, '..', 'content')

// Fix specific problematic files
const fixSurrenderNotSubmission = () => {
  const filePath = path.join(contentDir, 'blog', 'surrender-not-submission.mdx')
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Fix the YAML array issue
  content = content.replace(
    /tags:\s*\n([\s\S]*?)\]\s*\n---/,
    `tags:\n$1  ""\n]\n---`
  )
  
  fs.writeFileSync(filePath, content)
  console.log(`✅ Fixed: surrender-not-submission.mdx`)
}

const fixLegacyArchitectureCanvas = () => {
  const filePath = path.join(contentDir, 'downloads', 'legacy-architecture-canvas.mdx')
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Fix the trailing quote issue
  content = content.replace(
    /-\s*"operating-cadence-pack"\s*$/gm,
    '- "operating-cadence-pack"'
  )
  
  fs.writeFileSync(filePath, content)
  console.log(`✅ Fixed: legacy-architecture-canvas.mdx`)
}

const fixSurrenderOperationalFramework = () => {
  const filePath = path.join(contentDir, 'blog', 'surrender-operational-framework.mdx')
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Check if frontmatter exists
  if (!content.startsWith('---')) {
    console.warn(`File doesn't have frontmatter: ${filePath}`)
    return
  }
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  
  if (!frontmatterMatch) {
    console.error(`Could not parse frontmatter in: ${filePath}`)
    return
  }
  
  const yamlContent = frontmatterMatch[1]
  let fixedYaml = yamlContent
  
  // Add missing title and date if they don't exist
  if (!yamlContent.includes('title:')) {
    fixedYaml = `title: "Surrender Operational Framework"\ndate: 2024-01-01\n${fixedYaml}`
  } else if (!yamlContent.includes('date:')) {
    // Insert date after title
    fixedYaml = fixedYaml.replace(/title:.*\n/, `$&date: 2024-01-01\n`)
  }
  
  content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${fixedYaml}\n---`)
  fs.writeFileSync(filePath, content)
  console.log(`✅ Fixed: surrender-operational-framework.mdx`)
}

// Fix Windows permission issue
const fixWindowsPermissionIssue = () => {
  if (process.platform !== 'win32') {
    console.log('Not on Windows, skipping permission fix')
    return
  }
  
  const imagePath = path.join(__dirname, '..', 'public', 'assets', 'images', 'shorts', 'default-cover.jpg')
  
  if (fs.existsSync(imagePath)) {
    try {
      // Try to read the file to see if we have permission
      fs.accessSync(imagePath, fs.constants.R_OK)
      console.log(`✅ Image file is accessible: ${imagePath}`)
    } catch (error) {
      console.warn(`⚠️  Permission issue with: ${imagePath}`)
      console.warn(`Error: ${error.message}`)
      
      // Try to fix permissions
      try {
        fs.chmodSync(imagePath, 0o644)
        console.log(`✅ Fixed permissions for: ${imagePath}`)
      } catch (fixError) {
        console.error(`❌ Could not fix permissions: ${fixError.message}`)
        console.log(`\n💡 Manual fix needed:`)
        console.log(`1. Close any programs using this file`)
        console.log(`2. Right-click the file → Properties → Security`)
        console.log(`3. Ensure your user has Read & Execute permissions`)
      }
    }
  } else {
    console.log(`ℹ️  Image file doesn't exist: ${imagePath}`)
    console.log(`Creating default cover image...`)
    
    // Create directory if it doesn't exist
    const dirPath = path.dirname(imagePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    
    // Create a simple placeholder image
    const placeholderImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    )
    
    fs.writeFileSync(imagePath, placeholderImage)
    console.log(`✅ Created default cover image: ${imagePath}`)
  }
}

// Run all fixes
const runFixes = () => {
  console.log('🔧 Running content fixes...\n')
  
  try {
    fixSurrenderNotSubmission()
    fixLegacyArchitectureCanvas()
    fixSurrenderOperationalFramework()
    fixWindowsPermissionIssue()
    
    console.log('\n✅ All fixes completed!')
  } catch (error) {
    console.error('\n❌ Error running fixes:', error.message)
    process.exit(1)
  }
}

runFixes()