// scripts/optimize-fonts.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 Optimizing fonts for production...');

const fontsDir = path.join(__dirname, '../public/fonts');
const optimizedDir = path.join(__dirname, '../public/fonts/optimized');

// Create optimized directory
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Font optimization configuration
const fontConfig = {
  inter: {
    src: 'node_modules/@fontsource/inter/files',
    weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    styles: ['normal', 'italic'],
    formats: ['woff2']
  }
};

// Generate font optimization commands
console.log('📦 Copying and optimizing font files...');

try {
  // Copy Inter font files
  const interSrc = fontConfig.inter.src;
  fontConfig.inter.weights.forEach(weight => {
    fontConfig.inter.styles.forEach(style => {
      const styleSuffix = style === 'italic' ? 'italic' : '';
      const fontName = `Inter-${weight}${styleSuffix ? `-${styleSuffix}` : ''}`;
      
      fontConfig.inter.formats.forEach(format => {
        const srcFile = path.join(interSrc, `${fontName}-latin.${format}`);
        const destFile = path.join(optimizedDir, `${fontName}.${format}`);
        
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, destFile);
          console.log(`✅ Copied: ${fontName}.${format}`);
        }
      });
    });
  });
  
  // Create font manifest
  const fontManifest = {
    generated: new Date().toISOString(),
    fonts: Object.keys(fontConfig).map(fontName => ({
      name: fontName,
      weights: fontConfig[fontName].weights,
      styles: fontConfig[fontName].styles,
      formats: fontConfig[fontName].formats
    }))
  };
  
  fs.writeFileSync(
    path.join(optimizedDir, 'manifest.json'),
    JSON.stringify(fontManifest, null, 2)
  );
  
  console.log('🎉 Font optimization complete!');
  console.log(`📁 Optimized fonts saved to: ${optimizedDir}`);
  
} catch (error) {
  console.error('❌ Font optimization failed:', error);
  process.exit(1);
}