// scripts/create-contentlayer-fallback.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("📦 Creating Contentlayer fallback for Netlify...");

const generatedDir = path.join(process.cwd(), ".contentlayer", "generated");
fs.mkdirSync(generatedDir, { recursive: true });

// Create index.mjs (ESM)
const esmContent = `export const allDocuments = [];
export const allPosts = [];
export const allBooks = [];
export const allCanons = [];
export const allDownloads = [];
export const allShorts = [];
export const allEvents = [];
export const allPrints = [];
export const allResources = [];
export const allStrategies = [];

export default {
  allDocuments,
  allPosts,
  allBooks,
  allCanons,
  allDownloads,
  allShorts,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
};
`;

// Create index.js (CJS)
const cjsContent = `module.exports = {
  allDocuments: [],
  allPosts: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allShorts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
};
`;

// Create TypeScript definition
const tsContent = `declare module 'contentlayer/generated' {
  export const allDocuments: any[];
  export const allPosts: any[];
  export const allBooks: any[];
  export const allCanons: any[];
  export const allDownloads: any[];
  export const allShorts: any[];
  export const allEvents: any[];
  export const allPrints: any[];
  export const allResources: any[];
  export const allStrategies: any[];
  
  export default {
    allDocuments,
    allPosts,
    allBooks,
    allCanons,
    allDownloads,
    allShorts,
    allEvents,
    allPrints,
    allResources,
    allStrategies,
  };
}
`;

fs.writeFileSync(path.join(generatedDir, "index.mjs"), esmContent, 'utf8');
fs.writeFileSync(path.join(generatedDir, "index.js"), cjsContent, 'utf8');
fs.writeFileSync(path.join(generatedDir, "index.d.ts"), tsContent, 'utf8');

console.log("✅ Created fallback Contentlayer exports (ESM, CJS, TypeScript)");