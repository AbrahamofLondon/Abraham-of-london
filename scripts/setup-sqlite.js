// scripts/setup-sqlite.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'app.db');

console.log('🔧 Setting up SQLite database...');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 Created directory: ${dataDir}`);
} else {
  console.log(`📁 Data directory already exists: ${dataDir}`);
}

// Create empty database file if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log(`📄 Created database file: ${dbPath}`);
} else {
  console.log(`📄 Database file already exists: ${dbPath}`);
}

console.log('✅ SQLite setup complete!');