/* eslint-disable no-console */
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LegacyCanvasPDFGenerator {
  constructor() {
    this.doc = null;
    this.page = null;
    this.fonts = {};
    this.colors = {
      primary: rgb(124 / 255, 58 / 255, 237 / 255), // #7C3AED
      secondary: rgb(16 / 255, 185 / 255, 129 / 255), // #10B981
      accent: rgb(59 / 255, 130 / 255, 246 / 255), // #3B82F6
      warning: rgb(239 / 255, 68 / 255, 68 / 255), // #EF4444
      neutral: rgb(107 / 255, 114 / 255, 128 / 255), // #6B7280
      background: rgb(249 / 255, 250 / 255, 251 / 255), // #F9FAFB
      border: rgb(229 / 255, 231 / 255, 235 / 255), // #E5E7EB
      text: rgb(17 / 255, 24 / 255, 39 / 255), // #111827
    };
    
    this.dimensions = {
      A4: { width: 595.28, height: 841.89 },
      A3: { width: 841.89, height: 1190.55 },
      Letter: { width: 612, height: 792 },
    };
  }

  async initialize(format = 'A4') {
    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);
    
    // Embed fonts
    this.fonts.regular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fonts.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.fonts.italic = await this.doc.embedFont(StandardFonts.HelveticaOblique);
    this.fonts.boldItalic = await this.doc.embedFont(StandardFonts.HelveticaBoldOblique);
    
    // Add page
    const dimensions = this.dimensions[format] || this.dimensions.A4;
    this.page = this.doc.addPage([dimensions.width, dimensions.height]);
    
    return this;
  }

  // Helper methods
  addText(text, x, y, options = {}) {
    const {
      size = 11,
      font = this.fonts.regular,
      color = this.colors.text,
      maxWidth = null,
      lineHeight = 1.2,
      align = 'left',
    } = options;

    this.page.drawText(text, {
      x,
      y: this.page.getHeight() - y,
      size,
      font,
      color,
      maxWidth,
      lineHeight,
    });
  }

  addRectangle(x, y, width, height, options = {}) {
    const {
      color = this.colors.primary,
      borderColor = this.colors.border,
      borderWidth = 1,
      fill = true,
    } = options;

    if (fill) {
      this.page.drawRectangle({
        x,
        y: this.page.getHeight() - y - height,
        width,
        height,
        color,
      });
    }

    if (borderWidth > 0) {
      this.page.drawRectangle({
        x,
        y: this.page.getHeight() - y - height,
        width,
        height,
        borderColor,
        borderWidth,
      });
    }
  }

  addLine(x1, y1, x2, y2, options = {}) {
    const { color = this.colors.border, width = 1 } = options;
    this.page.drawLine({
      start: { x: x1, y: this.page.getHeight() - y1 },
      end: { x: x2, y: this.page.getHeight() - y2 },
      thickness: width,
      color,
    });
  }

  // Create fillable text field
  createTextField(x, y, width, height, fieldName, options = {}) {
    const {
      defaultValue = '',
      fontSize = 10,
      multiline = false,
      required = false,
    } = options;

    const form = this.doc.getForm();
    const field = form.createTextField(fieldName);
    
    field.addToPage(this.page, {
      x,
      y: this.page.getHeight() - y - height,
      width,
      height,
    });
    
    field.setText(defaultValue);
    field.setFontSize(fontSize);
    field.enableMultiline(multiline);
    field.enableScrolling();
    
    if (required) {
      field.markAsRequired();
    }
    
    return field;
  }

  createCheckbox(x, y, size, fieldName, options = {}) {
    const { defaultValue = false } = options;
    const form = this.doc.getForm();
    const field = form.createCheckBox(fieldName);
    
    field.addToPage(this.page, {
      x,
      y: this.page.getHeight() - y - size,
      width: size,
      height: size,
    });
    
    if (defaultValue) {
      field.check();
    }
    
    return field;
  }

  createDropdown(x, y, width, height, fieldName, options = {}) {
    const { choices = [], defaultValue = '' } = options;
    const form = this.doc.getForm();
    const field = form.createDropdown(fieldName);
    
    field.addToPage(this.page, {
      x,
      y: this.page.getHeight() - y - height,
      width,
      height,
    });
    
    choices.forEach(choice => field.addOption(choice));
    
    if (choices.includes(defaultValue)) {
      field.select(defaultValue);
    }
    
    return field;
  }

  // Legacy Canvas specific sections
  createHeader() {
    const { width } = this.page.getSize();
    
    // Title
    this.addText('THE LEGACY ARCHITECTURE CANVAS', width / 2, 50, {
      font: this.fonts.bold,
      size: 24,
      color: this.colors.primary,
      align: 'center',
    });
    
    this.addText('Beyond Bequest. The Framework for Intentional Endurance.', width / 2, 80, {
      font: this.fonts.italic,
      size: 14,
      color: this.colors.neutral,
      align: 'center',
    });
    
    // Divider line
    this.addLine(50, 100, width - 50, 100, {
      color: this.colors.primary,
      width: 2,
    });
    
    // ProTip box
    this.addRectangle(50, 120, width - 100, 60, {
      color: rgb(245 / 255, 243 / 255, 255 / 255), // Light purple background
      borderColor: this.colors.primary,
      borderWidth: 1,
      fill: true,
    });
    
    this.addText('⚡ PREMIUM INSIGHT', 65, 135, {
      font: this.fonts.bold,
      size: 10,
      color: this.colors.primary,
    });
    
    this.addText('This is not a document about death. It is the operating system for a living legacy.', 65, 155, {
      font: this.fonts.regular,
      size: 9,
      color: this.colors.text,
      maxWidth: width - 130,
    });
    
    return 200; // Return next y position
  }

  createArchitectureProcess(yStart) {
    const { width } = this.page.getSize();
    const sectionHeight = 350;
    
    // Section title
    this.addText('THE ARCHITECTURE PROCESS', width / 2, yStart, {
      font: this.fonts.bold,
      size: 18,
      color: this.colors.text,
      align: 'center',
    });
    
    this.addText('This structured framework transforms abstract values into executable design:', 50, yStart + 30, {
      font: this.fonts.regular,
      size: 11,
      color: this.colors.neutral,
    });
    
    // Create process boxes
    const processes = [
      {
        title: '1. THE SOVEREIGN THESIS',
        desc: 'Define the core, non-negotiable principle of your legacy.',
        color: this.colors.primary,
      },
      {
        title: '2. THE CAPITAL MATRIX',
        desc: 'Map human, intellectual, social & financial capitals.',
        color: this.colors.secondary,
      },
      {
        title: '3. INSTITUTIONS & STEWARDSHIP',
        desc: 'Design formal/informal institutions that steward each capital.',
        color: this.colors.accent,
      },
      {
        title: '4. RISK ARCHITECTURE',
        desc: 'Identify failure modes and engineer governance guardrails.',
        color: this.colors.warning,
      },
    ];
    
    const boxWidth = (width - 120) / 2;
    const boxHeight = 120;
    
    processes.forEach((process, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      const x = 50 + col * (boxWidth + 20);
      const y = yStart + 60 + row * (boxHeight + 20);
      
      // Process box
      this.addRectangle(x, y, boxWidth, boxHeight, {
        borderColor: process.color,
        borderWidth: 2,
        fill: false,
      });
      
      // Title
      this.addText(process.title, x + 15, y + 20, {
        font: this.fonts.bold,
        size: 12,
        color: process.color,
      });
      
      // Description
      this.addText(process.desc, x + 15, y + 45, {
        font: this.fonts.regular,
        size: 10,
        color: this.colors.text,
        maxWidth: boxWidth - 30,
      });
      
      // Fillable field
      this.createTextField(x + 15, y + 70, boxWidth - 30, 30, `process_${index + 1}`, {
        multiline: true,
        fontSize: 9,
      });
    });
    
    return yStart + sectionHeight;
  }

  createFrameworkDiagram(yStart) {
    const { width } = this.page.getSize();
    const diagramSize = 300;
    const centerX = width / 2;
    const centerY = yStart + diagramSize / 2;
    
    // Section title
    this.addText('THE COMPLETE FRAMEWORK', width / 2, yStart - 20, {
      font: this.fonts.bold,
      size: 18,
      color: this.colors.text,
      align: 'center',
    });
    
    // Draw circular diagram
    const radius = 120;
    
    // Draw outer circle
    this.page.drawCircle({
      x: centerX,
      y: this.page.getHeight() - centerY,
      size: radius,
      borderColor: this.colors.primary,
      borderWidth: 2,
    });
    
    // Draw inner circles
    [90, 60, 30].forEach((r, i) => {
      this.page.drawCircle({
        x: centerX,
        y: this.page.getHeight() - centerY,
        size: r,
        borderColor: this.colors.border,
        borderWidth: 0.5,
      });
    });
    
    // Add framework components around the circle
    const components = [
      { name: 'Sovereign Thesis', angle: 0 },
      { name: 'Capital Matrix', angle: 72 },
      { name: 'Institutions', angle: 144 },
      { name: 'Rituals', angle: 216 },
      { name: 'Guardrails', angle: 288 },
    ];
    
    components.forEach((component, i) => {
      const angle = (component.angle * Math.PI) / 180;
      const x = centerX + (radius - 30) * Math.cos(angle);
      const y = centerY + (radius - 30) * Math.sin(angle);
      
      // Draw connecting line
      this.addLine(centerX, centerY, x, y, {
        color: this.colors.border,
        width: 1,
      });
      
      // Draw component box
      this.addRectangle(x - 40, y - 15, 80, 30, {
        borderColor: this.colors.primary,
        borderWidth: 1,
        fill: true,
        color: rgb(1, 1, 1, 0.95),
      });
      
      this.addText(component.name, x, y + 5, {
        font: this.fonts.bold,
        size: 8,
        color: this.colors.primary,
        align: 'center',
      });
    });
    
    // Center text
    this.addText('LEGACY CORE', centerX, centerY, {
      font: this.fonts.bold,
      size: 14,
      color: this.colors.primary,
      align: 'center',
    });
    
    this.addText('Generative Principle', centerX, centerY + 15, {
      font: this.fonts.regular,
      size: 10,
      color: this.colors.neutral,
      align: 'center',
    });
    
    return yStart + diagramSize + 40;
  }

  createWhatThisProduces(yStart) {
    const { width } = this.page.getSize();
    
    this.addText('WHAT THIS PRODUCES', width / 2, yStart, {
      font: this.fonts.bold,
      size: 16,
      color: this.colors.text,
      align: 'center',
    });
    
    const outcomes = [
      'A Living Legacy Constitution – Not a static document, but a dynamic operating system for your values',
      'Intergenerational Governance Blueprint – Clear roles, responsibilities, and decision-rights for stewards',
      'Risk Mitigation Framework – Proactive design against the 7 classic failure modes of legacy',
      'Stewardship Rituals – Quarterly and annual review cadences that institutionalize reflection and adaptation',
    ];
    
    outcomes.forEach((outcome, i) => {
      const y = yStart + 30 + i * 40;
      
      // Bullet point
      this.page.drawCircle({
        x: 60,
        y: this.page.getHeight() - y - 5,
        size: 3,
        color: this.colors.primary,
      });
      
      // Text
      this.addText(outcome, 70, y, {
        font: this.fonts.regular,
        size: 10,
        color: this.colors.text,
        maxWidth: width - 90,
      });
    });
    
    return yStart + 200;
  }

  createImplementationGuide(yStart) {
    const { width } = this.page.getSize();
    const sectionHeight = 100;
    
    // Box background
    this.addRectangle(50, yStart, width - 100, sectionHeight, {
      color: rgb(240 / 255, 253 / 255, 244 / 255), // Light green
      borderColor: this.colors.secondary,
      borderWidth: 1,
      fill: true,
    });
    
    // Icon
    this.addText('🛠️', 65, yStart + 20, {
      font: this.fonts.regular,
      size: 16,
      color: this.colors.secondary,
    });
    
    // Title
    this.addText('IMPLEMENTATION GUIDANCE', 90, yStart + 20, {
      font: this.fonts.bold,
      size: 11,
      color: this.colors.secondary,
    });
    
    // Text
    this.addText('Begin with the Sovereign Thesis alone. Sit with it for one week. The clarity—or friction—it generates will illuminate the necessity of every subsequent component.', 90, yStart + 40, {
      font: this.fonts.regular,
      size: 9,
      color: this.colors.text,
      maxWidth: width - 120,
    });
    
    return yStart + sectionHeight + 30;
  }

  createCompanionResources(yStart) {
    const { width } = this.page.getSize();
    
    this.addText('COMPANION RESOURCES', width / 2, yStart, {
      font: this.fonts.bold,
      size: 16,
      color: this.colors.text,
      align: 'center',
    });
    
    const resources = [
      'The Steward\'s Brief – Communication templates for family/trustee alignment',
      'Guardrail Design Workshop – Video walkthrough of risk mitigation strategies',
      'Intergenerational Dialogue Guide – Facilitating meaningful legacy conversations',
      'Family Council Operating Manual – Procedures for effective multi-generational governance',
    ];
    
    resources.forEach((resource, i) => {
      const y = yStart + 30 + i * 25;
      this.addText(`• ${resource}`, 60, y, {
        font: this.fonts.regular,
        size: 10,
        color: this.colors.neutral,
      });
    });
    
    return yStart + 150;
  }

  createSignatureSection(yStart) {
    const { width } = this.page.getSize();
    
    // Divider line
    this.addLine(50, yStart, width - 50, yStart, {
      color: this.colors.border,
      width: 1,
    });
    
    this.addText('Steward\'s Commitment', 60, yStart + 20, {
      font: this.fonts.bold,
      size: 12,
      color: this.colors.primary,
    });
    
    // Signature fields
    this.createTextField(60, yStart + 40, 200, 30, 'signature_name', {
      defaultValue: 'Name',
      fontSize: 11,
    });
    
    this.createTextField(280, yStart + 40, 200, 30, 'signature_date', {
      defaultValue: new Date().toLocaleDateString(),
      fontSize: 11,
    });
    
    // Footer
    this.addText('© Abraham of London • Legacy Architecture Suite • v1.0', width / 2, yStart + 90, {
      font: this.fonts.regular,
      size: 8,
      color: this.colors.neutral,
      align: 'center',
    });
    
    this.addText('This document is part of the Architect-tier resource collection', width / 2, yStart + 105, {
      font: this.fonts.italic,
      size: 7,
      color: this.colors.neutral,
      align: 'center',
    });
  }

  async generateCanvas(format = 'A4') {
    await this.initialize(format);
    
    let currentY = 50;
    
    currentY = this.createHeader();
    currentY = this.createArchitectureProcess(currentY);
    currentY = this.createFrameworkDiagram(currentY);
    currentY = this.createWhatThisProduces(currentY);
    currentY = this.createImplementationGuide(currentY);
    currentY = this.createCompanionResources(currentY);
    this.createSignatureSection(currentY);
    
    // Flatten form for final output (keeps form fields)
    const form = this.doc.getForm();
    form.flatten();
    
    return this.doc;
  }

  async saveToFile(filename) {
    const pdfBytes = await this.doc.save();
    fs.writeFileSync(filename, pdfBytes);
    return filename;
  }
}

export default LegacyCanvasPDFGenerator;
