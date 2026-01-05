// scripts/pdf/mdx-pdf-converter/config.ts
import path from 'path';

export interface DocumentTier {
  slug: string;
  displayName: string;
  accessLevel: 'architect' | 'member' | 'free' | 'all';
  generatePdf: boolean;
  generateFillable: boolean;
  formats: ('A4' | 'Letter' | 'A3')[];
  quality: ('draft' | 'standard' | 'premium' | 'enterprise')[];
}

export interface MdxDocument {
  mdxPath: string;
  pdfName: string;
  displayName: string;
  category: string;
  description: string;
  thumbnail?: string;
  tiers: DocumentTier[];
  metadata?: Record<string, any>;
}

export const PDF_CONFIG = {
  // Output directories
  outputDir: path.join(process.cwd(), 'public/assets/downloads'),
  enterpriseDir: path.join(process.cwd(), 'public/assets/downloads/enterprise'),
  archivedDir: path.join(process.cwd(), 'public/assets/downloads/archived'),
  
  // Templates
  templateDir: path.join(process.cwd(), 'lib/pdf/templates'),
  
  // Defaults
  defaultQuality: 'premium' as const,
  defaultFormats: ['A4', 'Letter', 'A3'] as const,
  
  // Styling
  colors: {
    primary: '#1a365d',
    secondary: '#2d3748',
    accent: '#4299e1',
    success: '#38a169',
    warning: '#d69e2e',
    danger: '#e53e3e'
  },
  
  // Fonts
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
    code: 'Courier',
    accent: 'Times-Roman'
  },
  
  // Margins (in points)
  margins: {
    A4: { top: 72, bottom: 72, left: 72, right: 72 },
    Letter: { top: 72, bottom: 72, left: 72, right: 72 },
    A3: { top: 100, bottom: 100, left: 100, right: 100 }
  },
  
  // Watermarks
  watermarks: {
    draft: 'DRAFT',
    confidential: 'CONFIDENTIAL',
    tier: {
      architect: 'ARCHITECT TIER',
      member: 'MEMBER ACCESS',
      free: 'FREE VERSION'
    }
  }
};

// Document registry - maps MDX files to PDF configuration
export const DOCUMENT_REGISTRY: MdxDocument[] = [
  {
    mdxPath: 'content/downloads/legacy-architecture-canvas.mdx',
    pdfName: 'legacy-architecture-canvas',
    displayName: 'Legacy Architecture Canvas',
    category: 'Frameworks',
    description: 'Strategic legacy planning framework',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter', 'A3'], quality: ['premium', 'enterprise'] },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter', 'A3'], quality: ['premium'] },
      { slug: 'free', displayName: 'Free', accessLevel: 'free', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'] }
    ]
  },
  {
    mdxPath: 'content/downloads/entrepreneur-operating-pack.mdx',
    pdfName: 'entrepreneur-operating-pack',
    displayName: 'Entrepreneur Operating Pack',
    category: 'Business',
    description: 'Complete entrepreneur operating system',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter'], quality: ['premium', 'enterprise'] },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['premium'] }
    ]
  },
  {
    mdxPath: 'content/downloads/leadership-playbook.mdx',
    pdfName: 'leadership-playbook',
    displayName: 'Leadership Playbook',
    category: 'Leadership',
    description: 'Comprehensive leadership guide',
    tiers: [
      { slug: 'architect', displayName: 'Architect', accessLevel: 'architect', generatePdf: true, generateFillable: true, formats: ['A4', 'Letter'], quality: ['premium', 'enterprise'] },
      { slug: 'member', displayName: 'Member', accessLevel: 'member', generatePdf: true, generateFillable: false, formats: ['A4'], quality: ['standard'] }
    ]
  },
  // Add more documents here...
];

// Helper to auto-discover MDX files
export function discoverMdxFiles(): string[] {
  const contentDir = path.join(process.cwd(), 'content/downloads');
  const fs = require('fs');
  
  if (!fs.existsSync(contentDir)) return [];
  
  return fs.readdirSync(contentDir)
    .filter((file: string) => file.endsWith('.mdx'))
    .map((file: string) => path.join(contentDir, file));
}