import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixAllIssues() {
  console.log('🔧 Fixing build issues...\n');
  
  // 1. Fix generate-pdfs.tsx hashbang
  const generatePdfsPath = path.resolve(__dirname, '../scripts/generate-pdfs.tsx');
  if (fs.existsSync(generatePdfsPath)) {
    let content = fs.readFileSync(generatePdfsPath, 'utf8');
    content = content.replace(/^#!\/usr\/bin\/env tsx\n/, '');
    fs.writeFileSync(generatePdfsPath, content);
    console.log('✅ Fixed hashbang in generate-pdfs.tsx');
  }
  
  // 2. Create missing generate-legacy-canvas.tsx
  const legacyCanvasPath = path.resolve(__dirname, '../scripts/generate-legacy-canvas.tsx');
  if (!fs.existsSync(legacyCanvasPath)) {
    const legacyCanvasContent = `import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export class LegacyCanvasGenerator {
  async generate(options: { format: string; includeWatermark: boolean; isPreview: boolean }) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    
    let page;
    if (options.format === 'A4') {
      page = pdfDoc.addPage([595.28, 841.89]);
    } else if (options.format === 'Letter') {
      page = pdfDoc.addPage([612, 792]);
    } else {
      page = pdfDoc.addPage([841.89, 1190.55]);
    }
    
    const { width, height } = page.getSize();
    
    page.drawText('Legacy Architecture Canvas', {
      x: 50,
      y: height - 50,
      size: 24,
      color: rgb(0, 0, 0.5),
    });
    
    if (options.includeWatermark) {
      page.drawText('Abraham of London', {
        x: width / 2 - 50,
        y: 30,
        size: 10,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
      });
    }
    
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
}

export default LegacyCanvasGenerator;`;
    
    fs.writeFileSync(legacyCanvasPath, legacyCanvasContent);
    console.log('✅ Created missing generate-legacy-canvas.tsx');
  }
  
  // 3. Create contentlayer config
  const contentlayerConfigPath = path.resolve(__dirname, '../contentlayer.config.ts');
  if (!fs.existsSync(contentlayerConfigPath)) {
    const contentlayerContent = `import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: \`**/*.mdx\`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    date: { type: 'date', required: true },
  },
  computedFields: {
    url: { type: 'string', resolve: (post) => \`/posts/\${post._raw.flattenedPath}\` },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post],
});`;
    
    fs.writeFileSync(contentlayerConfigPath, contentlayerContent);
    console.log('✅ Created contentlayer.config.ts');
  }
  
  console.log('\n✅ All fixes applied. Try running: pnpm run build');
}

fixAllIssues().catch(console.error);