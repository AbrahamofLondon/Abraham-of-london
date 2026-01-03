import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------------------------
// TYPES & INTERFACES
// -----------------------------------------------------------------------------
interface GenerationOptions {
  format: 'A4' | 'Letter' | 'A3';
  includeWatermark: boolean;
  isPreview: boolean;
  quality: 'draft' | 'standard' | 'premium';
}

interface PageDimensions {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface CanvasSection {
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

// -----------------------------------------------------------------------------
// LEGACY ARCHITECTURE CANVAS GENERATOR (INSTITUTIONAL GRADE)
// -----------------------------------------------------------------------------
class LegacyCanvasGenerator {
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

  // Premium color palette for institutional documents
  private readonly colors = {
    // Primary brand colors
    primary: rgb(124 / 255, 58 / 255, 237 / 255),     // Purple
    primaryDark: rgb(89 / 255, 31 / 255, 191 / 255),   // Dark Purple
    secondary: rgb(16 / 255, 185 / 255, 129 / 255),   // Teal
    secondaryDark: rgb(5 / 255, 150 / 255, 105 / 255), // Dark Teal
    accent: rgb(59 / 255, 130 / 255, 246 / 255),      // Blue
    warning: rgb(239 / 255, 68 / 255, 68 / 255),      // Red
    success: rgb(34 / 255, 197 / 255, 94 / 255),      // Green
    
    // Neutral tones
    background: rgb(255 / 255, 255 / 255, 255 / 255), // White
    paper: rgb(250 / 255, 250 / 255, 249 / 255),      // Off-white
    border: rgb(229 / 255, 231 / 255, 235 / 255),     // Light gray
    borderDark: rgb(209 / 255, 213 / 255, 219 / 255), // Medium gray
    
    // Text colors
    heading: rgb(17 / 255, 24 / 255, 39 / 255),       // Near black
    body: rgb(31 / 255, 41 / 255, 55 / 255),          // Dark gray
    muted: rgb(107 / 255, 114 / 255, 128 / 255),      // Medium gray
    caption: rgb(156 / 255, 163 / 255, 175 / 255)     // Light gray
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
        { id: 'financial', label: 'Financial Capital', type: 'textarea', required: true, placeholder: 'Monetary resources and investments...' },
        { id: 'social', label: 'Social Capital', type: 'textarea', required: true, placeholder: 'Relationships and networks...' },
        { id: 'cultural', label: 'Cultural Capital', type: 'textarea', required: true, placeholder: 'Knowledge, skills, and traditions...' },
        { id: 'spiritual', label: 'Spiritual Capital', type: 'textarea', required: true, placeholder: 'Meaning, purpose, and transcendence...' }
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
        { id: 'family', label: 'Family Structures', type: 'textarea', required: true, placeholder: 'Family governance and traditions...' },
        { id: 'business', label: 'Business Entities', type: 'textarea', required: true, placeholder: 'Companies and ventures...' },
        { id: 'philanthropy', label: 'Philanthropic Vehicles', type: 'textarea', required: true, placeholder: 'Charities and foundations...' },
        { id: 'intellectual', label: 'Intellectual Property', type: 'textarea', required: true, placeholder: 'Patents, copyrights, trademarks...' }
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
        { id: 'ethical', label: 'Ethical Boundaries', type: 'textarea', required: true, placeholder: 'Lines you will never cross...' },
        { id: 'risk', label: 'Risk Management', type: 'textarea', required: true, placeholder: 'Protections against threats...' },
        { id: 'succession', label: 'Succession Planning', type: 'textarea', required: true, placeholder: 'Transition and continuity...' },
        { id: 'accountability', label: 'Accountability Systems', type: 'textarea', required: true, placeholder: 'Checks and balances...' }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------
  async initialize(options: GenerationOptions): Promise<void> {
    // Create document with high compression for quality
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    
    // Embed professional fonts
    this.fonts = {
      heading: await this.doc.embedFont(StandardFonts.HelveticaBold),
      subheading: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
      body: await this.doc.embedFont(StandardFonts.Helvetica),
      italic: await this.doc.embedFont(StandardFonts.HelveticaOblique),
      caption: await this.doc.embedFont(StandardFonts.HelveticaOblique)
    };
    
    // Add page with specified format
    const dim = this.dimensions[options.format];
    this.page = this.doc.addPage([dim.width, dim.height]);
    
    // Get form for interactive fields
    this.form = this.doc.getForm();
    
    // Set premium background (subtle gradient effect)
    if (options.quality === 'premium' && !options.isPreview) {
      this.drawPremiumBackground(dim);
    } else {
      // Standard white background
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

  // ---------------------------------------------------------------------------
  // DRAWING UTILITIES (ENHANCED FOR QUALITY)
  // ---------------------------------------------------------------------------
  private drawPremiumBackground(dim: PageDimensions): void {
    // Subtle gradient from top to bottom
    const gradientSteps = 5;
    const stepHeight = dim.height / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const y = i * stepHeight;
      const intensity = 0.98 - (i * 0.015); // Slight darkening toward bottom
      
      this.page.drawRectangle({
        x: 0,
        y,
        width: dim.width,
        height: stepHeight,
        color: rgb(intensity, intensity, intensity),
        borderWidth: 0
      });
    }
    
    // Add subtle grid pattern for professional look
    const gridSpacing = 20;
    const gridColor = rgb(0.95, 0.95, 0.95);
    
    // Vertical lines
    for (let x = gridSpacing; x < dim.width; x += gridSpacing) {
      this.page.drawLine({
        start: { x, y: 0 },
        end: { x, y: dim.height },
        thickness: 0.25,
        color: gridColor,
        opacity: 0.3
      });
    }
    
    // Horizontal lines
    for (let y = gridSpacing; y < dim.height; y += gridSpacing) {
      this.page.drawLine({
        start: { x: 0, y },
        end: { x: dim.width, y },
        thickness: 0.25,
        color: gridColor,
        opacity: 0.3
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
    
    // Handle text wrapping
    const words = text.split(' ');
    let line = '';
    let currentY = drawY;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (maxWidth && testWidth > maxWidth && i > 0) {
        // Draw the current line
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
        
        // Move to next line
        line = words[i] + ' ';
        currentY -= lineHeight;
      } else {
        line = testLine;
      }
    }
    
    // Draw the last line
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
    
    // Draw filled rectangle (if needed)
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
    
    // Draw border with rounded corners (simulated with lines)
    if (borderWidth > 0) {
      // Top border
      this.page.drawLine({
        start: { x: x + radius, y: drawY + height },
        end: { x: x + width - radius, y: drawY + height },
        thickness: borderWidth,
        color: borderColor
      });
      
      // Bottom border
      this.page.drawLine({
        start: { x: x + radius, y: drawY },
        end: { x: x + width - radius, y: drawY },
        thickness: borderWidth,
        color: borderColor
      });
      
      // Left border
      this.page.drawLine({
        start: { x: x, y: drawY + radius },
        end: { x: x, y: drawY + height - radius },
        thickness: borderWidth,
        color: borderColor
      });
      
      // Right border
      this.page.drawLine({
        start: { x: x + width, y: drawY + radius },
        end: { x: x + width, y: drawY + height - radius },
        thickness: borderWidth,
        color: borderColor
      });
      
      // Corner circles for rounded effect
      const cornerPoints = [
        { x: x + radius, y: drawY + height - radius }, // Top-left
        { x: x + width - radius, y: drawY + height - radius }, // Top-right
        { x: x + radius, y: drawY + radius }, // Bottom-left
        { x: x + width - radius, y: drawY + radius } // Bottom-right
      ];
      
      cornerPoints.forEach(point => {
        this.page.drawCircle({
          x: point.x,
          y: point.y,
          size: radius,
          borderWidth: borderWidth,
          borderColor: borderColor
        });
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
  
  if (type === 'signature') {
    const field = this.form.createSignature(fullFieldId);
    field.addToPage(this.page, { x, y: drawY, width, height });
  } else {
    const field = this.form.createTextField(fullFieldId);
    field.addToPage(this.page, { x, y: drawY, width, height });
    
    // Configure text field - FIXED: setFont doesn't exist, use setFontSize
    field.setFontSize(10);
    
    if (placeholder) {
      field.setText(placeholder);
      field.setOpacity(0.5); // Gray out placeholder text
    }
    
    if (multiline) {
      field.enableMultiline();
      field.enableScrolling();
    }
    
    if (required) {
      // Visual indicator for required fields
      this.page.drawText('*', {
        x: x - 8,
        y: drawY + height - 12,
        size: 12,
        font: this.fonts.heading,
        color: this.colors.warning
      });
    }
  }
}

  // ---------------------------------------------------------------------------
  // MAIN GENERATION LOGIC (ENHANCED FOR QUALITY)
  // ---------------------------------------------------------------------------
  async generate(options: GenerationOptions): Promise<Uint8Array> {
    await this.initialize(options);
    const dim = this.dimensions[options.format];
    const { width, height } = this.page.getSize();
    
    // Calculate scaling for different formats
    const scale = this.calculateScale(options.format);
    const offsetX = dim.margins.left;
    const offsetY = dim.margins.top + 50; // Extra space for header
    
    // -----------------------------------------------------------------------
    // HEADER SECTION (Premium Design)
    // -----------------------------------------------------------------------
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
    
    // Separator line
    this.page.drawLine({
      start: { x: offsetX, y: height - 150 },
      end: { x: width - offsetX, y: height - 150 },
      thickness: 1,
      color: this.colors.borderDark,
      opacity: 0.5
    });
    
    // -----------------------------------------------------------------------
    // INSTRUCTIONS SECTION
    // -----------------------------------------------------------------------
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
    
    // -----------------------------------------------------------------------
    // CANVAS SECTIONS (Interactive)
    // -----------------------------------------------------------------------
    this.canvasSections.forEach((section, index) => {
      const x = offsetX + section.position.x;
      const y = offsetY + section.position.y;
      
      // Section container with shadow effect
      this.drawRoundedRect(x - 5, y - 5, section.size.width + 10, section.size.height + 10, {
        color: rgb(0.98, 0.98, 0.98),
        borderWidth: 0,
        fill: true
      });
      
      // Main section box
      this.drawRoundedRect(x, y, section.size.width, section.size.height, {
        borderColor: section.color,
        borderWidth: 2,
        fill: false,
        radius: 6
      });
      
      // Section header with colored background
      this.page.drawRectangle({
        x,
        y: this.page.getHeight() - y - 30,
        width: section.size.width,
        height: 30,
        color: section.color,
        borderWidth: 0
      });
      
      // Section title
      this.addText(section.title, x + 15, y + 20, {
        font: this.fonts.heading,
        size: 12 * scale,
        color: rgb(1, 1, 1), // White text on colored background
        maxWidth: section.size.width - 30
      });
      
      // Section description
      this.addText(section.description, x + 15, y + 45, {
        font: this.fonts.caption,
        size: 9 * scale,
        color: this.colors.muted,
        maxWidth: section.size.width - 30
      });
      
      // Create form fields for this section
      section.fields.forEach((field, fieldIndex) => {
        const fieldY = y + 75 + (fieldIndex * 25);
        
        // Field label
        this.addText(field.label + ':', x + 15, fieldY, {
          font: this.fonts.body,
          size: 9 * scale,
          color: this.colors.heading
        });
        
        // Form field
        this.createFormField(
          section.id,
          field.id,
          x + 80,
          fieldY - 20, // Adjust for PDF coordinate system
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
    
    // -----------------------------------------------------------------------
    // FOOTER SECTION
    // -----------------------------------------------------------------------
    const footerY = height - 40;
    
    // Confidentiality notice
    if (!options.isPreview) {
      this.addText('CONFIDENTIAL & PROPRIETARY', width / 2, footerY - 20, {
        font: this.fonts.caption,
        size: 8 * scale,
        color: this.colors.muted,
        align: 'center'
      });
    }
    
    // Watermark (subtle background)
    if (options.includeWatermark && !options.isPreview) {
      this.addText('Abraham of London • Legacy Architecture Suite', width / 2, height / 2, {
        font: this.fonts.italic,
        size: 48 * scale,
        color: rgb(0.9, 0.9, 0.9),
        align: 'center',
        opacity: 0.1
      });
    }
    
    // Generation info
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
    
    // -----------------------------------------------------------------------
    // FINALIZE DOCUMENT
    // -----------------------------------------------------------------------
    
    // Don't flatten - keep form fields interactive
    // this.form.flatten(); // REMOVED to keep fields fillable
    
    // Set document metadata
    this.doc.setTitle('Legacy Architecture Canvas');
    this.doc.setAuthor('Abraham of London');
    this.doc.setSubject('Sovereign Legacy Design Framework');
    this.doc.setKeywords(['legacy', 'architecture', 'canvas', 'framework', 'sovereign']);
    this.doc.setProducer('Abraham of London PDF Engine');
    this.doc.setCreator('Legacy Architecture Suite v1.0');
    this.doc.setCreationDate(new Date());
    this.doc.setModificationDate(new Date());
    
    // Save with compression for quality
    return await this.doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100
    });
  }

  private calculateScale(format: string): number {
    switch (format) {
      case 'A3': return 1.1; // Larger scale for big format
      case 'A4': return 1.0; // Standard scale
      case 'Letter': return 0.95; // Slightly smaller for US format
      default: return 1.0;
    }
  }

  // ---------------------------------------------------------------------------
  // PRODUCTION METHODS
  // ---------------------------------------------------------------------------
  async generateAllFormats(quality: 'draft' | 'standard' | 'premium' = 'premium'): Promise<void> {
    console.log('🚀 Generating Legacy Architecture Canvas PDFs...\n');
    
    const formats: Array<'A4' | 'Letter' | 'A3'> = ['A4', 'Letter', 'A3'];
    const outputDir = path.join(process.cwd(), 'public/assets/downloads');
    
    // Ensure output directory exists
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
        
        // Verify file quality
        const stats = fs.statSync(filepath);
        const fileSizeKB = (stats.size / 1024).toFixed(1);
        
        if (stats.size < 5000) { // Less than 5KB is suspicious for a quality PDF
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
    
    // Generate premium bundle if all formats succeeded
    const successfulFormats = results.filter(r => r.success);
    if (successfulFormats.length === formats.length) {
      await this.createPremiumBundle(outputDir, successfulFormats);
    }
    
    console.log('\n📊 Generation Summary:');
    results.forEach(result => {
      if (result.success) {
        console.log(`  ✅ ${result.format}: ${result.sizeKB} KB`);
      } else {
        console.log(`  ❌ ${result.format}: ${result.error}`);
      }
    });
    
    if (successfulFormats.length > 0) {
      console.log(`\n🎉 ${successfulFormats.length}/${formats.length} formats generated successfully!`);
    }
  }

  private async createPremiumBundle(outputDir: string, formats: any[]): Promise<void> {
    console.log('📦 Creating premium bundle...');
    
    try {
      const bundleDoc = await PDFDocument.create();
      
      // Premium cover page
      const coverPage = bundleDoc.addPage([595.28, 841.89]); // A4
      const font = await bundleDoc.embedFont(StandardFonts.HelveticaBold);
      const subFont = await bundleDoc.embedFont(StandardFonts.Helvetica);
      
      // Cover design
      coverPage.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: rgb(0.05, 0.05, 0.08), // Dark background
        borderWidth: 0
      });
      
      // Title with glow effect (multiple layers)
      coverPage.drawText('LEGACY ARCHITECTURE', {
        x: 50,
        y: 600,
        size: 36,
        font,
        color: rgb(1, 1, 1)
      });
      
      coverPage.drawText('CANVAS BUNDLE', {
        x: 50,
        y: 550,
        size: 36,
        font,
        color: rgb(0.8, 0.7, 1) // Light purple
      });
      
      // Content listing
      coverPage.drawText('This premium bundle contains:', {
        x: 50,
        y: 450,
        size: 16,
        font: subFont,
        color: rgb(0.9, 0.9, 0.9)
      });
      
      formats.forEach((format, i) => {
        coverPage.drawText(`• ${format.format}: ${format.filename}`, {
          x: 70,
          y: 400 - (i * 25),
          size: 12,
          font: subFont,
          color: rgb(0.8, 0.8, 0.8)
        });
      });
      
      // Save bundle
      const bundleBytes = await bundleDoc.save();
      const bundlePath = path.join(outputDir, 'legacy-architecture-premium-bundle.pdf');
      fs.writeFileSync(bundlePath, Buffer.from(bundleBytes));
      
      const stats = fs.statSync(bundlePath);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      
      console.log(`✅ Created premium bundle: ${bundlePath} (${fileSizeKB} KB)`);
      
    } catch (error: any) {
      console.error('❌ Failed to create premium bundle:', error.message);
    }
  }
}

// ---------------------------------------------------------------------------
// CLI INTERFACE
// ---------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  
  const generator = new LegacyCanvasGenerator();
  
  // Parse arguments
  const singleFormat = args.find(arg => arg.startsWith('--format='))?.split('=')[1];
  const quality = args.find(arg => arg.startsWith('--quality='))?.split('=')[1] || 'premium';
  const isSingle = args.includes('--single');
  
  if (singleFormat && ['A4', 'Letter', 'A3'].includes(singleFormat) && isSingle) {
    // Generate single format
    console.log(`🚀 Generating single format: ${singleFormat} (${quality} quality)`);
    
    generator.generate({
      format: singleFormat as 'A4' | 'Letter' | 'A3',
      includeWatermark: true,
      isPreview: false,
      quality: quality as 'draft' | 'standard' | 'premium'
    }).then(async (pdfBytes) => {
      const outputDir = path.join(process.cwd(), 'public/assets/downloads');
      
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const filename = `legacy-architecture-canvas-${singleFormat.toLowerCase()}-${quality}.pdf`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, Buffer.from(pdfBytes));
      
      const stats = fs.statSync(filepath);
      const fileSizeKB = (stats.size / 1024).toFixed(1);
      
      console.log(`✅ Generated: ${filename} (${fileSizeKB} KB)`);
      console.log(`📍 Saved to: ${filepath}`);
      
    }).catch(error => {
      console.error('❌ Generation failed:', error);
      process.exit(1);
    });
    
  } else {
    // Generate all formats with premium quality
    generator.generateAllFormats('premium').then(() => {
      console.log('\n✨ All generations completed!');
      process.exit(0);
    }).catch(error => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
  }
}

export { LegacyCanvasGenerator };