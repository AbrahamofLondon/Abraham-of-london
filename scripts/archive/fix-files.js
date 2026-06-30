// fix-files.js - CORRECT VERSION
const fs = require('fs');
const path = require('path');

console.log('🚀 FIXING ALL PROBLEMATIC FILES:\n');

const contentDir = path.join(process.cwd(), 'content');

const failingFiles = [
  'canon/canon-campaign.mdx',
  'canon/canon-introduction-letter.mdx',
  'canon/canon-master-index-preview.mdx',
  'canon/volume-i-foundations-of-purpose.mdx',
  'canon/volume-ii-governance-and-formation.mdx',
  'canon/volume-ii-teaching-edition.mdx',
  'canon/volume-iii-teaching-edition.mdx',
  'canon/volume-iv-teaching-edition.mdx',
  'canon/volume-x-filename.mdx',
  'canon/volume-x-the-arc-of-future-civilisation.mdx',
  'prints/entrepreneur-operating-pack.mdx',
  'prints/fatherhood-standards-card.mdx',
  'prints/leadership-playbook.mdx',
  'prints/mentorship-starter-kit.mdx',
  'prints/standards-brief.mdx',
  'prints/weekly-operating-rhythm.mdx',
  'resources/brotherhood-starter-kit.mdx',
  'resources/canon-builders-rule-of-life.mdx',
  'resources/canon-campaign.mdx',
  'resources/canon-council-table-agenda.mdx',
  'resources/canon-household-charter.mdx',
  'resources/canon-reading-plan-year-one.mdx',
  'resources/destiny-mapping-worksheet.mdx',
  'resources/fatherhood-impact-framework.mdx',
  'resources/getting-started.mdx',
  'resources/institutional-health-scorecard.mdx',
  'resources/leadership-standards-blueprint.mdx',
  'resources/multi-generational-legacy-ledger.mdx',
  'resources/purpose-alignment-checklist.mdx',
  'resources/sample-strategy.mdx',
  'resources/strategic-frameworks.mdx'
];

let fixedCount = 0;
let skippedCount = 0;

failingFiles.forEach(relativePath => {
  const filePath = path.join(contentDir, relativePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️ ${relativePath}: Skipped (file not found)`);
    skippedCount++;
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changes = [];
    
    // FIX 1: Ensure draft is false
    if (content.includes('draft: true') || content.includes("draft: 'true'") || content.includes('draft: "true"')) {
      content = content.replace(/draft:\s*(true|"true"|'true')/gi, 'draft: false');
      changes.push('fixed draft');
    }
    
    // FIX 2: Add missing title from filename
    if (!content.includes('title:')) {
      const filename = path.basename(relativePath, '.mdx')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      const firstDashEnd = content.indexOf('---') + 3;
      content = content.substring(0, firstDashEnd) + `\ntitle: "${filename}"` + content.substring(firstDashEnd);
      changes.push('added title');
    }
    
    // FIX 3: Add missing date
    if (!content.includes('date:')) {
      const titleMatch = content.match(/title:\s*["'][^"']+["']/);
      if (titleMatch) {
        const insertPos = titleMatch.index + titleMatch[0].length;
        content = content.substring(0, insertPos) + '\ndate: "2024-01-01"' + content.substring(insertPos);
      } else {
        const firstDashEnd = content.indexOf('---') + 3;
        content = content.substring(0, firstDashEnd) + '\ndate: "2024-01-01"' + content.substring(firstDashEnd);
      }
      changes.push('added date');
    }
    
    // FIX 4: Add missing slug
    if (!content.includes('slug:')) {
      const slug = path.basename(relativePath, '.mdx');
      const titleMatch = content.match(/title:\s*["'][^"']+["']/);
      if (titleMatch) {
        const insertPos = titleMatch.index + titleMatch[0].length;
        content = content.substring(0, insertPos) + `\nslug: "${slug}"` + content.substring(insertPos);
        changes.push('added slug');
      }
    }
    
    // FIX 5: Check date format
    const dateMatch = content.match(/date:\s*["']?([^"'\n]+)["']?/);
    if (dateMatch && !/^\d{4}-\d{2}-\d{2}$/.test(dateMatch[1])) {
      console.log(`⚠️  ${relativePath}: Invalid date: "${dateMatch[1]}" (should be YYYY-MM-DD)`);
    }
    
    // Save if changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${relativePath}: ${changes.join(', ')}`);
      fixedCount++;
    } else {
      console.log(`⏭️ ${relativePath}: Already correct`);
      skippedCount++;
    }
    
  } catch (error) {
    console.log(`💥 ${relativePath}: Error - ${error.message}`);
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`  Fixed: ${fixedCount} files`);
console.log(`  Skipped: ${skippedCount} files`);
console.log(`  Total: ${failingFiles.length} files`);
console.log(`\n🎯 DONE! Run: pnpm build`);