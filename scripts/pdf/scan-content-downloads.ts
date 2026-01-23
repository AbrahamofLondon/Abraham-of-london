// scripts/pdf/scan-content-downloads.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface ContentFile {
  id: string;
  filePath: string;
  frontmatter: Record<string, any>;
  content: string;
  stats: fs.Stats;
}

interface GeneratedPDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: string;
  format: string;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: string;
  formats: string[];
  fileSize: string;
  lastModified: string;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
}

export function scanContentDownloads(contentDir: string = 'content/downloads'): ContentFile[] {
  const contentFiles: ContentFile[] = [];
  
  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.name.endsWith('.mdx') || file.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const { data: frontmatter, content: markdownContent } = matter(content);
          const stats = fs.statSync(fullPath);
          
          // Generate ID from filename
          const id = path.basename(file.name, path.extname(file.name))
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          
          contentFiles.push({
            id,
            filePath: fullPath,
            frontmatter,
            content: markdownContent,
            stats
          });
          
          console.log(`✓ Found content file: ${file.name} -> ${id}`);
        } catch (error) {
          console.error(`✗ Error reading ${fullPath}:`, error);
        }
      }
    }
  }
  
  if (!fs.existsSync(contentDir)) {
    console.warn(`⚠ Content directory ${contentDir} does not exist`);
    return [];
  }
  
  console.log(`📁 Scanning content directory: ${contentDir}`);
  scanDirectory(contentDir);
  console.log(`✅ Found ${contentFiles.length} content files`);
  
  return contentFiles;
}

export function contentToPDFConfig(contentFile: ContentFile): GeneratedPDFConfig {
  const { id, frontmatter, stats } = contentFile;
  
  // Extract metadata from frontmatter or generate sensible defaults
  const title = frontmatter.title || id.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  const description = frontmatter.description || 
    frontmatter.excerpt || 
    `Download ${title} - A valuable resource from Abraham of London`;
  
  const category = frontmatter.category || 
    (id.includes('legacy') ? 'legacy' : 
     id.includes('leadership') ? 'leadership' : 
     id.includes('personal') ? 'personal-growth' : 'downloads');
  
  const tier = frontmatter.tier || 
    (id.includes('premium') ? 'architect' : 
     id.includes('member') ? 'member' : 'free');
  
  const type = frontmatter.type || 
    (id.includes('canvas') ? 'canvas' :
     id.includes('worksheet') ? 'worksheet' :
     id.includes('assessment') ? 'assessment' :
     id.includes('toolkit') ? 'tool' : 'framework');
  
  // Generate output path in public/downloads
  const outputPath = `/assets/downloads/${id}.pdf`;
  
  return {
    id,
    title,
    description,
    excerpt: frontmatter.excerpt || description.substring(0, 120) + '...',
    outputPath,
    type,
    format: 'PDF',
    isInteractive: frontmatter.isInteractive || false,
    isFillable: frontmatter.isFillable || false,
    category,
    tier,
    formats: frontmatter.formats || ['A4'],
    fileSize: '0 KB', // Will be updated after generation
    lastModified: stats.mtime.toISOString(),
    exists: false, // Will be true after PDF is generated
    tags: frontmatter.tags || [category, type],
    requiresAuth: frontmatter.requiresAuth || (tier !== 'free'),
    version: frontmatter.version || '1.0.0',
    priority: frontmatter.priority || 5,
    preload: frontmatter.preload || false,
    placeholder: frontmatter.placeholder,
    md5: frontmatter.md5
  };
}

export function generateRegistryFromContent(): GeneratedPDFConfig[] {
  const contentFiles = scanContentDownloads();
  return contentFiles.map(contentToPDFConfig);
}

export function saveGeneratedRegistry(configs: GeneratedPDFConfig[], outputPath: string) {
  const registryContent = `// scripts/pdf/pdf-registry.generated.ts
// AUTO-GENERATED - DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}

export type PDFTier = 'free' | 'member' | 'architect' | 'inner-circle';
export type PDFType = 'editorial' | 'framework' | 'academic' | 'strategic' | 'tool' | 'canvas' | 'worksheet' | 'assessment' | 'journal' | 'tracker' | 'bundle' | 'other';
export type PDFFormat = 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';

export interface PDFConfigGenerated {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: PDFType;
  format: PDFFormat;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: PDFTier;
  formats: string[];
  fileSize: string;
  lastModified: string;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
}

export const GENERATED_PDF_CONFIGS: PDFConfigGenerated[] = ${JSON.stringify(configs, null, 2)};

export const GENERATED_AT = "${new Date().toISOString()}";
export const GENERATED_COUNT = ${configs.length};

// Helper exports
export const ALL_GENERATED_IDS = ${JSON.stringify(configs.map(c => c.id))};
export const TIER_COUNTS = ${JSON.stringify(
  configs.reduce((acc, c) => {
    acc[c.tier] = (acc[c.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
)};
`;

  fs.writeFileSync(outputPath, registryContent, 'utf-8');
  console.log(`✅ Generated registry saved to: ${outputPath}`);
}

// CLI support
if (require.main === module) {
  console.log('🔄 Scanning content/downloads and generating registry...\n');
  
  const configs = generateRegistryFromContent();
  
  if (configs.length > 0) {
    saveGeneratedRegistry(configs, 'scripts/pdf/pdf-registry.generated.ts');
    console.log(`\n🎉 Generated ${configs.length} PDF configurations`);
    console.log('\n📊 Summary by tier:');
    const tierCounts = configs.reduce((acc, c) => {
      acc[c.tier] = (acc[c.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(tierCounts).forEach(([tier, count]) => {
      console.log(`  ${tier}: ${count}`);
    });
  } else {
    console.log('❌ No content files found. Please check your content/downloads directory.');
    process.exit(1);
  }
}