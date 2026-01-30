// scripts/simple-build.js
import { execSync } from 'child_process'

console.log('🚀 Starting build process...\n')

try {
  console.log('1. Fixing YAML issues...')
  execSync('node scripts/fix-yaml-files.js', { stdio: 'inherit' })
  
  console.log('\n2. Running Contentlayer...')
  execSync('pnpm contentlayer:direct', { stdio: 'inherit' })
  
  console.log('\n3. Building Next.js...')
  execSync('pnpm build', { stdio: 'inherit' })
  
  console.log('\n🎉 Build completed successfully!')
} catch (error) {
  console.error('\n❌ Build failed:', error.message)
  process.exit(1)
}