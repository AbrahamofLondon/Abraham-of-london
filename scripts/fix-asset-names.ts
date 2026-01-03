// scripts/fix-asset-names.mjs
// Quick fix for immediate filename mismatches
import fs from 'fs/promises';
import path from 'path';

const fixes = [
  // Canon images: vol- → volume-
  {
    from: 'public/assets/images/canon/vol-i-teaching-edition.jpg',
    to: 'public/assets/images/canon/volume-i-teaching-edition.jpg'
  },
  {
    from: 'public/assets/images/canon/vol-ii-governance-and-formation.jpg',
    to: 'public/assets/images/canon/volume-ii-governance-and-formation.jpg'
  },
  {
    from: 'public/assets/images/canon/vol-ii-teaching-edition.jpg',
    to: 'public/assets/images/canon/volume-ii-teaching-edition.jpg'
  },
  {
    from: 'public/assets/images/canon/vol-iii-teaching-edition.jpg',
    to: 'public/assets/images/canon/volume-iii-teaching-edition.jpg'
  },
  {
    from: 'public/assets/images/canon/vol-iv-teaching-edition.jpg',
    to: 'public/assets/images/canon/volume-iv-teaching-edition.jpg'
  },
  
  // Scripture track: remove spaces and caps
  {
    from: 'public/assets/downloads/Scripture Track - John 14.pdf',
    to: 'public/assets/downloads/scripture-track-john14.pdf'
  },
];

const copies = [
  // Create missing onepager-template from existing file
  {
    from: 'public/assets/images/downloads/board-investor-one-pager-template.jpg',
    to: 'public/assets/images/downloads/onepager-template.jpg'
  },
  
  // Create canon-index-cover from resources
  {
    from: 'public/assets/images/canon/canon-resources.jpg',
    to: 'public/assets/images/canon/canon-index-cover.jpg'
  },
  
  // Fix canon-resources.jpeg → .jpg
  {
    from: 'public/assets/images/canon/canon-resources.jpg',
    to: 'public/assets/images/canon-resources.jpeg'
  },
];

async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function renameFile(from, to) {
  try {
    if (await fileExists(from)) {
      await fs.rename(from, to);
      console.log(`✅ Renamed: ${path.basename(from)} → ${path.basename(to)}`);
      return true;
    } else {
      console.log(`⏭️  Source not found: ${from}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to rename ${from}:`, error.message);
    return false;
  }
}

async function copyFile(from, to) {
  try {
    if (await fileExists(to)) {
      console.log(`⏭️  Already exists: ${path.basename(to)}`);
      return true;
    }
    
    if (await fileExists(from)) {
      await fs.copyFile(from, to);
      console.log(`✅ Copied: ${path.basename(from)} → ${path.basename(to)}`);
      return true;
    } else {
      console.log(`⏭️  Source not found: ${from}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Failed to copy ${from}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing asset filenames...\n');
  
  let renamed = 0;
  let copied = 0;
  let skipped = 0;
  let errors = 0;
  
  // Process renames
  console.log('📝 Renaming files...');
  for (const { from, to } of fixes) {
    const success = await renameFile(from, to);
    if (success) renamed++;
    else if (await fileExists(to)) skipped++;
    else errors++;
  }
  
  console.log('\n📋 Copying files...');
  for (const { from, to } of copies) {
    const success = await copyFile(from, to);
    if (success) copied++;
    else skipped++;
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Renamed: ${renamed}`);
  console.log(`  📋 Copied: ${copied}`);
  console.log(`  ⏭️  Skipped: ${skipped}`);
  console.log(`  ❌ Errors: ${errors}`);
  
  if (errors > 0) {
    console.log('\n⚠️  Some files could not be processed.');
    console.log('Run the full PDF generation to create missing files.');
  } else {
    console.log('\n✅ All filename fixes applied successfully!');
  }
}

main().catch(console.error);
