const fs = require("fs");
const path = require("path");

console.log("📦 Creating ContentLayer fallback for Netlify...");

const generatedDir = path.join(process.cwd(), ".contentlayer", "generated");
fs.mkdirSync(generatedDir, { recursive: true });

const content = `
export const allDocuments = [];
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

fs.writeFileSync(path.join(generatedDir, "index.js"), content);
fs.writeFileSync(path.join(generatedDir, "_index.d.ts"), "// TypeScript placeholder");
console.log("✅ Created fallback ContentLayer exports");
