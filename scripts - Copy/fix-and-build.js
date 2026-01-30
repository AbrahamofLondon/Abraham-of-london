import { execSync } from 'child_process'

console.log('🚀 Starting comprehensive fix and build...\n')

try {
  console.log('Step 1: Fixing YAML issues...')
  execSync('node scripts/fix-yaml-specific.js', { stdio: 'inherit' })
  
  console.log('\nStep 2: Cleaning cache...')
  execSync('rimraf .next .contentlayer node_modules/.cache', { stdio: 'inherit' })
  
  console.log('\nStep 3: Running Contentlayer...')
  execSync('contentlayer build', { stdio: 'inherit' })
  
  console.log('\nStep 4: Building Next.js...')
  execSync('next build', { stdio: 'inherit' })
  
  console.log('\n🎉 Build completed successfully!')
} catch (error) {
  console.error('\n❌ Build failed:', error.message)
  process.exit(1)
}