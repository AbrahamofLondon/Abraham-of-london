// scripts/fix-mdx-imports.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Fixing MDX comment syntax...');

// Move problematic file
const problematicFile = join(process.cwd(), 'content', '_downloads-registry.md');
if (existsSync(problematicFile)) {
  const archiveDir = join(process.cwd(), 'content', 'archive');
  if (!existsSync(archiveDir)) {
    mkdirSync(archiveDir, { recursive: true });
  }
  renameSync(
    problematicFile,
    join(archiveDir, '_downloads-registry.md')
  );
  console.log('✅ Moved _downloads-registry.md to archive');
}

// Fix problematic MDX comments in content files
const contentDirs = ['blog', 'downloads', 'events', 'books', 'resources'];
let totalFixed = 0;

contentDirs.forEach(dir => {
  const contentDir = join(process.cwd(), 'content', dir);
  if (!existsSync(contentDir)) return;

  const files = readdirSync(contentDir, { recursive: true })
    .filter(file => file.endsWith('.mdx') || file.endsWith('.md'));

  files.forEach(file => {
    const filePath = join(contentDir, file);
    let content = readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Remove ALL nested HTML comments completely
    // This regex matches patterns like: <!-- <!-- <!-- <ResourcesCTA /> --> --> -->
    // and removes the entire nested comment structure
    content = content.replace(/<!--\s*([\s\S]*?)-->/g, (match, innerContent) => {
      // If there are more HTML comments inside, this is a nested comment that needs complete removal
      if (innerContent.includes('<!--') || innerContent.includes('-->')) {
        return ''; // Remove the entire nested comment block
      }
      // For simple non-nested comments, convert to MDX style
      return `{/* ${innerContent.trim()} */}`;
    });

    // Additional cleanup: Remove any remaining problematic comment patterns
    content = content.replace(/<\!--/g, ''); // Remove any malformed opening tags
    content = content.replace(/-->/g, '');   // Remove any malformed closing tags
    
    // Clean up extra whitespace that might result from removals
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      writeFileSync(filePath, content);
      totalFixed++;
      console.log(`✅ Fixed comments in: ${file}`);
    }
  });
});

console.log(`✅ Fixed ${totalFixed} MDX files with comment syntax issues`);
console.log('🎉 MDX comment issues resolved!');