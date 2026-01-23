/* scripts/generate-premium-pdfs.tsx - V4.0 (Integrated System) */
import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Font,
  Link,
  Image,
  Canvas
} from '@react-pdf/renderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { renderToBuffer } from '@react-pdf/renderer';

// Register fonts (use local fallbacks to avoid external dependencies)
try {
  Font.register({
    family: 'EB Garamond',
    src: path.join(process.cwd(), 'public', 'fonts', 'EBGaramond-Regular.ttf')
  });
} catch {
  // Fallback to standard fonts if custom font not available
  Font.register({
    family: 'EB Garamond',
    src: 'https://fonts.gstatic.com/s/ebgaramond/v26/Sl0V77v_Bp6itS5XooPGEExvXv9N.ttf'
  });
}

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf'
});

Font.registerHyphenationCallback((word) => [word]);

// Tier-specific color schemes
const TIER_COLORS = {
  free: { primary: '#1A1A1A', accent: '#666666', background: '#FFFFFF' },
  member: { primary: '#1A1A1A', accent: '#2563EB', background: '#F8FAFC' },
  architect: { primary: '#1A1A1A', accent: '#D4AF37', background: '#FFFFFF' },
  'inner-circle': { primary: '#0F172A', accent: '#7C3AED', background: '#F8FAFC' }
} as const;

// Quality-specific settings
const QUALITY_SETTINGS = {
  draft: { dpi: 72, compression: 'low' },
  premium: { dpi: 300, compression: 'medium' },
  enterprise: { dpi: 600, compression: 'high' }
} as const;

const styles = StyleSheet.create({
  page: { 
    padding: 50, 
    backgroundColor: '#FFFFFF',
    fontFamily: 'EB Garamond',
    position: 'relative'
  },
  container: {
    flex: 1,
    position: 'relative'
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    zIndex: 0
  },
  content: {
    position: 'relative',
    zIndex: 1
  },
  header: { 
    borderBottomWidth: 2, 
    borderBottomColor: '#D4AF37', 
    paddingBottom: 20, 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  title: { 
    fontSize: 28, 
    color: '#1A1A1A',
    fontFamily: 'EB Garamond',
    marginBottom: 8
  },
  subtitle: { 
    fontSize: 10, 
    color: '#666666', 
    textTransform: 'uppercase', 
    letterSpacing: 2,
    fontFamily: 'Inter',
    fontWeight: 'light'
  },
  tierBadge: {
    position: 'absolute',
    top: 30,
    right: 30,
    backgroundColor: '#D4AF37',
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 8,
    fontFamily: 'Inter',
    fontWeight: 'bold'
  },
  section: { 
    marginVertical: 15, 
    padding: 15, 
    backgroundColor: '#FAFAFA', 
    borderLeftWidth: 3, 
    borderLeftColor: '#1A1A1A',
    borderRadius: 4
  },
  sectionTitle: { 
    fontSize: 14, 
    fontFamily: 'EB Garamond',
    fontWeight: 'bold', 
    marginBottom: 10,
    color: '#1A1A1A'
  },
  sectionContent: {
    fontSize: 10,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    color: '#333333'
  },
  canvasGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10
  },
  canvasCell: {
    width: '48%',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    padding: 10,
    backgroundColor: '#FFFFFF'
  },
  placeholder: { 
    height: 60, 
    borderWidth: 1, 
    borderColor: '#EEEEEE', 
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 50, 
    right: 50, 
    borderTopWidth: 0.5, 
    borderTopColor: '#EEEEEE', 
    paddingTop: 10, 
    fontSize: 8, 
    color: '#999999', 
    textAlign: 'center',
    fontFamily: 'Inter'
  },
  qrCode: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 40,
    height: 40
  },
  metadata: {
    fontSize: 6,
    color: '#CCCCCC',
    textAlign: 'right',
    marginTop: 5
  }
});

interface PremiumPDFConfig {
  format: 'A4' | 'Letter' | 'A3' | 'bundle';
  tier: 'free' | 'member' | 'architect' | 'inner-circle';
  quality: 'draft' | 'premium' | 'enterprise';
  outputDir: string;
  interactive?: boolean;
  fillable?: boolean;
  includeQR?: boolean;
  version?: string;
  metadata?: Record<string, any>;
}

interface CanvasDocumentProps {
  format: string;
  tier: string;
  quality: string;
  metadata?: Record<string, any>;
  interactive?: boolean;
}

const CanvasDocument = ({ format, tier, quality, metadata, interactive = false }: CanvasDocumentProps) => {
  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS.architect;
  const currentYear = new Date().getFullYear();
  
  return (
    <Document 
      author="Abraham of London"
      title={`Legacy Architecture Canvas - ${tier.toUpperCase()}`}
      subject="Strategic Framework for Legacy Building"
      keywords="legacy, architecture, canvas, framework, strategy"
      creator="Abraham of London Premium PDF Generator v4.0"
      producer="React-PDF + PDF-Lib"
    >
      <Page 
        size={format === 'Letter' ? 'LETTER' : format.toUpperCase()} 
        style={[styles.page, { backgroundColor: colors.background }]}
      >
        {/* Watermark Layer */}
        <View style={styles.watermark}>
          <Text style={{
            position: 'absolute',
            top: '40%',
            left: '10%',
            right: '10%',
            textAlign: 'center',
            fontSize: 48,
            color: '#000000',
            opacity: 0.05,
            transform: 'rotate(-45deg)',
            fontFamily: 'EB Garamond',
            fontWeight: 'bold'
          }}>
            {tier.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.container}>
          {/* Tier Badge */}
          <View style={[styles.tierBadge, { backgroundColor: colors.accent }]}>
            <Text>{tier.toUpperCase()}</Text>
          </View>
          
          <View style={styles.content}>
            <View style={[styles.header, { borderBottomColor: colors.accent }]}>
              <Text style={styles.title}>Legacy Architecture Canvas</Text>
              <Text style={styles.subtitle}>STRATEGIC FRAMEWORK FOR ENDURING IMPACT</Text>
            </View>
            
            {/* Metadata Section */}
            {metadata && (
              <View style={{ 
                backgroundColor: '#F3F4F6', 
                padding: 10, 
                borderRadius: 4, 
                marginBottom: 20,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent
              }}>
                <Text style={{ fontSize: 9, fontFamily: 'Inter', color: '#4B5563' }}>
                  Version: {metadata.version || '1.0.0'} • Generated: {new Date().toISOString().split('T')[0]} • Quality: {quality.toUpperCase()}
                </Text>
              </View>
            )}
            
            {/* Canvas Framework Sections */}
            <View style={[styles.section, { borderLeftColor: colors.accent }]}>
              <Text style={styles.sectionTitle}>SOVEREIGN THESIS</Text>
              <Text style={styles.sectionContent}>
                Your core legacy statement and enduring principles that guide all strategic decisions.
              </Text>
              {interactive ? (
                <View style={styles.placeholder}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>[Interactive field: Click to edit]</Text>
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Text style={{ fontSize: 9, color: '#6B7280' }}>[Document your Sovereign Thesis here]</Text>
                </View>
              )}
            </View>
            
            <View style={[styles.section, { borderLeftColor: colors.accent }]}>
              <Text style={styles.sectionTitle}>CAPITAL MATRIX</Text>
              <Text style={styles.sectionContent}>
                Mapping of your seven capitals: Financial, Human, Intellectual, Social, Spiritual, Cultural, Natural.
              </Text>
              
              <View style={styles.canvasGrid}>
                {['Financial', 'Human', 'Intellectual', 'Social', 'Spiritual', 'Cultural', 'Natural'].map((capital) => (
                  <View key={capital} style={styles.canvasCell}>
                    <Text style={{ fontSize: 8, fontFamily: 'Inter', fontWeight: 'bold', marginBottom: 4 }}>{capital}</Text>
                    <Text style={{ fontSize: 7, color: '#6B7280' }}>Assess and document your {capital.toLowerCase()} capital allocation</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={[styles.section, { borderLeftColor: colors.accent }]}>
              <Text style={styles.sectionTitle}>IMPACT HORIZONS</Text>
              <Text style={styles.sectionContent}>
                Define your legacy across multiple time horizons: Immediate (1-3 years), 
                Strategic (3-10 years), Generational (10-50 years), Eternal (50+ years).
              </Text>
            </View>
            
            <View style={[styles.section, { borderLeftColor: colors.accent }]}>
              <Text style={styles.sectionTitle}>STEWARDSHIP FRAMEWORK</Text>
              <Text style={styles.sectionContent}>
                Systems, processes, and governance for sustaining and multiplying your legacy.
              </Text>
            </View>
          </View>
          
          {/* Footer with dynamic content */}
          <View style={styles.footer}>
            <Text>
              © {currentYear} Abraham of London • {tier.toUpperCase()} Tier • {quality.toUpperCase()} Quality • 
              Document ID: {crypto.randomBytes(4).toString('hex').toUpperCase()}
            </Text>
            <Text style={styles.metadata}>
              Generated: {new Date().toISOString()} • Format: {format} • Interactive: {interactive ? 'Yes' : 'No'}
            </Text>
          </View>
          
          {/* Optional QR Code */}
          {metadata?.includeQR && (
            <View style={styles.qrCode}>
              <Canvas
                paint={(painter) => {
                  // Simple QR placeholder - in production, use a real QR library
                  painter.fillColor('#000000');
                  painter.drawSquare(0, 0, 40);
                  painter.fillColor('#FFFFFF');
                  painter.drawText('QR', 12, 15, { fontSize: 12 });
                }}
              />
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

// FIX: Export the class properly as a named export
export class PremiumPDFGenerator {
  private config: PremiumPDFConfig;
  
  constructor(config: PremiumPDFConfig) { 
    this.config = { 
      interactive: false,
      fillable: false,
      includeQR: false,
      version: '1.0.0',
      ...config 
    }; 
  }

  async generate(): Promise<{
    success: boolean;
    filePath?: string;
    size?: number;
    duration?: number;
    error?: string;
    metadata?: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      const { format, tier, quality, outputDir, interactive, fillable, version, metadata } = this.config;
      
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });
      
      console.log(`🚀 Generating premium PDF: ${tier}-${format}-${quality}`);
      console.log(`   Config: interactive=${interactive}, fillable=${fillable}, version=${version}`);
      
      // Generate initial PDF with React-PDF
      const initialBuffer = await renderToBuffer(
        <CanvasDocument 
          format={format} 
          tier={tier} 
          quality={quality} 
          metadata={{ ...metadata, version }}
          interactive={interactive}
        />
      );
      
      // Load and enhance with PDF-Lib
      const pdfDoc = await PDFDocument.load(initialBuffer);
      
      // Add interactive form fields if enabled
      if (interactive || fillable) {
        await this.addInteractiveFields(pdfDoc, tier);
      }
      
      // Add document metadata
      pdfDoc.setTitle(`Legacy Architecture Canvas - ${tier.toUpperCase()}`);
      pdfDoc.setAuthor('Abraham of London');
      pdfDoc.setSubject('Strategic Framework for Legacy Building');
      pdfDoc.setKeywords(['legacy', 'architecture', 'canvas', tier, quality]);
      pdfDoc.setProducer('Abraham of London Premium PDF Generator v4.0');
      pdfDoc.setCreator('React-PDF + PDF-Lib');
      pdfDoc.setCreationDate(new Date());
      pdfDoc.setModificationDate(new Date());
      
      // Add security features for premium tiers
      if (tier === 'architect' || tier === 'inner-circle') {
        await this.addSecurityFeatures(pdfDoc);
      }
      
      const finalBuffer = await pdfDoc.save();
      
      // Generate dynamic filename with all relevant parameters
      const fileName = this.generateFileName();
      const filePath = path.join(outputDir, fileName);
      
      await fs.writeFile(filePath, Buffer.from(finalBuffer));
      
      const duration = Date.now() - startTime;
      const stats = await fs.stat(filePath);
      
      console.log(`✅ Generated: ${fileName} (${(stats.size / 1024).toFixed(2)} KB, ${duration}ms)`);
      
      return {
        success: true,
        filePath,
        size: stats.size,
        duration,
        metadata: {
          id: crypto.createHash('md5').update(finalBuffer).digest('hex'),
          generatedAt: new Date().toISOString(),
          tier,
          format,
          quality,
          version,
          interactive,
          fillable
        }
      };
      
    } catch (error: any) {
      console.error(`❌ Generation failed:`, error.message);
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  private async addInteractiveFields(pdfDoc: PDFDocument, tier: string): Promise<void> {
    try {
      const form = pdfDoc.getForm();
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      
      // Add standard interactive fields
      const fields = [
        { name: 'sovereign_thesis', label: 'Sovereign Thesis', y: height - 250 },
        { name: 'financial_capital', label: 'Financial Capital Assessment', y: height - 400 },
        { name: 'human_capital', label: 'Human Capital Assessment', y: height - 420 },
        { name: 'impact_horizon_1', label: 'Immediate Horizon (1-3 years)', y: height - 500 },
        { name: 'stewardship_notes', label: 'Stewardship Framework Notes', y: height - 550 }
      ];
      
      fields.forEach((field, index) => {
        const textField = form.createTextField(field.name);
        textField.setText(`[${field.label}]`);
        textField.addToPage(page, { 
          x: 65, 
          y: field.y, 
          width: width - 130, 
          height: 20,
          borderWidth: 0.5,
          borderColor: rgb(0.8, 0.8, 0.8),
          backgroundColor: tier === 'architect' ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1)
        });
        textField.enableMultiline();
      });
      
      // For premium tiers, add more sophisticated fields
      if (tier === 'architect' || tier === 'inner-circle') {
        const ratingField = form.createTextField('overall_rating');
        ratingField.setText('[Rate your legacy readiness 1-10]');
        ratingField.addToPage(page, { x: width - 150, y: 50, width: 80, height: 20 });
      }
      
    } catch (error: any) {
      console.warn('⚠️ Interactive field creation failed:', error.message);
    }
  }
  
  private async addSecurityFeatures(pdfDoc: PDFDocument): Promise<void> {
    try {
      // Add invisible digital signature placeholder
      // In production, integrate with proper digital signature service
      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        page.drawText(`⸻ Digital Signature Placeholder ⸻`, {
          x: 50,
          y: 30,
          size: 6,
          color: rgb(0.9, 0.9, 0.9)
        });
      });
    } catch (error: any) {
      console.warn('⚠️ Security feature addition failed:', error.message);
    }
  }
  
  private generateFileName(): string {
    const { format, tier, quality, version, interactive } = this.config;
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const interactiveFlag = interactive ? '-interactive' : '';
    const versionFlag = version ? `-v${version.replace(/\./g, '_')}` : '';
    
    return `legacy-architecture-canvas_${tier}_${format.toLowerCase()}_${quality}${interactiveFlag}${versionFlag}_${timestamp}.pdf`;
  }
  
  // Utility method for batch generation
  static async generateBatch(configs: PremiumPDFConfig[]): Promise<Array<{
    config: PremiumPDFConfig;
    result: any;
  }>> {
    console.log(`🔄 Starting batch generation of ${configs.length} PDFs`);
    
    const results = [];
    for (const config of configs) {
      const generator = new PremiumPDFGenerator(config);
      const result = await generator.generate();
      results.push({ config, result });
      
      // Small delay to prevent resource contention
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const successCount = results.filter(r => r.result.success).length;
    console.log(`📊 Batch complete: ${successCount}/${configs.length} succeeded`);
    
    return results;
  }
}

// ESM execution guard
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(fileURLToPath(import.meta.url));
  return argv1 === here;
})();

// Export for use in other modules
export default PremiumPDFGenerator;
export { CanvasDocument, TIER_COLORS, QUALITY_SETTINGS };

// If run directly, provide a simple CLI interface
if (invokedAsScript) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Premium PDF Generator v4.0
Usage: pnpm tsx scripts/generate-premium-pdfs.tsx [options]

Options:
  --format=A4|Letter|A3|bundle   Paper format (default: A4)
  --tier=free|member|architect|inner-circle  Tier level
  --quality=draft|premium|enterprise  Quality level
  --output-dir=path              Output directory
  --interactive                  Generate interactive PDF
  --fillable                     Include fillable form fields
  --include-qr                   Include QR code placeholder
  --version=1.0.0                Document version
  --batch=config.json            Process batch from JSON config
  
Examples:
  pnpm tsx scripts/generate-premium-pdfs.tsx --tier=architect --format=A4 --quality=premium
  pnpm tsx scripts/generate-premium-pdfs.tsx --batch=config/batch.json
    `);
    process.exit(0);
  }
  
  // Parse command line arguments
  const config: PremiumPDFConfig = {
    format: 'A4',
    tier: 'architect',
    quality: 'premium',
    outputDir: path.join(process.cwd(), 'public', 'assets', 'downloads'),
    interactive: false,
    fillable: false,
    includeQR: false,
    version: '1.0.0'
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--format=')) config.format = arg.split('=')[1] as any;
    if (arg.startsWith('--tier=')) config.tier = arg.split('=')[1] as any;
    if (arg.startsWith('--quality=')) config.quality = arg.split('=')[1] as any;
    if (arg.startsWith('--output-dir=')) config.outputDir = arg.split('=')[1];
    if (arg === '--interactive') config.interactive = true;
    if (arg === '--fillable') config.fillable = true;
    if (arg === '--include-qr') config.includeQR = true;
    if (arg.startsWith('--version=')) config.version = arg.split('=')[1];
  });
  
  // Execute generation
  (async () => {
    const generator = new PremiumPDFGenerator(config);
    const result = await generator.generate();
    
    if (result.success) {
      console.log(`🎉 Successfully generated: ${result.filePath}`);
      console.log(`   Size: ${result.size} bytes, Duration: ${result.duration}ms`);
      process.exit(0);
    } else {
      console.error(`❌ Generation failed: ${result.error}`);
      process.exit(1);
    }
  })();
}