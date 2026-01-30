// scripts/fix-shorts-yaml.js - COMPLETE VERSION
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const contentDir = path.join(__dirname, '..', 'content');
const shortsDir = path.join(contentDir, 'shorts');

console.log('🔧 COMPREHENSIVE YAML fix for all content...');

function fixAllYAMLFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  let totalFixed = 0;

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    
    if (item.isDirectory()) {
      // Recursively fix subdirectories
      totalFixed += fixAllYAMLFiles(fullPath);
    } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const originalContent = content;
      
      // 🔥 CRITICAL FIX 1: Fix ALL tag patterns from your error logs
      // Pattern: tags: "- tag1"\n  - tag2
      content = content.replace(
        /^tags:\s*"(-[^"]+)"(?:\s*\n\s*(-[^\n]+))*/gm,
        (match, firstTag, restOfLine) => {
          let result = 'tags:\n  ' + firstTag;
          if (restOfLine) {
            // Handle multiple tags on subsequent lines
            const lines = restOfLine.split('\n').map(line => line.trim()).filter(line => line.startsWith('-'));
            lines.forEach(line => {
              result += '\n  ' + line;
            });
          }
          return result;
        }
      );

      // 🔥 CRITICAL FIX 2: Fix theme field without quotes
      content = content.replace(/^theme:\s*([^\n"']+)(?=\n|$)/gm, 'theme: "$1"');

      // 🔥 CRITICAL FIX 3: Fix ALL nested quotes in titles
      content = content.replace(/title:\s*"([^"\\]*(?:\\.[^"\\]*)*)"(\s*)$/gm, 
        (match, title, whitespace) => {
          const escapedTitle = title.replace(/"/g, '\\"');
          return `title: "${escapedTitle}"${whitespace}`;
        }
      );

      // 🔥 CRITICAL FIX 4: Fix any malformed frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        let frontmatter = frontmatterMatch[1];
        
        // Fix each line individually
        const lines = frontmatter.split('\n');
        const fixedLines = lines.map(line => {
          // Match YAML key: value
          const yamlMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*?)\s*$/);
          if (!yamlMatch) return line;
          
          const [, indent, key, value] = yamlMatch;
          
          // Skip empty values or already properly formatted
          if (!value || value.startsWith('"') || value.startsWith("'") || 
              value.startsWith('[') || value === 'true' || value === 'false' ||
              /^-?\d+(\.\d+)?$/.test(value)) {
            return line;
          }
          
          // Fix values with internal quotes
          if (value.includes('"') && !value.startsWith('"')) {
            return `${indent}${key}: "${value.replace(/"/g, '\\"')}"`;
          }
          
          // Quote simple unquoted strings
          return `${indent}${key}: "${value}"`;
        });
        
        frontmatter = fixedLines.join('\n');
        content = content.replace(/^---\n[\s\S]*?\n---/, `---\n${frontmatter}\n---`);
      }

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        totalFixed++;
        console.log(`   ✅ Fixed: ${path.relative(contentDir, fullPath)}`);
      }
    }
  }
  
  return totalFixed;
}

// Fix ALL content directories, not just shorts
const directories = ['shorts', 'blog', 'books', 'canon', 'downloads', 'events', 'prints', 'resources', 'strategy'];
let totalFilesFixed = 0;

directories.forEach(dir => {
  const dirPath = path.join(contentDir, dir);
  totalFilesFixed += fixAllYAMLFiles(dirPath);
});

console.log(`\n🎉 Fixed ${totalFilesFixed} files across all content directories.`);