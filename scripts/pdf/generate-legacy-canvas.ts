// /scripts/pdf/generate-legacy-canvas.ts
import { LegacyCanvasGenerator, generateLegacyCanvasProduction } from '../../scripts/generate-legacy-canvas'

async function main() {
  console.log('🔄 Starting Legacy Canvas PDF generation...')
  
  const generator = new LegacyCanvasGenerator()
  
  try {
    // Generate all formats
    await generator.generateAllFormats('premium')
    
    console.log('\n✅ Legacy Canvas PDF generation completed!')
    
    // Also generate individual formats as a backup
    const formats: Array<'A4' | 'Letter' | 'A3'> = ['A4', 'Letter', 'A3']
    
    for (const format of formats) {
      console.log(`\n🔧 Generating ${format} format...`)
      const result = await generateLegacyCanvasProduction(format, 'premium')
      
      if (result.success) {
        console.log(`   ✅ ${format}: Generated ${(result.size! / 1024).toFixed(1)} KB`)
      } else {
        console.log(`   ❌ ${format}: ${result.error}`)
      }
    }
    
    console.log('\n🎉 All PDFs generated successfully!')
    process.exit(0)
    
  } catch (error: any) {
    console.error('💥 Generation failed:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}