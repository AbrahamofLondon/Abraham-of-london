#!/usr/bin/env node
/**
 * Enterprise-Grade Legacy Architecture Canvas Generator
 * Version: 3.0.0
 * Author: Abraham of London
 * Description: Production-ready PDF generator with form fields, validation, and multi-format support
 */

import { PDFDocument, rgb, StandardFonts, PDFTextField, PDFCheckBox, PDFDropdown, PDFOptionList } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// ENTERPRISE CONFIGURATION
// =============================================================================
const ENTERPRISE_CONFIG = {
  COMPANY: {
    name: 'Abraham of London',
    website: 'https://abrahamoflondon.com',
    email: 'legacy@abrahamoflondon.com',
    phone: '+44 20 7123 4567'
  },
  
  SECURITY: {
    watermark: true,
    passwordProtection: false,
    encryptionLevel: 'standard' as const,
    maxFileSizeMB: 50
  },
  
  PERFORMANCE: {
    maxRetries: 3,
    timeoutMs: 30000,
    concurrentGenerations: 1,
    memoryLimitMB: 512
  },
  
  QUALITY: {
    defaultDpi: 300,
    compressionLevel: 'medium' as const,
    fontEmbedding: true,
    colorProfile: 'CMYK'
  }
};

// =============================================================================
// TYPES & INTERFACES
// =============================================================================
export interface GenerationOptions {
  format: 'A4' | 'Letter' | 'A3' | 'A2';
  includeWatermark: boolean;
  isPreview: boolean;
  quality: 'draft' | 'standard' | 'premium' | 'enterprise';
  encryption?: {
    password: string;
    permissions: {
      printing: 'lowResolution' | 'highResolution' | 'none';
      modifying: boolean;
      copying: boolean;
      annotating: boolean;
      fillingForms: boolean;
      accessibility: boolean;
      assembling: boolean;
    };
  };
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
  };
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
  safeArea: {
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
  fields: CanvasField[];
  validations?: FieldValidation[];
}

export interface CanvasField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'signature' | 'checkbox' | 'date' | 'dropdown' | 'number' | 'email';
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[]; // For dropdown/select fields
  validation?: FieldValidation;
  helpText?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
}

export interface FieldValidation {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  required?: boolean;
  customMessage?: string;
}

export interface GenerationResult {
  success: boolean;
  filepath?: string;
  size?: number;
  duration?: number;
  format: string;
  quality: string;
  error?: string;
  warnings?: string[];
  metadata?: {
    pageCount: number;
    fieldCount: number;
    compressionRatio: number;
    checksum: string;
  };
}

// =============================================================================
// ENTERPRISE CANVAS GENERATOR CLASS
// =============================================================================
export class EnterpriseLegacyCanvasGenerator {
  private doc: PDFDocument | null = null;
  private page: any = null;
  private fonts: Record<string, any> = {};
  private form: any = null;
  private currentFieldIndex = 0;
  private warnings: string[] = [];
  private startTime: number = 0;
  
  private readonly dimensions: Record<string, PageDimensions> = {
    A4: { 
      width: 595.28, 
      height: 841.89,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      safeArea: { top: 90, right: 90, bottom: 90, left: 90 }
    },
    Letter: { 
      width: 612, 
      height: 792,
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      safeArea: { top: 90, right: 90, bottom: 90, left: 90 }
    },
    A3: { 
      width: 841.89, 
      height: 1190.55,
      margins: { top: 90, right: 90, bottom: 90, left: 90 },
      safeArea: { top: 120, right: 120, bottom: 120, left: 120 }
    },
    A2: { 
      width: 1190.55, 
      height: 1683.78,
      margins: { top: 120, right: 120, bottom: 120, left: 120 },
      safeArea: { top: 150, right: 150, bottom: 150, left: 150 }
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
        {
          id: 'purpose',
          label: 'Core Purpose',
          type: 'textarea',
          required: true,
          placeholder: 'The fundamental reason for your existence...',
          helpText: 'What is your ultimate purpose? What legacy do you want to leave?',
          rows: 4,
          maxLength: 1000
        },
        {
          id: 'values',
          label: 'Guiding Values',
          type: 'textarea', 
          required: true,
          placeholder: 'Principles that guide every decision...',
          helpText: 'What values are non-negotiable in your life and work?',
          rows: 4,
          maxLength: 1000
        },
        {
          id: 'vision',
          label: 'Long-term Vision',
          type: 'textarea',
          required: true,
          placeholder: 'The world you aim to create...',
          helpText: 'Describe your 100-year vision',
          rows: 4,
          maxLength: 1000
        }
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
        {
          id: 'financial',
          label: 'Financial Capital',
          type: 'textarea',
          required: true,
          placeholder: 'Financial resources and investments...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'social', 
          label: 'Social Capital',
          type: 'textarea',
          required: true,
          placeholder: 'Networks, relationships, influence...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'cultural',
          label: 'Cultural Capital', 
          type: 'textarea',
          required: true,
          placeholder: 'Knowledge, education, taste...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'spiritual',
          label: 'Spiritual Capital',
          type: 'textarea',
          required: true, 
          placeholder: 'Faith, purpose, transcendence...',
          rows: 3,
          maxLength: 500
        }
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
        {
          id: 'family',
          label: 'Family Structures',
          type: 'textarea',
          required: true,
          placeholder: 'Family governance, traditions, values...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'business',
          label: 'Business Entities',
          type: 'textarea',
          required: true,
          placeholder: 'Companies, partnerships, holding structures...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'philanthropy',
          label: 'Philanthropic Vehicles',
          type: 'textarea',
          required: true,
          placeholder: 'Foundations, trusts, charitable initiatives...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'intellectual',
          label: 'Intellectual Property',
          type: 'textarea',
          required: true,
          placeholder: 'Patents, trademarks, copyrights, trade secrets...',
          rows: 3,
          maxLength: 500
        }
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
        {
          id: 'ethical',
          label: 'Ethical Boundaries',
          type: 'textarea',
          required: true,
          placeholder: 'Moral principles and red lines...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'risk',
          label: 'Risk Management',
          type: 'textarea',
          required: true,
          placeholder: 'Risk assessment and mitigation strategies...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'succession',
          label: 'Succession Planning',
          type: 'textarea',
          required: true,
          placeholder: 'Leadership transition and continuity plans...',
          rows: 3,
          maxLength: 500
        },
        {
          id: 'accountability',
          label: 'Accountability Systems',
          type: 'textarea',
          required: true,
          placeholder: 'Oversight, checks and balances, audits...',
          rows: 3,
          maxLength: 500
        }
      ]
    }
  ];

  // ===========================================================================
  // ENTERPRISE INITIALIZATION
  // ===========================================================================
  async initialize(options: GenerationOptions): Promise<void> {
    this.startTime = Date.now();
    this.warnings = [];
    
    try {
      // Create PDF document with enhanced options
      this.doc = await PDFDocument.create({
        updateMetadata: true,
        throwOnInvalidObject: true,
        objectsPerTick: 100
      });
      
      // Load enterprise fonts
      this.fonts = {
        heading: await this.doc.embedFont(StandardFonts.HelveticaBold),
        subheading: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
        body: await this.doc.embedFont(StandardFonts.Helvetica),
        italic: await this.doc.embedFont(StandardFonts.HelveticaOblique),
        caption: await this.doc.embedFont(StandardFonts.HelveticaOblique),
        monospace: await this.doc.embedFont(StandardFonts.Courier)
      };
      
      const dim = this.dimensions[options.format];
      
      // Create page with enterprise settings
      this.page = this.doc.addPage([dim.width, dim.height]);
      this.form = this.doc.getForm();
      
      // Set document metadata
      this.setEnterpriseMetadata(options);
      
      // Draw premium background based on quality
      this.drawEnterpriseBackground(dim, options.quality);
      
    } catch (error: any) {
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  // ===========================================================================
  // ENTERPRISE DRAWING UTILITIES
  // ===========================================================================
  private drawEnterpriseBackground(dim: PageDimensions, quality: string): void {
    switch (quality) {
      case 'enterprise':
        this.drawGradientMeshBackground(dim);
        break;
      case 'premium':
        this.drawGradientBackground(dim);
        break;
      case 'standard':
        this.page.drawRectangle({
          x: 0,
          y: 0,
          width: dim.width,
          height: dim.height,
          color: this.colors.paper,
          borderWidth: 0
        });
        break;
      default: // draft
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

  private drawGradientMeshBackground(dim: PageDimensions): void {
    const gridSize = 20;
    const cols = Math.ceil(dim.width / gridSize);
    const rows = Math.ceil(dim.height / gridSize);
    
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const x = col * gridSize;
        const y = row * gridSize;
        const intensity = 0.95 + (Math.sin(x * 0.01) * Math.cos(y * 0.01) * 0.05);
        
        this.page.drawRectangle({
          x,
          y,
          width: gridSize,
          height: gridSize,
          color: rgb(intensity, intensity, intensity),
          borderWidth: 0
        });
      }
    }
  }

  private drawGradientBackground(dim: PageDimensions): void {
    const gradientSteps = 8;
    const stepHeight = dim.height / gradientSteps;
    
    for (let i = 0; i < gradientSteps; i++) {
      const y = i * stepHeight;
      const intensity = 0.98 - (i * 0.02);
      
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

  // ===========================================================================
  // ENTERPRISE FORM FIELD CREATION
  // ===========================================================================
  private createEnterpriseFormField(
    sectionId: string, 
    field: CanvasField, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): void {
    try {
      const pageHeight = this.page.getHeight();
      const drawY = pageHeight - y - height;
      const fieldId = `${sectionId}_${field.id}_${this.currentFieldIndex++}`;
      
      let pdfField;
      
      switch (field.type) {
        case 'textarea':
        case 'text':
        case 'email':
        case 'number':
          pdfField = this.form.createTextField(fieldId);
          pdfField.addToPage(this.page, {
            x,
            y: drawY,
            width,
            height: field.type === 'textarea' ? height * (field.rows || 3) : height,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 1,
            backgroundColor: rgb(1, 1, 1),
            textColor: rgb(0, 0, 0)
          });
          
          pdfField.setFontSize(10);
          pdfField.setFont(this.fonts.body);
          
          if (field.placeholder) {
            pdfField.setText(field.placeholder);
          }
          
          if (field.type === 'textarea' || field.multiline) {
            pdfField.enableMultiline();
            pdfField.enableScrolling();
          }
          
          if (field.maxLength) {
            pdfField.setMaxLength(field.maxLength);
          }
          
          if (field.required) {
            pdfField.setRequired(true);
            this.page.drawText('*', {
              x: x - 8,
              y: drawY + height - 12,
              size: 12,
              font: this.fonts.heading,
              color: this.colors.warning
            });
          }
          break;
          
        case 'checkbox':
          pdfField = this.form.createCheckBox(fieldId);
          pdfField.addToPage(this.page, {
            x,
            y: drawY,
            width: 12,
            height: 12
          });
          break;
          
        case 'dropdown':
          if (field.options && field.options.length > 0) {
            pdfField = this.form.createDropdown(fieldId);
            pdfField.addToPage(this.page, {
              x,
              y: drawY,
              width,
              height
            });
            
            field.options.forEach((option, index) => {
              pdfField.addOption(option);
              if (index === 0) {
                pdfField.select(option);
              }
            });
          }
          break;
          
        default:
          this.warnings.push(`Unsupported field type: ${field.type} for ${fieldId}`);
          return;
      }
      
      // Add field name for accessibility
      if (pdfField) {
        (pdfField as any).setName(field.label.replace(/\s+/g, '_'));
        
        if (field.helpText) {
          (pdfField as any).setHelpText(field.helpText);
        }
      }
      
    } catch (error: any) {
      this.warnings.push(`Failed to create field ${field.id}: ${error.message}`);
    }
  }

  // ===========================================================================
  // ENTERPRISE METADATA MANAGEMENT
  // ===========================================================================
  private setEnterpriseMetadata(options: GenerationOptions): void {
    const metadata = options.metadata || {};
    
    this.doc.setTitle(metadata.title || 'Legacy Architecture Canvas');
    this.doc.setAuthor(metadata.author || ENTERPRISE_CONFIG.COMPANY.name);
    this.doc.setSubject(metadata.subject || 'Sovereign Legacy Design Framework');
    this.doc.setKeywords(metadata.keywords || ['legacy', 'architecture', 'canvas', 'framework', 'sovereign', 'enterprise']);
    this.doc.setProducer(metadata.producer || `${ENTERPRISE_CONFIG.COMPANY.name} PDF Engine v3.0`);
    this.doc.setCreator(metadata.creator || 'Legacy Architecture Suite Enterprise Edition');
    this.doc.setCreationDate(new Date());
    this.doc.setModificationDate(new Date());
    
    // Set additional metadata
    (this.doc as any).setLanguage('en-GB');
    (this.doc as any).setTrapped('False');
  }

  // ===========================================================================
  // ENTERPRISE GENERATION LOGIC
  // ===========================================================================
  async generate(options: GenerationOptions): Promise<Uint8Array> {
    console.log(`🚀 Starting enterprise generation (${options.format}, ${options.quality})...`);
    
    await this.initialize(options);
    const dim = this.dimensions[options.format];
    const { width, height } = this.page.getSize();
    
    const scale = this.calculateScale(options.format);
    const offsetX = dim.margins.left;
    const offsetY = dim.margins.top + 50;
    
    // Draw enterprise header
    this.drawEnterpriseHeader(width, height, scale, options);
    
    // Draw instructions
    this.drawInstructions(offsetX, 180, width, scale);
    
    // Draw all canvas sections
    await this.drawCanvasSections(offsetX, offsetY, scale, options.quality);
    
    // Draw enterprise footer
    this.drawEnterpriseFooter(width, height, dim, scale, options);
    
    // Apply encryption if requested
    if (options.encryption) {
      await this.applyEncryption(options.encryption);
    }
    
    // Generate final PDF
    const pdfBytes = await this.doc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 100,
      updateFieldAppearances: true
    });
    
    const duration = Date.now() - this.startTime;
    console.log(`✅ Generation completed in ${duration}ms`);
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warnings during generation`);
    }
    
    return pdfBytes;
  }

  private drawEnterpriseHeader(width: number, height: number, scale: number, options: GenerationOptions): void {
    // Main title
    this.addText('LEGACY ARCHITECTURE CANVAS', width / 2, 80, {
      font: this.fonts.heading,
      size: 32 * scale,
      color: this.colors.primaryDark,
      align: 'center'
    });
    
    // Subtitle
    this.addText('Enterprise-Grade Framework for Sovereign Design', width / 2, 120, {
      font: this.fonts.subheading,
      size: 14 * scale,
      color: this.colors.muted,
      align: 'center'
    });
    
    // Version and quality badge
    this.addText(`v3.0 • ${options.quality.toUpperCase()} • ${options.format}`, width / 2, 150, {
      font: this.fonts.caption,
      size: 10 * scale,
      color: this.colors.caption,
      align: 'center'
    });
    
    // Separator line
    this.page.drawLine({
      start: { x: 72, y: height - 170 },
      end: { x: width - 72, y: height - 170 },
      thickness: 2,
      color: this.colors.borderDark,
      opacity: 0.3
    });
  }

  private drawInstructions(x: number, y: number, width: number, scale: number): void {
    this.addText('ENTERPRISE INSTRUCTIONS:', x, y, {
      font: this.fonts.heading,
      size: 12 * scale,
      color: this.colors.heading
    });
    
    const instructions = [
      '1. Complete each section with strategic foresight and precision',
      '2. Consider multi-generational impact (25, 50, 100-year horizons)',
      '3. Review quarterly and update annually as legacy evolves',
      '4. Store completed canvas in secure, encrypted legacy vault',
      '5. Share with trusted advisors for review and accountability'
    ];
    
    instructions.forEach((instruction, i) => {
      this.addText(instruction, x + 20, y + 30 + (i * 25), {
        font: this.fonts.body,
        size: 10 * scale,
        color: this.colors.body,
        maxWidth: width - (x * 2) - 40
      });
    });
  }

  private async drawCanvasSections(offsetX: number, offsetY: number, scale: number, quality: string): Promise<void> {
    for (const section of this.canvasSections) {
      const x = offsetX + section.position.x;
      const y = offsetY + section.position.y;
      
      // Draw section background
      this.drawSectionBackground(x, y, section, quality);
      
      // Draw section title bar
      this.drawSectionTitle(x, y, section, scale);
      
      // Draw section description
      this.addText(section.description, x + 15, y + 45, {
        font: this.fonts.caption,
        size: 9 * scale,
        color: this.colors.muted,
        maxWidth: section.size.width - 30
      });
      
      // Draw all fields in this section
      await this.drawSectionFields(x, y, section, scale);
    }
  }

  private drawSectionBackground(x: number, y: number, section: CanvasSection, quality: string): void {
    // Background shadow
    if (quality === 'enterprise' || quality === 'premium') {
      this.page.drawRectangle({
        x: x + 3,
        y: this.page.getHeight() - y - section.size.height - 3,
        width: section.size.width,
        height: section.size.height,
        color: rgb(0, 0, 0),
        opacity: 0.1,
        borderWidth: 0
      });
    }
    
    // Main background
    this.page.drawRectangle({
      x,
      y: this.page.getHeight() - y - section.size.height,
      width: section.size.width,
      height: section.size.height,
      color: rgb(0.98, 0.98, 0.98),
      borderColor: section.color,
      borderWidth: 2
    });
    
    // Title background
    this.page.drawRectangle({
      x,
      y: this.page.getHeight() - y - 30,
      width: section.size.width,
      height: 30,
      color: section.color,
      borderWidth: 0
    });
  }

  private drawSectionTitle(x: number, y: number, section: CanvasSection, scale: number): void {
    this.addText(section.title, x + 15, y + 20, {
      font: this.fonts.heading,
      size: 12 * scale,
      color: rgb(1, 1, 1),
      maxWidth: section.size.width - 30
    });
  }

  private async drawSectionFields(x: number, y: number, section: CanvasSection, scale: number): Promise<void> {
    section.fields.forEach((field, fieldIndex) => {
      const fieldY = y + 75 + (fieldIndex * 25);
      
      // Field label
      this.addText(`${field.label}:`, x + 15, fieldY, {
        font: this.fonts.body,
        size: 9 * scale,
        color: this.colors.heading
      });
      
      // Create form field
      this.createEnterpriseFormField(
        section.id,
        field,
        x + 80,
        fieldY - 20,
        section.size.width - 95,
        15
      );
      
      // Help text (if any)
      if (field.helpText && scale > 0.9) {
        this.addText(field.helpText, x + 80, fieldY - 5, {
          font: this.fonts.caption,
          size: 7 * scale,
          color: this.colors.caption,
          maxWidth: section.size.width - 95
        });
      }
    });
  }

  private drawEnterpriseFooter(width: number, height: number, dim: PageDimensions, scale: number, options: GenerationOptions): void {
    const footerY = height - 40;
    
    // Confidential notice
    if (!options.isPreview) {
      this.addText('CONFIDENTIAL & PROPRIETARY • ENTERPRISE EDITION', width / 2, footerY - 20, {
        font: this.fonts.caption,
        size: 8 * scale,
        color: this.colors.muted,
        align: 'center'
      });
    }
    
    // Enterprise watermark
    if (options.includeWatermark && !options.isPreview) {
      this.addText(`${ENTERPRISE_CONFIG.COMPANY.name} • Legacy Architecture Suite`, width / 2, height / 2, {
        font: this.fonts.italic,
        size: 48 * scale,
        color: rgb(0.95, 0.95, 0.95),
        align: 'center',
        opacity: 0.05
      });
    }
    
    // Generation info
    const infoText = [
      `Generated: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`,
      `Format: ${options.format} | Quality: ${options.quality}`,
      `Version: 3.0.0 | Fields: ${this.currentFieldIndex}`,
      `${ENTERPRISE_CONFIG.COMPANY.website}`
    ].join(' • ');
    
    this.addText(infoText, width - dim.margins.right, footerY, {
      font: this.fonts.caption,
      size: 6 * scale,
      color: this.colors.caption,
      align: 'right'
    });
  }

  private async applyEncryption(encryption: GenerationOptions['encryption']): Promise<void> {
    if (!encryption) return;
    
    try {
      // Note: pdf-lib doesn't support encryption directly
      // In production, you'd use a different library or post-process
      this.warnings.push('PDF encryption requires post-processing with specialized tools');
    } catch (error: any) {
      this.warnings.push(`Encryption failed: ${error.message}`);
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
      opacity?: number;
    } = {}
  ): void {
    const { 
      size = 11, 
      font = this.fonts.body, 
      color = this.colors.body,
      align = 'left',
      maxWidth,
      lineHeight = size * 1.2,
      opacity = 1
    } = options;
    
    const pageHeight = this.page.getHeight();
    const drawY = pageHeight - y;
    
    // Simple text wrapping
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
          color,
          opacity
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
      color,
      opacity
    });
  }

  private calculateScale(format: string): number {
    switch (format) {
      case 'A2': return 1.3;
      case 'A3': return 1.1;
      case 'A4': return 1.0;
      case 'Letter': return 0.95;
      default: return 1.0;
    }
  }

  // ===========================================================================
  // ENTERPRISE PRODUCTION METHODS
  // ===========================================================================
  async generateEnterprise(
    format: 'A4' | 'Letter' | 'A3' | 'A2' = 'A4',
    quality: 'draft' | 'standard' | 'premium' | 'enterprise' = 'enterprise'
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      const pdfBytes = await this.generate({
        format,
        includeWatermark: true,
        isPreview: false,
        quality,
        metadata: {
          title: `Legacy Architecture Canvas - ${format} (${quality})`,
          author: ENTERPRISE_CONFIG.COMPANY.name,
          subject: 'Enterprise Legacy Design Framework',
          keywords: ['legacy', 'architecture', 'enterprise', 'framework', 'canvas'],
          creator: 'Enterprise Canvas Generator v3.0',
          producer: `${ENTERPRISE_CONFIG.COMPANY.name} PDF Engine`
        }
      });
      
      // Calculate checksum
      const checksum = crypto.createHash('sha256').update(pdfBytes).digest('hex');
      
      return {
        success: true,
        size: pdfBytes.length,
        duration: Date.now() - startTime,
        format,
        quality,
        warnings: this.warnings,
        metadata: {
          pageCount: 1,
          fieldCount: this.currentFieldIndex,
          compressionRatio: Math.round((pdfBytes.length / (1024 * 1024)) * 100) / 100, // MB
          checksum: checksum.substring(0, 16) // First 16 chars of SHA256
        }
      };
      
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        format,
        quality,
        duration: Date.now() - startTime,
        warnings: this.warnings
      };
    }
  }

  async generateAndSave(
    options: GenerationOptions,
    outputPath: string,
    retryCount = 0
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    try {
      const result = await this.generateEnterprise(options.format, options.quality);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Ensure output directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Generate PDF
      const pdfBytes = await this.generate(options);
      
      // Save to file
      fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
      
      // Verify file was written
      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        if (retryCount < ENTERPRISE_CONFIG.PERFORMANCE.maxRetries) {
          return this.generateAndSave(options, outputPath, retryCount + 1);
        }
        throw new Error('Generated file is empty after retries');
      }
      
      // Update result with file info
      return {
        ...result,
        filepath: outputPath,
        size: stats.size
      };
      
    } catch (error: any) {
      // Retry logic
      if (retryCount < ENTERPRISE_CONFIG.PERFORMANCE.maxRetries) {
        console.log(`Retrying generation (${retryCount + 1}/${ENTERPRISE_CONFIG.PERFORMANCE.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.generateAndSave(options, outputPath, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        format: options.format,
        quality: options.quality,
        duration: Date.now() - startTime,
        warnings: this.warnings
      };
    }
  }

  async generateAllFormats(
    quality: 'draft' | 'standard' | 'premium' | 'enterprise' = 'enterprise'
  ): Promise<GenerationResult[]> {
    console.log('🚀 Starting enterprise multi-format generation...\n');
    
    const formats: Array<'A4' | 'Letter' | 'A3' | 'A2'> = ['A4', 'Letter', 'A3'];
    const outputDir = path.join(process.cwd(), 'public/assets/downloads/enterprise');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results: GenerationResult[] = [];
    
    for (const format of formats) {
      console.log(`🎨 Generating ${format} format (${quality} quality)...`);
      
      const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}.pdf`;
      const filepath = path.join(outputDir, filename);
      
      try {
        const result = await this.generateAndSave(
          {
            format,
            includeWatermark: true,
            isPreview: false,
            quality
          },
          filepath
        );
        
        results.push(result);
        
        if (result.success && result.size) {
          const sizeMB = (result.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ ${format}: ${sizeMB} MB | ${result.duration}ms`);
          
          if (result.warnings && result.warnings.length > 0) {
            console.log(`   ⚠️  ${result.warnings.length} warnings`);
          }
        } else {
          console.log(`❌ ${format}: ${result.error}`);
        }
        
      } catch (error: any) {
        console.error(`💥 ${format}: ${error.message}`);
        results.push({
          success: false,
          error: error.message,
          format,
          quality
        });
      }
    }
    
    // Generate summary report
    this.generateSummaryReport(results, outputDir);
    
    return results;
  }

  private generateSummaryReport(results: GenerationResult[], outputDir: string): void {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log('\n📊 ENTERPRISE GENERATION SUMMARY');
    console.log('════════════════════════════════════════════════════════════════════');
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    
    if (successful.length > 0) {
      const totalSizeMB = successful.reduce((sum, r) => sum + (r.size || 0), 0) / (1024 * 1024);
      const avgSizeMB = totalSizeMB / successful.length;
      const avgDuration = successful.reduce((sum, r) => sum + (r.duration || 0), 0) / successful.length;
      
      console.log(`\n📈 Statistics:`);
      console.log(`   Total size: ${totalSizeMB.toFixed(2)} MB`);
      console.log(`   Average size: ${avgSizeMB.toFixed(2)} MB per file`);
      console.log(`   Average generation time: ${avgDuration.toFixed(0)} ms`);
      
      // Create manifest file
      const manifest = {
        generated: new Date().toISOString(),
        totalFiles: successful.length,
        totalSizeMB: totalSizeMB.toFixed(2),
        files: successful.map(r => ({
          filename: path.basename(r.filepath || ''),
          format: r.format,
          quality: r.quality,
          sizeMB: ((r.size || 0) / (1024 * 1024)).toFixed(2),
          duration: r.duration,
          checksum: r.metadata?.checksum
        }))
      };
      
      const manifestPath = path.join(outputDir, 'generation-manifest.json');
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`\n📄 Manifest saved: ${manifestPath}`);
    }
    
    if (failed.length > 0) {
      console.log('\n🔍 Failure Analysis:');
      failed.forEach(f => {
        console.log(`   ${f.format}: ${f.error}`);
      });
    }
    
    console.log('════════════════════════════════════════════════════════════════════');
    
    if (successful.length > 0) {
      console.log(`\n🎉 Enterprise generation completed!`);
      console.log(`📁 Files saved to: ${outputDir}`);
    } else {
      console.log('\n💥 All formats failed to generate!');
    }
  }
}

// =============================================================================
// ENTERPRISE PRODUCTION UTILITY FUNCTION
// =============================================================================
export async function generateEnterpriseLegacyCanvas(
  format: 'A4' | 'Letter' | 'A3' | 'A2' = 'A4',
  quality: 'draft' | 'standard' | 'premium' | 'enterprise' = 'enterprise',
  outputDir?: string
): Promise<GenerationResult> {
  const generator = new EnterpriseLegacyCanvasGenerator();
  
  const finalOutputDir = outputDir || path.join(process.cwd(), 'public/assets/downloads/enterprise');
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
async function main() {
  console.log('✨ ENTERPRISE LEGACY CANVAS GENERATOR v3.0 ✨');
  console.log('════════════════════════════════════════════════════════════════════');
  
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const generator = new EnterpriseLegacyCanvasGenerator();
  
  try {
    switch (command) {
      case 'single':
        const format = (args[1] as any) || 'A4';
        const quality = (args[2] as any) || 'enterprise';
        
        console.log(`🎯 Generating single format: ${format} (${quality})`);
        
        const result = await generator.generateEnterprise(format, quality);
        
        if (result.success) {
          console.log(`\n✅ Generation successful!`);
          console.log(`📊 Size: ${(result.size! / 1024).toFixed(1)} KB`);
          console.log(`⏱️  Duration: ${result.duration}ms`);
          console.log(`🔢 Fields: ${result.metadata?.fieldCount}`);
          console.log(`🔐 Checksum: ${result.metadata?.checksum}`);
        } else {
          console.log(`\n❌ Generation failed: ${result.error}`);
        }
        break;
        
      case 'all':
      default:
        const qualityAll = (args[1] as any) || 'enterprise';
        await generator.generateAllFormats(qualityAll);
        break;
    }
    
    process.exit(0);
    
  } catch (error: any) {
    console.error('💥 Fatal error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}