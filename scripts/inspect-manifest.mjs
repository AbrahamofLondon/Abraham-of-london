import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const manifest = JSON.parse(fs.readFileSync('./vault-manifest.json', 'utf8'));
const targets = [
  'reclaiming-the-narrative',
  'the-brotherhood-code',
  'leadership-begins-at-home',
  'fathering-without-fear'
];

console.log("--- 🧐 Manifest Inspection ---");
targets.forEach(t => {
  const entry = manifest.find(m => m.slug.includes(t));
  if (entry) {
    console.log(`Found: ${t} -> Actual Slug in Manifest: "${entry.slug}"`);
  } else {
    console.log(`NOT FOUND: ${t} is missing from manifest entirely!`);
  }
});