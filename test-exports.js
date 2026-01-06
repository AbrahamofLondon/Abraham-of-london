// test-exports.js
const mod = require("./lib/contentlayer-helper.ts");

console.log("Testing exports...");
const requiredExports = [
  "getServerAllPosts", "getServerPostBySlug",
  "getServerAllBooks", "getServerBookBySlug", 
  "getServerAllDownloads", "getServerDownloadBySlug",
  "getServerAllEvents", "getServerEventBySlug",
  "getServerAllShorts", "getServerShortBySlug",
  "getServerAllCanons", "getServerCanonBySlug",
  "getServerAllResources", "getServerResourceBySlug",
  "sanitizeData", "recordContentView", "resolveDocDownloadUrl",
  "getDownloadBySlug", "isContentlayerLoaded", "getAllDocuments"
];

let missing = [];
requiredExports.forEach(exp => {
  if (mod[exp]) {
    console.log(\`✅ \${exp}\`);
  } else {
    console.log(\`❌ \${exp}\`);
    missing.push(exp);
  }
});

if (missing.length === 0) {
  console.log("\n✅ All exports available!");
} else {
  console.log(\`\n❌ Missing exports: \${missing.length}\`);
}
