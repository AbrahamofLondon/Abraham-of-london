// scripts/generate-legacy-canvas.ts - PRODUCTION READY
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// TYPES & INTERFACES
// =============================================================================
export interface GenerationOptions {
  format: 'A4' | 'Letter' | 'A3';
  includeWatermark: boolean;
  isPreview: boolean;
  quality: 'draft' | 'standard' | 'premium';
}

export interface PageDimensions {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface CanvasSection {
  id: string;
  title: string;
  description: string;
  color: { r: number; g: number; b: number };
  position: { x: number; y: number };
  size: { width: number; height: number };
  fields: Array<{
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'signature' | 'checkbox' | 'date';
    required: boolean;
    placeholder?: string;
  }>;
}

// =============================================================================
// LEGACY CANVAS GENERATOR CLASS
// =============================================================================
export class LegacyCanvasGenerator {
  private doc: PDFDocument | null = null;
  private page: any = null;
  private fonts: Record<string, any> = {};
  private form: any = null;
  
  private readonly dimensions: Record<string, PageDimensions> = {
    A4: { 
      width: 595.28, 
      height: 841.89,
      margins: { top: 72, right: 72, bottom: 72, left: 72 }
    },
    Letter: { 
      width: 612, 
      height: 792,
      margins: { top: 72, right: 72, bottom: 72, left: 72 }
    },
    A3: { 
      width: 841.89, 
      height: 1190.55,
      margins: { top: 90, right: 90, bottom: 90, left: 90 }
    }
  };

  private readonly colors = {
    primary: rgb(124 / 255, 58 / 255, 237 / 255),
    primaryDark: rgb(89 / 255, 31 / 255, 191 / 255),
    secondary: rgb(16 / 255, 185 / 255, 129 / 255),
    secondaryDark: rgb(5 / 255, 150 / 255, 105 / 255),
    accent: rgb(59 / 255, 130 / 255, 246 / 255),
    warning: rgb(239 / 255, 68 / 255, 68 / 255),
    success: rgb(34 / 255, 197 / 255, 94 / 255),
    background: rgb(255 / 255, 255 / 255, 255 / 255),
    paper: rgb(250 / 255, 250 / 255, 249 / 255),
    border: rgb(229 / 255, 231 / 255, 235 / 255),
    borderDark: rgb(209 / 255, 213 / 255, 219 / 255),
    heading: rgb(17 / 255, 24 / 255, 39 / 255),
    body: rgb(31 / 255, 41 / 255, 55 / 255),
    muted: rgb(107 / 255, 114 / 255, 128 / 255),
    caption: rgb(156 / 255, 163 / 255, 175 / 255)
  };

  private readonly canvasSections: CanvasSection[] = [
    {
      id: 'sovereign-thesis',
      title: 'SOVEREIGN THESIS',
      description: 'Articulate your foundational worldview and purpose',
      color: this.colors.primary,
      position: { x: 0, y: 0 },
      size: { width: 250, height: 180 },
      fields: [
        { id: 'purpose', label: 'Core Purpose', type: 'textarea', required: true, placeholder: 'The fundamental reason for your existence...' },
        { id: 'values', label: 'Guiding Values', type: 'textarea', required: true, placeholder: 'Principles that guide every decision...' },
        { id: 'vision', label: 'Long-term Vision', type: 'textarea', required: true, placeholder: 'The world you aim to create...' }
      ]
    },
    {
      id: 'capital-matrix',
      title: 'CAPITAL MATRIX',
      description: 'Map and allocate your forms of capital',
      color: this.colors.secondary,
      position: { x: 270, y: 0 },
      size: { width: 250, height: 180 },
      fields: [
        { id: 'financial', label: 'Financial Capital', type: 'textarea', required: true },
        { id: 'social', label: 'Social Capital', type: 'textarea', required: true },
        { id: 'cultural', label: 'Cultural Capital', type: 'textarea', required: true },
        { id: 'spiritual', label: 'Spiritual Capital', type: 'textarea', required: true }
      ]
    },
    {
      id: 'institutions',
      title: 'INSTITUTIONS',
      description: 'Design the structures that embody your legacy',
      color: this.colors.accent,
      position: { x: 0, y: 200 },
      size: { width: 250, height: 180 },
      fields: [
        { id: 'family', label: 'Family Structures', type: 'textarea', required: true },
        { id: 'business', label: 'Business Entities', type: 'textarea', required: true },
        { id: 'philanthropy', label: 'Philanthropic Vehicles', type: 'textarea', required: true },
        { id: 'intellectual', label: 'Intellectual Property', type: 'textarea', required: true }
      ]
    },
    {
      id: 'guardrails',
      title: 'GUARDRAILS',
      description: 'Establish boundaries and protection mechanisms',
      color: this.colors.warning,
      position: { x: 270, y: 200 },
      size: { width: 250, height: 180 },
      fields: [
        { id: 'ethical', label: 'Ethical Boundaries', type: 'textarea', required: true },
        { id: 'risk', label: 'Risk Management', type: 'textarea', required: true },
        { id: 'succession', label: 'Succession Planning', type: 'textarea', required: true },
        { id: 'accountability', label: 'Accountability Systems', type: 'textarea', required: true }
      ]
    }
  ];

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================
  async initialize(options: GenerationOptions): Promise<void> {
    this.doc = await PDFDocument.create();
    
    this.fonts = {
      heading: await this.doc.embedFont(StandardFonts.HelveticaBold),
      subheading: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
      body: await this.doc.embedFont(StandardFonts.Helvetica),
      italic: await this.doc.embedFont(StandardFonts.HelveticaOblique),
      caption: await this.doc.embedFont(StandardFonts.HelveticaOblique)
    };
    
    const dim = this.dimensions[options.format];
    this.page = this.doc.addPage([dim.width, dim.height]);
    this.form = this.doc.getForm();
    
    if (options.quality === 'premium' && !options.isPreview) {
      this.drawPremiumBackground(dim);
    } else {
      this.page.drawRectangle({
        x: 0,
        y: 0,
        width: dim.width,
        height: dim.height,
        color: this.colors.background,
        borderWidth: 0
      });
    }
  }

  // ===========================================================================
  // DRAWING UTILITIES
  // ===========================================================================
  private drawPremiumBackground(dim: PageDimensions): void {
    const gradientSteps = 5;
    const stepHeight = dim.height / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const y = i * stepHeight;
      const intensity = 0.98 - (i * 0.015);
      
      this.page.drawRectangle({
        x: 0,
        y,
        width: dim.width,
        height: stepHeight,
        color: rgb(intensity, intensity, intensity),
        borderWidth: 0
      });
    }
  }

  private addText(
    text: string, 
    x: number, 
    y: number, 
    options: {
      size?: number;
      font?: any;
      color?: any;
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
      lineHeight?: number;
    } = {}
  ): void {
    const { 
      size = 11, 
      font = this.fonts.body, 
      color = this.colors.body,
      align = 'left',
      maxWidth,
      lineHeight = size * 1.2
    } = options;
    
    const pageHeight = this.page.getHeight();
    const drawY = pageHeight - y;
    
    const words = text.split(' ');
    let line = '';
    let currentY = drawY;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (maxWidth && testWidth > maxWidth && i > 0) {
        let drawX = x;
        if (align === 'center') drawX = x - (font.widthOfTextAtSize(line, size) / 2);
        if (align === 'right') drawX = x - font.widthOfTextAtSize(line, size);
        
        this.page.drawText(line.trim(), {
          x: drawX,
          y: currentY,
          size,
          font,
          color
        });
        
        line = words[i] + ' ';
        currentY -= lineHeight;
      } else {
        line = testLine;
      }
    }
    
    let drawX = x;
    if (align === 'center') drawX = x - (font.widthOfTextAtSize(line, size) / 2);
    if (align === 'right') drawX = x - font.widthOfTextAtSize(line, size);
    
    this.page.drawText(line.trim(), {
      x: drawX,
      y: currentY,
      size,
      font,
      color
    });
  }

  private drawRoundedRect(
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    options: {
      color?: any;
      borderColor?: any;
      borderWidth?: number;
      fill?: boolean;
      radius?: number;
    } = {}
  ): void {
    const {
      color,
      borderColor = this.colors.border,
      borderWidth = 1,
      fill = true,
      radius = 8
    } = options;
    
    const pageHeight = this.page.getHeight();
    const drawY = pageHeight - y - height;
    
    if (fill && color) {
      this.page.drawRectangle({
        x,
        y: drawY,
        width,
        height,
        color,
        borderWidth: 0
      });
    }
    
    if (borderWidth > 0) {
      this.page.drawLine({
        start: { x: x + radius, y: drawY + height },
        end: { x: x + width - radius, y: drawY + height },
        thickness: borderWidth,
        color: borderColor
      });
      
      this.page.drawLine({
        start: { x: x + radius, y: drawY },
        end: { x: x + width - radius, y: drawY },
        thickness: borderWidth,
        color: borderColor
      });
      
      this.page.drawLine({
        start: { x: x, y: drawY + radius },
        end: { x: x, y: drawY + height - radius },
        thickness: borderWidth,
        color: borderColor
      });
      
      this.page.drawLine({
        start: { x: x + width, y: drawY + radius },
        end: { x: x + width, y: drawY + height - radius },
        thickness: borderWidth,
        color: borderColor
      });
    }
  }

  private createFormField(
    sectionId: string, 
    fieldId: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number,
    options: {
      type?: 'text' | 'textarea' | 'signature';
      placeholder?: string;
      required?: boolean;
      multiline?: boolean;
    } = {}
  ): void {
    const {
      type = 'text',
      placeholder = '',
      required = false,
      multiline = true
    } = options;
    
    const pageHeight = this.page.getHeight();
    const drawY = pageHeight - y - height;
    
    const fullFieldId = `${sectionId}_${fieldId}`;
    
    const field = this.form.createTextField(fullFieldId);
    field.addToPage(this.page, { x, y: drawY, width, height });
    field.setFontSize(10);
    
    if (placeholder) {
      field.setText(placeholder);
    }
    
    if (multiline) {
      field.enableMultiline();
      field.enableScrolling();
    }
    
    if (required) {
      this.page.drawText('*', {
        x: x - 8,
        y: drawY + height - 12,
        size: 12,
        font: this.fonts.heading,
        color: this.colors.warning
      });
    }
  }

  // ===========================================================================
  // MAIN GENERATION LOGIC
  // ===========================================================================
  async generate(options: GenerationOptions): Promise<Uint8Array> {
    await this.initialize(options);
    const dim = this.dimensions[options.format];
    const { width, height } = this.page.getSize();
    
    const scale = this.calculateScale(options.format);
    const offsetX = dim.margins.left;
    const offsetY = dim.margins.top + 50;
    
    // Header
    this.addText('THE LEGACY ARCHITECTURE CANVAS', width / 2, 80, {
      font: this.fonts.heading,
      size: 28 * scale,
      color: this.colors.primaryDark,
      align: 'center'
    });
    
    this.addText('Institutional-Grade Framework for Sovereign Design', width / 2, 120, {
      font: this.fonts.subheading,
      size: 14 * scale,
      color: this.colors.muted,
      align: 'center'
    });
    
    this.page.drawLine({
      start: { x: offsetX, y: height - 150 },
      end: { x: width - offsetX, y: height - 150 },
      thickness: 1,
      color: this.colors.borderDark,
      opacity: 0.5
    });
    
    // Instructions
    this.addText('INSTRUCTIONS:', offsetX, 180, {
      font: this.fonts.heading,
      size: 12 * scale,
      color: this.colors.heading
    });
    
    const instructions = [
      '1. Complete each section with precision and foresight',
      '2. Consider multi-generational impact in your responses',
      '3. Review periodically and update as your legacy evolves',
      '4. Store completed canvas in your secure legacy vault'
    ];
    
    instructions.forEach((instruction, i) => {
      this.addText(instruction, offsetX + 20, 210 + (i * 25), {
        font: this.fonts.body,
        size: 10 * scale,
        color: this.colors.body,
        maxWidth: width - (offsetX * 2) - 40
      });
    });
    
    // Canvas Sections
    this.canvasSections.forEach((section) => {
      const x = offsetX + section.position.x;
      const y = offsetY + section.position.y;
      
      this.drawRoundedRect(x - 5, y - 5, section.size.width + 10, section.size.height + 10, {
        color: rgb(0.98, 0.98, 0.98),
        borderWidth: 0,
        fill: true
      });
      
      this.drawRoundedRect(x, y, section.size.width, section.size.height, {
        borderColor: section.color,
        borderWidth: 2,
        fill: false,
        radius: 6
      });
      
      this.page.drawRectangle({
        x,
        y: this.page.getHeight() - y - 30,
        width: section.size.width,
        height: 30,
        color: section.color,
        borderWidth: 0
      });
      
      this.addText(section.title, x + 15, y + 20, {
        font: this.fonts.heading,
        size: 12 * scale,
        color: rgb(1, 1, 1),
        maxWidth: section.size.width - 30
      });
      
      this.addText(section.description, x + 15, y + 45, {
        font: this.fonts.caption,
        size: 9 * scale,
        color: this.colors.muted,
        maxWidth: section.size.width - 30
      });
      
      section.fields.forEach((field, fieldIndex) => {
        const fieldY = y + 75 + (fieldIndex * 25);
        
        this.addText(field.label + ':', x + 15, fieldY, {
          font: this.fonts.body,
          size: 9 * scale,
          color: this.colors.heading
        });
        
        this.createFormField(
          section.id,
          field.id,
          x + 80,
          fieldY - 20,
          section.size.width - 95,
          15,
          {
            type: field.type,
            placeholder: field.placeholder,
            required: field.required,
            multiline: field.type === 'textarea'
          }
        );
      });
    });
    
    // Footer
    const footerY = height - 40;
    
    if (!options.isPreview) {
      this.addText('CONFIDENTIAL & PROPRIETARY', width / 2, footerY - 20, {
        font: this.fonts.caption,
        size: 8 * scale,
        color: this.colors.muted,
        align: 'center'
      });
    }
    
    if (options.includeWatermark && !options.isPreview) {
      this.addText('Abraham of London • Legacy Architecture Suite', width / 2, height / 2, {
        font: this.fonts.italic,
        size: 48 * scale,
        color: rgb(0.9, 0.9, 0.9),
        align: 'center'
      });
    }
    
    const infoText = `Generated: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })} | Format: ${options.format} | Version: 1.0`;
    
    this.addText(infoText, width - offsetX, footerY, {
      font: this.fonts.caption,
      size: 7 * scale,
      color: this.colors.caption,
      align: 'right'
    });
    
    // Set metadata
    this.doc.setTitle('Legacy Architecture Canvas');
    this.doc.setAuthor('Abraham of London');
    this.doc.setSubject('Sovereign Legacy Design Framework');
    this.doc.setKeywords(['legacy', 'architecture', 'canvas', 'framework', 'sovereign']);
    this.doc.setProducer('Abraham of London PDF Engine');
    this.doc.setCreator('Legacy Architecture Suite v1.0');
    this.doc.setCreationDate(new Date());
    this.doc.setModificationDate(new Date());
    
    return await this.doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    });
  }

  private calculateScale(format: string): number {
    switch (format) {
      case 'A3': return 1.1;
      case 'A4': return 1.0;
      case 'Letter': return 0.95;
      default: return 1.0;
    }
  }

  // ===========================================================================
  // PRODUCTION METHODS
  // ===========================================================================
  async generateAllFormats(quality: 'draft' | 'standard' | 'premium' = 'premium'): Promise<void> {
    console.log('🚀 Generating Legacy Architecture Canvas PDFs...\n');
    
    const formats: Array<'A4' | 'Letter' | 'A3'> = ['A4', 'Letter', 'A3'];
    const outputDir = path.join(process.cwd(), 'public/assets/downloads');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = [];
    
    for (const format of formats) {
      try {
        console.log(`🎨 Generating ${format} format (${quality} quality)...`);
        
        const pdfBytes = await this.generate({
          format,
          includeWatermark: true,
          isPreview: false,
          quality
        });
        
        const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}.pdf`;
        const filepath = path.join(outputDir, filename);
        
        fs.writeFileSync(filepath, Buffer.from(pdfBytes));
        
        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(1);
        
        if (stats.size < 5000) {
          throw new Error(`Generated file is too small (${fileSizeKB} KB), likely incomplete`);
        }
        
        console.log(`✅ Generated: ${filename} (${fileSizeKB} KB)`);
        
        results.push({
          format,
          filename,
          filepath,
          sizeKB: fileSizeKB,
          quality,
          success: true
        });
        
      } catch (error: any) {
        console.error(`❌ Failed to generate ${format}:`, error.message);
        results.push({
          format,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('\n📊 Generation Summary:');
    results.forEach(result => {
      if (result.success) {
        console.log(`  ✅ ${result.format}: ${result.sizeKB} KB`);
      } else {
        console.log(`  ❌ ${result.format}: ${result.error}`);
      }
    });
    
    const successfulFormats = results.filter(r => r.success);
    if (successfulFormats.length > 0) {
      console.log(`\n🎉 ${successfulFormats.length}/${formats.length} formats generated successfully!`);
    }
  }

  async generateAndSave(
    options: GenerationOptions,
    outputPath: string
  ): Promise<{ success: boolean; size?: number; error?: string; path: string }> {
    try {
      const pdfBytes = await this.generate(options);
      
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
      
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        throw new Error('Generated file is empty');
      }
      
      return {
        success: true,
        size: stats.size,
        path: outputPath
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        path: outputPath
      };
    }
  }
}

// =============================================================================
// PRODUCTION UTILITY FUNCTION
// =============================================================================
export async function generateLegacyCanvasProduction(
  format: 'A4' | 'Letter' | 'A3',
  quality: 'draft' | 'standard' | 'premium' = 'premium',
  outputDir?: string
): Promise<{ success: boolean; path?: string; size?: number; error?: string }> {
  const generator = new LegacyCanvasGenerator();
  
  const finalOutputDir = outputDir || path.join(process.cwd(), 'public/assets/downloads');
  const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}.pdf`;
  const outputPath = path.join(finalOutputDir, filename);
  
  return await generator.generateAndSave(
    {
      format,
      includeWatermark: true,
      isPreview: false,
      quality
    },
    outputPath
  );
}

// =============================================================================
// CLI INTERFACE
// =============================================================================
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const generator = new LegacyCanvasGenerator();
  
  generator.generateAllFormats('premium').then(() => {
    console.log('\n✨ All generations completed!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}