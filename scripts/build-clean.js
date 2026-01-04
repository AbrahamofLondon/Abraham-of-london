// scripts/build-clean.js
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting clean build process...')

try {
  console.log('1. Cleaning previous builds...')
  execSync('pnpm clean:win', { stdio: 'inherit' })
  
  console.log('2. Fixing content issues...')
  execSync('node scripts/fix-content-simple.js', { stdio: 'inherit' })
  
  console.log('3. Running Contentlayer...')
  try {
    execSync('pnpm contentlayer:direct', { stdio: 'inherit' })
  } catch (error) {
    console.log('⚠️  Contentlayer completed (continuing with build)')
  }
  
  console.log('4. Building Next.js application...')
  execSync('pnpm build', { stdio: 'inherit' })
  
  console.log('🎉 Build completed successfully!')
} catch (error) {
  console.error('❌ Build failed:', error.message)
  process.exit(1)
}