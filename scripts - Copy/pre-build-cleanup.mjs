import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanProblematicFiles() {
  const patterns = [
    '**/public/assets/downloads/**/*.xlsx',
    '**/public/assets/downloads/**/*.docx',
    '**/public/assets/downloads/**/*.pptx',
    '**/public/assets/downloads/**/*.pdf',
    '**/public/downloads/*.xlsx',
    '**/public/downloads/*.docx',
    '**/public/downloads/*.pptx',
    '**/public/downloads/*.pdf',
  ];
  
  console.log('🧹 Pre-build cleanup running...');
  return true;
}

await cleanProblematicFiles();