// scripts/pdf/file-pdf-converter/config.ts
import path from 'path';

export type FileType = 'mdx' | 'xlsx' | 'pptx' | 'docx' | 'pdf' | 'txt' | 'csv';
export type TierSlug = 'architect' | 'member' | 'free';
export type Format = 'A4' | 'Letter' | 'A3';
export type Quality = 'draft' | 'standard' | 'premium' | 'enterprise';

export interface DocumentTier {
  slug: TierSlug;
  displayName: string;
  accessLevel: TierSlug | 'all';
  generatePdf: boolean;
  generateFillable: boolean;
  formats: Format[];
  quality: Quality[];
  requiresConversion?: boolean; // true for non-PDF files
}

export interface FileDocument {
  sourcePath: string;
  pdfName: string;
  displayName: string;
  category: string;
  description: string;
  fileType: FileType;
  thumbnail?: string;
  tiers: DocumentTier[];
  metadata?: Record<string, any>;
  conversionOptions?: {
    excel?: {
      includeCharts: boolean;
      includeFormulas: boolean;
      sheetSelection?: string[]; // specific sheets to include
    };
    powerpoint?: {
      includeNotes: boolean;
      includeHiddenSlides: boolean;
      slidesPerPage: 1 | 2 | 4 | 6; // How many slides per PDF page
    };
    mdx?: {
      includeFrontmatter: boolean;
      includeComponents: boolean;
      maxContentLength?: number;
    };
  };
}

export const PDF_CONFIG = {
  // Source directories
  sourceDirs: {
    content: path.join(process.cwd(), 'content/downloads'),
    libPdf: path.join(process.cwd(), 'lib/pdf'),
    assets: path.join(process.cwd(), 'public/assets')
  },
  
  // Output directories
  outputDir: path.join(process.cwd(), 'public/assets/downloads'),
  enterpriseDir: path.join(process.cwd(), 'public/assets/downloads/enterprise'),
  archivedDir: path.join(process.cwd(), 'public/assets/downloads/archived'),
  tempDir: path.join(process.cwd(), '.temp/pdf-conversion'),
  
  // External tools (for office file conversion)
  externalTools: {
    libreoffice: 'soffice', // or specify full path
    pandoc: 'pandoc',
    imagemagick: 'convert'
  },
  
  // Defaults
  defaultQuality: 'premium' as Quality,
  defaultFormats: ['A4', 'Letter', 'A3'] as Format[],
  
  // File type handlers
  fileTypeHandlers: {
    mdx: { converter: 'mdx', extensions: ['.mdx', '.md'] },
    xlsx: { converter: 'excel', extensions: ['.xlsx', '.xls', '.csv'] },
    pptx: { converter: 'powerpoint', extensions: ['.pptx', '.ppt'] },
    docx: { converter: 'word', extensions: ['.docx', '.doc'] },
    pdf: { converter: 'copy', extensions: ['.pdf'] },
    txt: { converter: 'text', extensions: ['.txt', '.rtf'] }
  }
};

// File Registry - Configure how each file should be processed
export const FILE_REGISTRY: FileDocument[] = [
  // MDX Files
  {
    sourcePath: 'content/downloads/legacy-architecture-canvas.mdx',
    pdfName: 'legacy-architecture-canvas',
    displayName: 'Legacy Architecture Canvas',
    category: 'Frameworks',
    description: 'Strategic legacy planning framework',
    fileType: 'mdx',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter', 'A3'], quality: ['premium', 'enterprise'] },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter', 'A3'], quality: ['premium'] },
      { slug: 'free', displayName: 'Free', accessLevel: 'free', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'] }
    ],
    conversionOptions: {
      mdx: { includeFrontmatter: true, includeComponents: true }
    }
  },
  {
    sourcePath: 'content/downloads/entrepreneur-operating-pack.mdx',
    pdfName: 'entrepreneur-operating-pack',
    displayName: 'Entrepreneur Operating Pack',
    category: 'Business',
    description: 'Complete entrepreneur operating system',
    fileType: 'mdx',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter'], quality: ['premium', 'enterprise'] },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['premium'] }
    ]
  },
  
  // Excel Files
  {
    sourcePath: 'content/downloads/board-decision-log-template.xlsx',
    pdfName: 'board-decision-log-template',
    displayName: 'Board Decision Log Template',
    category: 'Templates',
    description: 'Excel template for board decision tracking',
    fileType: 'xlsx',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: false, formats: ['A4', 'Letter'], quality: ['premium'], requiresConversion: true },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'], requiresConversion: true }
    ],
    conversionOptions: {
      excel: { includeCharts: true, includeFormulas: false, sheetSelection: ['Sheet1'] }
    }
  },
  
  // PowerPoint Files
  {
    sourcePath: 'content/downloads/operating-cadence-pack.pptx',
    pdfName: 'operating-cadence-pack',
    displayName: 'Operating Cadence Pack',
    category: 'Presentations',
    description: 'PowerPoint presentation on operating rhythms',
    fileType: 'pptx',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['premium'], requiresConversion: true },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'], requiresConversion: true }
    ],
    conversionOptions: {
      powerpoint: { includeNotes: false, includeHiddenSlides: false, slidesPerPage: 1 }
    }
  },
  
  // Existing PDFs (copy as-is)
  {
    sourcePath: 'lib/pdf/decision-log-template.pdf',
    pdfName: 'decision-log-template',
    displayName: 'Decision Log Template',
    category: 'Templates',
    description: 'PDF version of decision log',
    fileType: 'pdf',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['premium'], requiresConversion: false },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'], requiresConversion: false }
    ]
  }
];

// Helper to discover all files
export function discoverAllFiles(): FileDocument[] {
  const fs = require('fs');
  const discovered: FileDocument[] = [];
  
  // Scan content/downloads
  const contentDir = PDF_CONFIG.sourceDirs.content;
  if (fs.existsSync(contentDir)) {
    const files = fs.readdirSync(contentDir);
    
    files.forEach((file: string) => {
      const filePath = path.join(contentDir, file);
      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      // Determine file type
      let fileType: FileType = 'txt';
      if (ext === '.mdx' || ext === '.md') fileType = 'mdx';
      else if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') fileType = 'xlsx';
      else if (ext === '.pptx' || ext === '.ppt') fileType = 'pptx';
      else if (ext === '.docx' || ext === '.doc') fileType = 'docx';
      else if (ext === '.pdf') fileType = 'pdf';
      
      // Check if already in registry
      const alreadyRegistered = FILE_REGISTRY.some(doc => 
        path.basename(doc.sourcePath) === file
      );
      
      if (!alreadyRegistered) {
        discovered.push({
          sourcePath: filePath,
          pdfName: baseName,
          displayName: formatDisplayName(baseName),
          category: 'Uncategorized',
          description: `Auto-discovered ${fileType.toUpperCase()} file`,
          fileType,
          tiers: [
            { slug: 'free', displayName: 'Free', accessLevel: 'free', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'], requiresConversion: fileType !== 'pdf' }
          ]
        });
      }
    });
  }
  
  return discovered;
}

function formatDisplayName(baseName: string): string {
  return baseName
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}