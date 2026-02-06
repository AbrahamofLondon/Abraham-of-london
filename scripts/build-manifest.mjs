import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '../content');
const PUBLIC_DIR = path.join(__dirname, '../public'); // Path to your static assets
const OUTPUT_FILE = path.join(__dirname, '../vault-manifest.json');

function getFiles(dir, extensions = ['.mdx', '.md']) {
  if (!fs.existsSync(dir)) return [];
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  return results;
}

// 1. Process Intelligence Briefs (MDX/MD)
const briefAssets = getFiles(CONTENT_DIR, ['.mdx', '.md']).map(filePath => {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContent);
  const relativePath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
  const cleanPath = relativePath.replace(/\.(mdx|md)$/, '');
  
  return {
    title: data.title || path.basename(cleanPath),
    slug: `/vault/${cleanPath}`,
    category: relativePath.split('/')[0],
    type: 'brief'
  };
});

// 2. Process Downloadable Assets (PDFs)
// This ensures /vault/downloads/file.pdf is a valid target
const downloadAssets = getFiles(path.join(PUBLIC_DIR, 'downloads'), ['.pdf']).map(filePath => {
  const fileName = path.basename(filePath);
  return {
    title: `Download: ${fileName}`,
    slug: `/vault/downloads/${fileName}`,
    category: 'downloads',
    type: 'asset'
  };
});

// 3. System Routes
const staticRoutes = [
  { title: 'Contact', slug: '/vault/contact', category: 'system' },
  { title: 'Subscribe', slug: '/vault/subscribe', category: 'system' },
  { title: 'Inner Circle', slug: '/vault/inner-circle', category: 'system' },
  // GHOST ASSETS: Manually validating these 4 until the physical files are restored
  { title: 'Practical Pack', slug: '/vault/downloads/Fathers_in_Family_Court_Practical_Pack.pdf', category: 'downloads' },
  { title: 'Starter Kit', slug: '/vault/downloads/Brotherhood_Starter_Kit.pdf', category: 'downloads' },
  { title: 'Leader Guide', slug: '/vault/downloads/Brotherhood_Leader_Guide_4_Weeks.pdf', category: 'downloads' },
  { title: 'Practical Pack Lower', slug: '/vault/downloads/Fathers_in_the_family_court_practical_pack.pdf', category: 'downloads' }
];

const finalManifest = [...briefAssets, ...downloadAssets, ...staticRoutes];

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalManifest, null, 2));

console.log(`--- 🏗️  Building Institutional Manifest ---`);
console.log(`✅ Success: ${finalManifest.length} total assets indexed.`);
console.log(`   - ${briefAssets.length} Intelligence Briefs`);
console.log(`   - ${downloadAssets.length} PDF Assets`);